import pandas as pd
from pathlib import Path
from lxml import etree
import copy
import json
import re
import traceback as tb
from pkg_resources import resource_filename
import numpy as np
from packaging.version import Version
from datetime import datetime
from controle_coherence.utils import convert_xml_text, element_to_value_dict, get_duplicates, get_uniques, calc_seuil_interpolate
from controle_coherence.enum_report import msg_themes, msg_importance
from controle_coherence.assets_dpe import tv_table_to_value, complex_values_list, mutually_exclusive_elements, \
    elements_saisi, \
    expected_pt_liaison, default_isol_for_pt_isol_mais_inconnu, expected_components, bool_trad_fr, \
    modele_verification_paths, \
    ban_types, versions_dpe_cfg, \
    specific_values_list, id_generateur_pac_hybride, seuils_energie, seuils_energie_altitude, seuils_ges_altitude, \
    seuils_ges, zones_climatiques_altitude, get_current_valid_versions_dpe, \
    systeme_to_cle_repartition, materiau_mur_isolant, DPE_VERSION_ANTERIEUR, get_latest_dpe_version, DATE_APPLICATION_PETITE_SURFACE, DATE_APPLICATION_PEF_ELEC, get_datetime_now, seuils_tertiaire, DATE_APPLICATION_BLOCAGE_CONTROLE_RCU

from controle_coherence.assets_audit import versions_audit_cfg, AUDIT_VERSION_ANTERIEUR, \
    get_current_valid_versions_audit



class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class CoreEngine(metaclass=Singleton):
    namespaces = {'xs': 'http://www.w3.org/2001/XMLSchema'}
    VERSION_CFG = None
    ENUM_VERSION_ID_VARNAME = None
    DATE_ETABLISSEMENT_VARNAME = None
    DATE_VISITE_VARNAME = None
    DENOMINATION_SIMPLE_XML_REG = None
    DENOMINATION_OBJET_XML_REG = None
    DENOMINATION_SUJET_XML_REG = None
    A_REMPLACER_VARNAME = None
    VERSION_ANTERIEUR = None
    mdd_path = Path(resource_filename('controle_coherence', 'modele_donnee'))  # docker load
    if not mdd_path.is_dir():
        mdd_path = Path(__file__).parent / "modele_donnee"  # docker load
    if not mdd_path.is_dir():
        mdd_path = Path(__file__).parent.parent.parent / "modele_donnee"  # dev load

    def __init__(self):

        self._instanciate_tv_table_dict()  # instanciate table valeur as dict
        self._instanciate_enums()  # instanciate enums as dict
        self._instanciate_reseau_chaleur()
        self._instanciate_seuils_petites_surfaces()
        self._instanciate_var_req_and_var_forbid_dict()  # instanciate var req and var forbid dicts
        self._reindex_enum_tables()  # reindex with ids enum tables
        parser = etree.XMLParser(remove_blank_text=True, resolve_entities=False, no_network=True) # Secure parser against XXE

        # schema is the xml schema object for validation and xsd is the xsd as an xml object to navigate.
        self.schema_dict = dict()
        self.xsd_dict = dict()
        for version_id_str, cfg in self.VERSION_CFG.items():
            self.schema_dict[version_id_str] = etree.XMLSchema(
                file=str((self.mdd_path / cfg['xsd_file']).absolute()))  # instanciate xsd for validation.
            self.xsd_dict[version_id_str] = etree.parse(str((self.mdd_path / cfg['xsd_file']).absolute()), parser)

        self.logement_models = dict()
        self._generate_models()


    def get_current_valid_versions(self,now):
        raise NotImplementedError('not implemented')

    def _instanciate_reseau_chaleur(self):

        with open(self.mdd_path / 'arrete_reseau_chaleur.json', 'r', encoding='utf-8') as f:
            arrete_reseau_chaleur = json.load(f)
        self.arrete_reseau_chaleur = arrete_reseau_chaleur

    def _instanciate_tv_table_dict(self):
        valeur_table = pd.read_excel(self.mdd_path / 'valeur_tables.xlsx', sheet_name=None)
        # GESTION DES TABLES DE VALEURS QUI NE CORRESPONDENT PAS EXACTEMENT A UN OBJET DU XSD
        valeur_table['coef_masque_lointain_non_homogene'] = valeur_table['coef_masque_lointain_non_homoge']
        del valeur_table['coef_masque_lointain_non_homoge']
        # tv_reseau_chaleur_id utilisé uniquement avant janvier 2022 -> remplacé par identifiant_reseau_chaleur
        valeur_table['reseau_chaleur'] = valeur_table['reseau_chaleur_2020']
        # del valeur_table['reseau_chaleur_2020']
        # del valeur_table['reseau_chaleur_2021']

        # Retire les tables sans tv_id
        del valeur_table['pecs_combustion']
        del valeur_table['pn_generateur_combustion']

        for k, v in valeur_table.items():
            enum_cols = [col for col in v if col.startswith('enum_')]
            for enum_col in enum_cols:
                # conversion enum x|y -> [x,y] string to list et null en texte
                null = v[enum_col].isnull()
                multiple_id = v[enum_col].astype(str).str.contains('|')
                v[enum_col] = v[enum_col].astype('object')
                v.loc[(~null) & (~multiple_id), enum_col] = v.loc[(~null) & (~multiple_id), enum_col].astype(int)
                v.loc[~null, enum_col] = v.loc[~null, enum_col].astype(str).apply(
                    lambda x: [int(float(el)) for el in x.split('|')])
        valeur_table_dict = dict()
        for table_name, table in valeur_table.items():
            if f'tv_{table_name}_id' in table:
                vt = table.set_index(f'tv_{table_name}_id').to_dict(orient='index')
                valeur_table_dict[f'tv_{table_name}_id'] = vt

        self.valeur_table = valeur_table
        self.valeur_table_dict = valeur_table_dict

    def _instanciate_seuils_petites_surfaces(self):

        with open(self.mdd_path / 'seuils_petites_surfaces.json', 'r') as f:
            seuils_petites_surfaces = json.load(f)

        for k, v in seuils_petites_surfaces.items():
            for k1, v1 in v.items():
                v1 = pd.DataFrame(v1)
                v1.index = v1.index.astype(int)
                seuils_petites_surfaces[k][k1] = v1
        self.seuils_petites_surfaces = seuils_petites_surfaces

    def _instanciate_enums(self):
        enum_table = pd.read_excel(self.mdd_path / 'enum_tables.xlsx', sheet_name=None)
        enum_dict = {f'enum_{k}_id': v.set_index('id').lib.to_dict() for k, v in enum_table.items() if
                     'lib' in v and 'id' in v}

        self.enum_dict = enum_dict
        self.enum_table = enum_table

    def _instanciate_var_req_and_var_forbid_dict(self):
        enum_table = self.enum_table
        var_req_dict = dict()
        for k, v in enum_table.items():
            if 'variables_requises' in v:
                v = v.dropna(subset=['variables_requises'])
                var_req = v.set_index('id').variables_requises.to_dict()
                var_req_dict[f"enum_{k}_id"] = var_req
        var_forbid_dict = dict()
        for k, v in enum_table.items():
            if 'variables_interdites' in v:
                v = v.dropna(subset=['variables_interdites'])
                var_forbid = v.set_index('id').variables_interdites.to_dict()
                var_forbid_dict[f"enum_{k}_id"] = var_forbid

        hors_methode_dict = dict()
        for k, v in enum_table.items():
            if 'hors_methode' in v:
                v = v.dropna(subset=['hors_methode'])
                hors_methode = v.set_index('id').hors_methode.to_dict()
                hors_methode_dict[f"enum_{k}_id"] = hors_methode

        self.var_req_dict = var_req_dict
        self.var_forbid_dict = var_forbid_dict
        self.enum_hors_methode_dict = hors_methode_dict

    def _reindex_enum_tables(self):
        enum_table = self.enum_table
        for k, v in enum_table.items():
            if 'id' in v:
                enum_table[k] = v.set_index('id')

    def _generate_models(self):
        for version_id_str, xsd in self.xsd_dict.items():
            administratif_models = dict()
            administratif = xsd.find('.//xs:element[@name="administratif"]', namespaces=self.namespaces)
            for name in ['adresse_proprietaire', 'adresse_bien', 'adresse_proprietaire_installation_commune']:
                model = administratif.find(f'*//xs:element[@name="{name}"]', namespaces=self.namespaces)
                administratif_models[name] = list()
                if model.attrib['type'] == 't_adresse':
                    t_adresse = xsd.find('.//xs:complexType[@name="t_adresse"]', namespaces=self.namespaces)
                    for el in list(t_adresse.iterfind('*//xs:element', namespaces=self.namespaces)):
                        administratif_models[name].append(el.attrib['name'])

                else:
                    for el in list(model.iterfind('*//xs:element', namespaces=self.namespaces)):
                        administratif_models[name].append(el.attrib['name'])

            logement = xsd.find('.//xs:element[@name="logement"]', namespaces=self.namespaces)
            logement_models = dict()

            for name in ['caracteristique_generale', 'meteo', 'inertie']:
                model = logement.find(f'*//xs:element[@name="{name}"]', namespaces=self.namespaces)
                logement_models[name] = list()
                for el in list(model.iterfind('*//xs:element', namespaces=self.namespaces)):
                    logement_models[name].append(el.attrib['name'])
            for donnee_entree in logement.iterfind('*//xs:element[@name="donnee_entree"]', namespaces=self.namespaces):
                parent = donnee_entree.getparent().getparent().getparent()
                name = parent.attrib['name']
                logement_models[name] = list()
                for el in list(donnee_entree.iterfind('*//xs:element', namespaces=self.namespaces)):
                    logement_models[name].append(el.attrib['name'])
                for el in list(parent.iterfind('*//xs:element[@name="donnee_intermediaire"]//xs:element',
                                               namespaces=self.namespaces)):
                    logement_models[name].append(el.attrib['name'])
            logement_models.update(administratif_models)
            self.logement_models[version_id_str] = logement_models

    def display_enum_traduction(self, enum_name, enum_values):
        if isinstance(enum_values, int):
            enum_values = [enum_values]
        return {k: v for k, v in self.enum_dict[enum_name].items() if k in enum_values}

    def get_enum_version(self, xml_reg):

        el_version = xml_reg.find(f'./administratif/{self.ENUM_VERSION_ID_VARNAME}')

        return el_version

    # ================== VALIDATION PREALABLE COMMUNES =======================================
    def validate_by_xsd(self, xml_reg):
        el_version = self.get_enum_version(xml_reg)
        if el_version is None:
            error_log = [f"""
ERREUR VALIDATION XML : l'élément /administratif/{self.ENUM_VERSION_ID_VARNAME} est manquant le processus de validation {self.DENOMINATION_OBJET_XML_REG} ne peut être effectué
        """]
            return {"valid": False,
                    "error_log": error_log}
        try:
            version_id_str = el_version.text
            schema = self.schema_dict[version_id_str]
        except (ValueError, KeyError):
            error_log = [f"""
ERREUR VALIDATION XML : l'élément /administratif/{self.ENUM_VERSION_ID_VARNAME} a pour valeur {el_version.text} et ne correspond a aucune des versions 
{self.DENOMINATION_OBJET_XML_REG} : {list(self.schema_dict.keys())} . 
Nous vous invitons à vous rapprocher de votre éditeur de logiciel pour régler ce problème.
"""]
            return {"valid": False,
                    "error_log": error_log}
        resp = schema.validate(xml_reg)

        return {"valid": resp,
                "error_log": str(schema.error_log).split('\n')}

    def run_validation_xsd(self, xml_reg, report):
        report.xsd_validation.update(self.validate_by_xsd(xml_reg))
        return report

    def validation_version_and_dates(self, xml_reg, report,now):
        date_etablissement_obj = xml_reg.find(f'*//{self.DATE_ETABLISSEMENT_VARNAME}')
        date_etablissement = datetime.fromisoformat(date_etablissement_obj.text)
        date_visite_obj = xml_reg.find(f'*//{self.DATE_VISITE_VARNAME}')
        date_visite = datetime.fromisoformat(date_visite_obj.text)
        # on compare avec la date d'établissement dpe pour la date de fin de validité pour permettre le dépôt de DPE en retard
        # on compare avec la date de transmission pour la date de début de validité.
        # c'est la date de transmission qui fait foi.

        version_id_str = self.get_enum_version(xml_reg).text
        start_date_version = datetime.fromisoformat(self.VERSION_CFG[version_id_str]['start_date'])
        end_date_version = datetime.fromisoformat(self.VERSION_CFG[version_id_str]['end_date'])
        end_date_compare_now_version = datetime.fromisoformat(self.VERSION_CFG[version_id_str]['end_date_compare_now'])
        end_date_edit = self.VERSION_CFG[version_id_str].get('end_date_edit')

        if end_date_edit is not None:
            end_date_edit = datetime.fromisoformat(end_date_edit)
            xml_reg_a_remplacer = xml_reg.find(f'administratif/{self.A_REMPLACER_VARNAME}')
            if xml_reg_a_remplacer is not None:
                is_valid_reedit = (date_etablissement <= end_date_edit) & (now <= end_date_edit)
            else:
                is_valid_reedit = False
        else:
            is_valid_reedit = False

        # contrôle de cohérence que la date de visite est inférieure ou égale à la date d'étabilisseement
        if date_visite > date_etablissement:
            msg = f"""la date de visite : {date_visite.date().strftime('%Y-%m-%d')} est postérieure à la date d'établissement {self.DENOMINATION_OBJET_XML_REG} : {date_etablissement.date().strftime('%Y-%m-%d')}. Veuillez vérifier votre saisie.
            """
            report.generate_msg(msg, msg_type='erreur_saisie',
                                msg_theme='warning_date_etablissement_visite',
                                related_objects=[date_visite_obj, date_etablissement_obj],
                                msg_importance='blocker')

        # invalidation de tous les DPE qui déclarent une date d'etablissement de DPE future
        if now < date_etablissement:
            msg = f"""{self.DENOMINATION_SUJET_XML_REG} est fourni avec une date d'établissement {self.DENOMINATION_OBJET_XML_REG} supérieure à la date d'aujourd'hui.
date d'établissement {self.DENOMINATION_OBJET_XML_REG} déclarée : {date_etablissement}
date du jour : {now.date().strftime('%Y-%m-%d')}

            """
            report.generate_msg(msg, msg_type='erreur_saisie',
                                msg_theme='invalid_date_etablissement',
                                related_objects=[self.get_enum_version(xml_reg),
                                                 xml_reg.find(f'*//{self.DATE_ETABLISSEMENT_VARNAME}')],
                                msg_importance='blocker')

        is_old_version = date_etablissement > end_date_version
        is_old_version_now = now > end_date_compare_now_version
        is_valid_version = (date_etablissement <= end_date_version) & (now >= start_date_version) & (
                now <= end_date_compare_now_version)
        is_valid_version = is_valid_version | is_valid_reedit  # soit la réédition est valide soit le dpe est valide pour première transmission
        is_future_version = now < start_date_version

        if is_old_version & (not is_valid_version):
            msg = f"""{self.DENOMINATION_SUJET_XML_REG} est fourni avec un numéro de version obsolète : {version_id_str}.
date d'expiration de la version : {end_date_version}
Votre logiciel {self.DENOMINATION_SIMPLE_XML_REG} doit être mis à jour. 
les versions suivantes sont acceptées pour dépôt. {self.get_current_valid_versions(now)}
        """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='out_of_date_version',
                                related_objects=[self.get_enum_version(xml_reg),
                                                 xml_reg.find(f'*//{self.DATE_ETABLISSEMENT_VARNAME}')],
                                msg_importance='blocker')
        if is_old_version_now & (not is_valid_version):
            msg = f"""{self.DENOMINATION_SUJET_XML_REG} est fourni avec un numéro de version obsolète : {version_id_str}.
date d'expiration de la version : {end_date_compare_now_version}
Votre logiciel {self.DENOMINATION_SIMPLE_XML_REG} doit être mis à jour. 
les versions suivantes sont acceptées pour dépôt. {self.get_current_valid_versions(now)}
        """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='out_of_date_version',
                                related_objects=[self.get_enum_version(xml_reg),
                                                 xml_reg.find(f'*//{self.DATE_ETABLISSEMENT_VARNAME}')],
                                msg_importance='blocker')

        elif is_future_version & (not is_valid_version):
            msg = f"""{self.DENOMINATION_SUJET_XML_REG}  est fourni avec un numéro de version en cours de développement non autorisée pour dépôt. : {version_id_str}
Veuillez contacter votre Editeur de Logiciel. 
les versions suivantes sont acceptées pour dépôt. {self.get_current_valid_versions(now)}
        """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='out_of_date_version',
                                related_objects=[self.get_enum_version(xml_reg),
                                                 xml_reg.find(f'*//{self.DATE_ETABLISSEMENT_VARNAME}')],
                                msg_importance='blocker')

        is_old_version = is_old_version & (not is_valid_version)
        is_old_version = is_old_version | (is_old_version_now & (not is_valid_version))

        return is_old_version

    # ================== CONTROLE COHERENCE GLOBAUX COMMUNS ===================================

    def controle_coherence_variables_interdites(self, xml_reg, report):
        version_id_str = self.get_enum_version(xml_reg).text
        for control_varname in self.var_forbid_dict:
            control_vars = list(xml_reg.iterfind(f'.//{control_varname}'))

            for control_var in control_vars:
                id_enum = convert_xml_text(control_var.text)
                variables_forbid = self.var_forbid_dict.get(control_varname).get(id_enum, None)
                if variables_forbid is not None:
                    element = control_var.getparent()
                    found_var_forbid = list()
                    for var in variables_forbid.split(','):
                        if self.exist_var(element, var, version_id_str=version_id_str):
                            found_var_forbid.append(var)

                    if len(found_var_forbid) > 0:
                        msg = f"""
les champs suivants ne doivent pas être renseignés :
{' et '.join(found_var_forbid)}
lorsque la variable {control_varname} vaut : 
{self.display_enum_traduction(control_varname, id_enum)}
"""
                        related_objects = [element, control_var]
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='forbidden_element',
                                            related_objects=related_objects,
                                            msg_importance='blocker')

    def controle_coherence_variables_requises(self, xml_reg, report):

        def check_existence(engine, element, vargroup, version_id_str):
            exist_list = list()
            for var in re.split('[|,]', vargroup):
                found = engine.exist_var(element, var, version_id_str=version_id_str)
                if found is True:
                    exist_list.append((True, var))
                elif found is False:
                    exist_list.append((False, var))
                else:
                    pass
            return exist_list

        def verify_condition(exist_list, operator):
            if len(exist_list) == 0:
                verif_condition = True
                sep = ' et '
            elif operator == '|':
                sep = ' ou '
                verif_condition = False
                for exist in exist_list:
                    verif_condition = verif_condition | exist[0]

            elif operator == ',':
                sep = ' et '
                verif_condition = True
                for exist in exist_list:
                    verif_condition = verif_condition & exist[0]

            else:
                BaseException(f'invalid operator : {operator}')

            if verif_condition is False:
                missing_variables = [el[1] for el in exist_list if el[0] is False]
                missing_variables = f'{sep}'.join(missing_variables)
            else:
                missing_variables = None
            return missing_variables

        def main_control_var_req(element, variables_requises, engine, version_id_str):
            if '(' in variables_requises:
                main_operator = variables_requises.split(')')
                if len(main_operator) > 1:
                    main_operator = main_operator[1]
                    if len(main_operator) > 0:
                        main_operator = main_operator[0]
                    else:
                        main_operator = variables_requises.split('(')[0][-1]
                else:
                    main_operator = variables_requises.split('(')[0][-1]
                vargroups = variables_requises.replace('(', '').replace(')', '').split(main_operator)
                exist_list = list()
                for vargroup in vargroups:
                    sub_exist_list = check_existence(engine, element, vargroup, version_id_str=version_id_str)
                    if '|' in vargroup:
                        operator = '|'
                    elif ',' in vargroup:
                        operator = ','
                    else:
                        operator = ','

                    missing_variables = verify_condition(sub_exist_list, operator)
                    if missing_variables is not None:
                        exist_list.append((False, missing_variables))
                    else:
                        exist_list.append((True, vargroup))
                missing_variables = verify_condition(exist_list, main_operator)
                if missing_variables is not None:
                    sep = ' et '
                    if main_operator == '|':
                        sep = ' ou '
                    missing_variables = '(' + f'){sep}('.join(missing_variables.split(sep)) + ')'
                    result = (False, missing_variables)
                else:
                    result = (True, None)

            elif '|' in variables_requises:
                exist_list = check_existence(engine, element, variables_requises, version_id_str=version_id_str)
                main_operator = '|'
                missing_variables = verify_condition(exist_list, main_operator)
                if missing_variables is not None:
                    result = (False, missing_variables)
                else:
                    result = (True, None)
            else:
                exist_list = check_existence(engine, element, variables_requises, version_id_str=version_id_str)
                main_operator = ','
                missing_variables = verify_condition(exist_list, main_operator)
                if missing_variables is not None:
                    result = (False, missing_variables)
                else:
                    result = (True, None)

            return result

        version_id_str = self.get_enum_version(xml_reg).text

        for control_varname in self.var_req_dict:
            control_vars = list(xml_reg.iterfind(f'.//{control_varname}'))

            for control_var in control_vars:
                id_enum = convert_xml_text(control_var.text)
                variables_requises = self.var_req_dict.get(control_varname).get(id_enum, None)
                if variables_requises is not None:
                    element = control_var.getparent()
                    control = main_control_var_req(element, variables_requises, self, version_id_str=version_id_str)
                    if control[0] is False:
                        msg = f"""
les champs suivants doivent être renseignés :
{control[1]}
lorsque la variable {control_varname} vaut : 
{self.display_enum_traduction(control_varname, id_enum)}
"""
                        related_objects = [element, control_var]
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='missing_required_element',
                                            related_objects=related_objects,
                                            msg_importance='blocker')

    def controle_coherence_administratif(self, xml_reg, report):
        for el_adresse in xml_reg.find('*//adresses').getchildren():
            el_statut_geocodage_ban = el_adresse.find('enum_statut_geocodage_ban_id')
            adresse_dict = element_to_value_dict(el_adresse)
            statut_geocodage_ban_id = int(el_statut_geocodage_ban.text)
            code_postal_brut = el_adresse.find('code_postal_brut').text
            adresse_brut_concat = f"{adresse_dict.get('adresse_brut', '')} {code_postal_brut} {adresse_dict.get('nom_commune_brut', '')}"
            if adresse_dict['enum_statut_geocodage_ban_id'] != 1:
                msg = f"""
L'adresse {el_adresse.tag} n'as pas été géocodée. Vérifier que l'adresse saisie {adresse_brut_concat} est bien valide.
Il est possible que l'adresse {el_adresse.tag} ne soit pas référencé dans la Base d'Adresse Nationale.
vous pouvez le vérfier grâce à cette carte interactive https://adresse.data.gouv.fr/base-adresse-nationale       
si votre adresse existe bien dans la Base d'Adresse Nationale, tentez de relancer le géocodage depuis le logiciel DPE."""
                #                 try:
                #                     r = requests.get(f'https://api-adresse.data.gouv.fr/search/?q={adresse_brut_concat}')
                #                     if r.status_code == 200:
                #                         r_json = r.json()
                #                         if len(r_json.get('features', [])) > 0:
                #                             resp_geocode = f"""
                # Tentative de géocodage de l'adresse brute :
                # l'adresse suivante est le meilleur résultat trouvé par l'API adresse (https://geo.api.gouv.fr/adresse)
                # {r_json['features'][0]}
                # si ce résultat correspond tentez de relancer le géocodage depuis le logiciel DPE.
                # """
                #                         else:
                #                             resp_geocode = ""
                #                     else:
                #                         resp_geocode = ""
                #                 except:
                #                     resp_geocode = ""
                #                 msg += resp_geocode
                related_objects = [el_adresse]
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='address_anomaly',
                                    related_objects=related_objects,
                                    msg_importance='critical')
            el_ban_type = el_adresse.find('ban_type')
            el_ban_id = el_adresse.find("ban_id")
            # TODO : redondant avec la partie automatique réalisée sur le DPE existant (à optimiser sur future version)
            if adresse_dict['enum_statut_geocodage_ban_id'] == 1:
                ban_var_req = self.var_req_dict['enum_statut_geocodage_ban_id'][1].split(',')
                missing_vars = set(ban_var_req) - set([el.tag for el in el_adresse.getchildren()])
                if len(missing_vars) > 0:
                    msg = f"""
erreur dans les données de géocodage de l'adresse {el_adresse.tag}.
un ou plusieurs champs requis du résultat du géocodage Base Adresse Nationale est manquant {missing_vars}
"""
                    related_objects = [el_adresse]
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='missing_required_element',
                                        related_objects=related_objects,
                                        msg_importance='blocker')
            if el_ban_type is not None:
                if el_ban_type.text not in ban_types:
                    msg = f"""
erreur dans les données de géocodage de l'adresse {el_adresse.tag}.
Le type de résultat fourni dans le champs ban_type : '{el_ban_type.text}' ne correspond à aucun des résultats possible {ban_types}
            """
                    related_objects = [el_adresse, el_ban_type]
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='geocoding_error',
                                        related_objects=related_objects,
                                        msg_importance='blocker')
                if el_ban_type.text != 'housenumber':
                    if el_ban_id is not None:
                        ban_id = el_ban_id.text
                    else:
                        ban_id = ''
                    msg = f"""
Le resultat du géocodage n'est pas précis au numéro de rue mais à une échelle plus imprécise {el_ban_type.text}
Ceci est anormal dans la plupart des cas. Essayez de préciser l'adresse au niveau du numéro de rue si celui-ci est bien référencé dans la Base d'Adresse Nationale
vous pouvez vous aider de cette carte centrée autour de l'adresse renseignée :  https://adresse.data.gouv.fr/base-adresse-nationale/{ban_id}  
"""
                    related_objects = [el_adresse, el_ban_type]
                    report.generate_msg(msg, msg_type='warning_saisie',
                                        msg_theme='address_anomaly',
                                        related_objects=related_objects,
                                        msg_importance='major')

            el_ban_score = el_adresse.find('ban_score')
            if el_ban_score is not None:
                if float(el_ban_score.text) < 0.8:
                    msg = f"""
Le score de géocodage de l'adresse {el_adresse.tag} est faible : {el_ban_score.text}
Est ce que l'adresse géocodée : {adresse_dict.get('ban_label', "AUCUNE ADRESSE GEOCODEE RENSEIGNEE")} correspond bien à l'adresse {el_adresse.tag}
                    """
                    related_objects = [el_adresse, el_ban_score]
                    report.generate_msg(msg, msg_type='warning_saisie',
                                        msg_theme='address_anomaly',
                                        related_objects=related_objects,
                                        msg_importance='major')

        el_methode_dpe = xml_reg.find('*//enum_methode_application_dpe_log_id')
        if el_methode_dpe is not None:
            methode_dpe_id = int(el_methode_dpe.text)
            type_batiment = self.enum_table['methode_application_dpe_log'].loc[methode_dpe_id].type_batiment
            if type_batiment == 'appartement':
                compl_etage_appartement = xml_reg.find('*//adresse_bien//compl_etage_appartement')
                if compl_etage_appartement is None:
                    msg = """
Le DPE est un DPE de type DPE appartement.
l'etage de l'appartement n'est pas précisé dans la section adresse du DPE
            """

                    related_objects = [xml_reg.find('*//adresse_bien')]
                    report.generate_msg(msg, msg_type='erreur_saisie',
                                        msg_theme='address_anomaly',
                                        related_objects=related_objects,
                                        msg_importance='blocker')

    def controle_coherence_administratif_consentement(self, xml_reg, report, is_blocker: bool):

        methode_dpe = xml_reg.find('.//enum_methode_application_dpe_log_id')

        # le contrôle de cohérence n'est pas applicable dans le cas d'un dpe appartement à partir de l'immeuble ou le consentement du propriétaire n'est pas olbigatoire.
        non_applicable = str(self.enum_table['methode_application_dpe_log'].loc[int(methode_dpe.text)].methode_application_dpe)=='dpe appartement généré à partir des données DPE immeuble'
        auditeur = xml_reg.find('*//auditeur')
        if auditeur is not None:
            diagnostiqueur = auditeur.find('diagnostiqueur')
            if diagnostiqueur is None:
                # Cas d'un BET ou architecte : consentement est non applicable
                non_applicable = True

        if xml_reg.find('*//enum_consentement_formulaire_id') is not None:
            enum_consentement_formulaire_id = xml_reg.find('*//enum_consentement_formulaire_id')

        else:
            enum_consentement_formulaire_id = xml_reg.find('*//consentement_proprietaire')

        # on ne peut saisir les deux informations en //
        if xml_reg.find('*//enum_consentement_formulaire_id') is not None and xml_reg.find('*//consentement_proprietaire') is not None:
            msg = f"""
erreur logiciel :  enum_consentement_formulaire_id et consentement_proprietaire ne peuvent pas être déclarés en même temps -> utilisez le nouveau champs enum_consentement_formulaire_id 
"""

            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='mutually_exclusive',
                                related_objects=[xml_reg.find('*//enum_consentement_formulaire_id'),xml_reg.find('*//consentement_proprietaire')],
                                msg_importance='blocker')
        # on ne peut saisir les deux informations en //
        if xml_reg.find('*//information_formulaire_consentement') is not None and xml_reg.find('*//information_consentement_proprietaire') is not None:
                msg = f"""
erreur logiciel :  information_formulaire_consentement et consentement_proprietaire ne peuvent pas être déclarés en même temps -> utilisez le nouveau champs enum_consentement_formulaire_id 
        """

                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='mutually_exclusive',
                                    related_objects=[xml_reg.find('*//information_formulaire_consentement'), xml_reg.find('*//information_consentement_proprietaire')],
                                    msg_importance='blocker')

        # on ne peut saisir les deux informations qui sont dans différents modèles
        if xml_reg.find('*//consentement_proprietaire') is not None and xml_reg.find('*//information_formulaire_consentement') is not None:
            msg = f"""
erreur logiciel :  enum_consentement_formulaire_id et information_consentement_proprietaire ne peuvent pas être déclarés en même temps -> utilisez le nouveau champs enum_consentement_formulaire_id avec information_formulaire_consentement
"""

            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='mutually_exclusive',
                                related_objects=[xml_reg.find('*//consentement_proprietaire'), xml_reg.find('*//information_formulaire_consentement')],
                                msg_importance='blocker')

        if xml_reg.find('*//information_consentement_proprietaire') is not None and xml_reg.find('*//enum_consentement_formulaire_id') is not None:
            msg = f"""
            erreur logiciel :  consentement_proprietaire et information_formulaire_consentement ne peuvent pas être déclarés en même temps -> utilisez le nouveau champs enum_consentement_formulaire_id avec information_formulaire_consentement
"""

            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='mutually_exclusive',
                                related_objects=[xml_reg.find('*//information_formulaire_consentement'), xml_reg.find('*//consentement_proprietaire')],
                                msg_importance='blocker')

        if enum_consentement_formulaire_id is not None:

            consentement_formulaire_value = int(enum_consentement_formulaire_id.text)

            if xml_reg.find('*//information_formulaire_consentement') is not None:
                information_formulaire_consentement = xml_reg.find('*//information_formulaire_consentement')

            else:
                information_formulaire_consentement = xml_reg.find('*//information_consentement_proprietaire')

            if consentement_formulaire_value > 0:
                if information_formulaire_consentement is None:
                    msg = f"""
il est déclaré que le consentement du commanditaire a été fourni ou n'est pas requis car il s'agit d'une personne morale mais le formulaire de consentement associé n'est pas présent dans {self.DENOMINATION_SUJET_XML_REG} transmis.           
                    """

                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='missing_required_element',
                                        related_objects=[enum_consentement_formulaire_id],
                                        msg_importance='blocker')

                else:
                    personne_morale_value = int(information_formulaire_consentement.find('personne_morale').text)
                    telephone = information_formulaire_consentement.find('telephone')
                    mail = information_formulaire_consentement.find('mail')


                    if xml_reg.find('*//siren_formulaire') is not None:

                        siren_formulaire = xml_reg.find('*//siren_formulaire')

                    else:
                        siren_formulaire = information_formulaire_consentement.find('siren_proprietaire')

                    if personne_morale_value == 1 and siren_formulaire is None:
                        msg = f"""
le commanditaire est une personne morale mais aucun siren n'est fourni permettant d'identifier la personne morale dans le formulaire de consentement. Pour un commanditaire personne morale, la saisie du numéro de siren est obligatoire.
                    """

                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='missing_required_element',
                                            related_objects=[information_formulaire_consentement],
                                            msg_importance='blocker')
                    if telephone is None and mail is None:
                        msg = f"""
aucune information de contact du commanditaire n'est renseigné dans le formulaire de consentement. Il est nécessaire d'avoir soit un numéro de téléphone ou un courriel pour contacter le commanditaire dans le formulaire de consentement. 
                               """

                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='missing_required_element',
                                            related_objects=[information_formulaire_consentement],
                                            msg_importance='blocker')

            elif information_formulaire_consentement is not None:

                if len(information_formulaire_consentement.getchildren())>0:
                    # s'il existe des éléments dans information_consentement_proprietaire on bloque
                    content = '\n'.join([el.tag for el in information_formulaire_consentement.getchildren()])
                    msg = f"""
le consentement du commanditaire est déclaré comme refusé (valeur 0), information_formulaire_consentement contient des informations ce qui n'est pas compatible avec cette déclaration de refus
{content}
                    """
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='forbidden_element',
                                        related_objects=[information_formulaire_consentement],
                                        msg_importance='blocker')



        # si le consentement est non applicable on ne déclenche pas de messages
        elif non_applicable:
            pass
        else:
            if is_blocker:
                msg_importance = 'blocker'
                msg_type = 'erreur_logiciel'
            else:
                msg_importance = 'major'
                msg_type = 'warning_logiciel'
            msg = f"""
le consentement du commanditaire est non renseigné
A partir du 1er juillet 2024, lors de toutes ses interventions, le diagnostiqueur recueille le consentement de ses clients en vue de la transmission de leurs coordonnées à l’organisme de certification à des fins de contrôles, selon un modèle de formulaire fourni par les services du ministère chargé de la construction.
"""

            report.generate_msg(msg, msg_type=msg_type,
                                msg_theme='missing_required_element',
                                related_objects=[xml_reg.find('administratif')],
                                msg_importance=msg_importance)

    def controle_coherence_declaration_numero_fiscal_local(self, xml_reg, report,is_blocker):
        if is_blocker == True:
            msg_type = 'erreur_saisie'
            msg_importance = 'blocker'
            msg_add = ''
        else:
            msg_type = 'warning_saisie'
            msg_importance = 'critical'
            msg_add = ' \nceci sera bloquant dans une future version du moteur de contrôle de cohérence'

        methode_dpe_id = int(xml_reg.find('*//enum_methode_application_dpe_log_id').text)
        obligation_numero_fiscal = int(self.enum_table['methode_application_dpe_log'].loc[methode_dpe_id].obligation_numero_fiscal)
        if xml_reg.find('*//enum_commanditaire_id') is not None:

            enum_commanditaire_id = int(xml_reg.find('*//enum_commanditaire_id').text)
        else:
            msg = f"""
enum_commanditaire_id manquant dans le volet administratif {self.DENOMINATION_OBJET_XML_REG}. Ceci est un nouvel élément requis pour identifier le type de commanditaire du DPE.                              
"""
            msg += msg_add
            report.generate_msg(msg, msg_type=msg_type,
                                msg_theme='missing_required_element',
                                related_objects=[],
                                msg_importance=msg_importance)
            enum_commanditaire_id = 0

        numero_fiscal_local = xml_reg.find('.//numero_fiscal_local')

        if numero_fiscal_local is None and obligation_numero_fiscal ==1 and enum_commanditaire_id==1:
            msg = f"""
{self.DENOMINATION_SUJET_XML_REG} concerne un logement dont le numéro fiscal de local n'est pas renseigné. Le numéro fiscal de local doit être renseigné pour ce document de type  {self.DENOMINATION_SIMPLE_XML_REG}
                    """
            msg+=msg_add
            report.generate_msg(msg, msg_type=msg_type,
                                msg_theme='missing_required_element',
                                related_objects=[],
                                msg_importance=msg_importance)

    def controle_coherence_logement_visite(self, xml_reg, report):
        is_audit = xml_reg.find('*//enum_version_audit_id') is not None
        if is_audit:
            # Cherche l'élément caracteristique_generale de l'étape initiale
            all_caracteristique_generale = list(xml_reg.iterfind('*//caracteristique_generale'))
            for caracteristique_generale in all_caracteristique_generale:
                enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
                enum_etape_id = caracteristique_generale.find('enum_etape_id').text
                if enum_scenario_id == "0" and enum_etape_id == "0":
                    break
        else:
            caracteristique_generale = xml_reg.find('*/caracteristique_generale')
            if caracteristique_generale is None:
                caracteristique_generale = xml_reg.find('caracteristique_generale')
        enum_methode_application_dpe_log_id = caracteristique_generale.find('enum_methode_application_dpe_log_id')
        methode_application_dpe = self.enum_table['methode_application_dpe_log'].loc[
            int(enum_methode_application_dpe_log_id.text)].methode_application_dpe

        if methode_application_dpe == 'dpe immeuble collectif' and len(
                list(xml_reg.iterfind('*//logement_visite'))) == 0:
            msg = f"""
aucun logement visité n'est déclaré pour le dpe immeuble collectif. les logements visités doivent être déclarés dans le xml.
methode d'application : {self.display_enum_traduction('enum_methode_application_dpe_log_id', int(enum_methode_application_dpe_log_id.text))}                
"""

            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='missing_required_element',
                                related_objects=[enum_methode_application_dpe_log_id],
                                msg_importance='blocker',
                                is_audit=is_audit)

    # ================== CONTROLE COHERENCE LOGEMENT COMMUNS ===================================

    def controle_coherence_etiquette(self, logement, report, is_arrete_petite_surface=False):

        classe_bilan_dpe = logement.find('*//classe_bilan_dpe').text
        classe_emission_ges = logement.find('*//classe_emission_ges').text

        # récupération de la surface pour contrôler que l'on est dans le cas d'une petite surface
        methode_dpe = logement.find('.//enum_methode_application_dpe_log_id')
        surface_reference_name = str(self.enum_table['methode_application_dpe_log'].loc[int(methode_dpe.text)].surface_reference_calcul_etiquette)

        if logement.find(f'.//{surface_reference_name}') is None:
            report.generate_msg(f"""
la surface {surface_reference_name} n'est pas renseignée pour la méthode DPE {self.enum_table['methode_application_dpe_log'].loc[int(methode_dpe.text)].lib}
cette surface doit être obligatoirement renseignée. 
        """,

                                msg_type='erreur_logiciel',
                                msg_theme='missing_required_element',
                                related_objects=methode_dpe,
                                msg_importance='blocker')
        else:
            surface_reference = np.round(np.float64(logement.find(f'.//{surface_reference_name}').text), 5)

            # arrondi à l'entier inférieur pour le calcul des étiquettes
            ep_conso_5_usages_m2 = np.floor(float(logement.find('*//ep_conso/ep_conso_5_usages_m2').text))

            # arrondi à l'entier inférieur pour le calcul des étiquettes
            emission_ges_5_usages_m2 = np.floor(float(logement.find('*//emission_ges/emission_ges_5_usages_m2').text))

            enum_zone_climatique_id = logement.find('*//enum_zone_climatique_id')
            enum_classe_altitude_id = logement.find('*//enum_classe_altitude_id')

            if enum_zone_climatique_id is not None and enum_classe_altitude_id is not None:

                enum_zone_climatique_id = int(enum_zone_climatique_id.text)
                enum_classe_altitude_id = int(enum_classe_altitude_id.text)

                # dans le cas d'un bâtiment en altitude pour les zones climatiques H1b, H1c et H2d les seuils E,F et G sont changés
                if (enum_zone_climatique_id in zones_climatiques_altitude) and (enum_classe_altitude_id == 3):
                    seuils_energie_final = seuils_energie_altitude
                    seuils_ges_final = seuils_ges_altitude
                    altitude = 'sup800m'

                else:
                    seuils_ges_final = seuils_ges
                    seuils_energie_final = seuils_energie
                    altitude = 'inf800m'

                petite_surface = False
                if surface_reference < 40 and is_arrete_petite_surface:
                    seuils_energie_table = self.seuils_petites_surfaces[altitude]['seuils_energie']
                    seuils_ges_table = self.seuils_petites_surfaces[altitude]['seuils_ges']
                    seuils_energie_final = calc_seuil_interpolate(surface_reference, seuils_energie_table)
                    seuils_ges_final = calc_seuil_interpolate(surface_reference, seuils_ges_table)
                    petite_surface = True

                for etiquette, (min_value_ges, max_value_ges) in seuils_ges_final.items():
                    if emission_ges_5_usages_m2 < max_value_ges:
                        classe_emission_ges_expected = etiquette
                        break

                # test si la classe emission ges est bonne
                if classe_emission_ges_expected != classe_emission_ges:
                    msg = f"""la classe GES du DPE ne correspond pas à la valeur d'emission GES 5 usages calculée 
    classe étiquette GES fournie : {classe_emission_ges}
    emission GES 5 usage fournie : {emission_ges_5_usages_m2}
    classe étiquette GES attendue : {classe_emission_ges_expected} (intervalle {min_value_ges},{max_value_ges})
    """
                    if petite_surface is True:
                        msg += f'''
    NB : les seuils calculés sont ceux pour un bien d'une surface de moins de 40m² qui ont été interpolés à partir de la valeur de la surface du bien {surface_reference} m²
    '''

                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='bad_etiquette_calculation',
                                        related_objects=[logement.find('*//classe_emission_ges'),
                                                         logement.find('*//emission_ges/emission_ges_5_usages_m2')],
                                        msg_importance='blocker')

                for etiquette, (min_value_ener, max_value_ener) in seuils_energie_final.items():
                    if ep_conso_5_usages_m2 < max_value_ener:
                        classe_conso_energie_expected = etiquette
                        break

                classe_bilan_dpe_expected = max(classe_emission_ges_expected, classe_conso_energie_expected)

                # test si la classe bilan energétique est bonne
                if classe_bilan_dpe_expected != classe_bilan_dpe:
                    msg = f"""la classe energétique bilan du DPE ne correspond pas à la valeur d'emission 5 usages calculée 
    et la valeur de consommation energie primaire 5 usages
    classe energétique bilan du DPE fournie : {classe_bilan_dpe}
    emission GES 5 usage fournie : {emission_ges_5_usages_m2}
    consommation EP 5 usage fournie : {ep_conso_5_usages_m2}
    classe energétique bilan du DPE attendue : {classe_bilan_dpe_expected} 
    car soit 
    la consommation EP est dans l'intervalle : {seuils_energie_final[classe_bilan_dpe_expected][0]},{seuils_energie_final[classe_bilan_dpe_expected][1]}
    et l'emission GES est inférieure à {seuils_ges_final[classe_bilan_dpe_expected][1]}
    ou 
    l'emission GES est dans l'intervalle : {seuils_ges_final[classe_bilan_dpe_expected][0]},{seuils_ges_final[classe_bilan_dpe_expected][1]}
    et la consommation EP est inférieur à {seuils_energie_final[classe_bilan_dpe_expected][1]}
    """

                    if petite_surface is True:
                        msg += f'''
    NB : les seuils calculés sont ceux pour un bien d'une surface de moins de 40m² qui ont été interpolés à partir de la valeur de la surface du bien {surface_reference} m²
                    '''
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='bad_etiquette_calculation',
                                        related_objects=[logement.find('*//classe_emission_ges'),
                                                         logement.find('*//emission_ges/emission_ges_5_usages_m2'),
                                                         logement.find('*//classe_bilan_dpe'),
                                                         logement.find('*//ep_conso/ep_conso_5_usages_m2')
                                                         ],
                                        msg_importance='blocker')

    def controle_coherence_conso_5_usages(self, logement, report, tolerance=3, is_arrete_pef_elec=False):

        # 2.3 pour l'électricité jusqu'au 31 décembre 2025, 1.9 à partir du 1er janvier 2026
        coef_ep_electricite = 1.9 if is_arrete_pef_elec else 2.3

        # Récupération des valeurs de référence
        ef_conso_5_usages_total = float(logement.find('.//ef_conso/conso_5_usages').text)
        ep_conso_5_usages_total = float(logement.find('.//ep_conso/ep_conso_5_usages').text)

        # Initialisation
        somme_conso_ef = 0.0
        somme_conso_ep = 0.0
        somme_elec_ef = 0.0  # pour suivre uniquement l'électricité

        # Parcours des consommations par énergie
        for sortie in logement.findall('.//sortie_par_energie_collection/sortie_par_energie'):
            conso_ef = float(sortie.find('conso_5_usages').text)
            energie_id = sortie.find('enum_type_energie_id').text

            # Exclusion de "électricité d'origine renouvelable utilisée dans le bâtiment"
            if energie_id != "12":
                somme_conso_ef += conso_ef
                if energie_id == "1":  # électricité
                    somme_elec_ef += conso_ef
                    coef = coef_ep_electricite
                else:
                    coef = 1.0
                somme_conso_ep += conso_ef * coef

        # Contrôle 1 : cohérence EF
        ecart_ef = abs(somme_conso_ef - ef_conso_5_usages_total)
        if ecart_ef > tolerance:
            report.generate_msg(f"""
    Incohérence conso_5_usages (finale)
    Somme sortie_par_energie : {round(somme_conso_ef, 2)} 
       dont {round(somme_elec_ef, 2)} d'électricité (hors PV auto-consommée)
    ef_conso_5_usages total  : {round(ef_conso_5_usages_total, 2)}
    Écart                    : {round(ecart_ef, 2)}
    Tolérance                : {tolerance}

    Merci de vous assurer de la cohérence entre les sorties par énergie et la sortie globale.
            """,
                                msg_type='erreur_logiciel',
                                msg_theme='bad_ef_conso_calculation',
                                related_objects=[logement.find('.//ef_conso/conso_5_usages')],
                                msg_importance='blocker_as_warning'
                                )

        # Contrôle 2 : cohérence EP
        ecart_ep = abs(somme_conso_ep - ep_conso_5_usages_total)
        if ecart_ep > tolerance:
            report.generate_msg(f"""
    Incohérence conso_5_usages (primaire)
    Somme sortie_par_energie (EF) : {round(somme_conso_ef, 2)} 
       dont {round(somme_elec_ef, 2)} d'électricité (hors PV auto-consommée)
    Soit somme_conso_ep (EP)     : {round(somme_conso_ep, 2)}
    ep_conso_5_usages total      : {round(ep_conso_5_usages_total, 2)}
    Écart                        : {round(ecart_ep, 2)}
    Tolérance                    : {tolerance}
    
    Merci de vous assurer de la cohérence entre les sorties par énergie et la sortie globale,
    et de vous assurer d'utiliser les bons coefficients de conversion d'énergie primaire
    (2.3 pour l'électricité jusqu'au 31 décembre 2025, 1.9 à partir du 1er janvier 2026 et 1.0 pour les autres types d'énergie).
    """,
                                msg_type='erreur_logiciel',
                                msg_theme='bad_ep_conso_calculation',
                                related_objects=[logement.find('.//ep_conso/ep_conso_5_usages')],
                                msg_importance='blocker_as_warning'
                                )

    def controle_coherence_conso_5_usages_tertiaire(self, tertiaire, report, tolerance=3, is_arrete_pef_elec=False):
        """
        Contrôle cohérence consommation tertiaire :
          - Vérifie cohérence conso_energie_primaire par consommation
          - Vérifie somme des conso_energie_primaire avec le total du bilan
        """

        # Récupération des sections
        bilan = tertiaire.find('.//bilan_consommation')
        conso_collection = tertiaire.find('.//consommation_collection')

        # Si conso_collection vides => pas de contrôle
        if conso_collection is None or len(conso_collection.findall('consommation')) == 0:
            return

        # 2.3 pour l'électricité jusqu'au 31/12/2025, 1.9 à partir du 01/01/2026
        coef_ep_electricite = 1.9 if is_arrete_pef_elec else 2.3

        somme_ep = 0.0
        somme_elec_ef = 0.0

        # Parcours des consommations détaillées
        for conso in conso_collection.findall('consommation'):
            conso_ef = float(conso.find('conso_energie_finale').text)
            conso_ep = float(conso.find('conso_energie_primaire').text)
            energie_id = conso.find('enum_type_energie_id').text

            # Calcul attendu
            if energie_id == "1":  # électricité
                coef = coef_ep_electricite
                somme_elec_ef += conso_ef
            elif energie_id == "12":  # élec PV auto-consommée -> exclue
                continue
            else:
                coef = 1.0

            conso_ep_calc = conso_ef * coef
            ecart_local = abs(conso_ep_calc - conso_ep)

            if ecart_local > tolerance:
                report.generate_msg(f"""
Incohérence conso_energie_primaire pour une consommation de enum_type_energie_id = {self.display_enum_traduction('enum_type_energie_id', int(energie_id))}
conso_energie_finale  : {round(conso_ef, 2)}
Coefficient appliqué  : {coef}
conso_energie_primaire attendue : {round(conso_ep_calc, 2)}
conso_energie_primaire trouvée  : {round(conso_ep, 2)}
Écart                : {round(ecart_local, 2)}
Tolérance            : {tolerance}

Merci de vous assurer de la cohérence entre la consommation finale, le coefficient
et la consommation primaire déclarée.
(2.3 pour l'électricité jusqu'au 31 décembre 2025, 1.9 à partir du 1er janvier 2026 et 1.0 pour les autres types d'énergie).
                """,
                                    msg_type='erreur_logiciel',
                                    msg_theme='bad_ep_conso_calculation',
                                    related_objects=[conso.find('conso_energie_primaire')],
                                    msg_importance='blocker_as_warning'
                                    )


            somme_ep += conso_ep

        # TODO: Contrôle désactivé temporairement en attente d'une clarification sur les pratiques de saisie des balises <consommation> dans les logiciels métiers.
        # if bilan is not None:
        #     # Récupération du total attendu (primaire) surface_utile
        #     conso_ep_total = bilan.find('conso_energie_primaire')
        #     surface_utile = tertiaire.find('.//caracteristique_generale/surface_utile')
        #     surface_utile = float(surface_utile.text)
        #     if conso_ep_total is None or conso_ep_total.text in (None, ""):
        #         return  # rien à contrôler
        #     conso_ep_total = float(conso_ep_total.text)
        #
        #     # Contrôle sur le total bilan
        #     ecart_total = abs(somme_ep / surface_utile - conso_ep_total)
        #     if ecart_total > tolerance:
        #         report.generate_msg(f"""
        #     Incohérence conso_energie_primaire (bilan global)
        #     Somme conso_energie_primaire (détaillée) par m² : {round(somme_ep / surface_utile, 2)}
        #        dont {round(somme_elec_ef / surface_utile, 2)} d'électricité (hors PV auto-consommée)
        #     bilan_consommation total                 : {round(conso_ep_total, 2)}
        #     Écart                                    : {round(ecart_total, 2)}
        #     Tolérance                                : {tolerance}
        #
        #     Merci de vous assurer de la cohérence entre les consommations détaillées
        #     et le bilan global, et d'utiliser les bons coefficients de conversion
        #     d'énergie primaire (2.3 pour l'électricité jusqu'au 31 décembre 2025,
        #     1.9 à partir du 1er janvier 2026 et 1.0 pour les autres types d'énergie).
        #             """,
        #                             msg_type='warning_logiciel',
        #                             msg_theme='bad_ep_conso_calculation',
        #                             related_objects=[bilan.find('conso_energie_primaire')],
        #                             msg_importance='critical'
        #                             )


    def controle_coherence_5_usages_surface(self, logement, report):
        """
        Vérifie que les valeurs "5_usages_m2" sont cohérentes avec "5_usages / surface_reference",
        avec une précision de ±1 unité pour tolérer les erreurs d'arrondi.
        Génère une erreur bloquante pour chaque incohérence détectée.
        """
        a_tol = 2 # tolérance numérique
        # Récupération de la surface de référence
        methode_dpe = logement.find('.//enum_methode_application_dpe_log_id')
        surface_reference_name = str(self.enum_table['methode_application_dpe_log'].loc[int(methode_dpe.text)].surface_reference_calcul_etiquette)
        surface_reference_element = logement.find(f'.//{surface_reference_name}')

        if surface_reference_element is not None:
            surface_reference = np.round(np.float64(surface_reference_element.text), 5)

            # Extraction des valeurs des consommations et émissions
            conso_5_usages = float(logement.find('*//ef_conso/conso_5_usages').text)
            ep_conso_5_usages = float(logement.find('*//ep_conso/ep_conso_5_usages').text)
            emission_ges_5_usages = float(logement.find('*//emission_ges/emission_ges_5_usages').text)

            conso_5_usages_m2 = float(logement.find('*//ef_conso/conso_5_usages_m2').text)
            ep_conso_5_usages_m2 = float(logement.find('*//ep_conso/ep_conso_5_usages_m2').text)
            emission_ges_5_usages_m2 = float(logement.find('*//emission_ges/emission_ges_5_usages_m2').text)

            # Calcul des valeurs attendues
            conso_5_usages_m2_expected = np.round(conso_5_usages / surface_reference, 5)
            ep_conso_5_usages_m2_expected = np.round(ep_conso_5_usages / surface_reference, 5)
            emission_ges_5_usages_m2_expected = np.round(emission_ges_5_usages / surface_reference, 5)

            # Vérification avec tolérance de ±1 et génération de messages séparés
            if abs(conso_5_usages_m2 - conso_5_usages_m2_expected) > a_tol:
                msg = f"""Incohérence détectée sur conso_5_usages_m2 par rapport à conso_5_usages :
        - Valeur fournie : {conso_5_usages_m2}
        - Valeur attendue : {conso_5_usages_m2_expected} (tolérance ±2)
        - Surface de référence : {surface_reference} m²
                """
                report.generate_msg(msg,
                                    msg_type='erreur_logiciel',
                                    msg_theme='error_incoherent_ef_conso_surface',
                                    related_objects=[logement.find('*//ef_conso/conso_5_usages_m2'), logement.find('*//ef_conso/conso_5_usages')],
                                    msg_importance='blocker')

            if abs(ep_conso_5_usages_m2 - ep_conso_5_usages_m2_expected) > a_tol:
                msg = f"""Incohérence détectée sur ep_conso_5_usages_m2 par rapport à ef_conso_5_usages :
        - Valeur fournie : {ep_conso_5_usages_m2}
        - Valeur attendue : {ep_conso_5_usages_m2_expected} (tolérance ±2)
        - Surface de référence : {surface_reference} m²
                """
                report.generate_msg(msg,
                                    msg_type='erreur_logiciel',
                                    msg_theme='error_incoherent_ep_conso_surface',
                                    related_objects=[logement.find('*//ep_conso/ep_conso_5_usages_m2'), logement.find('*//ep_conso/ep_conso_5_usages')],
                                    msg_importance='blocker')

            if abs(emission_ges_5_usages_m2 - emission_ges_5_usages_m2_expected) > a_tol:
                msg = f"""Incohérence détectée sur emission_ges_5_usages_m2 par rapport à emission_ges_5_usages :
        - Valeur fournie : {emission_ges_5_usages_m2}
        - Valeur attendue : {emission_ges_5_usages_m2_expected} (tolérance ±2)
        - Surface de référence : {surface_reference} m²
                """
                report.generate_msg(msg,
                                    msg_type='erreur_logiciel',
                                    msg_theme='error_incoherent_emission_ges_surface',
                                    related_objects=[logement.find('*//emission_ges/emission_ges_5_usages_m2'), logement.find('*//emission_ges/emission_ges_5_usages')],
                                    msg_importance='blocker')

    def controle_coherence_table_valeur_enum(self, logement, report):

        all_tv_found = list()
        for tv in self.valeur_table_dict:
            all_tv_found.extend(list(logement.iterfind(f'*//{tv}')))

        for tv in all_tv_found:
            parent = tv.getparent()
            component_name = tv.getparent().getparent().tag
            parent_dict = element_to_value_dict(parent)
            name = tv.tag
            tv_value = convert_xml_text(tv.text)
            if tv_value is not None:
                related_properties = {k: v for k, v in self.valeur_table_dict[name][tv_value].items() if v == v}
                related_enums = {k: v for k, v in related_properties.items() if k.startswith('enum')}
                for related_enum_name, admissible_values in related_enums.items():
                    current_parent = parent
                    current_parent_dict = parent_dict
                    # if enum methode application on va chercher dans caracteristique generale
                    if related_enum_name == 'enum_methode_application_dpe_log_id':
                        current_parent = logement.find('caracteristique_generale')
                        current_parent_dict = element_to_value_dict(current_parent)
                    # if enum periode construction on va chercher dans caracteristique generale
                    elif related_enum_name == 'enum_periode_construction_id':
                        # si une période d'isolation est déclarée elle "écrase" la période de construction pour le calcul du U concerné
                        enum_periode_isolation_id = current_parent.find('enum_periode_isolation_id')
                        if enum_periode_isolation_id is not None:
                            related_enum_name = "enum_periode_isolation_id"
                        else:
                            current_parent = logement.find('caracteristique_generale')
                            current_parent_dict = element_to_value_dict(current_parent)
                    # if zone climatique
                    elif related_enum_name == 'enum_zone_climatique_id':
                        current_parent = logement.find('meteo')
                        current_parent_dict = element_to_value_dict(current_parent)
                    # if not in direct parent getting grand-parent data
                    elif related_enum_name not in parent_dict:
                        current_parent = current_parent.getparent().getparent()
                        # si donnee entree encapsulé dans un objet puis une collection on remonte encore d'un parent.
                        if current_parent.tag.endswith('collection'):
                            current_parent = current_parent.getparent()
                        if current_parent.find('donnee_entree') is not None:
                            current_parent = current_parent.find('donnee_entree')
                            current_parent_dict = element_to_value_dict(current_parent)
                        else:
                            current_parent_dict = element_to_value_dict(current_parent)
                    if related_enum_name in current_parent_dict:
                        if current_parent_dict[related_enum_name] not in admissible_values:
                            related_objects = [current_parent.find(related_enum_name), tv]
                            msg = f"""
mauvaise correspondance entre la valeur {name}:{tv_value}
avec les données connexes suivantes :
{related_properties}
et l'énumérateur {related_enum_name}:{self.display_enum_traduction(related_enum_name,
                                                                   current_parent_dict[related_enum_name])}.
La valeur attendue de l'énumérateur {related_enum_name} doit être une des suivantes:
{self.display_enum_traduction(related_enum_name, admissible_values)}
"""
                            msg_type = 'erreur_logiciel'
                            msg_importance = 'blocker'
                            if related_enum_name in ['enum_type_generateur_ch_id', 'enum_type_generateur_ecs_id'] and name == 'tv_scop_id':
                                msg += """
pour les PAC et CET ceci n'était pas contrôlé jusqu'à présent à cause d'un bug.
                                """
                                msg_type = 'erreur_logiciel'
                                msg_importance = 'blocker'

                            if related_enum_name == 'enum_periode_construction_id' and component_name in [
                                'plancher_bas', 'plancher_haut', 'mur']:
                                msg += """
Si le composant est considéré avec une période d'isolation différente de la période de construction, ce message d'erreur peut apparaître
si la période d'isolation (enum_periode_isolation_id) n'a pas été déclarée. 
"""
                            report.generate_msg(msg, msg_type=msg_type,
                                                msg_theme='bad_enum_tv',
                                                related_objects=related_objects,
                                                msg_importance=msg_importance)

    def controle_coherence_tv_values_simple(self, logement, report):

        all_tv_found = list()
        for tv in self.valeur_table_dict:
            all_tv_found.extend(list(logement.iterfind(f'*//{tv}')))

        for tv in all_tv_found:
            parent = tv.getparent()
            parent_dict = element_to_value_dict(parent)
            name = tv.tag
            name_wo_id = '_'.join(name.split('_')[1:-1])
            tv_value = convert_xml_text(tv.text)
            value_varname_list = tv_table_to_value[name_wo_id]['values']
            double_fenetre = parent.find('double_fenetre')
            if double_fenetre is not None:
                # dans le cas d'une double fenêtre on ne contrôle pas la cohérence tv/value dans le cas de double fenêtre.
                if double_fenetre.text == '1':
                    continue

            if name_wo_id not in complex_values_list:

                if tv_value is not None:

                    # controle coherence avec valeur

                    for value_varname in value_varname_list:
                        if parent.find(value_varname) is not None:
                            value = parent_dict[value_varname]
                        else:
                            value = parent.getparent().find(f'donnee_intermediaire/{value_varname}')
                            if value is not None:
                                value = convert_xml_text(value.text)
                        if value is not None:

                            tv_value_name = tv_table_to_value[name_wo_id]['tv_value_name']
                            expected_value = self.valeur_table_dict[name][tv_value][tv_value_name]
                            if name_wo_id == "seer":
                                expected_seer_value = self.valeur_table_dict[name][tv_value]['seer']

                            if not np.isclose(expected_value, value, atol=tv_table_to_value[name_wo_id]['atol']):
                                if name_wo_id not in specific_values_list:
                                    msg = f"""
la valeur de {value_varname} ne correspond pas à la valeur attendue de 
la table de valeur :

valeur : {value}
valeur table : {expected_value} 
{name} : {tv_value}
"""
                                    report.generate_msg(msg=msg,
                                                        msg_type='erreur_logiciel',
                                                        msg_theme='bad_value_tv',
                                                        msg_importance='blocker',
                                                        related_objects=[tv, parent])
                                elif name_wo_id == 'coef_transparence_ets':
                                    msg = f"""
la valeur de {value_varname} ne correspond pas à la valeur attendue de 
la table de valeur :

valeur : {value}
valeur table : {expected_value} 
{name} : {tv_value}

Dans le cas de coef_transparence_ets ceci n'est possible que dans le cas extrêmement rare
où l'on n'est pas en mesure de déterminer un vitrage majoritaire pour l'espace tampon
"""
                                    report.generate_msg(msg=msg,
                                                        msg_type='warning_logiciel',
                                                        msg_theme='bad_value_tv',
                                                        msg_importance='critical',
                                                        related_objects=[tv, parent])
                                elif name_wo_id in ['umur', 'upb', 'uph']:
                                    u0 = parent.getparent().find(f'donnee_intermediaire/{name_wo_id}0')
                                    if u0 is not None:
                                        u0_value = convert_xml_text(u0.text)
                                        #                                         enum_type_doublage_id = parent.find('enum_type_doublage_id')
                                        #                                         is_doublage = False
                                        #                                         if enum_type_doublage_id is not None:
                                        #                                             is_doublage = enum_type_doublage_id.text in ["3", "4", "5"]
                                        #                                         if is_doublage:
                                        #                                             # dans le cas d'un doublage on calcule le U en ajoutant la résistance du doublage
                                        #                                             r_doublage = type_doublage_to_r_doublage[enum_type_doublage_id.text]
                                        #                                             expected_value_table =expected_value
                                        #                                             expected_value = np.minimum(expected_value,u0_value)
                                        #                                             expected_value_with_doublage = 1 / ((1 / expected_value)+r_doublage)
                                        #                                             # on vérifie que la valeur avec prise en compte du doublage est inférieure ou égale à la valeur saisie.
                                        #                                             # La comparaison stricte n'est pas effectuée par sécurité à cause d'un point de détail d'interprétation de la méthode
                                        #                                             # (est ce que la resistance de doublage s'applique aussi sur les parois qui ne sont pas nues d'isolation).
                                        #                                             if (not np.isclose(expected_value_with_doublage,value,atol=tv_table_to_value[name_wo_id]['atol'])) & (not np.isclose(expected_value,value,atol=tv_table_to_value[name_wo_id]['atol'])):
                                        #                                                 msg = f"""
                                        # la valeur de {value_varname} ne correspond pas à la valeur attendue de
                                        # la table de valeur OU à la valeur attendue pour une paroi avec doublage OU à la valeur du U0 en cas de U0 meilleur que la table de valeur.
                                        #
                                        # valeur : {value}
                                        # valeur table : {expected_value_table}
                                        # valeur attendue avec doublage  : {expected_value_with_doublage}
                                        # {name} : {tv_value}
                                        # valeur {value_varname}0 : {u0_value}
                                        #                                                 """
                                        #                                                 report.generate_msg(msg=msg,
                                        #                                                                     msg_type='erreur_logiciel',
                                        #                                                                     msg_theme='bad_value_tv',
                                        #                                                                     msg_importance='blocker',
                                        #                                                                     related_objects=[tv, parent])
                                        if not np.isclose(value, u0_value, atol=tv_table_to_value[name_wo_id]['atol']):
                                            msg = f"""
la valeur de {value_varname} ne correspond pas à la valeur attendue de 
la table de valeur. De plus {value_varname}0 est différent de {value_varname}.

valeur : {value}
valeur table : {expected_value} 
{name} : {tv_value}
valeur {value_varname}0 : {u0_value} 
    """
                                            report.generate_msg(msg=msg,
                                                                msg_type='erreur_logiciel',
                                                                msg_theme='bad_value_tv',
                                                                msg_importance='blocker',
                                                                related_objects=[tv, parent])

                                    else:

                                        msg = f"""
la valeur de {value_varname} ne correspond pas à la valeur attendue de 
la table de valeur. 
de plus la valeur {name_wo_id}0 n'est pas déclarée pour l'objet. {name_wo_id}0 doit être déclaré lorsque la table de valeur par défaut est utilisée  
valeur : {value}
valeur table : {expected_value} 
{name} : {tv_value}
"""
                                        report.generate_msg(msg=msg,
                                                            msg_type='erreur_logiciel',
                                                            msg_theme='bad_value_tv',
                                                            msg_importance='blocker',
                                                            related_objects=[tv, parent])
                                elif name_wo_id == 'seer':
                                    msg = f"""
la valeur du SEER/EER ne correspond pas à la valeur attendue de 
la table de valeur :

valeur du EER : {value}
valeur du SEER de la table (pour les systèmes avant 2008 = EER) : {expected_value} 
valeur du EER de la table : {expected_seer_value} 

{name} : {tv_value}
                                    """
                                    report.generate_msg(msg=msg,
                                                        msg_type='erreur_logiciel',
                                                        msg_theme='bad_value_tv',
                                                        msg_importance='blocker',
                                                        related_objects=[tv, parent])

    def controle_coherence_mutually_exclusive(self, logement, report):

        for exclusives in mutually_exclusive_elements:
            for ex in exclusives:

                for el in logement.iterfind(f'*//{ex}'):
                    parent = el.getparent()
                    found = [found for found in element_to_value_dict(parent) if found in exclusives]
                    if len(found) > 1:
                        msg = f"""
    les éléments {found} sont mutuellement exclusifs et ne peuvent pas être renseignés dans le même objet
    """

                        report.generate_msg(msg=msg,
                                            msg_type='erreur_logiciel',
                                            msg_theme='mutually_exclusive',
                                            msg_importance='blocker',
                                            related_objects=[parent])

    def controle_coherence_energie_vs_generateur(self, logement, report):
        # pour le chauffage
        type_generateur_ch_table = self.enum_table['type_generateur_ch']

        for el in logement.iterfind('.//generateur_chauffage'):
            el_type_energie = el.find('.//enum_type_energie_id')
            type_energie_id = int(el_type_energie.text)
            el_type_generateur_chauffage = el.find('.//enum_type_generateur_ch_id')
            type_generateur_ch_id = int(el_type_generateur_chauffage.text)
            type_generateur_ch_property = type_generateur_ch_table.loc[type_generateur_ch_id].to_dict()
            energies_admissibles_id = [int(el) for el in str(type_generateur_ch_property['enum_type_energie_id']).split('|')]

            if type_energie_id not in energies_admissibles_id:
                msg = f'''
le type d'energie déclaré pour le générateur de chauffage {self.display_enum_traduction('enum_type_generateur_ch_id', type_generateur_ch_id)} n'est pas compatible avec le type d'energie admissible pour ce générateur
type d'énergie déclaré :  {self.display_enum_traduction('enum_type_energie_id', type_energie_id)}
type d'énergies admissibles : {self.display_enum_traduction('enum_type_energie_id', energies_admissibles_id)}
                '''
                report.generate_msg(msg=msg,
                                    msg_type='erreur_logiciel',
                                    msg_theme='incoherence_systeme',
                                    msg_importance='blocker',
                                    related_objects=[el_type_generateur_chauffage, el_type_energie])

        # pour l'ECS

        type_generateur_ecs_table = self.enum_table['type_generateur_ecs']

        for el in logement.iterfind('.//generateur_ecs'):
            el_type_energie = el.find('.//enum_type_energie_id')
            type_energie_id = int(el_type_energie.text)
            el_type_generateur_ecs = el.find('.//enum_type_generateur_ecs_id')
            type_generateur_ecs_id = int(el_type_generateur_ecs.text)
            type_generateur_ecs_property = type_generateur_ecs_table.loc[type_generateur_ecs_id].to_dict()
            energies_admissibles_id = [int(el) for el in str(type_generateur_ecs_property['enum_type_energie_id']).split('|')]

            if type_energie_id not in energies_admissibles_id:
                msg = f'''
le type d'energie déclaré pour le générateur d'ECS {self.display_enum_traduction('enum_type_generateur_ecs_id', type_generateur_ecs_id)} n'est pas compatible avec le type d'energie admissible pour ce générateur
type d'énergie déclaré :  {self.display_enum_traduction('enum_type_energie_id', type_energie_id)}
type d'énergies admissibles : {self.display_enum_traduction('enum_type_energie_id', energies_admissibles_id)}
ceci sera une erreur bloquante dans une future version. 
                '''
                report.generate_msg(msg=msg,
                                    msg_type='erreur_logiciel',
                                    msg_theme='incoherence_systeme',
                                    msg_importance='blocker',
                                    related_objects=[el_type_generateur_ecs, el_type_energie])

    def controle_coherence_correspondance_saisi_value(self, logement, report):
        for el_saisi in elements_saisi:

            for found in logement.iterfind(f'*//{el_saisi}'):
                de = found.getparent()
                double_fenetre = de.find('double_fenetre')
                if double_fenetre is not None:
                    # dans le cas d'une double fenêtre on ne contrôle pas la cohérence tv/value dans le cas de double fenêtre.
                    if double_fenetre.text == '1':
                        continue
                di = de.getparent().find('donnee_intermediaire')
                el_name = el_saisi.split('_saisi')[0]
                if di.find(el_name) is None:
                    msg = f"""
    la donnée {el_name} est manquante alors que {el_saisi} est présent. 
    """
                    report.generate_msg(msg=msg,
                                        msg_type='erreur_logiciel',
                                        msg_theme='missing_required_element',
                                        msg_importance='blocker',
                                        related_objects=[de, di])
                else:
                    value = convert_xml_text(di.find(el_name).text)
                    value_saisi = convert_xml_text(found.text)
                    if not np.isclose(value, value_saisi, atol=0.01):
                        msg = f"""
    la valeur de {el_saisi} ne correspond pas à {el_name}
    {el_saisi} : {value_saisi} 
    {el_name} : {value}
    """
                        report.generate_msg(msg=msg,
                                            msg_type='erreur_logiciel',
                                            msg_theme='bad_value',
                                            msg_importance='blocker',
                                            related_objects=[de, di])

    def controle_coherence_structure_installation_chauffage(self, logement, report):
        cfg_installation_ch_table = self.enum_table['cfg_installation_ch']
        for installation in logement.iterfind('*//installation_chauffage'):
            id_ = convert_xml_text(installation.find('*//enum_cfg_installation_ch_id').text)
            cfg_inst = cfg_installation_ch_table.loc[id_].to_dict()
            nb_gen_expected = cfg_inst['nombre_generateur']
            comparaison_key = cfg_inst['comparaison_nombre_generateur']
            if len(list(installation.iterfind('*//priorite_generateur_cascade'))) > 1:
                nb_gen_expected += 1
            type_generateur_id = [int(el.text) for el in installation.iterfind('*//enum_type_generateur_ch_id')]
            if any(el in type_generateur_id for el in id_generateur_pac_hybride):
                nb_gen_expected += 1
            nb_gen = len(list(installation.iterfind('*//generateur_chauffage')))

            if comparaison_key == 'egal':
                invalid_cond = nb_gen != nb_gen_expected
            elif comparaison_key == 'sup_ou_egal':
                invalid_cond = nb_gen < nb_gen_expected
            else:
                raise KeyError(f'invalid comparaison_nombre_generateur key : {comparaison_key}')

            if invalid_cond:
                msg = f"""
    le nombre de générateurs ne correspond à la configuration  {str(id_) + ' : ' + cfg_inst['lib']} :
    nombre generateur attendus : {nb_gen_expected}
    nombre generateurs déclarés : {nb_gen}
    """
                related_objects = [installation] + list(installation.iterfind('*//generateur_chauffage'))
                report.generate_msg(msg, msg_type='warning_logiciel',
                                    msg_theme='bad_installation_cfg',
                                    related_objects=related_objects,
                                    msg_importance='critical')

            # Contrôle de cohérence des enum_lien_generateur_emetteur_id
            lien_generateur_emetteur = cfg_inst['enum_lien_generateur_emetteur_id']
            el_lien_em = list(installation.iterfind('*//emetteur_chauffage//enum_lien_generateur_emetteur_id'))
            el_lien_gen = list(installation.iterfind('*//generateur_chauffage//enum_lien_generateur_emetteur_id'))
            lien_em_id = [int(el.text) for el in el_lien_em if el.text and el.text.isdigit()]
            lien_gen_id = [int(el.text) for el in el_lien_gen if el.text and el.text.isdigit()]

            if len(set(lien_em_id) - set(lien_gen_id)) > 0:
                gen_lien_missing = set(lien_em_id) - set(lien_gen_id)
                related_objects = [el for el in el_lien_em if int(el.text) in gen_lien_missing]
                msg = f"""
    des emetteurs de type {self.display_enum_traduction('enum_lien_generateur_emetteur_id', gen_lien_missing)} sont déclarés
    sans aucune génération de même type.
    types de génération déclarées : {self.display_enum_traduction('enum_lien_generateur_emetteur_id', lien_gen_id)} 
            """
                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='bad_installation_cfg',
                                    related_objects=related_objects,
                                    msg_importance='blocker')
            if len(set(lien_gen_id) - set(lien_em_id)) > 0:
                em_lien_missing = set(lien_gen_id) - set(lien_em_id)
                related_objects = [el for el in el_lien_gen if int(el.text) in em_lien_missing]

                msg = f"""
    des générations de type {self.display_enum_traduction('enum_lien_generateur_emetteur_id', em_lien_missing)} sont déclarés
    sans aucun émetteur de même type.
    types d'emetteurs déclarées : {self.display_enum_traduction('enum_lien_generateur_emetteur_id', lien_gen_id)} 
            """
                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='bad_installation_cfg',
                                    related_objects=related_objects,
                                    msg_importance='blocker')

            if lien_generateur_emetteur and isinstance(lien_generateur_emetteur, str):
                if ',' in lien_generateur_emetteur:  # Cas "ET"
                    expected_ids = set(map(int, lien_generateur_emetteur.split(',')))
                    if not expected_ids.issubset(set(lien_em_id)) or not expected_ids.issubset(set(lien_gen_id)):
                        msg = f"""
    la configuration  {str(id_) + ' : ' + cfg_inst['lib']} exige la présence de générateur(s) et d'émetteur(s) avec le(s) enum_lien_generateur_emetteur_id de type {self.display_enum_traduction('enum_lien_generateur_emetteur_id', expected_ids)}
    or seul les générations de type {self.display_enum_traduction('enum_lien_generateur_emetteur_id', lien_gen_id)}, et les emetteurs de type {self.display_enum_traduction('enum_lien_generateur_emetteur_id', lien_em_id)} sont déclarés.
    """
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='bad_installation_cfg',
                                            related_objects=[installation]+el_lien_em+el_lien_gen,
                                            msg_importance='blocker')

                elif '|' in lien_generateur_emetteur:  # Cas "OU"
                    expected_groups = [set(map(int, group.split(','))) for group in lien_generateur_emetteur.split('|')]
                    valid = any(
                        (group.issubset(set(lien_em_id)) and group.issubset(set(lien_gen_id)))
                        for group in expected_groups
                    )
                    if not valid:
                        msg = f"""
    la configuration  {str(id_) + ' : ' + cfg_inst['lib']} exige la présence de générateur(s) et d'émetteur(s) avec l'un des enum_lien_generateur_emetteur_id de type {self.display_enum_traduction('enum_lien_generateur_emetteur_id', expected_ids)}
    or seul les générations de type {self.display_enum_traduction('enum_lien_generateur_emetteur_id', lien_gen_id)}, et les emetteurs de type {self.display_enum_traduction('enum_lien_generateur_emetteur_id', lien_em_id)} sont déclarés.
    """
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='bad_installation_cfg',
                                            related_objects=[installation]+el_lien_em+el_lien_gen,
                                            msg_importance='blocker')

            tv_reg = self.valeur_table['rendement_regulation']
            tv_em = self.valeur_table['rendement_emission']
            enum_table_type_emission_distribution = self.enum_table['type_emission_distribution'].copy()
            enum_table_type_emission_distribution.enum_type_generateur_ch_id = enum_table_type_emission_distribution.enum_type_generateur_ch_id.astype(str).apply(lambda x: [int(el) for el in x.split('|')] )

            # nouveaux contrôles de cohérences régulation et emission en cohérence avec les générateurs
            for lien_em in installation.iterfind('*//emetteur_chauffage//enum_lien_generateur_emetteur_id'):

                lien_em_txt = lien_em.text
                tv_rd_reg_id = int(lien_em.getparent().find('tv_rendement_regulation_id').text)
                tv_rd_em_id = int(lien_em.getparent().find('tv_rendement_emission_id').text)
                enum_type_emission_distribution_id = int(lien_em.getparent().find('enum_type_emission_distribution_id').text)

                liens_gen_associe = [el for el in el_lien_gen if el.text == lien_em_txt]
                if len(liens_gen_associe) > 0:
                    list_valid_generateur_reg = tv_reg.loc[tv_reg.tv_rendement_regulation_id == tv_rd_reg_id].enum_type_generateur_ch_id.iloc[0]
                    list_valid_generateur_em = tv_em.loc[tv_em.tv_rendement_emission_id == tv_rd_em_id].enum_type_generateur_ch_id.iloc[0]
                    list_valid_generateur_em_distrib = enum_table_type_emission_distribution.loc[enum_type_emission_distribution_id].enum_type_generateur_ch_id
                    type_emission_distribution_lib = enum_table_type_emission_distribution.loc[enum_type_emission_distribution_id].lib


                    # liste des id générateurs associés à ce type d'emetteurs
                    list_id_generateur = [int(el.getparent().find('enum_type_generateur_ch_id').text) for el in liens_gen_associe]

                    type_emission_regulation = tv_reg.loc[tv_reg.tv_rendement_regulation_id == tv_rd_reg_id].type_emission_regulation.iloc[0]

                    type_emission = tv_em.loc[tv_em.tv_rendement_emission_id == tv_rd_em_id].type_emission.iloc[0]

                    if (set(list_id_generateur) & set(list_valid_generateur_reg)) == set():
                        related_objects = [lien_em] + liens_gen_associe
                        msg = f"""
le type d'emission utilisé pour calculer le rendement de régulation :   {type_emission_regulation}
est associé à des générateurs qui ne sont pas compatibles avec ce type d'émission : 
types de génération déclarées : {[self.display_enum_traduction('enum_type_generateur_ch_id', el) for el in list_id_generateur]} 
"""
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='bad_installation_cfg',
                                            related_objects=related_objects,
                                            msg_importance='blocker')

                    if (set(list_id_generateur) & set(list_valid_generateur_em)) == set():
                        related_objects = [lien_em] + liens_gen_associe
                        msg = f"""
le type d'emission utilisé pour calculer le rendement d'emission :  {type_emission}
est associé à des générateurs qui ne sont pas compatibles avec ce type d'émission : 
types de génération déclarées : {[self.display_enum_traduction('enum_type_generateur_ch_id', el) for el in list_id_generateur]} 
"""
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='bad_installation_cfg',
                                            related_objects=related_objects,
                                            msg_importance='blocker')

                    if (set(list_id_generateur) & set(list_valid_generateur_em_distrib)) == set():
                        related_objects = [lien_em] + liens_gen_associe
                        msg = f"""
le couple d'emission/distribution d'emission  : {type_emission_distribution_lib}
est associé à des générateurs qui ne sont pas compatibles avec ce type d'émission : 
types de génération déclarées : {[self.display_enum_traduction('enum_type_generateur_ch_id', el) for el in list_id_generateur]} 
"""
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='bad_installation_cfg',
                                            related_objects=related_objects,
                                            msg_importance='blocker')


    def controle_pac_air_air_clim(self,logement,report):
        is_pac_air_air = False
        found_generateur=None
        for generateur in logement.iterfind('*//enum_type_generateur_ch_id'):
            id = int(generateur.text)
            if id in [1,2,3]: # identifiants pac air/air
                is_pac_air_air = True
                found_generateur = generateur

        climatisation = logement.find('*//climatisation/donnee_entree')
        if climatisation is None and is_pac_air_air:
            msg = """
Il existe un générateur de type PAC air/air déclaré mais aucun système de climatisation associé. Conformément au guide diagnostiqueur DPE toute pompe à chaleur air/air doit être aussi prise en compte comme un générateur de climatisation.            
            """
            report.generate_msg(msg=msg,
                                msg_type='erreur_saisie',
                                msg_theme='missing_required_element',
                                msg_importance='blocker',
                                related_objects=[found_generateur])

    # TODO : Lorsque ce controle basculera de "blocker_as_warning" à "blocker", il sera possible de le remplacer par l'ajout d'une colonne "enum_type_regulation_id" (avec les id) dans la table de valeur "rendement_regulation".
    #  Ainsi, la cohérence entre tv_rendement_regulation_id et enum_type_regulation_id sera directement gérée par le controle de cohérence des tables de valeurs
    def controle_coherence_type_regulation(self, logement, report):
        """
        Vérifie la cohérence entre 'tv_rendement_regulation_id' et 'enum_type_regulation_id'
        pour chaque émetteur de chauffage.
        """
        table_regulation = self.valeur_table_dict['tv_rendement_regulation_id']
        for emetteur in logement.iterfind('*//emetteur_chauffage'):
            tv_rendement_regulation_id = emetteur.find('*//tv_rendement_regulation_id').text
            enum_type_regulation_id = emetteur.find('*//enum_type_regulation_id').text
            type_regulation_lib = self.enum_dict['enum_type_regulation_id'][int(enum_type_regulation_id)]
            if tv_rendement_regulation_id and tv_rendement_regulation_id.isdigit():
                tv_rendement_regulation_id = int(tv_rendement_regulation_id)
                regulation_data = table_regulation.get(tv_rendement_regulation_id)
                expected_regulation_id = regulation_data['type_regulation']
                if not pd.isnull(expected_regulation_id) and len(expected_regulation_id)>0:
                    if type_regulation_lib != expected_regulation_id:
                        msg = f"""Incohérence régulation émetteur détectée : tv_rendement_regulation_id={tv_rendement_regulation_id} : {regulation_data['type_emission_regulation']} nécessite un enum_type_regulation_id avec {expected_regulation_id}
                        or le type de régulation déclaré est :  {self.display_enum_traduction('enum_type_regulation_id', int(enum_type_regulation_id))}."""
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='inconsistent_regulation',
                                            related_objects=[emetteur],
                                            msg_importance='blocker')

    def controle_coherence_surfaces(self, logement, report):

        eps = 1
        for mur in logement.iterfind('*//mur_collection/mur/donnee_entree'):
            surf_opaque = convert_xml_text(mur.find('surface_paroi_opaque').text)
            if mur.find('surface_paroi_totale') is not None:
                surf_tot = convert_xml_text(mur.find('surface_paroi_totale').text)

                if surf_tot < (surf_opaque - eps):
                    related_objects = [mur]
                    msg = f"""
    la surface de paroi totale est inférieure à la surface de paroi opaque
    surface paroi totale : {surf_tot}
    surface paroi opaque : {surf_opaque}
    """
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='bad_surface',
                                        related_objects=related_objects,
                                        msg_importance='blocker')
            surface_aiu = mur.find('surface_aiu')
            if surface_aiu is not None:
                surface_aiu = convert_xml_text(surface_aiu.text)
                if surface_aiu < (surf_opaque - eps):
                    related_objects = [mur]
                    msg = f"""
    la surface aiu  des parois du local non chauffé qui donnent sur des locaux chauffés  est inférieure à la surface de paroi opaque du mur
    surface aiu : {surface_aiu}
    surface paroi opaque : {surf_opaque}
    """
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='bad_surface',
                                        related_objects=related_objects,
                                        msg_importance='blocker')
        id_methode_application_dpe_log = convert_xml_text(logement.find('*//enum_methode_application_dpe_log_id').text)
        surface_reference_name = self.enum_table['methode_application_dpe_log'].loc[
            id_methode_application_dpe_log].surface_reference
        el_surface_reference = logement.find('*//enum_methode_application_dpe_log_id').getparent().find(
            surface_reference_name)
        if el_surface_reference is None:
            msg = f"""
la surface de référence {surface_reference_name} du DPE de type {self.display_enum_traduction('enum_methode_application_dpe_log_id', id_methode_application_dpe_log)}
n'est pas déclarée. Elle est obligatoire pour ce type de DPE. 
    """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='bad_surface',
                                related_objects=[logement.find('*//enum_methode_application_dpe_log_id')],
                                msg_importance='blocker')
            return None  # exit si pas de surface de réference
        surface_reference = convert_xml_text(el_surface_reference.text)
        if surface_reference_name == 'surface_habitable_immeuble':
            surface_tertiaire = logement.find('*//surface_tertiaire_immeuble')
            if surface_tertiaire is not None:
                surface_reference += convert_xml_text(surface_tertiaire.text)

        surface_chauffee_list = list(logement.iterfind('*//installation_chauffage/donnee_entree/surface_chauffee'))

        surface_chauffee_sum = np.sum([convert_xml_text(el.text) for el in surface_chauffee_list])

        if surface_reference < (surface_chauffee_sum - eps):
            related_objects = list(surface_chauffee_list) + [el_surface_reference]

            msg = f"""
    la somme de surface_chauffee est supérieure à la surface {surface_reference_name}
    {surface_reference_name} : {surface_reference}
    surface_chauffee : {surface_chauffee_sum}
    """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='bad_surface',
                                related_objects=related_objects,
                                msg_importance='blocker')

        surface_ventile_list = list(logement.iterfind('*//ventilation/donnee_entree/surface_ventile'))

        surface_ventile_sum = np.sum([convert_xml_text(el.text) for el in surface_ventile_list])

        if surface_reference < (surface_ventile_sum - eps):
            related_objects = list(surface_ventile_list) + [el_surface_reference]

            msg = f"""
    la somme de surface_ventile est supérieure à la surface {surface_reference_name}
    {surface_reference_name} : {surface_reference}
    surface_ventile : {surface_ventile_sum}
    """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='bad_surface',
                                related_objects=related_objects,
                                msg_importance='blocker')

        surface_clim_list = list(logement.iterfind('*//climatisation/donnee_entree/surface_clim'))

        if len(list(surface_clim_list)) > 0:
            surface_clim_sum = np.sum([convert_xml_text(el.text) for el in surface_clim_list])

            if surface_reference < (surface_clim_sum - eps):
                related_objects = list(surface_clim_list) + [el_surface_reference]

                msg = f"""
    la somme de surface_clim est supérieure à la surface {surface_reference_name}
    {surface_reference_name} : {surface_reference}
    surface_clim : {surface_clim_sum}
    """
                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='bad_surface',
                                    related_objects=related_objects,
                                    msg_importance='blocker')

        surface_habitable_list = list(logement.iterfind('*//installation_ecs/donnee_entree/surface_habitable'))

        surface_habitable_sum = np.sum([convert_xml_text(el.text) for el in surface_habitable_list])

        if surface_reference < (surface_habitable_sum - eps):
            related_objects = list(surface_habitable_list) + [el_surface_reference]
            msg = f"""
    la somme de surface_habitable est supérieure à la surface {surface_reference_name}
    {surface_reference_name} : {surface_reference}
    surface_habitable : {surface_habitable_sum}
    """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='bad_surface',
                                related_objects=related_objects,
                                msg_importance='blocker')

    def controle_coherence_surface_immeuble_logement(self, logement, report):
        """
        Vérifie que la surface habitable de l'immeuble est supérieure à celle du logement,
        uniquement si les deux balises existent et contiennent des valeurs numériques.
        """

        # Récupération des balises dans le XML
        surface_immeuble_element = logement.find('.//surface_habitable_immeuble')
        surface_logement_element = logement.find('.//surface_habitable_logement')
        nombre_appartement = logement.find('.//nombre_appartement')


        # Applique le controle que si les surfaces immeuble et logement sont définies
        if (surface_immeuble_element is not None) and (nombre_appartement is not None) and (surface_immeuble_element.text is not None) and (surface_logement_element is not None) and (surface_logement_element.text is not None):
            surface_immeuble = float(surface_immeuble_element.text)
            surface_logement = float(surface_logement_element.text)
            nombre_appartement = int(nombre_appartement.text)
            # Contrôle de cohérence : surface immeuble > surface logement
            if (surface_immeuble <= surface_logement) and (nombre_appartement>1):
                msg = f"""
Incohérence détectée :
La surface habitable de l'immeuble ({surface_immeuble} m²) doit être supérieure
à la surface habitable du logement ({surface_logement} m²).
                """
                report.generate_msg(
                    msg,
                    msg_type='erreur_saisie',
                    msg_theme='error_surface_habitable_exceeds_building',
                    related_objects=[surface_immeuble_element, surface_logement_element],
                    msg_importance='blocker'
                )
            elif (surface_immeuble <= surface_logement) and (nombre_appartement==1):

                msg = f"""
Incohérence détectée :
La surface habitable de l'immeuble ({surface_immeuble} m²) doit être supérieure
à la surface habitable du logement ({surface_logement} m²).
le nombre d'appartement pour l'immeuble est de 1 cela peut être une anomalie de saisie. 
                                """
                report.generate_msg(
                    msg,
                    msg_type='warning_saisie',
                    msg_theme='error_surface_habitable_exceeds_building',
                    related_objects=[surface_immeuble_element, surface_logement_element],
                    msg_importance='critical'
                )
            elif nombre_appartement == 1:
                msg = f"""
Incohérence détectée :
le nombre d'appartement pour l'immeuble est de 1 cela peut constituer une anomalie de saisie. 
"""
                report.generate_msg(
                    msg,
                    msg_type='warning_saisie',
                    msg_theme='warning_nombre_appartement',
                    related_objects=[surface_immeuble_element, surface_logement_element],
                    msg_importance='critical'
                )

    def controle_coherence_masque_solaire(self,logement,report):


        for baie_vitree in logement.iterfind('*//baie_vitree/donnee_entree'):

            masque_lointain_non_homogene_collection = baie_vitree.find('masque_lointain_non_homogene_collection')
            tv_coef_masque_lointain_homogene_id = baie_vitree.find('tv_coef_masque_lointain_homogene_id')
            related_objects = [masque_lointain_non_homogene_collection,tv_coef_masque_lointain_homogene_id]
            if tv_coef_masque_lointain_homogene_id is not None and masque_lointain_non_homogene_collection is not None and len(masque_lointain_non_homogene_collection.getchildren())>0:
                msg = """
incohérence détectée : 
tv_coef_masque_lointain_homogene_id est déclaré conjointement avec masque_lointain_non_homogene. Les masques lointain doivent être traités soit par l'approche de masque lointain homogène soit par l'approche masque lointain non homogène.
                    """
                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='mutually_exclusive',
                                    related_objects=related_objects,
                                    msg_importance='blocker')

    def controle_coherence_energie_entree_sortie(self, logement, report):
        type_ener_ch_list = list(logement.iterfind('*//generateur_chauffage/donnee_entree/enum_type_energie_id'))
        type_ener_ecs_list = list(logement.iterfind('*//generateur_ecs/donnee_entree/enum_type_energie_id'))
        type_ener_fr_list = list(logement.iterfind('*//climatisation/donnee_entree/enum_type_energie_id'))

        # construction d'un dictionnaire de consommation par énergie sur les générateurs ch
        conso_ch_list = list(logement.iterfind('*//generateur_chauffage/donnee_intermediaire/conso_ch'))
        conso_ch_dict = dict()
        for conso_ch, enum_type_energie_id in zip(conso_ch_list, type_ener_ch_list):
            enum_type_energie_id = enum_type_energie_id.text
            conso_ch_ener = conso_ch_dict.get(enum_type_energie_id, 0)
            conso_ch_ener += float(conso_ch.text)
            conso_ch_dict[enum_type_energie_id] = conso_ch_ener

        # dans le cas du chauffage on supprime les type d'energie nulles
        type_ener_ch_0 = [k for k, v in conso_ch_dict.items() if v == 0]
        type_ener_ch_list = [el for el in type_ener_ch_list if el.text not in type_ener_ch_0]

        # construction d'un dictionnaire de consommation par énergie sur les générateurs ecs
        conso_ecs_list = list(logement.iterfind('*//generateur_ecs/donnee_intermediaire/conso_ecs'))
        conso_ecs_dict = dict()
        for conso_ecs, enum_type_energie_id in zip(conso_ecs_list, type_ener_ecs_list):
            enum_type_energie_id = enum_type_energie_id.text
            conso_ecs_ener = conso_ecs_dict.get(enum_type_energie_id, 0)
            conso_ecs_ener += float(conso_ecs.text)
            conso_ecs_dict[enum_type_energie_id] = conso_ecs_ener

        # dans le cas de l'ECS on supprime les type d'energie nulles
        type_ener_ecs_0 = [k for k, v in conso_ecs_dict.items() if v == 0]

        type_ener_ecs_list = [el for el in type_ener_ecs_list if el.text not in type_ener_ecs_0]

        type_ener_input_list = type_ener_ecs_list + type_ener_ch_list + type_ener_fr_list

        type_ener_input_num = set([convert_xml_text(el.text) for el in type_ener_input_list])

        type_ener_output_list = list(logement.iterfind('*//sortie_par_energie/enum_type_energie_id'))

        type_ener_output_num = set([convert_xml_text(el.text) for el in type_ener_output_list])

        missing_output_ener = type_ener_input_num - type_ener_output_num

        type_ener_output_elec = {1, 12} & type_ener_output_num

        if len(type_ener_output_elec) == 0:
            related_objects = type_ener_output_list
            msg = """
    aucune consommation éléctrique n'est présente dans les sorties par énergies. 
    """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='bad_by_energy_output',
                                related_objects=related_objects,
                                msg_importance='blocker')

        if len(missing_output_ener) > 0:
            related_objects = type_ener_output_list + type_ener_input_list
            msg = f"""
    des énergies consommées par des générateurs ne sont pas dans les données de sorties par énergie
    energies manquantes : 
    {self.display_enum_traduction('enum_type_energie_id', missing_output_ener)} 
    """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='bad_by_energy_output',
                                related_objects=related_objects,
                                msg_importance='blocker')
        missing_input_ener = type_ener_output_num - type_ener_input_num - {1,
                                                                           12}  # l'electricité peut toujours être présente même si hors générateur
        if len(missing_input_ener) > 0:
            related_objects = type_ener_output_list + type_ener_input_list
            msg = f"""
    des énergies apparaissent dans les sorties par énergie alors qu'aucun générateur ne les consomme. 
    energies manquantes : 
    {self.display_enum_traduction('enum_type_energie_id', missing_input_ener)} 
    """
            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='bad_by_energy_output',
                                related_objects=related_objects,
                                msg_importance='blocker')

        for type_ener_ecs in type_ener_ecs_list:
            found_output_list = [el for el in type_ener_output_list if el.text == type_ener_ecs.text]
            for found_output in found_output_list:  # should be len ==1
                parent = found_output.getparent()
                conso_ecs = convert_xml_text(parent.find('conso_ecs').text)
                if conso_ecs == 0:
                    if found_output.text not in type_ener_ecs_0:
                        related_objects = [parent] + [type_ener_ecs]
                        msg = f"""
    la consommation d'ECS pour l'énergie {self.display_enum_traduction('enum_type_energie_id', int(found_output.text))} 
    est égale à 0 dans les sorties alors qu'au moins un générateur d'ECS consomme cette énergie
    """
                        report.generate_msg(msg, msg_type='warning_logiciel',
                                            msg_theme='bad_by_energy_output',
                                            related_objects=related_objects,
                                            msg_importance='critical')

        for type_ener_ch in type_ener_ch_list:
            found_output_list = [el for el in type_ener_output_list if el.text == type_ener_ch.text]
            for found_output in found_output_list:  # should be len ==1
                parent = found_output.getparent()
                conso_ch = convert_xml_text(parent.find('conso_ch').text)
                if conso_ch == 0:
                    if found_output.text not in type_ener_ch_0:
                        related_objects = [parent] + [type_ener_ch]
                        msg = f"""
    la consommation de chauffage pour l'énergie {self.display_enum_traduction('enum_type_energie_id', int(found_output.text))} 
    est égale à 0 dans les sorties alors qu'au moins un générateur de chauffage consomme cette énergie.
    """
                        report.generate_msg(msg, msg_type='warning_logiciel',
                                            msg_theme='bad_by_energy_output',
                                            related_objects=related_objects,
                                            msg_importance='critical')

    def controle_coherence_hors_methode(self, logement, report):

        for enum_name, v in self.enum_hors_methode_dict.items():
            for enum in logement.iterfind(f'*//{enum_name}'):
                enum_value = convert_xml_text(enum.text)
                if v[enum_value] == 1:
                    msg = f"""
    attention utilisation d'une valeur hors méthode de calcul pour {enum_name}:
    {self.display_enum_traduction(enum_name, enum_value)}
    vérifiez qu'aucune des valeurs forfaitaires ne convienne à la place de cette saisie. 
    """
                    related_objects = [enum]
                    report.generate_msg(msg, msg_type='warning_saisie',
                                        msg_theme='anomaly',
                                        related_objects=related_objects,
                                        msg_importance='major')

    def controle_coherence_existence_composants(self, logement, report):

        methode_dpe_id = int(logement.find('*//enum_methode_application_dpe_log_id').text)
        type_batiment = self.enum_table['methode_application_dpe_log'].loc[methode_dpe_id].type_batiment

        for element_enveloppe in expected_components[type_batiment]:
            if len(list(logement.iterfind(f'*//{element_enveloppe}'))) == 0:
                msg = f"""
                aucun {' '.join(element_enveloppe.split('_'))} n'est saisi pour ce DPE {type_batiment}. Ceci constitue une anomalie importante dans la grande majorité des cas.   
                """
                related_objects = [logement.find('enveloppe')]
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='anomaly',
                                    related_objects=related_objects,
                                    msg_importance='critical')

    def controle_coherence_pont_thermique(self, logement, report):
        periode_construction_id = int(logement.find('*//enum_periode_construction_id').text)
        # controle aucun pt de certaine catégorie.
        type_liaison_num = [int(el.text) for el in
                            list(logement.iterfind('*//pont_thermique/donnee_entree/enum_type_liaison_id'))]

        methode_dpe = int(logement.find('*//enum_methode_application_dpe_log_id').text)
        type_batiment = self.enum_table['methode_application_dpe_log'].loc[methode_dpe].type_batiment

        missing_type_liaison_num = expected_pt_liaison[type_batiment] - set(type_liaison_num)

        if len(missing_type_liaison_num) > 0:
            msg = f"""
    aucun pont thermique de type :
    {self.display_enum_traduction('enum_type_liaison_id', missing_type_liaison_num)}
    n'est saisi pour ce DPE {type_batiment}. Ceci constitue une anomalie dans la grande majorité des cas.   
    """
            related_objects = [logement.find('*//pont_thermique_collection')]
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=related_objects,
                                msg_importance='major')

        tv_pont_thermique_id = list(logement.iterfind('*//pont_thermique/donnee_entree/tv_pont_thermique_id'))

        related_props = [{**self.valeur_table_dict['tv_pont_thermique_id'][int(el.text)], **{'element': el}} for el in
                         tv_pont_thermique_id]

        # controle type isolation mur dans PT
        type_isolation_mur_id = [int(el.text) for el in logement.iterfind('*//mur//enum_type_isolation_id')]

        type_isolation_mur_id = [default_isol_for_pt_isol_mais_inconnu['mur'].get(el, el) for el in
                                 type_isolation_mur_id]

        default_isolation_by_period = self.enum_table['periode_construction'].loc[
            periode_construction_id].defaut_mur_enum_type_isolation_id
        default_isolation_by_period = {1: default_isolation_by_period}
        type_isolation_mur_id = [default_isolation_by_period.get(el, el) for el in type_isolation_mur_id]
        type_isolation_mur = [self.enum_dict['enum_type_isolation_id'][el] for el in type_isolation_mur_id]

        # gestion du cas particulier ossature bois
        materiaux_murs = [self.enum_dict['enum_materiaux_structure_mur_id'][int(el.text)] for el in
                          logement.iterfind('*//mur//enum_materiaux_structure_mur_id')]
        if len(materiaux_murs) > 0:
            is_ossature_bois = max(['ossature' in el for el in materiaux_murs])
            if is_ossature_bois is True:
                ossature_bois = ['ITR', 'ITI+ITR', 'ITE+ITR']
            else:
                ossature_bois = []
        else:
            is_ossature_bois = False
            ossature_bois = []
        type_isolation_mur_in_pt = [el for el in related_props if isinstance(el['isolation_mur'], str)]

        isolation_pt_not_in_mur = set({el['isolation_mur'] for el in type_isolation_mur_in_pt}) - set(
            type_isolation_mur + ossature_bois)

        if len(isolation_pt_not_in_mur) > 0:
            anomaly_pt = [el['element'] for el in related_props if el['isolation_mur'] in isolation_pt_not_in_mur]
            related_objects = anomaly_pt
            msg = f"""
    le type d'isolation des murs saisi dans les ponts thermiques est : {' ou '.join(isolation_pt_not_in_mur)}
    ceci est incohérent avec le type d'isolation saisi pour les murs du logement : {' ou '.join(set(type_isolation_mur))}
    """
            if is_ossature_bois is True:
                msg += f"ou avec le type d'isolation prévu par l'ossature bois {' ou '.join(set(ossature_bois))}"
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='incoherence_enveloppe',
                                related_objects=related_objects,
                                msg_importance='major')

        # controle type isolation plancher bas dans PT

        type_isolation_plancher_bas_id = [int(el.text) for el in
                                          logement.iterfind('*//plancher_bas//enum_type_isolation_id')]

        type_isolation_plancher_bas_id = [default_isol_for_pt_isol_mais_inconnu['plancher_bas'].get(el, el) for el in
                                          type_isolation_plancher_bas_id]

        default_isolation_by_period = self.enum_table['periode_construction'].loc[
            periode_construction_id].defaut_plancher_bas_enum_type_isolation_id
        default_isolation_by_period_tp = self.enum_table['periode_construction'].loc[
            periode_construction_id].defaut_terre_plein_enum_type_isolation_id

        # gestion de la subtilité terre plein vs autres planchers
        default_isolation_by_period_by_adj = {False: {1: default_isolation_by_period},
                                              True: {1: default_isolation_by_period_tp}
                                              }

        is_terre_plein = [int(el.text) == 5 for el in logement.iterfind('*//plancher_bas//enum_type_adjacence_id')]
        type_isolation_plancher_bas_id = [default_isolation_by_period_by_adj[is_tp].get(el, el) for is_tp, el in
                                          zip(is_terre_plein, type_isolation_plancher_bas_id)]
        type_isolation_plancher_bas = [self.enum_dict['enum_type_isolation_id'][el] for el in
                                       type_isolation_plancher_bas_id]

        type_isolation_plancher_bas_in_pt = [el for el in related_props if isinstance(el['isolation_plancher'], str)]

        type_isolation_plancher_bas_in_pt = [el for
                                             el in type_isolation_plancher_bas_in_pt if
                                             el['enum_type_liaison_id'][0] == 1]

        isolation_pt_not_in_plancher_bas = set({el['isolation_plancher'] for
                                                el in type_isolation_plancher_bas_in_pt}) - set(
            type_isolation_plancher_bas)
        # cas PT avec plancher bas alors qu'aucun plancher bas déclaré
        if (len(type_isolation_plancher_bas) == 0) & (len(type_isolation_plancher_bas_in_pt) > 0):
            anomaly_pt = [el['element'] for el in related_props if
                          el['isolation_plancher'] in isolation_pt_not_in_plancher_bas]
            related_objects = anomaly_pt
            msg = """
    il existe des ponts thermiques de type Plancher bas / Mur mais aucun plancher bas n'est déclaré dans le modèle de donnée. 
    """
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=related_objects,
                                msg_importance='major')

        elif len(isolation_pt_not_in_plancher_bas) > 0:
            anomaly_pt = [el['element'] for el in related_props if
                          el['isolation_plancher'] in isolation_pt_not_in_plancher_bas]
            related_objects = anomaly_pt
            msg = f"""
    le type d'isolation des planchers bas saisi dans les ponts thermiques est : {' ou '.join(isolation_pt_not_in_plancher_bas)}
    ceci est incohérent avec le type d'isolation saisi pour les planchers bas du logement : {' ou '.join(set(type_isolation_plancher_bas))}
    """
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=related_objects,
                                msg_importance='major')

        # controle type isolation plancher haut dans PT

        type_isolation_plancher_haut_id = [int(el.text) for el in
                                           logement.iterfind('*//plancher_haut//enum_type_isolation_id')]

        type_isolation_plancher_haut_id = [default_isol_for_pt_isol_mais_inconnu['plancher_haut'].get(el, el) for el in
                                           type_isolation_plancher_haut_id]

        default_isolation_by_period = self.enum_table['periode_construction'].loc[
            periode_construction_id].defaut_plancher_haut_enum_type_isolation_id
        default_isolation_by_period = {1: default_isolation_by_period}
        type_isolation_plancher_haut_id = [default_isolation_by_period.get(el, el) for el in
                                           type_isolation_plancher_haut_id]
        type_isolation_plancher_haut = [self.enum_dict['enum_type_isolation_id'][el] for el in
                                        type_isolation_plancher_haut_id]

        type_isolation_plancher_haut_in_pt = [el for el in related_props if isinstance(el['isolation_plancher'], str)]

        type_isolation_plancher_haut_in_pt = [el for
                                              el in type_isolation_plancher_haut_in_pt if
                                              el['enum_type_liaison_id'][0] == 3]

        isolation_pt_not_in_plancher_haut = set({el['isolation_plancher'] for
                                                 el in type_isolation_plancher_haut_in_pt}) - set(
            type_isolation_plancher_haut)
        # cas PT avec plancher haut alors qu'aucun plancher haut déclaré
        if (len(type_isolation_plancher_haut) == 0) & (len(type_isolation_plancher_haut_in_pt) > 0):
            anomaly_pt = [el['element'] for el in related_props if
                          el['isolation_plancher'] in isolation_pt_not_in_plancher_haut]
            related_objects = anomaly_pt
            msg = """
    il existe des ponts thermiques de type plancher haut / Mur mais aucun plancher haut n'est déclaré dans le modèle de donnée. 
    """
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=related_objects,
                                msg_importance='major')

        elif len(isolation_pt_not_in_plancher_haut) > 0:
            anomaly_pt = [el['element'] for el in related_props if
                          el['isolation_plancher'] in isolation_pt_not_in_plancher_haut]
            related_objects = anomaly_pt
            msg = f"""
    le type d'isolation des planchers hauts saisi dans les ponts thermiques est : {' ou '.join(isolation_pt_not_in_plancher_haut)}
    ceci est incohérent avec le type d'isolation saisi pour les planchers hauts du logement : {' ou '.join(set(type_isolation_plancher_haut))}
    """
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=related_objects,
                                msg_importance='major')

        # controle type isolation baies vitrées dans PT

        type_pose_baie_vitree = [self.enum_dict['enum_type_pose_id'][int(el.text)] for
                                 el in logement.iterfind('*//baie_vitree//enum_type_pose_id')]
        type_pose_porte = [self.enum_dict['enum_type_pose_id'][int(el.text)] for
                           el in logement.iterfind('*//porte//enum_type_pose_id')]
        type_pose_menuiserie = type_pose_porte + type_pose_baie_vitree
        type_pose_menuiserie_in_pt = [el for el in related_props if isinstance(el['type_pose'], str)]

        type_pose_menuiserie_in_pt = [el for
                                      el in type_pose_menuiserie_in_pt if
                                      el['enum_type_liaison_id'][0] == 5]

        type_pose_pt_not_in_menuiserie = set({el['type_pose'] for
                                              el in type_pose_menuiserie_in_pt}) - set(type_pose_menuiserie)
        # cas PT avec baie vitrée alors qu'aucun baie vitrée déclaré
        if (len(type_pose_menuiserie) == 0) & (len(type_pose_pt_not_in_menuiserie) > 0):
            anomaly_pt = [el['element'] for el in related_props if
                          el['type_pose'] in type_pose_pt_not_in_menuiserie]
            related_objects = anomaly_pt
            msg = """
    il existe des ponts thermiques de type menuiserie / Mur mais aucune menuiserie n'est déclaré dans le modèle de donnée. 
    """
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=related_objects,
                                msg_importance='major')

        elif len(type_pose_pt_not_in_menuiserie) > 0:
            anomaly_pt = [el['element'] for el in related_props if
                          el['type_pose'] in type_pose_pt_not_in_menuiserie]
            related_objects = anomaly_pt
            msg = f"""
    le type de pose des menuiseries saisi dans les ponts thermiques est : {' ou '.join(type_pose_pt_not_in_menuiserie)}
    ceci est incohérent avec le type de pose saisi pour les menuiseries (baies ou portes) du logement : {' ou '.join(set(type_pose_menuiserie))}
    """
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=related_objects,
                                msg_importance='major')

        calcul_pont_thermique_baie = [(self.enum_table['type_vitrage'].loc[int(el.text)].calcul_pont_thermique_baie, int(el.getparent().find('enum_type_adjacence_id').text), int(el.getparent().find('enum_inclinaison_vitrage_id').text),el) for
                                      el in logement.iterfind('*//baie_vitree/donnee_entree/enum_type_vitrage_id')]

        el_baie_ext_pt = [el[3] for el in calcul_pont_thermique_baie if el[0:3]==(1, 1, 3)]

        calcul_pont_thermique_baie = [el[0:3] for el in calcul_pont_thermique_baie]
        # on a au moins une baie extérieure verticale qui fait l'objet d'un calcul de pont thermique
        baie_ext_pt = {(1, 1, 3)}.issubset(set(calcul_pont_thermique_baie))

        calcul_pont_thermique_mur = [(self.enum_table['materiaux_structure_mur'].loc[int(el.text)].calcul_pont_thermique_baie, int(el.getparent().find('enum_type_adjacence_id').text),el) for
                                     el in logement.iterfind('*//mur//enum_materiaux_structure_mur_id')]

        el_mur_ext_pt = [el[2] for el in calcul_pont_thermique_mur if el[0:2] == (1, 1)]

        calcul_pont_thermique_mur = [el[0:2] for el in calcul_pont_thermique_mur]
        # on a au moins un mur extérieur qui n'est pas en bois et on a aucun murs en bois qui est extérieur
        mur_ext_pt = {(1, 1)}.issubset(set(calcul_pont_thermique_mur)) and not {(0, 1)}.issubset(set(calcul_pont_thermique_mur))
        # exception pour les appartements sous les toits (dernier étage), susceptible de n'avoir que des fenêtres de toit (avec ponts thermiques négligées)
        presence_appartement = type_batiment == 'appartement'
        presence_plancher_haut_deperditif = float(logement.find('*//deperdition_plancher_haut').text) > 0
        presence_appartement_sous_toit = presence_appartement and presence_plancher_haut_deperditif

        # si l'on a des baies ext et murs ext non bois alors on doit avoir au moins un pt baie/mur, SAUF pour un appartement sous les toits
        if baie_ext_pt and mur_ext_pt and (not {5}.issubset(type_liaison_num)) and not presence_appartement_sous_toit:
            msg =f"""
aucun pont thermique n'est saisi pour les intéractions baie/mur. En l'absence de structure bois pour les murs extérieur, cette déclaration de pont thermique est obligatoire.
   """
            report.generate_msg(msg, msg_type='erreur_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=el_mur_ext_pt+el_baie_ext_pt,
                                msg_importance='blocker')

        paroi_lourde_pb = [(int(el.text), el) for
                           el in logement.iterfind('*//plancher_bas//paroi_lourde')]

        el_paroi_lourde_pb = [el[1] for el in paroi_lourde_pb if el[0] == 1]
        # on a que des plancher bas lourds
        paroi_lourde_pb = pd.Series([el[0] for el in paroi_lourde_pb]).min() == 1

        paroi_lourde_ph = [(int(el.text), el) for
                           el in logement.iterfind('*//plancher_haut//paroi_lourde')]

        el_paroi_lourde_ph = [el[1] for el in paroi_lourde_ph if el[0] == 1]
        # on a que des plancher bas lourds
        paroi_lourde_ph = pd.Series([el[0] for el in paroi_lourde_ph]).min() == 1

        paroi_lourde_mur_ext = [(int(el.text), int(el.getparent().find('enum_type_adjacence_id').text), el) for
                                el in logement.iterfind('*//mur//paroi_lourde')]

        paroi_lourde_mur_ext = [el for el in paroi_lourde_mur_ext if el[1] == 1]
        el_paroi_lourde_mur = [el[2] for el in paroi_lourde_mur_ext if el[0] == 1]
        # on a que des murs lourds
        paroi_lourde_mur_ext = pd.Series([el[0] for el in paroi_lourde_mur_ext]).min() == 1

        if paroi_lourde_mur_ext and paroi_lourde_pb and (not {1}.issubset(type_liaison_num)):
            msg = f"""
aucun pont thermique n'est saisi pour les intéractions plancher bas / mur alors que l'intégralité des planchers bas et des murs donnant sur l'extérieur sont des parois lourdes. 
Ceci est une anomalie dans la très grande majorité des cas. Cet avertissement doit être ignoré dans le cas exceptionnel où le plancher bas n'est en contact qu'avec des circulations ou locaux chauffés d'autres logements
"""
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=el_paroi_lourde_mur+el_paroi_lourde_pb,
                                msg_importance='blocker')

        if paroi_lourde_mur_ext and paroi_lourde_ph and (not {3}.issubset(type_liaison_num)):
            msg = f"""
aucun pont thermique n'est saisi pour les intéractions plancher haut / mur alors que l'intégralité des planchers hauts et des murs donnant sur l'extérieur sont des parois lourdes. 
Ceci est une anomalie dans la très grande majorité des cas. Cet avertissement doit être ignoré dans le cas exceptionnel où le plancher bas n'est en contact qu'avec des circulations ou locaux chauffés d'autres logements
"""
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='anomaly_pont_thermique',
                                related_objects=el_paroi_lourde_mur+el_paroi_lourde_ph,
                                msg_importance='blocker')

    def controle_coherence_enveloppe(self, logement, report):

        # coherence isolation pour b et isolation déclarée de la paroi
        periode_construction_id = int(logement.find('*//enum_periode_construction_id').text)

        type_isolation = [el for el in logement.iterfind('*//enum_type_isolation_id')]
        type_isolation_lnc = [el for el in type_isolation if
                              el.getparent().find('enum_cfg_isolation_lnc_id') is not None]
        cfg_isolation_lnc = [el.getparent().find('enum_cfg_isolation_lnc_id') for el in type_isolation_lnc]
        type_paroi_lnc = [el.getparent().getparent().tag for el in type_isolation_lnc]
        type_isolation_lnc_id = [int(el.text) for el in type_isolation_lnc]
        pc_tab = self.enum_table['periode_construction']
        pc_id = periode_construction_id
        type_isolation_lnc_id = [{1: pc_tab.loc[pc_id][f'defaut_{paroi}_enum_type_isolation_id']}.get(el, el) for
                                 el, paroi in zip(type_isolation_lnc_id, type_paroi_lnc)]
        is_isole_lnc = [el in range(3, 10) for el in type_isolation_lnc_id]

        for is_isole, cfg, type_isolation_id, paroi, el_type_isolation in zip(is_isole_lnc, cfg_isolation_lnc,
                                                                              type_isolation_lnc_id, type_paroi_lnc,
                                                                              type_isolation_lnc):
            is_isole_in_cfg = 'lc isolé' in self.enum_dict['enum_cfg_isolation_lnc_id'][int(cfg.text)]
            is_non_acessible = self.enum_dict['enum_cfg_isolation_lnc_id'][int(cfg.text)]=='local chauffé non accessible'
            el_materiaux_structure_mur = el_type_isolation.getparent().find('enum_materiaux_structure_mur_id')
            is_isole_mat = False
            if el_materiaux_structure_mur is not None:
                is_isole_mat = el_materiaux_structure_mur.text in materiau_mur_isolant
            incoherence_isolation = is_isole_in_cfg != is_isole
            incoherence_isolation = incoherence_isolation and not is_non_acessible
            # si le matériau est auto isolant et que l'on considère la paroi isolée alors pas de message d'erreur
            if is_isole_mat and is_isole_in_cfg:
                incoherence_isolation = False
            if incoherence_isolation:
                msg = f"""
    pour le calcul du b d'une paroi de type {paroi} celle ci est considérée isolé : {bool_trad_fr[is_isole_in_cfg]}
    alors que l'isolation de la paroi de type {paroi} est {self.display_enum_traduction('enum_type_isolation_id', [type_isolation_id])}
    Cet avertissement peut être ignoré pour le cas particulier où l'isolation des parois donnant sur le local non chauffé est inhomogène et le type d'isolation de cette paroi est minoritaire.
    """
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el_type_isolation],
                                    msg_importance='major')
        # cohérence période isolation période construction

        for el_periode_isolation in logement.iterfind('*//enum_periode_isolation_id'):
            periode_isolation_id = int(el_periode_isolation.text)
            if periode_isolation_id < periode_construction_id:
                msg = f"""
    pour une paroi de type {el_periode_isolation.getparent().getparent().tag}
    la période d'isolation déclarée :{self.display_enum_traduction('enum_periode_isolation_id', [periode_isolation_id])}
    est inférieure à la période de construction du bâtiment :{self.display_enum_traduction('enum_periode_construction_id', [periode_construction_id])}
    """
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el_periode_isolation],
                                    msg_importance='major')

        # cohérence type paroi autorisée pour adjacence

        type_paroi_autorise_dict = self.enum_table['type_adjacence']['type_paroi_autorise'].to_dict()
        for el_type_adjacence in logement.iterfind('*//enum_type_adjacence_id'):
            type_adjacence_id = int(el_type_adjacence.text)
            type_paroi_autorise = type_paroi_autorise_dict[type_adjacence_id].split('|')
            type_paroi = el_type_adjacence.getparent().getparent().tag
            if type_paroi not in type_paroi_autorise:
                msg = f"""
    pour une paroi de type {type_paroi}
    le type d'adjacence déclaré est {self.display_enum_traduction('enum_type_adjacence_id', [type_adjacence_id])}
    ce type d'adjacence est reservée aux parois suivantes : {','.join(type_paroi_autorise)}
    """
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el_type_adjacence],
                                    msg_importance='critical')

        orientation_baie_ids = [int(el.text) for el in logement.iterfind('*//baie_vitree//enum_orientation_id')]
        # exclusion des baies horizontales
        orientation_baie_ids = [el for el in orientation_baie_ids if el != 5]
        # murs exterieurs sur ets ou exterieur
        orientation_mur_ext = [el for el in logement.iterfind('*//mur//enum_orientation_id') if
                               int(el.getparent().find('enum_type_adjacence_id').text) in [1, 10]]
        orientation_mur_ext_id = [int(el.text) for el in orientation_mur_ext]
        orientation_baie_non_mur = set(orientation_baie_ids) - set(orientation_mur_ext_id)
        el_orientation_baie_non_mur = [el for el in logement.iterfind('*//baie_vitree//enum_orientation_id') if
                                       int(el.text) in orientation_baie_non_mur]
        for el_orientation in el_orientation_baie_non_mur:
            msg = f"""
    une baie vitrée orientée {self.display_enum_traduction('enum_orientation_id', [int(el_orientation.text)])}
    ne correspond à aucun mur donnant sur l'exterieur ou sur véranda de même orientation. 
    Ceci n'est possible que dans certains cas atypiques :
    - cas de paroi totalement vitrée 
    - cas de velux sur un toit incliné de même orientation qu'un mur sur local non chauffé ou adjacent donnant sur un local d'habitation
    - cas d'une paroi vitrée donnant sur un local non chauffé. 
    - cas d'un vitrage sur un débord d'une facade. 
    """
            report.generate_msg(msg, msg_type='warning_saisie',
                                msg_theme='incoherence_enveloppe',
                                related_objects=[el_orientation],
                                msg_importance='minor')
        # dimension des epaisseurs d'isolant
        for el in logement.iterfind('*//epaisseur_isolation'):

            if float(el.text) > 50:
                type_paroi = el.getparent().getparent().tag
                msg = f"""
    la valeur d'epaisseur d'isolant pour une paroi de type {type_paroi} est anormalement élevée {float(el.text)} cm
    vérifiez que l'epaisseur a bien été fournie en cm
    """
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el],
                                    msg_importance='major')
            elif float(el.text) < 2:
                type_paroi = el.getparent().getparent().tag
                msg = f"""
    la valeur d'epaisseur d'isolant pour une paroi de type {type_paroi} est anormalement faible {float(el.text)} cm
    vérifiez que l'epaisseur a bien été fournie en cm
    """
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el],
                                    msg_importance='major')

        # dimension des epaisseurs de structure
        for el in logement.iterfind('*//epaisseur_structure'):

            if float(el.text) > 100:
                type_paroi = el.getparent().getparent().tag
                msg = f"""
    la valeur d'epaisseur de la structure pour une paroi de type {type_paroi} est anormalement élevée {float(el.text)} cm
    vérifiez que l'epaisseur a bien été fournie en cm
    """
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el],
                                    msg_importance='minor')
            elif float(el.text) < 8:
                type_paroi = el.getparent().getparent().tag
                msg = f"""
    la valeur d'epaisseur de la structure pour une paroi de type {type_paroi} est anormalement faible {float(el.text)} cm
    vérifiez que l'epaisseur a bien été fournie en cm
    """
                report.generate_msg(msg, msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el],
                                    msg_importance='major')

        # controle que b = 0 correspond bien à aue = 0
        el_b_0 = logement.xpath('*//b[number(text())=0]')

        for el in el_b_0:
            paroi = el.getparent().getparent()
            paroi_name = paroi.tag
            de = paroi.find('donnee_entree')
            tv_coef_reduction_deperdition_id = de.find('tv_coef_reduction_deperdition_id')

            aue_0 = False
            el_aue = de.find('surface_aue')
            if el_aue is not None:
                aue = float(el_aue.text)
                if aue == 0:
                    aue_0 = True
            tv_coef_reduction_deperdition_id = de.find('tv_coef_reduction_deperdition_id')
            tv_b_equal_0 = False

            if tv_coef_reduction_deperdition_id is not None:
                coef_reduction_deperdition = int(tv_coef_reduction_deperdition_id.text)
                expected_value = self.valeur_table_dict['tv_coef_reduction_deperdition_id'][coef_reduction_deperdition][
                    'b']
                tv_b_equal_0 = expected_value == 0
            b_equal_0 = aue_0 | tv_b_equal_0
            if b_equal_0 is not True:
                msg = f"""
    la valeur de b pour une paroi de type {paroi_name} vaut 0
    cette valeur n'est acceptable que dans certaines configurations :
    la surface_aue de la paroi vaut 0 
    """
                if el_aue is not None:
                    msg += f"""
                        surface_aue = {aue} pour cette paroi"""
                else:
                    msg += """surface_aue n'est pas déclaré pour la paroi correspondante."""
                msg += "\nou la valeur de tv_coef_reduction_deperdition_id correspond à une valeur de la table =0."
                if tv_coef_reduction_deperdition_id is not None:
                    msg += f"""
    valeur b : 0
    valeur table : {expected_value} 
    """
                else:
                    msg += """\ntv_coef_reduction_deperdition_id n'est pas déclaré pour la paroi correspondante. 
    """
                report.generate_msg(msg,
                                    msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el, paroi],
                                    msg_importance='critical'
                                    )
        # verification si b >0 alors la table de valeur est saisie
        el_b_sup0 = logement.xpath('*//b[number(text())>0]')
        for el in el_b_sup0:
            paroi = el.getparent().getparent()
            paroi_name = paroi.tag
            de = paroi.find('donnee_entree')
            if de.find('tv_coef_reduction_deperdition_id') is None:
                msg = f"""
    la valeur de b pour une paroi de type {paroi_name} est >0 
    la table de valeur correspondante tv_coef_reduction_deperdition_id n'est pas renseignée alors qu'elle devrait l'être pour tout b>0
    Cet avertissement peut être ignoré pour le cas des vérandas à multiple orientation sans orientation principale. (b calculé comme une moyenne) 
    """
                report.generate_msg(msg,
                                    msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el, paroi],
                                    msg_importance='critical'
                                    )
        # controle que l'epaisseur du mur est déclarée lorsque une structure de mur est identifiée. (exception des plaques de platres sans épaisseur obligatoire)
        mur_connu = logement.xpath('*//enum_materiaux_structure_mur_id[text()!="1" and text()!="20"]')

        for el in mur_connu:
            paroi = el.getparent().getparent()
            paroi_name = paroi.tag
            de = paroi.find('donnee_entree')
            epaisseur_structure = de.find('epaisseur_structure')
            if epaisseur_structure is None:
                msg = f"""
    le matériaux du mur {self.display_enum_traduction('enum_materiaux_structure_mur_id', int(el.text))} est connu
    mais l'épaisseur associée n'a pas été saisie.
    """
                report.generate_msg(msg,
                                    msg_type='warning_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el, paroi],
                                    msg_importance="critical"
                                    )


    def controle_coherence_paroi_lourde(self,logement,report):

        for el_paroi_lourde in logement.iterfind('*//mur//paroi_lourde'):
            materiau = int(el_paroi_lourde.getparent().find('enum_materiaux_structure_mur_id').text)
            paroi_lourde = int(el_paroi_lourde.text)
            expected_paroi_lourde = self.enum_table['materiaux_structure_mur'].loc[materiau].fillna(0).paroi_lourde
            min_epaisseur = self.enum_table['materiaux_structure_mur'].loc[materiau].fillna(0).paroi_lourde_epaisseur
            type_isolation = int(el_paroi_lourde.getparent().find('enum_type_isolation_id').text)
            type_adjacence = int(el_paroi_lourde.getparent().find('enum_type_adjacence_id').text)
            if el_paroi_lourde.getparent().find('epaisseur_structure') is not None:

                ep = np.float64(el_paroi_lourde.getparent().find('epaisseur_structure').text)
            else:
                ep = 0

            if (expected_paroi_lourde == 1) and (type_isolation in (2, 4)) and (ep >= min_epaisseur) and (paroi_lourde == 0) and (type_adjacence == 1):
                epaisseur_txt = ep
                if epaisseur_txt is None:
                    epaisseur_txt = 'non définie'

                msg = f"""
        un mur en {self.display_enum_traduction('enum_materiaux_structure_mur_id', materiau)} devrait être déclaré comme une paroi à inertie lourde mais ne l'est pas
        matériau : {self.display_enum_traduction('enum_materiaux_structure_mur_id', materiau)}
        épaisseur : {epaisseur_txt}
        type_isolation : {self.display_enum_traduction('enum_type_isolation_id', type_isolation)} 
        donnant sur :{self.display_enum_traduction('enum_type_adjacence_id', type_adjacence)}
                """
                report.generate_msg(msg,
                                    msg_type='erreur_saisie',
                                    msg_theme='incoherence_enveloppe',
                                    related_objects=[el_paroi_lourde],
                                    msg_importance="blocker"
                                    )

    def controle_coherence_systeme(self, logement, report):

        periode_construction_id = int(logement.find('*//enum_periode_construction_id').text)

        # vérification cohérence période de ventilation

        periode_ventilation = self.enum_table['type_ventilation'].periode_construction.dropna().to_dict()

        for el_type_ventilation in logement.iterfind('*//enum_type_ventilation_id'):
            type_ventilation_id = int(el_type_ventilation.text)
            periodes = periode_ventilation.get(type_ventilation_id)
            if periodes is not None:
                periodes_id = [int(el) for el in periodes.split('|')]
                max_period_id = max(periodes_id)
                if periode_construction_id > max_period_id:
                    msg = f"""
    le système de ventilation est déclaré plus ancien que la période de construction du bâtiment
    type ventilation : {self.display_enum_traduction('enum_type_ventilation_id', type_ventilation_id)}
    periode ventilation : {self.display_enum_traduction('enum_periode_construction_id', periode_construction_id)}
    """
                    related_objects = [el_type_ventilation]
                    report.generate_msg(msg, msg_type='warning_saisie',
                                        msg_theme='incoherence_systeme',
                                        related_objects=related_objects,
                                        msg_importance='major')

        # controle de cohérence valeur rpn/rpint

        rpn_sup_rpint = self.enum_table['type_generateur_ch']['rpn_sup_rpint'].dropna()
        for el_rpn in logement.iterfind('*//generateur_chauffage//rpn'):
            el_rpint = el_rpn.getparent().find('rpint')
            if el_rpint is not None:
                el_type_generateur_ch = el_rpn.getparent().getparent().find('*//enum_type_generateur_ch_id')
                rpn = float(el_rpn.text)
                rpint = float(el_rpint.text)
                type_generateur_ch_id = int(el_type_generateur_ch.text)
                logic = rpn_sup_rpint.get(type_generateur_ch_id)
                if logic is not None:
                    if logic == 0 and (rpn > rpint):
                        related_objects = [el_rpn, el_rpint]
                        msg = f"""
    pour un générateur de type {self.display_enum_traduction('enum_type_generateur_ch_id', type_generateur_ch_id)}
    Rpn > Rpint. Pour ce type de générateur c'est en général le contraire qui est attendu. 
    Rpn :  {rpn}
    Rpint :  {rpint}
    """
                        report.generate_msg(msg,
                                            msg_type='warning_saisie',
                                            msg_theme='incoherence_systeme',
                                            related_objects=related_objects,
                                            msg_importance="minor"
                                            )
                    elif logic == 1 and (rpn < rpint):
                        related_objects = [el_rpn, el_rpint]
                        msg = f"""
    pour un générateur de type {self.display_enum_traduction('enum_type_generateur_ch_id', type_generateur_ch_id)}
    Rpn < Rpint. Pour ce type de générateur c'est en général le contraire qui est attendu. 
    Rpn :  {rpn}
    Rpint :  {rpint}
    """
                        report.generate_msg(msg,
                                            msg_type='warning_saisie',
                                            msg_theme='incoherence_systeme',
                                            related_objects=related_objects,
                                            msg_importance="minor"
                                            )
        # controle coherence intermittence inertie
        intermittence_inertie_dict = self.valeur_table['intermittence'].enum_classe_inertie_id.dropna().to_dict()
        for el_intermittence in logement.iterfind('*//tv_intermittence_id'):
            intermittence_id = int(el_intermittence.text)
            intermittence_inertie = intermittence_inertie_dict.get(intermittence_id)
            if intermittence_inertie is not None:

                el_inertie = logement.find('*//enum_classe_inertie_id')
                inertie_id = int(el_inertie.text)
                if inertie_id not in intermittence_inertie:
                    related_objects = [el_inertie, el_intermittence]
                    msg = f"""
    incohérence entre l'inertie déclarée pour le dpe {self.display_enum_traduction('enum_classe_inertie_id', inertie_id)}
    et la valeur d'intermittence choisie pour un des emetteurs qui correspond à une inertie {self.display_enum_traduction('enum_classe_inertie_id', intermittence_inertie)}
    """
                    report.generate_msg(msg,
                                        msg_type='warning_saisie',
                                        msg_theme='incoherence_systeme',
                                        related_objects=related_objects,
                                        msg_importance="major"
                                        )

        # position probable des générateurs (volume chauffé) comparé avec valeur déclarée.
        methode_dpe = int(logement.find('*//enum_methode_application_dpe_log_id').text)
        type_batiment = self.enum_table['methode_application_dpe_log'].loc[methode_dpe].type_batiment
        pos_prob_vol_ch_dict = self.enum_table['type_generateur_ch'][
            'position_probable_volume_chauffe'].dropna().to_dict()
        for el_type_generateur_ch in logement.iterfind('*//enum_type_generateur_ch_id'):
            type_generateur_ch_id = int(el_type_generateur_ch.text)
            position_probable_volume_chauffe = pos_prob_vol_ch_dict.get(type_generateur_ch_id)
            el_type_installation = el_type_generateur_ch.getparent().getparent().getparent().getparent().find(
                '*//enum_type_installation_id')
            type_installation_id = int(el_type_installation.text)
            if type_batiment != 'maison':
                position_probable_volume_chauffe = 1
            if type_installation_id > 1:
                position_probable_volume_chauffe = 0
            if type_generateur_ch_id in range(98, 106):
                position_probable_volume_chauffe = 1
            if position_probable_volume_chauffe is not None:
                el_position_volume_chauffe = el_type_generateur_ch.getparent().find('position_volume_chauffe')
                position_volume_chauffe = int(el_position_volume_chauffe.text)
                if position_volume_chauffe != position_probable_volume_chauffe:
                    msg = f"""
    un générateur de chauffage de type {self.display_enum_traduction('enum_type_generateur_ch_id', type_generateur_ch_id)} 
    dans une installation de type  : {self.display_enum_traduction('enum_type_installation_id', type_installation_id)}
    est déclaré avec présence en volume chauffé : {bool_trad_fr[position_volume_chauffe > 0]}
    ceci est inhabituel pour cette combinaison installation/generateur. 
    """
                    related_objects = [el_position_volume_chauffe, el_type_generateur_ch]
                    report.generate_msg(msg, msg_type='warning_saisie',
                                        msg_theme='incoherence_systeme',
                                        related_objects=related_objects,
                                        msg_importance='minor')

        pos_prob_vol_ecs_dict = self.enum_table['type_generateur_ecs'][
            'position_probable_volume_chauffe'].dropna().to_dict()
        for el_type_generateur_ecs in logement.iterfind('*//enum_type_generateur_ecs_id'):
            type_generateur_ecs_id = int(el_type_generateur_ecs.text)
            position_probable_volume_chauffe = pos_prob_vol_ecs_dict.get(type_generateur_ecs_id)
            el_type_installation = el_type_generateur_ecs.getparent().getparent().getparent().getparent().find(
                '*//enum_type_installation_id')
            type_installation_id = int(el_type_installation.text)
            if type_batiment != 'maison':
                position_probable_volume_chauffe = 1
            if type_installation_id > 1:
                position_probable_volume_chauffe = 0
            if position_probable_volume_chauffe is not None:
                el_position_volume_chauffe = el_type_generateur_ecs.getparent().find('position_volume_chauffe')
                position_volume_chauffe = int(el_position_volume_chauffe.text)
                if position_volume_chauffe != position_probable_volume_chauffe:
                    msg = f"""
    un générateur d'ECS de type {self.display_enum_traduction('enum_type_generateur_ecs_id', type_generateur_ecs_id)} 
    dans une installation de type  : {self.display_enum_traduction('enum_type_installation_id', type_installation_id)}
    est déclaré avec présence en volume chauffé : {bool_trad_fr[position_volume_chauffe > 0]}
    ceci est inhabituel pour cette combinaison installation/generateur. 
    """
                    related_objects = [el_position_volume_chauffe, el_type_generateur_ecs]
                    report.generate_msg(msg, msg_type='warning_saisie',
                                        msg_theme='incoherence_systeme',
                                        related_objects=related_objects,
                                        msg_importance='minor')

    def controle_coherence_cle_repartition_dpe_appartement(self, logement, report):
        """
        Ce contrôle de cohérence ne s'applique que dans le cas d'un DPE appartement réalisé à partir d'un DPE immeuble.
        """
        methode_dpe = int(logement.find('*//enum_methode_application_dpe_log_id').text)
        methode_application_dpe = self.enum_table['methode_application_dpe_log'].loc[
            methode_dpe].methode_application_dpe

        is_dpe_appartement_immeuble = methode_application_dpe == 'dpe appartement généré à partir des données DPE immeuble'

        if is_dpe_appartement_immeuble:
            for container_name, cle_repartition in systeme_to_cle_repartition.items():
                for container_object in logement.iterfind(f'*//{container_name}'):
                    el_cle_repartition = container_object.find(f'*//{cle_repartition}')
                    if el_cle_repartition is None:
                        msg = f"""
    Pour un DPE à l'appartement issu d'un DPE immeuble il doit être précisé {cle_repartition} pour un objet de type {container_name}.Ceci afin de spécifier la part de consommation immeuble à attribuer au logement. 
    """
                        related_objects = [container_object]
                        report.generate_msg(msg, msg_type='erreur_logiciel',
                                            msg_theme='error_cle_repartition',
                                            related_objects=related_objects,
                                            msg_importance='blocker')

    def controle_coherence_consommation_0_generateur_installation(self, logement, report):

        """
        ce contrôle de cohérence gère l'ensemble des configurations dans lesquelles on peut avoir des consommations 0 sur un générateur ou une installation.
        si l'on est pas dans un cas particulier évalué dans ce contrôle, le moteur renvoie un message d'erreur.
        """

        # ==================== CONTROLE INSTALLATION ECS =================================
        for prop in ['conso_ecs', 'conso_ecs_depensier']:
            prop_0_list = logement.xpath(f'*//installation_ecs/donnee_intermediaire/{prop}[number(text())=0]')
            for prop_0 in prop_0_list:
                fecs = prop_0.getparent().find('fecs')
                installation = prop_0.getparent().getparent()
                if fecs is not None:
                    fecs = float(fecs.text)
                else:
                    fecs = 0
                if fecs != 1:
                    msg = f"""
    le champ {prop} vaut 0 pour une installation d'ecs
    Ceci n'est autorisé que dans les cas suivants:

    - une installation d'ecs avec ecs solaire dont le fecs est de 1 (couverture du besoin à 100% grâce à l'installation solaire)
    L'installation en question ne correspond pas à cette configuration.
    """
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='error_conso_0',
                                        related_objects=[installation,
                                                         prop_0],
                                        msg_importance='blocker')
        # ==================== CONTROLE GENERATEUR ECS =================================
        for prop in ['conso_ecs', 'conso_ecs_depensier']:
            prop_0_list = logement.xpath(f'*//generateur_ecs/donnee_intermediaire/{prop}[number(text())=0]')
            for prop_0 in prop_0_list:

                installation = prop_0.getparent().getparent().getparent().getparent()
                fecs = installation.find('*//fecs')
                if fecs is not None:
                    fecs = float(fecs.text)
                else:
                    fecs = 0
                if fecs != 1:
                    msg = f"""
    le champ {prop} vaut 0 pour un générateur d'ecs
    Ceci n'est autorisé que dans les cas suivants:

    - une installation d'ecs avec ecs solaire dont le fecs est de 1 (couverture du besoin à 100% grâce à l'installation solaire)
    L'installation en question ne correspond pas à cette configuration.
    """
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='error_conso_0',
                                        related_objects=[installation,
                                                         prop_0],
                                        msg_importance='blocker')
        # ==================== CONTROLE INSTALLATION CHAUFFAGE =================================
        for prop in ['conso_ch', 'conso_ch_depensier']:
            prop_0_list = logement.xpath(f'*//installation_chauffage/donnee_intermediaire/{prop}[number(text())=0]')
            for prop_0 in prop_0_list:
                el_fch = prop_0.getparent().find('fch')
                besoin_ch = float(prop_0.getparent().find(f'{prop.replace("conso", "besoin")}').text)
                installation = prop_0.getparent().getparent()
                if el_fch is not None:
                    fch = float(el_fch.text)
                else:
                    fch = 0
                if (fch != 1) & (besoin_ch > 0):
                    msg = f"""
    le champ {prop} vaut 0 pour une installation de chauffage
    Ceci n'est autorisé que dans les cas suivants:

    - une installation de chauffage avec chauffage solaire dont le fch est de 1 (couverture du besoin à 100% grâce à l'installation solaire)
    L'installation en question ne correspond pas à cette configuration.
    - une installation de chauffage dont le besoin est 0 à cause d'apports internes/solaires trop élevé qui compense l'intégralité des besoins de chauffage.
    """
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='error_conso_0',
                                        related_objects=[installation,
                                                         prop_0],
                                        msg_importance='blocker')
        # ==================== CONTROLE GENERATEUR CHAUFFAGE =============================

        cascades = [el for el in logement.iterfind('*//priorite_generateur_cascade')]
        if len(cascades) > 0:
            cascades_num = [int(el.text) for el in cascades]
            max_cascade = max(cascades_num)
            if max_cascade > 1 and 1 not in cascades_num:
                msg = """
    un générateur à combustion en cascade est déclaré avec priorite_generateur_cascade en priorité 2 ou +(non prioritaire) alors qu'aucun générateur en cascade n'est
    déclaré prioritaire (1)
    """
                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='error_generateur_cascade_order',
                                    related_objects=cascades,
                                    msg_importance='blocker')

        for prop in ['rendement_generation', 'conso_ch_depensier', 'conso_ch']:

            prop_0_list = logement.xpath(f'*//generateur_chauffage//donnee_intermediaire//{prop}[number(text())=0]')

            for prop_0 in prop_0_list:
                generateur = prop_0.getparent().getparent()
                installation = generateur.getparent().getparent()
                enum_cfg_installation_ch_id = int(installation.find('*//enum_cfg_installation_ch_id').text)
                el_fch = installation.find('*//fch')
                el_besoin_ch = installation.find(f'donnee_intermediaire/{prop.replace("conso", "besoin")}')

                type_generateur_ch = generateur.find('*//enum_type_generateur_ch_id').text
                el_priorite_generateur_cascade = generateur.find('donnee_entree/priorite_generateur_cascade')
                if el_priorite_generateur_cascade is not None:
                    priorite_generateur_cascade = int(el_priorite_generateur_cascade.text)
                else:
                    priorite_generateur_cascade = 0
                if el_fch is not None:
                    fch = float(el_fch.text)
                else:
                    fch = 0
                if el_besoin_ch is not None:
                    besoin_ch = float(el_besoin_ch.text)
                else:
                    besoin_ch = 1
                # si le générateur n'est pas en cascade non prioritaire ou issu d'une installation base + appoint cela bloque.
                if (priorite_generateur_cascade < 2) & (enum_cfg_installation_ch_id != 10) & (fch != 1) & (
                        besoin_ch != 0):
                    msg = f"""
le champ {prop} vaut 0 pour un générateur de chauffage de type {self.display_enum_traduction('enum_type_generateur_ch_id', int(type_generateur_ch))}
Ceci n'est autorisé que dans les cas suivants:
- générateur à combustion en cascade avec priorité qui est non prioritaire 
- un appoint dans une installation collective base + appoint.
- une installation de chauffage avec chauffage solaire dont le fch est de 1 (couverture du besoin à 100% grâce à l'installation solaire)
Le générateur en question ne correspond pas à cette configuration.
- une installation de chauffage dont le besoin est 0 à cause d'apports internes/solaires trop élevé qui compense l'intégralité des besoins de chauffage.
    """
                    if priorite_generateur_cascade == 1:
                        msg += f'ce générateur est prioritaire. ordre de priorité : {priorite_generateur_cascade}.'
                    report.generate_msg(msg, msg_type='erreur_logiciel',
                                        msg_theme='error_generateur_cascade_valeur_0',
                                        related_objects=[generateur,
                                                         prop_0],
                                        msg_importance='blocker')

    def controle_coherence_unicite_reference(self, logement, report):

        all_references = list(logement.iterfind('*//reference'))
        # gestion d'étape travaux (on supprime toutes les références dans etape travaux (car ce sont des liens vers references existantes).

        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            all_elements_etape_travaux = list(etape_travaux.iterfind('*//reference'))
            all_references = [el for el in all_references if el not in all_elements_etape_travaux]

        all_references_txt = [el.text for el in all_references]
        all_duplicates_reference_txt = get_duplicates(all_references_txt)

        if len(all_duplicates_reference_txt) > 0:
            ids = [i for i, el in enumerate(all_references_txt) if el in all_duplicates_reference_txt]
            all_duplicates_reference = [el for i, el in enumerate(all_references) if i in ids]
            report.generate_msg(
                f"les noms de références suivantes sont dupliquées dans plusieurs objets du DPE : {get_uniques(all_duplicates_reference_txt)}. Les références d'objets doivent être unique au sein d'un même DPE",
                msg_type='erreur_logiciel',
                msg_theme='error_duplicate_reference',
                related_objects=all_duplicates_reference,
                msg_importance='blocker')

    def controle_coherence_modele_methode_application(self, logement, report):
        xml_reg = logement.getroottree().getroot()
        enum_modele_dpe_id = xml_reg.find('*//enum_modele_dpe_id')
        enum_modele_audit_id = xml_reg.find('*//enum_modele_audit_id')
        if enum_modele_dpe_id is not None:
            enum_methode_application_dpe_log_id = logement.find('*//enum_methode_application_dpe_log_id')
            enum_modele_dpe_id_associe = str(self.enum_table['methode_application_dpe_log'].loc[
                                                 int(enum_methode_application_dpe_log_id.text)].enum_modele_dpe_id)
            if enum_modele_dpe_id.text != enum_modele_dpe_id_associe:
                report.generate_msg(f"""
la méthode d'application du dpe n'est pas compatible avec le modèle choisi : un modèle DPE logement neuf est appliqué avec une méthode DPE logement existant ou l'inverse
modele dpe : {self.display_enum_traduction('enum_modele_dpe_id', int(enum_modele_dpe_id.text))}
methode d'application : {self.display_enum_traduction('enum_methode_application_dpe_log_id', int(enum_methode_application_dpe_log_id.text))}                
""",
                                    msg_type='erreur_logiciel',
                                    msg_theme='error_methode_application',
                                    related_objects=[enum_methode_application_dpe_log_id, enum_modele_dpe_id],
                                    msg_importance='blocker')
        elif enum_modele_audit_id is not None:
            enum_methode_application_dpe_log_id_list = list(logement.iterfind('*//enum_methode_application_dpe_log_id'))
            for enum_methode_application_dpe_log_id in enum_methode_application_dpe_log_id_list:
                enum_modele_audit_id_associe = str(self.enum_table['methode_application_dpe_log'].loc[
                                                       int(enum_methode_application_dpe_log_id.text)].enum_modele_audit_id)
                if enum_modele_audit_id_associe == '0':
                    report.generate_msg(f"""
l'audit énergétique ne peut utiliser : ni une méthode d'application pour les bâtiments neufs, ni une méthode d'application d'appartement à partir de l'immeuble.
methode d'application : {self.display_enum_traduction('enum_methode_application_dpe_log_id', int(enum_methode_application_dpe_log_id.text))}                
""",
                                        msg_type='erreur_logiciel',
                                        msg_theme='error_methode_application',
                                        related_objects=[enum_methode_application_dpe_log_id, enum_modele_audit_id],
                                        msg_importance='blocker')
                elif enum_modele_audit_id.text not in enum_modele_audit_id_associe.split("|"):
                    report.generate_msg(f"""
la méthode d'application de l'audit n'est pas compatible avec le modèle choisi 
modele audit : {self.display_enum_traduction('enum_modele_audit_id', int(enum_modele_audit_id.text))}
methode d'application : {self.display_enum_traduction('enum_methode_application_dpe_log_id', int(enum_methode_application_dpe_log_id.text))}                
""",
                                        msg_type='erreur_logiciel',
                                        msg_theme='error_methode_application',
                                        related_objects=[enum_methode_application_dpe_log_id, enum_modele_audit_id],
                                        msg_importance='blocker')

    def controle_coherence_double_fenetre(self, logement, report):
        for double_fenetre in logement.iterfind('*//double_fenetre'):
            double_fenetre_value = int(double_fenetre.text)
            # si double fenetre alors on vérifie que la sous structure est saisie
            if double_fenetre_value == 1:
                parent = double_fenetre.getparent().getparent()
                if parent.find('baie_vitree_double_fenetre') is None:
                    report.generate_msg("""
une baie_vitree est déclarée en double fenetre sans le nouveau sous élément baie_vitree_double_fenetre associé . Ce sous élément est requis à partir du DPE 2.3 et de l'audit 1.1
                                        """,
                                        msg_type='erreur_logiciel',
                                        msg_theme='missing_required_element',
                                        related_objects=[parent, double_fenetre],
                                        msg_importance='blocker')

    def controle_coherence_presence_veilleuse(self, logement, report):

        tv_generateur_combustion = self.valeur_table['generateur_combustion']
        gen_veilleuse = tv_generateur_combustion.loc[tv_generateur_combustion.pveil > 0]

        enum_type_generateur_ch_id_avec_pveilleuse = gen_veilleuse.explode(
            'enum_type_generateur_ch_id').enum_type_generateur_ch_id.dropna().astype(str).unique()
        enum_type_generateur_ecs_id_avec_pveilleuse = gen_veilleuse.explode(
            'enum_type_generateur_ecs_id').enum_type_generateur_ecs_id.dropna().astype(str).unique()

        el_type_generateur_ch = list(logement.iterfind('*//enum_type_generateur_ch_id'))
        el_type_generateur_ecs = list(logement.iterfind('*//enum_type_generateur_ecs_id'))

        for el in el_type_generateur_ch:

            if el.text in enum_type_generateur_ch_id_avec_pveilleuse:
                generateur = el.getparent().getparent()
                enum_methode_saisie_carac_sys_id = generateur.find('*//enum_methode_saisie_carac_sys_id')
                if generateur.find('*//pveilleuse') is None and enum_methode_saisie_carac_sys_id.text == '1':
                    msg = f"""
le champ pveilleuse doit être renseigné pour les générateurs :
{self.display_enum_traduction("enum_type_generateur_ch_id", int(el.text))}
si la saisie est par défaut {self.display_enum_traduction("enum_methode_saisie_carac_sys_id", int(enum_methode_saisie_carac_sys_id.text))}
"""
                    related_objects = [generateur, el]
                    report.generate_msg(msg, msg_type='warning_logiciel',
                                        msg_theme='missing_required_element',
                                        related_objects=related_objects,
                                        msg_importance='major')

        for el in el_type_generateur_ecs:

            if el.text in enum_type_generateur_ecs_id_avec_pveilleuse:
                generateur = el.getparent().getparent()
                enum_methode_saisie_carac_sys_id = generateur.find('*//enum_methode_saisie_carac_sys_id')
                if generateur.find('*//pveilleuse') is None and enum_methode_saisie_carac_sys_id.text == '1':
                    msg = f"""
le champ pveilleuse doit être renseigné pour les générateurs :
{self.display_enum_traduction("enum_type_generateur_ecs_id", int(el.text))}
si la saisie est par défaut {self.display_enum_traduction("enum_methode_saisie_carac_sys_id", int(enum_methode_saisie_carac_sys_id.text))}
"""
                    related_objects = [generateur, el]
                    report.generate_msg(msg, msg_type='warning_logiciel',
                                        msg_theme='missing_required_element',
                                        related_objects=related_objects,
                                        msg_importance='major')

    def controle_coherence_reseau_chaleur(self, logement, report, is_blocker,now):

        if is_blocker == True:
            msg_type = 'erreur_logiciel'
            msg_type_saisie = 'erreur_saisie'
            msg_importance = 'blocker'
            msg_add = ''
        else:
            msg_type_saisie = 'warning_saisie'
            msg_type = 'warning_logiciel'
            msg_importance = 'critical'
            msg_add = ' \nceci sera bloquant dans une future version du moteur de contrôle de cohérence'

        for el_reseau in logement.iterfind('*//identifiant_reseau_chaleur'):

            parent = el_reseau.getparent()

            # test existence de date_arrete_reseau_chaleur

            if parent.find('date_arrete_reseau_chaleur') is None:
                msg = """
le champ date_arrete_reseau_chaleur doit être renseigné lorsqu'un réseau de chaleur est renseigné
"""
                report.generate_msg(msg + msg_add, msg_type=msg_type,
                                    msg_theme='missing_required_element',
                                    related_objects=[parent, el_reseau],
                                    msg_importance=msg_importance)
            # controle validité de la date_arrete_reseau_chaleur
            else:
                date_arrete_reseau_chaleur_txt = parent.find('date_arrete_reseau_chaleur').text
                date_arrete_reseau_chaleur = datetime.fromisoformat(date_arrete_reseau_chaleur_txt)
                last_date_arrete_reseau_chaleur_txt = self.arrete_reseau_chaleur[-1]['date_arrete_reseau_chaleur']

                date_application_dernier_arrete_txt = self.arrete_reseau_chaleur[-1]['date_application_arrete']
                # si la date d'arrêté de réseau de chaleur est inférieure à la dernière date en vigueur alors on bloque le dépot
                if datetime.fromisoformat(date_arrete_reseau_chaleur_txt) <= datetime.fromisoformat(last_date_arrete_reseau_chaleur_txt):
                    found_date_arrete = [el for el in self.arrete_reseau_chaleur if
                                         el['date_arrete_reseau_chaleur'] == date_arrete_reseau_chaleur_txt]

                    if len(found_date_arrete) == 0:
                        all_date_arrete = [el['date_arrete_reseau_chaleur'] for el in self.arrete_reseau_chaleur]
                        msg = f"""
la date d'arrêté de réseau de chaleur fournie n'est pas une date valide d'arrêté autorisée :
liste des dates autorisées :
{','.join(all_date_arrete)}                        
                        """

                        report.generate_msg(msg + msg_add, msg_type=msg_type,
                                            msg_theme='error_date_arrete_reseau_chaleur',
                                            related_objects=[parent, el_reseau],
                                            msg_importance=msg_importance)
                    else:
                        found_date_arrete = found_date_arrete[0]

                        tv_reseau = self.valeur_table[found_date_arrete['nom_table_valeur']]

                        if 'identifiant_reseau' in tv_reseau:
                            identifiants_reseaux_connus = tv_reseau.identifiant_reseau.unique().tolist()

                            if el_reseau.text not in identifiants_reseaux_connus:
                                msg = f"""
l'identifiant réseau {el_reseau.text} déclaré ne figure pas dans la liste des identifiants réseaux de l'arrêté. Il peut s'agir d'une erreur de saisie.            
                                """
                                report.generate_msg(msg, msg_type=msg_type_saisie,
                                                    msg_theme='warning_identifiant_reseau',
                                                    related_objects=[parent, el_reseau],
                                                    msg_importance=msg_importance)
                        # si l'on dépasse la date de validité de l'arrêté saisi alors bloqué
                        msg = f"""
les valeurs provenant de l'arrêté de réseau de chaleur utilisé par votre logiciel sont obsolètes. Le logiciel doit être mis à jour avec le nouvel arrêté réseau de chaleur
date_arrete_reseau_chaleur : {date_arrete_reseau_chaleur_txt}     
date_arrete_reseau_chaleur en vigueur :  {last_date_arrete_reseau_chaleur_txt}
date de fin de validité de l'arrêté utilisé dans l'observatoire DPE :  {found_date_arrete['date_fin']}                
"""
                        if now > datetime.fromisoformat(found_date_arrete['date_fin']) and date_arrete_reseau_chaleur_txt!=last_date_arrete_reseau_chaleur_txt:


                            report.generate_msg(msg+msg_add, msg_type=msg_type,
                                                msg_theme='error_date_arrete_reseau_chaleur',
                                                related_objects=[parent, el_reseau],
                                                msg_importance=msg_importance)
                        # si le nouvel arrêté est déjà en vigueur on envoi un message pour avertir du blocage prochain
                        elif now <= datetime.fromisoformat(found_date_arrete['date_fin']) and now > datetime.fromisoformat(date_application_dernier_arrete_txt) and date_arrete_reseau_chaleur_txt!=last_date_arrete_reseau_chaleur_txt:
                            msg_type = 'warning_logiciel'
                            msg_importance = 'critical'
                            msg += " \ncette erreur sera bloquante une fois la date de fin de validité échue."
                            report.generate_msg(msg, msg_type=msg_type,
                                                msg_theme='error_date_arrete_reseau_chaleur',
                                                related_objects=[parent, el_reseau],
                                                msg_importance=msg_importance)

    def controle_coherence_calcul_ue(self, logement, report, is_blocker):

        if is_blocker == True:
            msg_type = 'erreur_logiciel'
            msg_importance = 'blocker'
            msg_add = ''
        else:
            msg_type = 'warning_logiciel'
            msg_importance = 'critical'
            msg_add = ' \nceci sera bloquant dans une future version du moteur de contrôle de cohérence'

        ue_balises = ['surface_ue', 'perimetre_ue', 'ue']
        type_adjacence_table = self.enum_table['type_adjacence']
        adjacence_id_avec_ue = type_adjacence_table.loc[type_adjacence_table.calcul_ue_plancher_bas == 1].index.astype(
            str).unique().tolist()

        for el_plancher_bas in logement.iterfind('*//plancher_bas'):
            el_adjacence = el_plancher_bas.find('*//enum_type_adjacence_id')

            if el_adjacence.text in adjacence_id_avec_ue:

                if el_plancher_bas.find('*//calcul_ue').text != '1':
                    msg = f"""
il existe un plancher bas en adjacence avec {self.display_enum_traduction("enum_type_adjacence_id", int(el_adjacence.text))}. 
Un plancher bas avec ce type d'adjacence doit effectuer un calcul de Ue en remplacement de Upb. 
la balise calcul_ue est déclarée à 0 (faux) alors qu'elle devrait être à 1 pour ce cas
"""
                    report.generate_msg(msg + msg_add, msg_type=msg_type,
                                        msg_theme='bad_value',
                                        related_objects=[el_plancher_bas],
                                        msg_importance=msg_importance)
                for el, tag in [(el_plancher_bas.find(f'*//{el}'), el) for el in ue_balises]:
                    if el is None:
                        msg = f"""
il existe un plancher bas en adjacence avec {self.display_enum_traduction("enum_type_adjacence_id", int(el_adjacence.text))}. 
Un plancher bas avec ce type d'adjacence doit effectuer un calcul de Ue en remplacement de Upb. 
la balise {tag} n'est pas déclarée pour ce plancher bas ceci est une erreur.                           
"""
                        report.generate_msg(msg + msg_add, msg_type=msg_type,
                                            msg_theme='missing_required_element',
                                            related_objects=[el_plancher_bas],
                                            msg_importance=msg_importance)

                if el_plancher_bas.find('*//ue') is not None:
                    ue = float(el_plancher_bas.find('*//ue').text)
                    upb_final = float(el_plancher_bas.find('*//upb_final').text)

                    if not np.isclose(ue, upb_final, atol=0.01):
                        msg = f"""
il existe un plancher bas en adjacence avec {self.display_enum_traduction("enum_type_adjacence_id", int(el_adjacence.text))}. 
Un plancher bas avec ce type d'adjacence doit effectuer un calcul de Ue en remplacement de Upb. 
la valeur de upb_final ne correspond pas à la valeur de ue déclarée
ue : {ue}
upb_final : {upb_final}                             
"""
                        report.generate_msg(msg + msg_add, msg_type=msg_type,
                                            msg_theme='bad_value',
                                            related_objects=[el_plancher_bas, el_plancher_bas.find('*//ue'),
                                                             el_plancher_bas.find('*//upb_final')],
                                            msg_importance=msg_importance)
            else:

                upb = float(el_plancher_bas.find('*//upb').text)
                upb_final = float(el_plancher_bas.find('*//upb_final').text)
                if not np.isclose(upb, upb_final, atol=0.01):
                    msg = f"""
il existe un plancher bas en adjacence avec {self.display_enum_traduction("enum_type_adjacence_id", int(el_adjacence.text))}. 
Un plancher bas avec ce type d'adjacence n'effectue pas de calcul de ue, 
la valeur de upb_final ne correspond pas à la valeur de upb déclarée
upb : {upb}
upb_final : {upb_final}                             
"""
                    report.generate_msg(msg + msg_add, msg_type=msg_type,
                                        msg_theme='bad_value',
                                        related_objects=[el_plancher_bas, el_plancher_bas.find('*//upb'),
                                                         el_plancher_bas.find('*//upb_final')],
                                        msg_importance=msg_importance)
                for el in [el_plancher_bas.find(f'*//{el}') for el in ue_balises]:
                    if el is not None:
                        msg = f"""
il existe un plancher bas en adjacence avec {self.display_enum_traduction("enum_type_adjacence_id", int(el_adjacence.text))}. 
Un plancher bas avec ce type d'adjacence ne peut pas effectuer un calcul de Ue en remplacement de Upb. 
la balise {el.tag} ne doit pas être déclarée pour ce plancher bas ceci est une erreur.                           
"""
                        report.generate_msg(msg + msg_add, msg_type=msg_type,
                                            msg_theme='missing_required_element',
                                            related_objects=[el_plancher_bas],
                                            msg_importance=msg_importance)

                if el_plancher_bas.find('*//calcul_ue').text == '1':
                    msg = f"""
il existe un plancher bas en adjacence avec {self.display_enum_traduction("enum_type_adjacence_id", int(el_adjacence.text))}. 
Un plancher bas avec ce type d'adjacence ne peut pas effectuer un calcul de Ue en remplacement de Upb. 
la balise calcul_ue est déclarée à 1 (vrai) alors qu'elle devrait être à 0 pour ce cas
"""
                    report.generate_msg(msg + msg_add, msg_type=msg_type,
                                        msg_theme='bad_value',
                                        related_objects=[el_plancher_bas],
                                        msg_importance=msg_importance)

    def controle_coherence_calcul_echantillonage(self, logement, report):

        enum_methode_application_dpe_log_id = logement.find('*//enum_methode_application_dpe_log_id')
        methode_application_dpe = self.enum_table['methode_application_dpe_log'].loc[
            int(enum_methode_application_dpe_log_id.text)].methode_application_dpe

        if methode_application_dpe == 'dpe immeuble collectif' and logement.find(
                '*//enum_calcul_echantillonnage_id') is None:
            msg = f"""
enum_calcul_echantillonnage_id est absent du xml il doit être déclaré pour un DPE immeuble :
methode d'application : {self.display_enum_traduction('enum_methode_application_dpe_log_id', int(enum_methode_application_dpe_log_id.text))}                
"""

            report.generate_msg(msg, msg_type='erreur_logiciel',
                                msg_theme='missing_required_element',
                                related_objects=[enum_methode_application_dpe_log_id],
                                msg_importance='blocker')

    def exist_var(self, element, var, version_id_str):
        if element.tag == 'donnee_entree':
            parent = element.getparent()
            model_tag = parent.tag
        else:
            model_tag = element.tag
            parent = element
        if var not in self.logement_models[version_id_str][model_tag]:
            return None
        if element.find(var) is not None:
            return True
        elif parent.find(f'donnee_intermediaire/{var}') is not None:
            return True
        else:
            return False


class EngineDPE(CoreEngine):
    VERSION_CFG = versions_dpe_cfg
    ENUM_VERSION_ID_VARNAME = "enum_version_id"
    DATE_ETABLISSEMENT_VARNAME = "date_etablissement_dpe"
    DATE_VISITE_VARNAME = "date_visite_diagnostiqueur"
    DENOMINATION_SIMPLE_XML_REG = "DPE"
    DENOMINATION_OBJET_XML_REG = "du DPE"
    DENOMINATION_SUJET_XML_REG = "le DPE"
    A_REMPLACER_VARNAME = 'dpe_a_remplacer'
    VERSION_ANTERIEUR = DPE_VERSION_ANTERIEUR
    GET_CURRENT_VALID_VERSION_FUNC = get_current_valid_versions_dpe

    def run_controle_coherence(self, dpe, debug=False,datetime_now=None):
        """

        :param dpe: xml du DPE : lxml.etree.ElementTree
        :param debug: if True permet le contrôle de cohérence même si le xml est invalide XSD
        :param datetime_now: permet de changer la date du jour pour tester le contrôle de cohérence.
        :return:
        """

        report = ReportDPE()
        report = self.run_validation_xsd(dpe, report)

        if report.xsd_validation['valid'] is False:
            if debug is False:
                report.report['message_principal'] += 'ERREUR VALIDATION XML : CONTROLE COHERENCE NON EFFECTUE.'
                return report.report
            else:
                report.report['message_principal'] += 'ERREUR VALIDATION XML + '

        el_version = self.get_enum_version(dpe)
        version_id_str = el_version.text
        modele_dpe = dpe.find('./administratif/enum_modele_dpe_id').text
        now = get_datetime_now(datetime_now)

        try:
            if self.validation_structure_dpe(dpe, report) is False:
                return report.generate_report(dpe, engine=self)
            is_old_version = self.validation_version_and_dates(dpe, report,now=now)
            # si ancienne version obsolète aucun contrôle n'est effectué et un message d'erreur est directement renvoyé
            if is_old_version is True:
                report.report['message_principal'] += 'ERREUR VALIDATION XML. Version du DPE obsolète.'
                return report.generate_report(dpe, engine=self)
            self.controle_coherence_administratif(dpe, report)

            arrete_pef_elec = (now >= DATE_APPLICATION_PEF_ELEC) | (Version(el_version.text) >= Version('2.6'))
            if modele_dpe == '1':
                # =========== Contrôles de cohérences 2.0/2.1 ==============

                report.report['message_principal'] += 'CONTROLE COHERENCE EFFECTUE SUR DPE LOGEMENT EXISTANT.'
                self.controle_coherence_variables_interdites(dpe, report)
                self.controle_coherence_variables_requises(dpe, report)
                logement = dpe.find('logement')

                arrete_petite_surface = (now >= DATE_APPLICATION_PETITE_SURFACE) | (Version(el_version.text) >= Version('2.4'))
                controle_bloquant_reseau_chaleur = now>= DATE_APPLICATION_BLOCAGE_CONTROLE_RCU


                self.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=arrete_petite_surface)
                self.controle_coherence_conso_5_usages(logement, report, is_arrete_pef_elec=arrete_pef_elec)
                self.controle_coherence_5_usages_surface(logement, report)
                self.controle_coherence_table_valeur_enum(logement, report)

                self.controle_coherence_tv_values_simple(logement, report)
                self.controle_coherence_mutually_exclusive(logement, report)
                self.controle_coherence_correspondance_saisi_value(logement, report)
                self.controle_coherence_structure_installation_chauffage(logement, report)
                self.controle_coherence_surfaces(logement, report)
                self.controle_coherence_energie_entree_sortie(logement, report)
                self.controle_coherence_hors_methode(logement, report)
                self.controle_coherence_existence_composants(logement, report)
                self.controle_coherence_pont_thermique(logement, report)
                self.controle_coherence_enveloppe(logement, report)
                self.controle_coherence_systeme(logement, report)
                self.controle_coherence_consommation_0_generateur_installation(logement, report)
                self.controle_coherence_cle_repartition_dpe_appartement(logement, report)

                # ===========  controle de cohérence 2.2 ==============

                self.controle_coherence_ref_dpe_immeuble(dpe, report)
                self.controle_coherence_unicite_reference(logement, report)

                # ===========  controle de cohérence 2.3 ==============
                # logement
                self.controle_coherence_modele_methode_application(logement, report)
                self.controle_coherence_double_fenetre(logement, report)
                self.controle_coherence_calcul_echantillonage(logement, report)

                # Contrôle de cohérence sous forme de warning pour le moment car réintroduit à postériori
                self.controle_coherence_presence_veilleuse(logement, report)

                # immeuble

                self.controle_coherence_logement_visite(dpe, report)

                # controle de consentement
                is_blocker = arrete_petite_surface  # a partir du moment où l'arrêté petite surface est en vigueur le consentement propriétaire l'est aussi
                self.controle_coherence_administratif_consentement(dpe, report, is_blocker)

                # controle de cohérence numero fiscal local

                self.controle_coherence_declaration_numero_fiscal_local(dpe, report, is_blocker=False)

                # ===========  controle de cohérence 2.4 ==============

                self.controle_coherence_energie_vs_generateur(logement, report)

                # pour l'instant sous forme de warning , sera placé en bloquant sur une prochaine version
                self.controle_coherence_reseau_chaleur(logement, report, is_blocker=controle_bloquant_reseau_chaleur,now=now)

                # pour l'instant sous forme de warning , sera placé en bloquant sur une prochaine version

                self.controle_coherence_calcul_ue(logement, report, is_blocker=True)


                # controle cohérence 2.5

                self.controle_coherence_masque_solaire(logement, report)
                self.controle_coherence_type_regulation(logement, report)
                self.controle_coherence_surface_immeuble_logement(logement, report)
                self.controle_pac_air_air_clim(logement,report)
                self.controle_coherence_paroi_lourde(logement,report)



            elif modele_dpe == '4':

                self.controle_coherence_tertiaire(dpe, report)
                self.controle_coherence_etiquette_tertiaire(dpe, report)
                tertiaire = dpe.find('tertiaire')
                self.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=arrete_pef_elec)
                report.report['message_principal'] += 'CONTROLE DE COHERENCE DU MODELE EFFECTUE SUR DPE TERTIAIRE.'
            else:

                self.controle_coherence_rset_rsee(dpe, report)
                logement_neuf = dpe.find('logement_neuf')
                self.controle_coherence_conso_5_usages(logement_neuf, report, is_arrete_pef_elec=arrete_pef_elec)
                report.report['message_principal'] += 'CONTROLE DE COHERENCE DU MODELE EFFECTUE SUR DPE NEUF.'

        except Exception as e:
            if (report.xsd_validation['valid'] is False) & (debug is True):
                report.report['message_principal'] += f"""
ERREUR DU MOTEUR DE CONTROLE DE COHERENCE EN MODE DEBUG AVEC UN XSD INVALIDE.
Le contrôle de cohérence a rencontré une erreur et n'as pas pu aboutir. Cela peut-être du à une opération sur un élément non valide du XSD.
Erreur interne :
{tb.format_exc()} 
"""
                return report.generate_report(dpe, engine=self)
            else:
                raise e
        return report.generate_report(dpe, engine=self)


    def get_current_valid_versions(self,now):
        return get_current_valid_versions_dpe(now)

    def validation_structure_dpe(self, dpe, report):
        modele_dpe_id = int(dpe.find('./administratif/enum_modele_dpe_id').text)
        for path in modele_verification_paths[modele_dpe_id]:
            el = dpe.find(path)
            if el is None:
                msg = f"""
le DPE ne correspond au modèle de DPE saisi {self.display_enum_traduction('enum_modele_dpe_id', modele_dpe_id)}
il correspond à un des autre modèle de DPE proposé :
{self.display_enum_traduction('enum_modele_dpe_id', self.enum_dict['enum_modele_dpe_id'].keys() - {modele_dpe_id})}
il manque l'objet suivant {path}
                """
                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='bad_model',
                                    related_objects=[dpe.getroot()],
                                    msg_importance='blocker')
                return False
        return True

    def controle_coherence_tertiaire(self, dpe, report):

        enum_methode_application_dpe_ter_id = dpe.find('*//enum_methode_application_dpe_ter_id')
        methode_application_dpe_ter = int(enum_methode_application_dpe_ter_id.text)
        if methode_application_dpe_ter < 3:  # non vierge
            bilan_consommation = dpe.find('*//bilan_consommation')
            consommation = dpe.find('*//consommation_collection/consommation')
            if bilan_consommation is None:
                related_objects = [enum_methode_application_dpe_ter_id]
                msg = """
Le DPE Tertiaire est non vierge, la section bilan_consommation est manquante
                """
                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='missing_required_element',
                                    related_objects=related_objects,
                                    msg_importance='blocker')
            if consommation is None:
                related_objects = [enum_methode_application_dpe_ter_id]
                msg = """
Le DPE Tertiaire est non vierge, il faut au moins déclarer une consommation dans la section consommation_collection
                                """
                report.generate_msg(msg, msg_type='erreur_logiciel',
                                    msg_theme='missing_required_element',
                                    related_objects=related_objects,
                                    msg_importance='blocker')

    def controle_coherence_etiquette_tertiaire(self, dpe, report):

        el_bilan_consommation = dpe.find('.//bilan_consommation')

        el_enum_sous_modele_dpe_ter_id = dpe.find('.//enum_sous_modele_dpe_ter_id')

        if el_enum_sous_modele_dpe_ter_id is None:
            msg = """
la balise enum_sous_modele_dpe_ter_id qui spécifie le sous modèle tertiaire dont dépend les seuils réglementaire n'est pas renseigné. Ceci sera une erreur bloquant le dépôt du DPE dans une version ultérieure.            
            """

            report.generate_msg(msg, msg_type='warning_logiciel',
                                msg_theme='missing_required_element',
                                related_objects=[dpe.find('*//caracteristique_generale')],
                                msg_importance='critical')
        # contrôle de cohérence d'étiquette uniquement sur bilan_consommation
        if el_bilan_consommation is not None and el_enum_sous_modele_dpe_ter_id is not None:

            classe_conso_energie = el_bilan_consommation.find('classe_conso_energie').text

            classe_emission_ges = el_bilan_consommation.find('classe_emission_ges').text

            conso_energie_primaire = np.floor(np.float64(el_bilan_consommation.find('conso_energie_primaire').text))

            emission_ges = np.floor(np.float64(el_bilan_consommation.find('emission_ges').text))

            enum_sous_modele_dpe_ter_id = int(el_enum_sous_modele_dpe_ter_id.text)

            seuils_ges_final = seuils_tertiaire[(enum_sous_modele_dpe_ter_id, 'ges')]

            for etiquette, (min_value_ges, max_value_ges) in seuils_ges_final.items():
                if emission_ges <= max_value_ges:
                    classe_emission_ges_expected = etiquette
                    break

            # test si la classe emission ges est bonne
            if classe_emission_ges_expected != classe_emission_ges:
                msg = f"""la classe GES du DPE ne correspond pas à la valeur d'emission GES 5 usages calculée 
    classe étiquette GES fournie : {classe_emission_ges}
    emission GES  fournie : {emission_ges} kgCO2/m²/an
    classe étiquette GES attendue : {classe_emission_ges_expected} (intervalle {min_value_ges},{max_value_ges})
    """

                report.generate_msg(msg, msg_type='warning_logiciel',
                                    msg_theme='bad_etiquette_calculation',
                                    related_objects=[el_bilan_consommation.find('classe_emission_ges'),
                                                     el_bilan_consommation.find('emission_ges')],
                                    msg_importance='critical')

            seuils_energie_final = seuils_tertiaire[(enum_sous_modele_dpe_ter_id, 'energie')]

            for etiquette, (min_value_ener, max_value_ener) in seuils_energie_final.items():
                if conso_energie_primaire <= max_value_ener:
                    classe_conso_energie_expected = etiquette
                    break

            # test si la classe conso énergie est bonne
            if classe_conso_energie_expected != classe_conso_energie:
                msg = f"""la classe GES du DPE ne correspond pas à la valeur d'emission GES 5 usages calculée 
    classe étiquette énergie primaire fournie : {classe_conso_energie}
    consommation énergie primaire fournie : {conso_energie_primaire} kWhep/m²/an
    classe étiquette énergie primaire attendue : {classe_conso_energie_expected} (intervalle {min_value_ener},{max_value_ener})
    """

                report.generate_msg(msg, msg_type='warning_logiciel',
                                    msg_theme='bad_etiquette_calculation',
                                    related_objects=[el_bilan_consommation.find('classe_conso_energie'),
                                                     el_bilan_consommation.find('conso_energie_primaire')],
                                    msg_importance='critical')

    def controle_coherence_rset_rsee(self, dpe, report):

        rset = dpe.find('*//rset')
        rsee = dpe.find('*//rsee')
        if rset is not None and rsee is not None:
            related_objects = [rset, rsee]
            msg = """
    les balises rset et rsee sont toutes les deux déclarées ce qui n'est pas permis. Choisissez la balise rset pour un
    dpe basé sur la RT2012 et rsee pour un dpe basé sur la RE2020.
    """
            report.generate_msg(msg, msg_type='warning_logiciel',
                                msg_theme='mutually_exclusive',
                                related_objects=related_objects,
                                msg_importance='critical')
        elif rset is None and rsee is None:
            related_objects = [dpe.getroot()]
            msg = """
    Aucune des balises rset ou rsee n'est renseignée. Un modèle RSET ou RSEE doit être fourni dans le DPE. 
    Choisissez la balise rset pour un dpe basé sur la RT2012 et rsee pour un dpe basé sur la RE2020.
    """
            report.generate_msg(msg, msg_type='warning_logiciel',
                                msg_theme='mutually_exclusive',
                                related_objects=related_objects,
                                msg_importance='critical')
        elif rset is not None:
            rset_paths = [
                '/projet',
                '/projet/Datas_Comp',
                '/projet/Entree_Projet',
                '/projet/Entree_Projet//Zone',
                '/projet/Sortie_Projet',
                '/projet/Sortie_Projet/Sortie_Batiment_C_Collection/Sortie_Batiment_C/O_Cep_annuel',
            ]
            for path in rset_paths:
                full_path = '*//rset' + path
                if dpe.find(full_path) is None:
                    related_objects = [rset]
                    msg = f"""
            le fichier rset fourni est invalide :
            {full_path} not found
            """
                    report.generate_msg(msg, msg_type='warning_logiciel',
                                        msg_theme='bad_rset_rsee',
                                        related_objects=related_objects,
                                        msg_importance='critical')
        elif rsee is not None:
            rsee_paths = [
                '/projet',
                '/projet/Datas_Comp',
                # '/projet/RSEnv',
                # '/projet/RSEnv/entree_projet',
                # '/projet/RSEnv/sortie_projet',
                '/projet/RSET/Entree_Projet',
                '/projet/RSET/Entree_Projet//Zone',
                '/projet/RSET/Sortie_Projet',
                '/projet/RSET/Sortie_Projet/Sortie_Batiment_C_Collection/Sortie_Batiment_C/O_Cep_annuel',
            ]
            for path in rsee_paths:
                full_path = '*//rsee' + path
                if dpe.find(full_path) is None:
                    related_objects = [rsee]
                    msg = f"""
            le fichier rsee fourni est invalide :
            {full_path} not found
            """
                    report.generate_msg(msg, msg_type='warning_logiciel',
                                        msg_theme='bad_rset_rsee',
                                        related_objects=related_objects,
                                        msg_importance='critical')

    def controle_coherence_ref_dpe_immeuble(self, dpe, report):
        el_methode_dpe = dpe.find('*//enum_methode_application_dpe_log_id')
        methode_dpe = int(el_methode_dpe.text)
        methode_application_dpe = self.enum_table['methode_application_dpe_log'].loc[
            methode_dpe].methode_application_dpe

        is_dpe_appartement_immeuble = methode_application_dpe == 'dpe appartement généré à partir des données DPE immeuble'

        if is_dpe_appartement_immeuble:
            dpe_immeuble = dpe.find('*//dpe_immeuble_associe')
            if dpe_immeuble is None:
                report.generate_msg(
                    "il manque le champ dpe_immeuble_associe pour un DPE qui applique une méthode appartement à partir de l'immeuble. Fournir le numéro de DPE de l'immeuble est désormais obligatoire pour ce type de DPE",
                    msg_type='erreur_saisie',
                    msg_theme='error_missing_dpe_immeuble_associe',
                    related_objects=[el_methode_dpe],
                    msg_importance='blocker')


EngineDPE()  # init the engine singleton


class EngineAudit(CoreEngine):
    VERSION_CFG = versions_audit_cfg
    ENUM_VERSION_ID_VARNAME = "enum_version_audit_id"
    DATE_ETABLISSEMENT_VARNAME = "date_etablissement_audit"
    DATE_VISITE_VARNAME = 'date_visite_auditeur'
    DENOMINATION_SIMPLE_XML_REG = "audit logement"
    DENOMINATION_OBJET_XML_REG = "de l'audit logement"
    DENOMINATION_SUJET_XML_REG = "l'audit logement"
    A_REMPLACER_VARNAME = 'audit_a_remplacer'
    VERSION_ANTERIEUR = AUDIT_VERSION_ANTERIEUR

    namespaces = {'xs': 'http://www.w3.org/2001/XMLSchema'}

    mdd_path = Path(resource_filename('controle_coherence', 'modele_donnee'))  # docker load
    if not mdd_path.is_dir():
        mdd_path = Path(__file__).parent / "modele_donnee"  # docker load
    if not mdd_path.is_dir():
        mdd_path = Path(__file__).parent.parent.parent / "modele_donnee"  # dev load

    def _instanciate_enums(self):

        # ============== ENUMS DPE =============================================
        CoreEngine._instanciate_enums(self)

        # ============== ENUMS AUDIT =============================================

        enum_table_audit = pd.read_excel(self.mdd_path / 'enum_tables_audit.xlsx', sheet_name=None)
        enum_dict_audit = {f'enum_{k}_id': v.set_index('id').lib.to_dict() for k, v in enum_table_audit.items() if
                           'lib' in v and 'id' in v}
        # retrocompatibilité renommage enum_travaux_resume_id
        enum_dict_audit['enum_travaux_resume_collection_id'] = enum_dict_audit['enum_travaux_resume_id']
        enum_table_audit['travaux_resume_collection'] = enum_table_audit['travaux_resume']

        self.enum_dict.update(enum_dict_audit)
        self.enum_table_audit = enum_table_audit

    # TO DEL
    # def validate_by_xsd(self, xml):
    #     el_version = xml.find('/administratif/enum_version_audit_id')
    #     if el_version is None:
    #         error_log = ["""
    # ERREUR VALIDATION XML : l'élément /administratif/enum_version_audit_id est manquant le processus de validation de l'audit ne peut être effectué
    #         """]
    #         return {"valid": False,
    #                 "error_log": error_log}
    #     try:
    #         version_id_str = el_version.text
    #         schema = self.schema_dict[version_id_str]
    #     except (ValueError, KeyError):
    #         error_log = [f"""
    # ERREUR VALIDATION XML : l'élément /administratif/enum_version_audit_id a pour valeur {el_version.text} et ne correspond a aucune des versions
    # du DPE : {self.schema_dict.keys()} .
    # Nous vous invitons à vous rapprocher de votre éditeur de logiciel pour régler ce problème.
    # """]
    #         return {"valid": False,
    #                 "error_log": error_log}
    #     resp = schema.validate(xml)
    #
    #     return {"valid": resp,
    #             "error_log": str(schema.error_log).split('\n')}

    def run_controle_coherence(self, audit, debug=False,datetime_now=None):
        """

        :param audit: xml de l'audit : lxml.etree.ElementTree
        :param debug: if True permet le contrôle de cohérence même si le xml est invalide XSD
        :param datetime_now: permet de changer la date du jour pour tester le contrôle de cohérence.
        :return:
        """

        report = ReportAudit()
        report = self.run_validation_xsd(audit, report)

        if report.xsd_validation['valid'] is False:
            if debug is False:
                report.report['message_principal'] += 'ERREUR VALIDATION XML'
                return report.report
            else:
                report.report['message_principal'] += 'ERREUR VALIDATION XML'

        el_version = self.get_enum_version(audit)
        version_id_str = el_version.text
        now = get_datetime_now(datetime_now)

        report.report['message_principal'] += f'CONTROLE COHERENCE EFFECTUE SUR {self.DENOMINATION_SIMPLE_XML_REG}.'
        is_old_version = self.validation_version_and_dates(audit, report,now=now)
        if is_old_version is True:
            report.report[
                'message_principal'] += f'ERREUR VALIDATION XML. Version {self.DENOMINATION_OBJET_XML_REG} obsolète.'
            return report.generate_report(audit, engine=self)

        # Controle sur la compatibilité du numéro de version DPE avec celui de l'Audit.
        # DEVIENS BLOQUANT UNIQUEMENT A PARTIR DU 1er JUILLET 2024
        dpe_2_4_enabled = now >= DATE_APPLICATION_PETITE_SURFACE
        is_dpe_version_compatible, message_principal = self.dpe_version_compatibility(audit, report, dpe_2_4_enabled)
        if is_dpe_version_compatible is False:
            report.report[
                'message_principal'] += message_principal
            if 'ERREUR VALIDATION XML' in message_principal:
                return report.generate_report(audit, engine=self)

        self.controle_coherence_administratif(audit, report)
        self.controle_coherence_variables_interdites(audit, report)
        self.controle_coherence_variables_requises(audit, report)
        self.controle_coherence_logement_visite(audit, report)

        arrete_petite_surface = now >= DATE_APPLICATION_PETITE_SURFACE
        arrete_pef_elec = (now >= DATE_APPLICATION_PEF_ELEC) | (Version(el_version.text) >= Version('2.5'))
        controle_bloquant_reseau_chaleur = now >= DATE_APPLICATION_BLOCAGE_CONTROLE_RCU

        for logement in audit.iterfind('*//logement'):
            # ===========  controle de cohérence 1.0 ============== controle_coherence_conso_5_usages
            self.controle_coherence_etiquette(logement, report, arrete_petite_surface)
            self.controle_coherence_conso_5_usages(logement, report, is_arrete_pef_elec=arrete_pef_elec)
            self.controle_coherence_5_usages_surface(logement, report)
            self.controle_coherence_table_valeur_enum(logement, report)
            self.controle_coherence_tv_values_simple(logement, report)
            self.controle_coherence_mutually_exclusive(logement, report)
            self.controle_coherence_correspondance_saisi_value(logement, report)
            self.controle_coherence_structure_installation_chauffage(logement, report)
            self.controle_coherence_surfaces(logement, report)
            self.controle_coherence_energie_entree_sortie(logement, report)
            self.controle_coherence_hors_methode(logement, report)
            self.controle_coherence_existence_composants(logement, report)
            self.controle_coherence_pont_thermique(logement, report)
            self.controle_coherence_enveloppe(logement, report)
            self.controle_coherence_systeme(logement, report)
            self.controle_coherence_consommation_0_generateur_installation(logement, report)
            self.controle_coherence_cle_repartition_dpe_appartement(logement, report)
            self.controle_coherence_unicite_reference(logement, report)

            # ===========  controle de cohérence 1.1 ==============

            self.controle_coherence_modele_methode_application(logement, report)
            self.controle_coherence_double_fenetre(logement, report)
            self.controle_coherence_calcul_echantillonage(logement, report)

            # Contrôle de cohérence sous forme de warning pour le moment car réintroduit à postériori
            self.controle_coherence_presence_veilleuse(logement, report)

            # ===========  controle de cohérence 2.4 ==============

            self.controle_coherence_energie_vs_generateur(logement, report)

            # pour l'instant sous forme de warning , sera placé en bloquant sur une prochaine version
            self.controle_coherence_reseau_chaleur(logement, report, is_blocker=controle_bloquant_reseau_chaleur, now = now)

            # pour l'instant sous forme de warning , sera placé en bloquant sur une prochaine version

            self.controle_coherence_calcul_ue(logement, report, is_blocker=True)

            # controle cohérence 2.5

            self.controle_coherence_masque_solaire(logement, report)
            self.controle_coherence_type_regulation(logement, report)
            self.controle_coherence_surface_immeuble_logement(logement, report)
            self.controle_pac_air_air_clim(logement,report)
            self.controle_coherence_paroi_lourde(logement, report)

        # controle de consentement
        is_blocker = arrete_petite_surface  # a partir du moment où l'arrêté petite surface est en vigueur le consentement propriétaire l'est aussi
        self.controle_coherence_administratif_consentement(audit, report, is_blocker)

        # controle de cohérence numero fiscal local

        self.controle_coherence_declaration_numero_fiscal_local(audit, report,is_blocker=False)

        # si en version antérieure à ce moment là on ne considère que les erreurs non warning
        if version_id_str in self.VERSION_ANTERIEUR:
            error_dpe_blocker = [el for el in report.error_input if el['importance'] != 'blocker_as_warning']
            error_dpe_blocker += [el for el in report.error_software if el['importance'] != 'blocker_as_warning']
        # on considère toutes les erreurs
        else:
            error_dpe_blocker = report.error_input + report.error_software

        if len(error_dpe_blocker) > 0:
            report.report[
                'message_principal'] += "CONTROLE COHERENCE SPECIFIQUE AUDIT NON EFFECTUES, car il existe des erreurs bloquantes dans les controles de coherences de l'application de la méthode de calcul 3CL (methode DPE)."
            return report.generate_report(audit, engine=self)

        # =========== controle de cohérence spécifique audit ==============

        self.controle_coherence_presence_numero_dpe(audit, report)
        self.controle_coherence_unicite_etape_par_scenario(audit, report)
        self.controle_coherence_presence_etat_initial(audit, report)
        self.controle_coherence_scenario_multi_etapes(audit, report)
        self.controle_coherence_scenario_mono_etape(audit, report)
        self.controle_coherence_etape_finale(audit, report)
        self.controle_coherence_etape_premiere_saut_2_classes(audit, report)
        self.controle_coherence_type_batiment_constant(audit, report)
        self.controle_coherence_seuil_3_etapes(audit, report)
        self.controle_coherence_presence_recommandation(audit, report)
        self.controle_coherence_six_postes_travaux(audit, report)
        self.controle_coherence_deux_postes_isolation(audit, report)
        self.controle_coherence_abscence_derogation_ventilation(audit, report)
        self.controle_coherence_gain_cumule(audit, report)
        self.controle_coherence_travaux_autre(audit, report)
        # Controles Audit Copro
        self.controle_coherence_scenario_audit_copro(audit, report)
        self.controle_coherence_derogation_audit_copro(audit, report)


        for logement in audit.iterfind('*//logement'):
            # =========== controle de cohérence spécifique audit ==============

            self.controle_coherence_reference_travaux_existent(logement, report)
            self.controle_coherence_presence_etape_travaux(logement, report)
            self.controle_coherence_etape_travaux_sortie_dpe(logement, report)
            # self.controle_coherence_etape_travaux_cout(logement, report) # => Ce controle n'est plus utilisable depuis l'intégration des fourchettes de couts en audit 2.2
            self.controle_coherence_cout_nul(logement, report)
            self.controle_coherence_etat_composant(logement, report)
            self.controle_coherence_conso_etape_travaux(logement, report)
            self.controle_coherence_presence_derogation_ventilation(logement, report)
            self.controle_coherence_ubat_base_ubat(logement, report)
            self.controle_coherence_etat_ventilation(logement, report)
            self.controle_coherence_presence_caracteristiques_travaux(logement, report)
            self.controle_coherence_absence_caracteristiques_travaux(logement, report)
            self.controle_coherence_caracteristiques_travaux(logement, report)
            self.controle_coherence_etape_travaux_cout_presence(logement, report)

        return report.generate_report(audit, engine=self)

    def get_current_valid_versions(self,now):
        return get_current_valid_versions_audit(now)

    # Controle la présence du numero de version dpe dans l'audit.
    # Controle que le DPE 2.4 ne soit pas utilisé avant le 1er juillet 2024.
    # Controle que la version du DPE soit bien compatible avec la version de l'audit : Ainsi UNIQUEMENT le DPE 2.4 soit utilisé à partir du 1er juillet 2024, pour les audit 2.1 et 2.2
    def dpe_version_compatibility(self, xml_reg, report, dpe_2_4_enabled):

        # Initialisation des variables à retourner :
        is_dpe_version_compatible = True
        message_principal = None

        audit_version_id = self.get_enum_version(xml_reg)
        audit_version_id_str = audit_version_id.text
        dpe_version_id = xml_reg.find('/administratif/enum_version_dpe_id')

        if dpe_version_id is None:
            is_dpe_version_compatible = False
            msg_type = 'warning_logiciel'
            msg_theme = 'warning_missing_dpe_version'
            msg_importance = 'critical'
            message_principal = 'WARNING VALIDATION XML. Balise enum_version_dpe_id manquante, SERA BLOQUANT à partir du 1er juillet 2024.'
            if dpe_2_4_enabled:
                msg_type = 'erreur_logiciel'
                msg_theme = 'error_missing_dpe_version'
                msg_importance = 'blocker'
                message_principal = 'ERREUR VALIDATION XML. Balise enum_version_dpe_id manquante, est obligatoire à compter du 1er juillet 2024.'

            msg = """La balise 'enum_version_dpe_id' est manquante dans la section 'administratif' du XML, or elle est obligatoire à compter du 1er juillet 2024. Votre logiciel Audit doit être mis à jour et les calculs relancés"""
            report.generate_msg(msg, msg_type=msg_type,
                                msg_theme=msg_theme,
                                related_objects=[xml_reg.find('/administratif')],
                                msg_importance=msg_importance)

        else:
            version_dpe_min = self.VERSION_CFG[audit_version_id_str]['version_dpe_min']
            version_dpe_max = self.VERSION_CFG[audit_version_id_str]['version_dpe_max']

            dpe_version_id_str = dpe_version_id.text
            version_strictly_inferior = Version(dpe_version_id_str) < Version(version_dpe_min)
            if version_dpe_max is None:
                version_dpe_max = get_latest_dpe_version()
                # S'assurer que version_dpe_max > version_dpe_min, sinon ça doit être égale
                if Version(version_dpe_max) < Version(version_dpe_min):
                    version_dpe_max = version_dpe_min
            version_strictly_superior = Version(dpe_version_id_str) > Version(version_dpe_max)

            if dpe_version_id_str == '2.4' and not dpe_2_4_enabled:
                is_dpe_version_compatible = False
                msg_type = 'erreur_logiciel'
                msg_theme = 'error_dpe_2_4_date'
                msg_importance = 'blocker'
                message_principal = 'ERREUR VALIDATION XML. Numéro version DPE "2.4" ne peut pas être utilisé avant le 1er juillet 2024. Merci de retrograder "enum_version_dpe_id" en 2.3.'

                msg = f"""le numéro de version dpe '{dpe_version_id_str}' ne peut pas être utilisé avant le 1er juillet 2024.
                Merci de retrograder "enum_version_dpe_id" en 2.3."""

                report.generate_msg(msg, msg_type=msg_type,
                                    msg_theme=msg_theme,
                                    related_objects=[dpe_version_id],
                                    msg_importance=msg_importance)

            elif version_strictly_inferior or version_strictly_superior:
                is_dpe_version_compatible = False
                msg_type = 'warning_logiciel'
                msg_theme = 'warning_compatibility_dpe_audit_version'
                msg_importance = 'critical'
                message_principal = f'WARNING VALIDATION XML. Numéro version DPE {dpe_version_id_str} SERA INCOMPATIBLE avec l Audit à partir du 1er juillet 2024. Il faudra passer au DPE version {version_dpe_min} à cette date.'
                if dpe_2_4_enabled:
                    msg_type = 'erreur_logiciel'
                    msg_theme = 'error_compatibility_dpe_audit_version'
                    msg_importance = 'blocker'
                    message_principal = 'ERREUR VALIDATION XML. Numéro version DPE incompatible avec numéro version Audit.'

                msg = f"""le numéro de version dpe '{dpe_version_id_str}' n'est pas compatible avec la version de l'audit sélectionnée '{audit_version_id_str}'. 
                Pour cette version de l'audit, la version DPE doit être supérieure ou égale à '{version_dpe_min}' et inférieure ou égale à '{version_dpe_max}'.
                Merci de corriger la version DPE ou bien la version de l'audit utilisée."""

                report.generate_msg(msg, msg_type=msg_type,
                                    msg_theme=msg_theme,
                                    related_objects=[dpe_version_id, audit_version_id],
                                    msg_importance=msg_importance)

        return is_dpe_version_compatible, message_principal

    # LE CONTROLE DE COHERENCE "controle_coherence_choix_maj_ou_remplacer" N'EST PLUS APPLIQUE SUITE A UN ROLLBACK DE LA 2.0 (voir issue gitlab #129)
    # Vérifier l'audit ne contienne pas à la fois un numéro audit à remplacer et un numéro audit à mettre à jour
    # def controle_coherence_choix_maj_ou_remplacer(self, audit, report):
    #
    #     audit_a_remplacer = audit.find('*/audit_a_remplacer')
    #     audit_a_mettre_a_jour = audit.find('*/audit_a_mettre_a_jour')
    #
    #     if audit_a_remplacer is not None and audit_a_mettre_a_jour is not None:
    #         report.generate_msg(f"l'audit contient à la fois un audit à mettre à jour (audit_a_mettre_a_jour) : {audit_a_mettre_a_jour.text} ainsi qu'un audit à remplacer (audit_a_remplacer) : {audit_a_remplacer.text}. Or, un audit ne peut faire qu'une seule opération : soit mettre à jour, soit remplacer",
    #                             msg_type='erreur_logiciel',
    #                             msg_theme='error_maj_and_replace',
    #                             related_objects=[audit_a_remplacer,audit_a_mettre_a_jour],
    #                             msg_importance='blocker_as_warning')

    # Contrôler l'unicité id d'étape par scénario
    def controle_coherence_unicite_etape_par_scenario(self, audit, report):

        mapping_scenario_etape_to_related_objects = {}
        all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
        for caracteristique_generale in all_caracteristique_generale:
            enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
            enum_etape_id = caracteristique_generale.find('enum_etape_id').text
            if enum_scenario_id + '_' + enum_etape_id in mapping_scenario_etape_to_related_objects.keys():
                mapping_scenario_etape_to_related_objects[enum_scenario_id + '_' + enum_etape_id].append(
                    caracteristique_generale.find('enum_etape_id'))
            else:
                mapping_scenario_etape_to_related_objects[enum_scenario_id + '_' + enum_etape_id] = [
                    caracteristique_generale.find('enum_etape_id')]

        all_duplicates_scenario_etape = [k for k, v in mapping_scenario_etape_to_related_objects.items() if len(v) > 1]

        for scenario_etape in all_duplicates_scenario_etape:
            scenario, etape = scenario_etape.split('_')
            report.generate_msg(
                f"le scenario : {self.display_enum_traduction('enum_scenario_id', int(scenario))} contient plusieurs étapes identiques : {self.display_enum_traduction('enum_etape_id', int(etape))}. Chaque étape doit être unique au sein d'un même scénario",
                msg_type='erreur_logiciel',
                msg_theme='error_duplicate_etape',
                related_objects=mapping_scenario_etape_to_related_objects[scenario_etape],
                msg_importance='blocker',
                is_audit=True)

    #  Existence d'un seul logement de type « état initial »
    def controle_coherence_presence_etat_initial(self, audit, report):
        related_objects = []
        mapping_scenario_etape_to_related_objects = {}
        all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
        for caracteristique_generale in all_caracteristique_generale:
            enum_scenario_id = caracteristique_generale.find('enum_scenario_id')
            enum_etape_id = caracteristique_generale.find('enum_etape_id')
            related_objects.append(enum_scenario_id)
            related_objects.append(enum_etape_id)
            if enum_scenario_id.text + '_' + enum_etape_id.text in mapping_scenario_etape_to_related_objects.keys():
                mapping_scenario_etape_to_related_objects[enum_scenario_id.text + '_' + enum_etape_id.text].append(
                    caracteristique_generale.find('enum_etape_id'))
            else:
                mapping_scenario_etape_to_related_objects[enum_scenario_id.text + '_' + enum_etape_id.text] = [
                    caracteristique_generale.find('enum_etape_id')]

        if "0_0" not in mapping_scenario_etape_to_related_objects.keys():
            report.generate_msg(
                f"l'audit ne contient pas de logement avec un enum_scenario_id ET un enum_etape_id en {str({0: 'état initial'})}. L'audit doit contenir un logement en « état initial »",
                msg_type='erreur_logiciel',
                msg_theme='error_missing_etape',
                related_objects=related_objects,
                msg_importance='blocker',
                is_audit=True)

    # Contrôle la présence d'un numéro DPE, lors que le contexte de l'audit est règlementaire
    def controle_coherence_presence_numero_dpe(self, audit, report):

        numero_dpe = audit.find('*//numero_dpe')
        enum_modele_audit_id = audit.find('*//enum_modele_audit_id')

        if numero_dpe is None and enum_modele_audit_id.text == '1':
            report.generate_msg(f"""
            Le numéro DPE est absent, or le contexte de l'audit est règlementaire : {self.display_enum_traduction('enum_modele_audit_id', int(enum_modele_audit_id.text))}, il devrait donc être associé à un numéro DPE. 
            Merci de renseigner le numéro DPE dans la balise "numero_dpe" ou bien de choisir le contexte volontaire pour "enum_modele_audit_id"              
            """,
                                msg_type='warning_saisie',
                                msg_theme='warning_missing_dpe_number',
                                related_objects=[enum_modele_audit_id],
                                msg_importance='critical',
                                is_audit=True)

    # Lorsque la date d'établissement de l'audit est antérieure, ou même jour, par rapport à la date de visite

    # Contrôler que tous les logements, SAUF logement de type « état initial », possèdent « etape_travaux »
    def controle_coherence_presence_etape_travaux(self, logement, report):

        enum_scenario_id = logement.find('.//caracteristique_generale').find('enum_scenario_id')
        enum_etape_id = logement.find('.//caracteristique_generale').find('enum_etape_id')
        scenario_and_etape = [enum_scenario_id, enum_etape_id]
        logement_etat_initial = enum_scenario_id.text == '0' and enum_etape_id.text == '0'
        etape_travaux = logement.find('.//etape_travaux')
        etape_travaux_present = etape_travaux is not None

        if logement_etat_initial and etape_travaux_present:
            report.generate_msg(
                f"le logement contient l'objet « etape_travaux » alors qu'il correspond à l'« état initial ». le logement avec avec un enum_scenario_id ET un enum_etape_id en {str({0: 'état initial'})} ne doit pas avoir d'objet « etape_travaux »",
                msg_type='erreur_logiciel',
                msg_theme='error_present_etape_travaux',
                related_objects=etape_travaux,
                msg_importance='blocker',
                is_audit=True)

        if not logement_etat_initial and not etape_travaux_present:
            report.generate_msg(
                f"l'objet « etape_travaux » est absent dans le logement, alors qu'il ne correspond pas à l'« état initial ». Tout logement avec avec un enum_scenario_id ET un enum_etape_id different de {str({0: 'état initial'})} doit avoir l'objet « etape_travaux »",
                msg_type='erreur_logiciel',
                msg_theme='error_missing_etape_travaux',
                related_objects=scenario_and_etape,
                msg_importance='blocker',
                is_audit=True)

    # Contrôler que les consommations 5 usages, les emissions de CO2 5 usages et les classes dans « etape_travaux » correspondent bien à celles dans « sortie » issues du calcul 3CL (tolérance à l’unité)
    def controle_coherence_etape_travaux_sortie_dpe(self, logement, report):

        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:

            mapping_etape_travaux_sortie_dpe = {
                "ep_conso_5_usages_m2": "ep_conso_5_usages_m2",
                "ef_conso_5_usages_m2": "conso_5_usages_m2",
                "emission_ges_5_usages_m2": "emission_ges_5_usages_m2",
                "classe_emission_ges": "classe_emission_ges",
                "classe_bilan_dpe": "classe_bilan_dpe",
            }

            for etape_travaux_name in ["ep_conso_5_usages_m2", "ef_conso_5_usages_m2", "emission_ges_5_usages_m2"]:
                dpe_sortie_name = mapping_etape_travaux_sortie_dpe[etape_travaux_name]
                dpe_sortie_el = logement.find('.//sortie').find(f'.//{dpe_sortie_name}')
                etape_travaux_el = logement.find('.//etape_travaux').find(f'.//{etape_travaux_name}')
                if not np.isclose(float(dpe_sortie_el.text), float(etape_travaux_el.text), atol=1):
                    report.generate_msg(
                        f"la valeur de la balise de etape_travaux - {etape_travaux_name} : {etape_travaux_el.text}, ne correspond pas à la valeur de la balise de sortie du DPE - {dpe_sortie_name} : {dpe_sortie_el.text}. Les valeurs dans etape_travaux doivent être cohérentes avec les sorties du calcul 3CL DPE",
                        msg_type='erreur_logiciel',
                        msg_theme='error_etape_travaux_dpe',
                        related_objects=[etape_travaux_el, dpe_sortie_el],
                        msg_importance='blocker',
                        is_audit=True)

            for etape_travaux_name in ["classe_emission_ges", "classe_bilan_dpe"]:
                dpe_sortie_name = mapping_etape_travaux_sortie_dpe[etape_travaux_name]
                dpe_sortie_el = logement.find('.//sortie').find(f'.//{dpe_sortie_name}')
                etape_travaux_el = logement.find('.//etape_travaux').find(f'.//{etape_travaux_name}')
                if dpe_sortie_el.text != etape_travaux_el.text:
                    report.generate_msg(
                        f"la classe présente dans etape_travaux - {etape_travaux_name} : {etape_travaux_el.text}, ne correspond pas à celle issue du DPE - {dpe_sortie_name} : {dpe_sortie_el.text}. Les valeurs dans etape_travaux doivent être cohérentes avec les sorties du calcul 3CL DPE",
                        msg_type='erreur_logiciel',
                        msg_theme='error_etape_travaux_dpe',
                        related_objects=[etape_travaux_el, dpe_sortie_el],
                        msg_importance='blocker',
                        is_audit=True)

    # # Contrôler que pour toutes les étapes de travaux, le « cout » de l’étape corresponde à la somme des coûts dans « travaux_collection » et « travaux_induits_collection » (tolérance à 100€ près).
    # def controle_coherence_etape_travaux_cout(self, logement, report):
    #
    #     etape_travaux = logement.find('.//etape_travaux')
    #     if etape_travaux is not None:
    #
    #         travaux_collection_cout = list(etape_travaux.find('.//travaux_collection').iterfind('*//cout'))
    #         travaux_collection_cout_total = sum([float(cout.text) for cout in travaux_collection_cout])
    #         travaux_induits_collection_cout = list(
    #             etape_travaux.find('.//travaux_induits_collection').iterfind('*//cout'))
    #         travaux_induits_collection_cout_total = sum([float(cout.text) for cout in travaux_induits_collection_cout])
    #         etape_travaux_cout = etape_travaux.find('cout')
    #
    #         if not np.isclose(travaux_collection_cout_total + travaux_induits_collection_cout_total,
    #                           float(etape_travaux_cout.text), atol=100):
    #             report.generate_msg(
    #                 f"la valeur de la balise de etape_travaux - cout : {etape_travaux_cout.text} €, ne correspond pas à la somme des couts déclarés dans « travaux_collection » : {str(int(travaux_collection_cout_total))} € et dans « travaux_induits_collection » : {str(int(travaux_induits_collection_cout_total))} €. Le coût déclaré dans etape_travaux doit correspondra à la somme des coûts des travaux (travaux induits inclus)",
    #                 msg_type='erreur_logiciel',
    #                 msg_theme='error_etape_travaux_cout',
    #                 related_objects=[etape_travaux_cout] + travaux_collection_cout + travaux_induits_collection_cout,
    #                 msg_importance='blocker',
    #                 is_audit=True)

    # Lorsque des travaux, dans "travaux_collection", ont des coûts nuls
    def controle_coherence_cout_nul(self, logement, report):

        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:

            travaux_collection_cout = list(etape_travaux.find('.//travaux_collection').iterfind('*//cout')) + list(etape_travaux.find('.//travaux_collection').iterfind('*//cout_min')) + list(etape_travaux.find('.//travaux_collection').iterfind('*//cout_max'))
            travaux_collection_cout_nul = [cout for cout in travaux_collection_cout if float(cout.text) == 0.0]

            if len(travaux_collection_cout_nul) > 0:
                report.generate_msg(
                    "un ou plusieurs travaux dans « travaux_collection » ont leur balise - cout/cout_min/cout_max à 0 €. Mise à part quelques exceptions (ex: chaudière mixte), les couts dans « travaux_collection » ne doivent pas être nuls. Vérifiez qu'il ne s'agit pas d'une erreur. S'il s'agit de travaux annexes (qui ne concerne pas directement la performance énergétique), merci de le déclarer dans « travaux_induits_collection ».",
                    msg_type='warning_saisie',
                    msg_theme='warning_cost_to_zero',
                    related_objects=travaux_collection_cout_nul,
                    msg_importance='major',
                    is_audit=True)

    # Contrôler que les références dans « travaux/reference_collection » existent bien dans le « logement »
    def controle_coherence_reference_travaux_existent(self, logement, report):

        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            logement_copy = copy.deepcopy(logement)
            etape_travaux_copy = logement_copy.find('etape_travaux')
            logement_copy.remove(etape_travaux_copy)
            all_references = list(logement_copy.iterfind('*//reference'))
            mapping_references_txt_to_object = {el.text: el for el in all_references}
            all_ref_etape_travaux = list(etape_travaux.iterfind('*//reference'))
            mapping_ref_etape_travaux_txt_to_object = {el.text: el for el in all_ref_etape_travaux}

            all_ref_etape_travaux_missing = [el for el in mapping_ref_etape_travaux_txt_to_object.keys() if
                                             el not in mapping_references_txt_to_object.keys()]

            if len(all_ref_etape_travaux_missing) > 0:
                all_missing_reference = [mapping_ref_etape_travaux_txt_to_object[ref] for ref in
                                         all_ref_etape_travaux_missing]
                report.generate_msg(
                    f"les noms de références suivantes : {get_uniques(all_ref_etape_travaux_missing)}, présentes dans « travaux/reference_collection », sont inexistantes dans le « logement ». Les références associées aux travaux doivent correspondre à des objets du « logement »",
                    msg_type='erreur_logiciel',
                    msg_theme='error_missing_reference',
                    related_objects=all_missing_reference,
                    msg_importance='blocker',
                    is_audit=True)

    # Contrôler que pour le logement « état initial » que tous les « enum_etat_composant_id » soit à "1"="initial"
    # Contrôler que pour toutes les étapes de travaux (qui ne sont pas « état initial »), au moins 1 objet ait un « enum_etat_composant_id » à "2"="neuf ou rénové"
    def controle_coherence_etat_composant(self, logement, report):

        enum_scenario_id = logement.find('.//caracteristique_generale').find('enum_scenario_id').text
        enum_etape_id = logement.find('.//caracteristique_generale').find('enum_etape_id').text
        logement_etat_initial = enum_scenario_id == '0' and enum_etape_id == '0'

        all_enum_etat_composant_id = list(logement.iterfind('*//enum_etat_composant_id'))

        if logement_etat_initial:
            all_incorrect_etat_composant = [el for el in all_enum_etat_composant_id if el.text != '1']
            if len(all_incorrect_etat_composant) > 0:
                report.generate_msg(
                    f"certains « enum_etat_composant_id » ne sont pas à {str({1: 'initial'})}, alors qu'il s'agit du logement « état initial ». Pour le logement avec avec un enum_scenario_id ET un enum_etape_id en {str({0: 'état initial'})}, tous les « enum_etat_composant_id » doivent être à {str({1: 'initial'})}",
                    msg_type='erreur_logiciel',
                    msg_theme='error_etat_composant',
                    related_objects=all_incorrect_etat_composant,
                    msg_importance='blocker',
                    is_audit=True)

        else:
            all_modified_etat_composant = [el for el in all_enum_etat_composant_id if el.text == '2']
            if len(all_modified_etat_composant) == 0:
                report.generate_msg(
                    f"aucun « enum_etat_composant_id » n'est à {str({2: 'neuf ou rénové'})}, alors qu'il s'agit logement correspondant à une étape de travaux (avec des travaux). Tout logement avec avec un enum_scenario_id ET un enum_etape_id different de {str({0: 'état initial'})} doit avoir au moins un objet avec « enum_etat_composant_id » à {str({2: 'neuf ou rénové'})}",
                    msg_type='erreur_logiciel',
                    msg_theme='error_etat_composant',
                    related_objects=all_enum_etat_composant_id,
                    msg_importance='blocker',
                    is_audit=True)

    # Contrôler l'ordre de grandeur (facteur 10) des consommations dans etape_travaux par rapport aux sorties DPE - objectif, signaler un oubli de division par la surface habitable
    def controle_coherence_conso_etape_travaux(self, logement, report):

        etape_travaux = logement.find('.//etape_travaux')
        sortie_dpe = logement.find('.//sortie')
        if etape_travaux is not None:
            methode_dpe = logement.find('.//enum_methode_application_dpe_log_id')
            surface_reference_name = str(
                self.enum_table['methode_application_dpe_log'].loc[int(methode_dpe.text)].surface_reference)

            if logement.find(f'.//{surface_reference_name}') is None:
                report.generate_msg(f"""
la surface {surface_reference_name} n'est pas renseignée pour la méthode DPE {self.enum_table['methode_application_dpe_log'].loc[int(methode_dpe.text)].lib}
cette surface doit être obligatoirement renseignée. 
""",


                    msg_type='erreur_logiciel',
                    msg_theme='missing_required_element',
                    related_objects=methode_dpe,
                    msg_importance='blocker',
                    is_audit=True)

            else:

                surface_reference = float(logement.find(f'.//{surface_reference_name}').text)

                mapping_conso_etape_travaux_sortie_dpe = {
                    "ep_conso_ch_m2": "ep_conso_ch",
                    "ep_conso_ecs_m2": "ep_conso_ecs",
                    "ep_conso_eclairage_m2": "ep_conso_eclairage",
                    "ep_conso_totale_auxiliaire_m2": "ep_conso_totale_auxiliaire",
                    "ep_conso_fr_m2": "ep_conso_fr",
                    "ep_conso_5_usages_m2": "ep_conso_5_usages",
                    "ef_conso_ch_m2": "conso_ch",
                    "ef_conso_ecs_m2": "conso_ecs",
                    "ef_conso_eclairage_m2": "conso_eclairage",
                    "ef_conso_totale_auxiliaire_m2": "conso_totale_auxiliaire",
                    "ef_conso_fr_m2": "conso_fr",
                    "ef_conso_5_usages_m2": "conso_5_usages",
                    "emission_ges_5_usages_m2": "emission_ges_5_usages",
                }
                all_incorrect_balises_conso = {}
                for etape_travaux_name, sortie_dpe_name in mapping_conso_etape_travaux_sortie_dpe.items():
                    if "ef" in etape_travaux_name:
                        category = "ef_conso"
                    elif "ep" in etape_travaux_name:
                        category = "ep_conso"
                    else:
                        category = "emission_ges"

                    conso_dpe_in_m2 = float(
                        sortie_dpe.find(f'{category}').find(f'{sortie_dpe_name}').text) / surface_reference
                    if conso_dpe_in_m2 == 0.0:
                        conso_dpe_in_m2 = 1.0
                    ratio = float(etape_travaux.find(f'{etape_travaux_name}').text) / conso_dpe_in_m2
                    if ratio > 10:
                        all_incorrect_balises_conso[etape_travaux_name] = etape_travaux.find(f'{etape_travaux_name}')

                if len(all_incorrect_balises_conso) > 0:
                    report.generate_msg(
                        f"les balises de « etape_travaux » suivantes : {list(all_incorrect_balises_conso.keys())}, ont des valeurs plus de 10 fois supérieurs à celles issues des sorties du DPE (objet : « sortie ») par m² de surface habitable. Veuillez verifier que vous n'avez pas oublié de diviser les consommations du DPE par la surface habitable. En effet, contrairement aux sorties du DPE, les consommations par usage en EP et EF dans « etape_travaux » sont exprimées par m² de surface habitable.",
                        msg_type='warning_logiciel',
                        msg_theme='warning_shab_division',
                        related_objects=list(all_incorrect_balises_conso.values()),
                        msg_importance='critical',
                        is_audit=True)

    # Le « scénario multi étapes "principal" » existe ET contient au moins 2 étapes de travaux dont une « étape première » et une « étape finale »
    def controle_coherence_scenario_multi_etapes(self, audit, report):
        enum_modele_audit_id = audit.find('*//enum_modele_audit_id')
        not_audit_copro = enum_modele_audit_id.text in ['1', '2']
        if not_audit_copro:
            mapping_scenario_etape_to_related_objects = {}
            all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
            for caracteristique_generale in all_caracteristique_generale:
                enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
                enum_etape_id = caracteristique_generale.find('enum_etape_id').text
                if enum_scenario_id + '_' + enum_etape_id in mapping_scenario_etape_to_related_objects.keys():
                    mapping_scenario_etape_to_related_objects[enum_scenario_id + '_' + enum_etape_id].append(
                        caracteristique_generale.find('enum_etape_id'))
                else:
                    mapping_scenario_etape_to_related_objects[enum_scenario_id + '_' + enum_etape_id] = [
                        caracteristique_generale.find('enum_etape_id')]

            all_scenario = [k.split('_')[0] for k in mapping_scenario_etape_to_related_objects.keys()]
            presence_scenario_multi_etapes = '1' in all_scenario

            all_etape_in_scenario_multi_etapes = [k.split('_')[-1] for k in mapping_scenario_etape_to_related_objects.keys()
                                                  if k.split('_')[0] == '1']
            presence_etape_premiere = '1' in all_etape_in_scenario_multi_etapes
            presence_etape_finale = '2' in all_etape_in_scenario_multi_etapes

            if not presence_scenario_multi_etapes:
                related_objects = [v for sublist in mapping_scenario_etape_to_related_objects.values() for v in sublist]
                report.generate_msg(
                    f"le scenario multi étapes principal est absent de l'audit. L'audit doit contenir des logements avec enum_scenario_id à {self.display_enum_traduction('enum_scenario_id', 1)}",
                    msg_type='erreur_saisie',  # TODO : est-ce une erreur saisie ou logiciel ? ??
                    msg_theme='error_missing_scenario',
                    related_objects=related_objects,
                    msg_importance='blocker',
                    is_audit=True)
            else:
                related_objects = [v for etape in all_etape_in_scenario_multi_etapes for v in
                                   mapping_scenario_etape_to_related_objects['1_' + etape]]
                if not presence_etape_premiere:
                    report.generate_msg(
                        f"le scénario multi étapes principal ne contient pas d'étape première. Le scénario multi étapes principal (avec enum_scenario_id à {self.display_enum_traduction('enum_scenario_id', 1)}) doit être associé à une étape première (avec enum_etape_id à {self.display_enum_traduction('enum_etape_id', 1)})",
                        msg_type='erreur_saisie',  # TODO : est-ce une erreur saisie ou logiciel ? ??
                        msg_theme='error_missing_etape',
                        related_objects=related_objects,
                        msg_importance='blocker',
                        is_audit=True)
                if not presence_etape_finale:
                    report.generate_msg(
                        f"le scénario multi étapes principal ne contient pas d'étape finale. Le scénario multi étapes principal (avec enum_scenario_id à {self.display_enum_traduction('enum_scenario_id', 1)}) doit être associé à une étape finale (avec enum_etape_id à {self.display_enum_traduction('enum_etape_id', 2)})",
                        msg_type='erreur_saisie',  # TODO : est-ce une erreur saisie ou logiciel ? ??
                        msg_theme='error_missing_etape',
                        related_objects=related_objects,
                        msg_importance='blocker',
                        is_audit=True)

    # CE CONTROLE (QUI ETAIT EN WARNING) DOIT ETRE RETIRE POUR LE 1er JANVIER 2024
    # Pour les bâtiments de classe de performance F ou G avant travaux, le « scénario multi étapes "principal" » comporte une « étape intermédiaire » permettant d'atteindre au moins la classe C
    # def controle_coherence_scenario_multi_etapes_passoire(self, audit, report):
    #    scenario_and_etape = []
    #    class_etat_initial = None
    #    class_etape_intermediaire =[]
    #    all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
    #    for caracteristique_generale in all_caracteristique_generale:
    #        enum_scenario_id = caracteristique_generale.find('enum_scenario_id')
    #        enum_etape_id = caracteristique_generale.find('enum_etape_id')
    #        scenario_and_etape.append(enum_scenario_id)
    #        scenario_and_etape.append(enum_etape_id)
    #        if enum_scenario_id.text == "0" and enum_etape_id.text == "0":
    #            class_etat_initial = caracteristique_generale.getparent().find('.//classe_bilan_dpe')
    #        # Scenario multi etapes
    #        elif enum_scenario_id.text == "1" and enum_etape_id.text in ["3","4","5"]:
    #            class_etape_intermediaire.append(caracteristique_generale.getparent().find('.//classe_bilan_dpe'))
    #
    #    if (class_etat_initial is not None) and (class_etat_initial.text in ['F', 'G']):
    #        if len(class_etape_intermediaire) == 0:
    #            report.generate_msg(f"le scenario multi étapes principal ne contient pas d'étape intermédiaire. Or, dans le cas d'un état initial avec une classe DPE F ou G, le « scénario multi étapes principal » de l'audit doit comporter une « étape intermédiaire », permettant d'atteindre au moins la classe C",
    #                            msg_type='warning_saisie',
    #                            msg_theme='warning_missing_etape',
    #                            related_objects=scenario_and_etape,
    #                            msg_importance='critical')
    #        else:
    #            class_score = {"A": 6, "B": 5, "C": 4, "D": 3, "E": 2, "F": 1, "G": 0}
    #            class_etape_intermediaire_score = {etape_class:class_score[etape_class.text] for etape_class in class_etape_intermediaire}
    #            etape_intermediaire, best_class_score = sorted(class_etape_intermediaire_score.items(), key=lambda x: x[1], reverse=True)[0]
    #            if etape_intermediaire.text not in ["A","B","C"]:
    #                report.generate_msg(f"l'étape intermédiaire avec la meilleure classe DPE du scenario multi étapes principal, atteint la classe : {etape_intermediaire.text}. Or, dans le cas d'un état initial avec une classe DPE F ou G, le « scénario multi étapes principal » de l'audit doit comporter une « étape intermédiaire », permettant d'atteindre au moins la classe C",
    #                                    msg_type='warning_saisie',
    #                                    msg_theme='warning_class_etape_intermediaire',
    #                                    related_objects=etape_intermediaire,
    #                                    msg_importance='major')

    # Lorsqu'il y a plus de 3 étapes dans un scénario de travaux
    def controle_coherence_seuil_3_etapes(self, audit, report):

        mapping_scenario_logement = {"1": [], "3": [], "4": [], "5": []}
        all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
        for caracteristique_generale in all_caracteristique_generale:
            enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
            # Scenario multi etapes
            if enum_scenario_id in mapping_scenario_logement.keys():
                mapping_scenario_logement[enum_scenario_id].append(caracteristique_generale.getparent())

        mapping_scenario_nb_etape = {scenario: len(etapes) for scenario, etapes in mapping_scenario_logement.items() if
                                     len(etapes) > 3}

        for scenario, nb_etape in mapping_scenario_nb_etape.items():
            report.generate_msg(
                f"le {list(self.display_enum_traduction('enum_scenario_id', int(scenario)).values())[0]} contient plus de 3 étapes - nombre d'étapes : {nb_etape}. Le fait d'avoir trop d'étapes rends techniquement difficile l'atteinte de la classe B",
                msg_type='warning_saisie',
                msg_theme='warning_too_many_etape',
                related_objects=mapping_scenario_logement[scenario],
                msg_importance='major',
                is_audit=True)

    # Le « scénario en une étape "principal" » existe ET ne contient qu’une seule étape de travaux correspondant à l’ « étape finale »
    def controle_coherence_scenario_mono_etape(self, audit, report):

        enum_modele_audit_id = audit.find('*//enum_modele_audit_id')
        not_audit_copro = enum_modele_audit_id.text in ['1', '2']
        if not_audit_copro:
            related_objects = []
            mapping_scenario_etape_to_related_objects = {}
            all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
            for caracteristique_generale in all_caracteristique_generale:
                enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
                enum_etape_id = caracteristique_generale.find('enum_etape_id').text
                related_objects.append(caracteristique_generale.find('enum_scenario_id'))
                if enum_scenario_id + '_' + enum_etape_id in mapping_scenario_etape_to_related_objects.keys():
                    mapping_scenario_etape_to_related_objects[enum_scenario_id + '_' + enum_etape_id].append(
                        caracteristique_generale.find('enum_etape_id'))
                else:
                    mapping_scenario_etape_to_related_objects[enum_scenario_id + '_' + enum_etape_id] = [
                        caracteristique_generale.find('enum_etape_id')]

            all_scenario = [k.split('_')[0] for k in mapping_scenario_etape_to_related_objects.keys()]
            presence_scenario_mono_etape = '2' in all_scenario
            all_etape_in_scenario_mono_etape = [k.split('_')[-1] for k in mapping_scenario_etape_to_related_objects.keys()
                                                if k.split('_')[0] == '2']
            presence_etape_finale = '2' in all_etape_in_scenario_mono_etape

            if not presence_scenario_mono_etape:
                report.generate_msg(
                    f"le scénario en une étape principal est absent de l'audit. L'audit doit contenir un logement avec enum_scenario_id à {self.display_enum_traduction('enum_scenario_id', 2)}",
                    msg_type='erreur_saisie',  # TODO : est-ce une erreur saisie ou logiciel ? ??
                    msg_theme='error_missing_scenario',
                    related_objects=related_objects,
                    msg_importance='blocker',
                    is_audit=True)
            else:
                related_objects = [v for etape in all_etape_in_scenario_mono_etape for v in
                                   mapping_scenario_etape_to_related_objects['2_' + etape]]
                if len(all_etape_in_scenario_mono_etape) > 1:
                    report.generate_msg(
                        f"le scénario en une étape principal contient plusieurs étape de travaux. Le scénario en une étape principal (avec enum_scenario_id à {self.display_enum_traduction('enum_scenario_id', 2)}) ne doit être associé qu'à une seule étape de travaux",
                        msg_type='erreur_saisie',  # TODO : est-ce une erreur saisie ou logiciel ? ??
                        msg_theme='error_number_etape',
                        related_objects=related_objects,
                        msg_importance='blocker',
                        is_audit=True)
                if not presence_etape_finale:
                    report.generate_msg(
                        f"le scénario en une étape principal ne contient pas d'étape finale. Le scénario en une étape principal (avec enum_scenario_id à {self.display_enum_traduction('enum_scenario_id', 2)}) doit être associé à une étape finale (avec enum_etape_id à {self.display_enum_traduction('enum_etape_id', 2)})",
                        msg_type='erreur_saisie',  # TODO : est-ce une erreur saisie ou logiciel ? ??
                        msg_theme='error_missing_etape',
                        related_objects=related_objects,
                        msg_importance='blocker',
                        is_audit=True)

    # L’ « étape finale » doit atteindre l’étiquette : "C" si l'état existant est passoire (F ou G), "B" sinon.
    # Si dérogation, alors il faut un saut de deux classes entre l’ « état initial » (avant travaux) et l’étape finale.
    # Si scénario principal, alors erreur bloquante. Sinon, warning.
    def controle_coherence_etape_finale(self, audit, report):
        class_etat_initial = None
        # enum_derogation_technique_id
        derogation_technique = audit.find('.//enum_derogation_technique_id').text != '1'
        derogation_economique = audit.find('.//enum_derogation_economique_id').text != '1'

        all_class_etape_finale = []
        all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
        for caracteristique_generale in all_caracteristique_generale:
            enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
            enum_etape_id = caracteristique_generale.find('enum_etape_id').text
            if enum_scenario_id == "0" and enum_etape_id == "0":
                class_etat_initial = caracteristique_generale.getparent().find('.//classe_bilan_dpe')
            elif enum_scenario_id != "0" and enum_etape_id == "2":
                if caracteristique_generale.getparent().find('etape_travaux') is not None:
                    all_class_etape_finale.append(
                        caracteristique_generale.getparent().find('etape_travaux').find('classe_bilan_dpe'))

        if (derogation_technique or derogation_economique) and (class_etat_initial is not None):
            class_score = {"A": 6, "B": 5, "C": 4, "D": 3, "E": 2, "F": 1, "G": 0}
            for etape_finale in all_class_etape_finale:
                gap_class = class_score[etape_finale.text] - class_score[class_etat_initial.text]
                if gap_class < 2:
                    enum_scenario_id = etape_finale.getparent().getparent().find('*/enum_scenario_id').text
                    msg_type = 'warning_saisie'
                    msg_theme = 'warning_class_etape_finale'
                    msg_importance = 'major'
                    if enum_scenario_id in ["1", "2"]:
                        msg_type = 'erreur_saisie'
                        msg_theme = 'error_class_etape_finale'
                        msg_importance = 'blocker'
                    report.generate_msg(
                        f"le saut de classe DPE entre l'étape finale du {list(self.display_enum_traduction('enum_scenario_id', int(enum_scenario_id)).values())[0]} : {etape_finale.text} et l'état initial : {class_etat_initial.text} n'est pas suffisant. En effet, dans le cas d'une derogation, l'audit exige un saut d'au moins 2 classes DPE. Ici le saut n'est que de : {gap_class} classe",
                        msg_type=msg_type,
                        msg_theme=msg_theme,
                        related_objects=etape_finale,
                        msg_importance=msg_importance,
                        is_audit=True)
        elif class_etat_initial.text in ['G', 'F']:
            for etape_finale in all_class_etape_finale:
                if etape_finale.text not in ['C', 'B', 'A']:
                    enum_scenario_id = etape_finale.getparent().getparent().find('*/enum_scenario_id').text
                    msg_type = 'warning_saisie'
                    msg_theme = 'warning_class_etape_finale'
                    msg_importance = 'major'
                    if enum_scenario_id in ["1", "2"]:
                        msg_type = 'erreur_saisie'
                        msg_theme = 'error_class_etape_finale'
                        msg_importance = 'blocker'
                    report.generate_msg(
                        f"la classe DPE : {etape_finale.text},  de l'étape finale du {list(self.display_enum_traduction('enum_scenario_id', int(enum_scenario_id)).values())[0]} n'atteint pas la classe C. Or, pour un état initial en 'passoire énergétique' (F ou G), quand il n'y a pas de derogation (avec enum_derogation_technique_id à {self.display_enum_traduction('enum_derogation_technique_id', 1)} et enum_derogation_economique_id à {self.display_enum_traduction('enum_derogation_economique_id', 1)}), l'audit exige l'atteinte de la classe C pour l'étape finale",
                        msg_type=msg_type,
                        msg_theme=msg_theme,
                        related_objects=etape_finale,
                        msg_importance=msg_importance,
                        is_audit=True)

        else:
            for etape_finale in all_class_etape_finale:
                if etape_finale.text not in ['B', 'A']:
                    enum_scenario_id = etape_finale.getparent().getparent().find('*/enum_scenario_id').text
                    msg_type = 'warning_saisie'
                    msg_theme = 'warning_class_etape_finale'
                    msg_importance = 'major'
                    if enum_scenario_id in ["1", "2"]:
                        msg_type = 'erreur_saisie'
                        msg_theme = 'error_class_etape_finale'
                        msg_importance = 'blocker'
                    report.generate_msg(
                        f"la classe DPE : {etape_finale.text},  de l'étape finale du {list(self.display_enum_traduction('enum_scenario_id', int(enum_scenario_id)).values())[0]} n'atteint pas la classe B. Or, quand il n'y a pas de derogation (avec enum_derogation_technique_id à {self.display_enum_traduction('enum_derogation_technique_id', 1)} et enum_derogation_economique_id à {self.display_enum_traduction('enum_derogation_economique_id', 1)}), l'audit exige l'atteinte de la classe B pour l'étape finale",
                        msg_type=msg_type,
                        msg_theme=msg_theme,
                        related_objects=etape_finale,
                        msg_importance=msg_importance,
                        is_audit=True)

    # Pour les dérogations, vérifier que les six postes de travaux de rénovation énergétique ont été traités pour les deux scénarios :
    # isolation des murs, l'isolation des planchers bas, l'isolation de la toiture, le remplacement des menuiseries extérieures, la ventilation, la production de chauffage et d'eau chaude sanitaire (via « enum_lot_travaux_audit_id »)
    def controle_coherence_six_postes_travaux(self, audit, report):
        enum_modele_audit_id = audit.find('*//enum_modele_audit_id')
        not_audit_copro = enum_modele_audit_id.text in ['1', '2']
        if not_audit_copro:
            # enum_derogation_technique_id
            derogation_technique = audit.find('.//enum_derogation_technique_id').text != '1'
            derogation_economique = audit.find('.//enum_derogation_economique_id').text != '1'
            if derogation_technique or derogation_economique:
                all_lot_travaux_in_mono = []
                all_lot_travaux_in_multi = []
                all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
                for caracteristique_generale in all_caracteristique_generale:
                    enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
                    if enum_scenario_id == "2":
                        if caracteristique_generale.getparent().find('etape_travaux') is not None:
                            all_lot_travaux_in_mono += list(
                                caracteristique_generale.getparent().find('etape_travaux').iterfind(
                                    '*//enum_lot_travaux_audit_id'))
                    elif enum_scenario_id == "1":
                        if caracteristique_generale.getparent().find('etape_travaux') is not None:
                            all_lot_travaux_in_multi += list(
                                caracteristique_generale.getparent().find('etape_travaux').iterfind(
                                    '*//enum_lot_travaux_audit_id'))

                lot_travaux_to_check = {"1": "murs",
                                        "2": "planchers bas",
                                        "3": "toiture/plafond",
                                        "4": "portes et fenêtres",
                                        "5": "système de chauffage",
                                        "8": "système de ventilation"}
                for enum_scenario_id, all_lot_travaux in zip(["2", "1"],
                                                             [all_lot_travaux_in_mono, all_lot_travaux_in_multi]):
                    all_lot_travaux_values = [lot_travaux.text for lot_travaux in all_lot_travaux]
                    missing_lot_travaux = [lib for id_, lib in lot_travaux_to_check.items() if
                                           id_ not in all_lot_travaux_values]
                    if len(missing_lot_travaux):
                        report.generate_msg(
                            f"dans le scenario {list(self.display_enum_traduction('enum_scenario_id', int(enum_scenario_id)).values())[0]} les postes de travaux suivants n'ont pas été traités : {missing_lot_travaux}. Or, dans le cas d'une dérogation, il est nécessaire que les 6 postes de travaux (murs, toit, plancher bas, menuiseries, ventilation et Chauffage-ECS) soit traités. Merci de verifier que les postes de travaux suivant : {missing_lot_travaux},  n'ont pas besoin d'être traités",
                            msg_type='warning_saisie',
                            msg_theme='warning_missing_work',
                            related_objects=all_lot_travaux,
                            msg_importance='major',
                            is_audit=True)


    # Vérifier que tous les logements ont une méthode DPE cohérents (dans :"enum_methode_application_dpe_log_id"), c'est-à-dire un même type de bâtiment (maison, appartement, immeuble)
    def controle_coherence_type_batiment_constant(self, audit, report):
        enum_methode_application_dpe_log_id_list = list(audit.iterfind('*//enum_methode_application_dpe_log_id'))
        type_batiment_list = [
            str(self.enum_table['methode_application_dpe_log'].loc[int(methode_dpe.text)].type_batiment) for methode_dpe
            in enum_methode_application_dpe_log_id_list]

        if len(set(type_batiment_list)) > 1:
            report.generate_msg(f"""
                l'audit règlementaire ne peut utiliser, entre les différentes étapes, des méthodes d'application correspondants à des type de bâtiments différents : {list(set(type_batiment_list))}. Tous les logements de l'audit doivent avoir un enum_methode_application_dpe_log_id correspondant à un seul type de bâtiment (soit "maison", soit "appartement", soit "immeuble").                 
                """,
                                msg_type='erreur_logiciel',
                                msg_theme='error_methode_application',
                                related_objects=enum_methode_application_dpe_log_id_list,
                                msg_importance='blocker',
                                is_audit=True)

    #  Lorsque l'auditeur n'a renseigné aucun encadré destiné aux observations (recommandation)
    def controle_coherence_presence_recommandation(self, audit, report):
        all_recommandation_scenario = list(audit.iterfind('*//recommandation_scenario'))
        if len(all_recommandation_scenario) == 0:
            recommandation_auditeur_collection = audit.find('.//recommandation_auditeur_collection')
            report.generate_msg(
                "aucune recommandation auditeur n'a été définie (correspond aux encadrés « observations » dans la trame).",
                msg_type='warning_saisie',
                msg_theme='warning_missing_recommandation',
                related_objects=recommandation_auditeur_collection,
                msg_importance='minor',
                is_audit=True)
        else:
            all_recommandation = [r_c.find('recommandation') for r_c in all_recommandation_scenario]
            recommandations_non_vides = ['OK' for recommandation in all_recommandation if (
                    recommandation is not None and recommandation.text is not None and len(
                recommandation.text) > 0)]
            if len(recommandations_non_vides) == 0:
                report.generate_msg(
                    "toutes les recommandations auditeurs sont vides (correspond aux encadrés « observations » dans la trame).",
                    msg_type='warning_saisie',
                    msg_theme='warning_missing_recommandation',
                    related_objects=all_recommandation,
                    msg_importance='minor',
                    is_audit=True)

    #  Contrôle : si aucune étape (objet logement) de l'audit n'utilise la dérogration ventilation, alors la balise enum_derogation_ventilation_id doit être à "abscence de dérogation"
    def controle_coherence_abscence_derogation_ventilation(self, audit, report):
        all_etat_ventilation = list(audit.iterfind('*//enum_etat_ventilation_id'))
        if len(all_etat_ventilation) > 0:
            all_cases_with_derogation = [el for el in all_etat_ventilation if
                                         el.text == "3"]  # "3": "cas de dérogation"
            no_cases_with_derogation = len(all_cases_with_derogation) == 0

            if no_cases_with_derogation:
                derogation_ventilation = audit.find('.//administratif').find('enum_derogation_ventilation_id')
                # Si une déclaration ventilation a été saisie dans enum_derogation_ventilation_id
                if derogation_ventilation is not None and derogation_ventilation.text != '1':
                    # Ajoute l'objet derogation_ventilation à la liste des objets pour related_objects
                    all_etat_ventilation.insert(0, derogation_ventilation)
                    report.generate_msg(
                        f"une dérogration est déclarée dans le champ enum_derogation_ventilation_id : {list(self.display_enum_traduction('enum_derogation_ventilation_id', int(derogation_ventilation.text)).values())[0]}. Or aucune étape (logement) n'utilise de dérogation pour l'état de la ventilation.\n Merci de mettre en cohérence votre saisie, soit en mettant enum_derogation_ventilation_id à : {list(self.display_enum_traduction('enum_derogation_ventilation_id', int(1)).values())[0]}, soit utilisant une dérogation (avec enum_etat_ventilation_id à : {list(self.display_enum_traduction('enum_etat_ventilation_id', int(3)).values())[0]}) pour au moins un logement.",
                        msg_type='erreur_saisie',
                        msg_theme='error_derogation_ventilation',
                        related_objects=all_etat_ventilation,
                        msg_importance='blocker',
                        is_audit=True)

    #  Controle : si la dérogration ventilation est utilisée pour l'étape (objet logement), alors une dérogation doit être présente dans enum_derogation_ventilation_id
    def controle_coherence_presence_derogation_ventilation(self, logement, report):
        enum_etat_ventilation_id = logement.find('*//enum_etat_ventilation_id')
        enum_derogation_ventilation_id = logement.getparent().getparent().find('.//administratif').find(
            'enum_derogation_ventilation_id')
        if enum_etat_ventilation_id is not None and enum_derogation_ventilation_id is not None:
            etape_has_derogation = enum_etat_ventilation_id.text == "3"  # "3": "cas de dérogation"
            derogation_not_declared = enum_derogation_ventilation_id.text == "1"  # "1": "abscence de dérogation"
            if etape_has_derogation and derogation_not_declared:
                report.generate_msg(
                    f"le logement (étape) contient utilise un dérogation pour enum_etat_ventilation_id : {list(self.display_enum_traduction('enum_etat_ventilation_id', int(enum_etat_ventilation_id.text)).values())[0]}. Or, aucune dérogation n'est déclarée dans enum_derogation_ventilation_id : {list(self.display_enum_traduction('enum_derogation_ventilation_id', int(enum_derogation_ventilation_id.text)).values())[0]}.\n Merci de mettre en cohérence votre saisie. ",
                    msg_type='erreur_saisie',
                    msg_theme='error_derogation_ventilation',
                    related_objects=[enum_derogation_ventilation_id, enum_etat_ventilation_id],
                    msg_importance='blocker',
                    is_audit=True)

    # Controle (Warning) : vérifie que pour les scénarios mono et multi étapes principaux, que le Ubat de l'étape finale soit inférieur au Ubat_base (condition BCC réno)
    def controle_coherence_ubat_base_ubat(self, logement, report):
        ubat_base = logement.find('*//ubat_base')
        if ubat_base is not None:
            enum_scenario_id = logement.find('*//enum_scenario_id')
            enum_etape_id = logement.find('*//enum_etape_id')
            is_scenario_principal = enum_scenario_id.text in ["1", "2"]
            is_etape_finale = enum_etape_id.text == "2"  # "étape finale"
            if is_scenario_principal and is_etape_finale:
                ubat = logement.find('*//ubat')
                if float(ubat.text) > float(ubat_base.text):
                    report.generate_msg(
                        f"l'étape finale du scénario : {list(self.display_enum_traduction('enum_scenario_id', int(enum_scenario_id.text)).values())[0]}, a un Ubat = {round(float(ubat.text), 2)} supérieur au Ubat base = {round(float(ubat_base.text), 2)}, ce qui n'est pas BCC réno compatible. \n Merci de saisir des travaux de rénovation plus performants pour l'enveloppe du bâtiment.",
                        msg_type='warning_saisie',
                        msg_theme='warning_ubat_base',
                        related_objects=[ubat, ubat_base],
                        msg_importance='critical',
                        is_audit=True)

    # Controle (Warning) : vérifie que pour les étapes de travaux ont un état de ventilation fonctionnelle (condition BCC réno)
    def controle_coherence_etat_ventilation(self, logement, report):
        enum_etat_ventilation_id = logement.find('*//enum_etat_ventilation_id')
        enum_scenario_id = logement.find('*//enum_scenario_id')
        enum_etape_id = logement.find('*//enum_etape_id')
        if enum_etat_ventilation_id is not None and enum_scenario_id.text != "0":
            ventilation_non_fonctionnelle = enum_etat_ventilation_id.text == "1"  # "1": "ventilation non fonctionnelle"
            enum_scenario_id = logement.find('*//enum_scenario_id')
            is_scenario_principal = enum_scenario_id.text in ["1", "2"]
            is_scenario_additional = enum_scenario_id.text in ["3", "4", "5"]

            if ventilation_non_fonctionnelle and is_scenario_principal:
                report.generate_msg(
                    f"l'{list(self.display_enum_traduction('enum_etape_id', int(enum_etape_id.text)).values())[0]} du {list(self.display_enum_traduction('enum_scenario_id', int(enum_scenario_id.text)).values())[0]}, a un état de ventilation à :  = {list(self.display_enum_traduction('enum_etat_ventilation_id', int(enum_etat_ventilation_id.text)).values())[0]}, ce qui n'est pas BCC réno compatible. \n Merci de traiter la ventilation ou bien de sélectionner un cas de derogation",
                    msg_type='warning_saisie',
                    msg_theme='warning_etat_ventilation',
                    related_objects=[enum_etat_ventilation_id],
                    msg_importance='critical',
                    is_audit=True)
            if ventilation_non_fonctionnelle and is_scenario_additional:
                report.generate_msg(
                    f"l'{list(self.display_enum_traduction('enum_etape_id', int(enum_etape_id.text)).values())[0]} du {list(self.display_enum_traduction('enum_scenario_id', int(enum_scenario_id.text)).values())[0]}, a un état de ventilation à :  = {list(self.display_enum_traduction('enum_etat_ventilation_id', int(enum_etat_ventilation_id.text)).values())[0]}, ce qui n'est pas BCC réno compatible.",
                    msg_type='warning_saisie',
                    msg_theme='warning_etat_ventilation',
                    related_objects=[enum_etat_ventilation_id],
                    msg_importance='minor',
                    is_audit=True)

    # Contrôle la présence de l'élément "caracteristiques_travaux", pour tous les travaux, dans "travaux_collection", qui nécessitent la présence de caractéristiques techniques
    def controle_coherence_presence_caracteristiques_travaux(self, logement, report):

        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            df_type_travaux_with_caracteristiques_travaux = self.enum_table_audit['type_travaux'].dropna(subset=['caracteristiques_travaux'])
            ids_with_required_caracteristiques_travaux = list(df_type_travaux_with_caracteristiques_travaux.index)
            libs_with_required_caracteristiques_travaux = list(df_type_travaux_with_caracteristiques_travaux.lib)
            travaux_without_caracteristiques_travaux = [travaux for travaux in list(etape_travaux.find('.//travaux_collection')) if travaux.find('caracteristiques_travaux') is None]

            missing_required_caracteristiques_travaux = [travaux for travaux in travaux_without_caracteristiques_travaux if int(travaux.find('enum_type_travaux_id').text) in ids_with_required_caracteristiques_travaux]

            if len(missing_required_caracteristiques_travaux) > 0:
                report.generate_msg(
                    f"un ou plusieurs travaux dans « travaux_collection » ne contiennent pas la balise 'caracteristiques_travaux' alors qu'ils font partis des types de travaux où elle est exigée : {libs_with_required_caracteristiques_travaux}. Merci d'ajouter et de renseigner les 'caracteristiques_travaux' pour le(s) travaux concerné(s).",
                    msg_type='erreur_saisie',
                    msg_theme='error_caracteristiques_travaux_missing',
                    related_objects=missing_required_caracteristiques_travaux,
                    msg_importance='blocker',
                    is_audit=True)

    # Contrôle l'absence de l'élément "caracteristiques_travaux", pour tous les travaux, dans "travaux_collection", qui NE nécessitent PAS la présence de caractéristiques techniques
    def controle_coherence_absence_caracteristiques_travaux(self, logement, report):

        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            df_type_travaux_with_caracteristiques_travaux = self.enum_table_audit['type_travaux'].dropna(subset=['caracteristiques_travaux'])
            ids_with_required_caracteristiques_travaux = list(df_type_travaux_with_caracteristiques_travaux.index)
            libs_with_required_caracteristiques_travaux = list(df_type_travaux_with_caracteristiques_travaux.lib)
            travaux_with_caracteristiques_travaux = [travaux for travaux in list(etape_travaux.find('.//travaux_collection')) if travaux.find('caracteristiques_travaux') is not None]

            wrong_presence_caracteristiques_travaux = [travaux for travaux in travaux_with_caracteristiques_travaux if int(travaux.find('enum_type_travaux_id').text) not in ids_with_required_caracteristiques_travaux]

            if len(wrong_presence_caracteristiques_travaux) > 0:
                report.generate_msg(
                    f"un ou plusieurs travaux dans « travaux_collection » contiennent la balise 'caracteristiques_travaux' alors qu'ils ne font pas partis des types de travaux où elle est demandée : {libs_with_required_caracteristiques_travaux}. Merci de retirer les 'caracteristiques_travaux' pour le(s) travaux concerné(s).",
                    msg_type='erreur_saisie',
                    msg_theme='error_caracteristiques_travaux_presence',
                    related_objects=wrong_presence_caracteristiques_travaux,
                    msg_importance='blocker',
                    is_audit=True)

    # Contrôle la cohérence entre enum_type_travaux_id et l'élément renseigné dans "caracteristiques_travaux", pour tous les travaux, dans "travaux_collection". Ne s'exécute que pour les travaux qui ont un "caracteristiques_travaux"
    def controle_coherence_caracteristiques_travaux(self, logement, report):

        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            df_type_travaux_with_caracteristiques_travaux = self.enum_table_audit['type_travaux'].dropna(subset=['caracteristiques_travaux'])
            ids_with_required_caracteristiques_travaux = list(df_type_travaux_with_caracteristiques_travaux.index)
            libs_with_required_caracteristiques_travaux = list(df_type_travaux_with_caracteristiques_travaux.lib)
            travaux_with_caracteristiques_travaux = [travaux for travaux in list(etape_travaux.find('.//travaux_collection')) if travaux.find('caracteristiques_travaux') is not None]

            # On ne garde QUE les travaux qui ONT une balise 'caracteristiques_travaux' ET qui ONT une valeur de 'enum_type_travaux_id' qui nécessite la présence de 'caracteristiques_travaux'
            travaux_clean = [travaux for travaux in travaux_with_caracteristiques_travaux if int(travaux.find('enum_type_travaux_id').text) in ids_with_required_caracteristiques_travaux]

            enum_type_travaux_id_to_caracteristiques_travaux = df_type_travaux_with_caracteristiques_travaux['caracteristiques_travaux'].to_dict()

            # Pour tous les travaux_clean, on regarde si la valeur de enum_type_travaux_id est cohérente avec celle de la balise fille de caracteristiques_travaux
            travaux_incoherent = [travaux for travaux in travaux_clean if enum_type_travaux_id_to_caracteristiques_travaux[int(travaux.find('enum_type_travaux_id').text)] != travaux.find('caracteristiques_travaux').getchildren()[0].tag]

            if len(travaux_incoherent) > 0:
                report.generate_msg(
                    "un ou plusieurs travaux dans « travaux_collection » ont une incohérence entre le type de travaux déclaré dans 'enum_type_travaux_id' et celui déclaré dans 'caracteristiques_travaux'. Merci de vous assurer de la coherence entre 'enum_type_travaux_id' et ce qui est déclaré dans 'caracteristiques_travaux' pour ce(s) travaux.",
                    msg_type='erreur_saisie',
                    msg_theme='error_caracteristiques_travaux_consistency',
                    related_objects=travaux_incoherent,
                    msg_importance='blocker',
                    is_audit=True)

    # Contrôler que pour toutes les étapes de travaux, travaux_collection et travaux_induits_collection, que les balises de couts soient correctement renseignées : cout, cout_min, cout_max, cout_cumule, cout_cumule_min, cout_cumule_max.
    # 1) Déclaration des fourchettes : les balises 'cout_min', 'cout_max' et 'cout_cumule_min', 'cout_cumule_max' doivent toujours être présentes ensemble OU ne pas être présentes du tout.
    # 2) Ordre Min/Max des fourchettes : la valeur 'cout_min' doit être inférieure à 'cout_max' et 'cout_cumule_min' doit être inférieure à 'cout_cumule_max'.
    # 3) Présence des coûts dans étapes de travaux, travaux_collection et travaux_induits_collection : soit la balise 'cout' soit la fourchette de couts 'cout_min', 'cout_max' doivent être renseignées. Pour etape_travaux, il faut aussi renseigner soit 'cout_cumule', soit la fourchette 'cout_cumule_min', 'cout_cumule_max'.
    # 4) Choix d'une méthode de saisie de coûts : Il n'est pas permis de saisir la balise de coût 'cout' et la fourchette de couts 'cout_min', 'cout_max'. L'utilisateur doit choisir une méthode. Cela s'applique aussi au 'cout_cumule'.
    def controle_coherence_etape_travaux_cout_presence(self, logement, report):

        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:

            # EVALUATION DE 'cout', 'cout_min', 'cout_max' de etape_travaux
            etape_travaux_cout_presence = etape_travaux.find('cout') is not None
            etape_travaux_cout_min_presence = etape_travaux.find('cout_min') is not None
            etape_travaux_cout_max_presence = etape_travaux.find('cout_max') is not None

            if etape_travaux_cout_min_presence ^ etape_travaux_cout_max_presence:
                report.generate_msg(
                    "la fourchette de coûts dans 'etape_travaux' est mal déclarée, puisque l'une des deux balises nécessaires : 'cout_max', 'cout_min', est manquante",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_fourchette',
                    related_objects=etape_travaux,
                    msg_importance='blocker',
                    is_audit=True)

            elif not etape_travaux_cout_presence and not etape_travaux_cout_max_presence:
                report.generate_msg(
                    "aucun coûts dans 'etape_travaux' n'est déclaré. Merci de renseigner soit 'cout', soit 'cout_min' et 'cout_max'.",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_missing',
                    related_objects=etape_travaux,
                    msg_importance='blocker',
                    is_audit=True)

            elif etape_travaux_cout_presence and etape_travaux_cout_max_presence:
                report.generate_msg(
                    "à la fois le coût ET la fourchette de coûts sont déclarés, dans 'etape_travaux'. Merci de renseigner soit 'cout', soit 'cout_min' et 'cout_max'.",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_presence',
                    related_objects=etape_travaux,
                    msg_importance='blocker',
                    is_audit=True)

            # Nouveau contrôle pour 'cout_min' et 'cout_max'
            if etape_travaux_cout_min_presence and etape_travaux_cout_max_presence:
                cout_min = float(etape_travaux.find('cout_min').text)
                cout_max = float(etape_travaux.find('cout_max').text)
                if cout_min > cout_max:
                    report.generate_msg(
                        "'cout_min' est supérieur à 'cout_max' dans 'etape_travaux'.",
                        msg_type='erreur_saisie',
                        msg_theme='error_travaux_cout_order',
                        related_objects=etape_travaux,
                        msg_importance='blocker',
                        is_audit=True)

            # EVALUATION DE 'cout_cumule', 'cout_cumule_min', 'cout_cumule_max' de etape_travaux
            etape_travaux_cout_cumule_presence = etape_travaux.find('cout_cumule') is not None
            etape_travaux_cout_cumule_min_presence = etape_travaux.find('cout_cumule_min') is not None
            etape_travaux_cout_cumule_max_presence = etape_travaux.find('cout_cumule_max') is not None

            if etape_travaux_cout_cumule_min_presence ^ etape_travaux_cout_cumule_max_presence:
                report.generate_msg(
                    "la fourchette de coûts cumulés dans 'etape_travaux' est mal déclarée, puisque l'une des deux balises nécessaires : 'cout_cumule_max', 'cout_cumule_min', est manquante",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_cumule_fourchette',
                    related_objects=etape_travaux,
                    msg_importance='blocker',
                    is_audit=True)

            elif not etape_travaux_cout_cumule_presence and not etape_travaux_cout_cumule_max_presence:
                report.generate_msg(
                    "aucun coût cumulé dans 'etape_travaux' n'est déclaré. Merci de renseigner soit 'cout_cumule', soit 'cout_cumule_min' et 'cout_cumule_max'.",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_cumule_missing',
                    related_objects=etape_travaux,
                    msg_importance='blocker',
                    is_audit=True)

            elif etape_travaux_cout_cumule_presence and etape_travaux_cout_cumule_max_presence:
                report.generate_msg(
                    "à la fois le coût cumulé ET la fourchette de coûts cumulés sont déclarés, dans 'etape_travaux'. Merci de renseigner soit 'cout_cumule', soit 'cout_cumule_min' et 'cout_cumule_max'.",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_cumule_presence',
                    related_objects=etape_travaux,
                    msg_importance='blocker',
                    is_audit=True)

            # Nouveau contrôle pour 'cout_cumule_min' et 'cout_cumule_max'
            if etape_travaux_cout_cumule_min_presence and etape_travaux_cout_cumule_max_presence:
                cout_cumule_min = float(etape_travaux.find('cout_cumule_min').text)
                cout_cumule_max = float(etape_travaux.find('cout_cumule_max').text)
                if cout_cumule_min > cout_cumule_max:
                    report.generate_msg(
                        "'cout_cumule_min' est supérieur à 'cout_cumule_max' dans 'etape_travaux'.",
                        msg_type='erreur_saisie',
                        msg_theme='error_travaux_cout_cumule_order',
                        related_objects=etape_travaux,
                        msg_importance='blocker',
                        is_audit=True)

            # Contrôles pour 'travaux_collection' et 'travaux_induits_collection'
            travaux_wrong_fourchettes = [travaux for travaux in list(etape_travaux.find('.//travaux_collection')) if (travaux.find('cout_min') is not None) ^ (travaux.find('cout_max') is not None)]
            if len(travaux_wrong_fourchettes) > 0:
                report.generate_msg(
                    "la fourchette de coûts est mal déclarée, pour un ou plusieurs travaux de 'travaux_collection', puisque l'une des deux balises nécessaires : 'cout_max', 'cout_min', est manquante",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_fourchette',
                    related_objects=travaux_wrong_fourchettes,
                    msg_importance='blocker',
                    is_audit=True)

            travaux_cost_missing = [travaux for travaux in list(etape_travaux.find('.//travaux_collection')) if not ((travaux.find('cout_min') is not None) ^ (travaux.find('cout_max') is not None)) and (travaux.find('cout') is None) and (travaux.find('cout_max') is None)]
            if len(travaux_cost_missing) > 0:
                report.generate_msg(
                    "aucun coûts n'est déclaré, pour un ou plusieurs travaux de 'travaux_collection'. Merci de renseigner soit 'cout', soit 'cout_min' et 'cout_max'.",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_missing',
                    related_objects=travaux_cost_missing,
                    msg_importance='blocker',
                    is_audit=True)

            travaux_all_costs_presents = [travaux for travaux in list(etape_travaux.find('.//travaux_collection')) if not ((travaux.find('cout_min') is not None) ^ (travaux.find('cout_max') is not None)) and (travaux.find('cout') is not None) and (travaux.find('cout_max') is not None)]
            if len(travaux_all_costs_presents) > 0:
                report.generate_msg(
                    "à la fois le coût ET la fourchette de coûts sont déclarés, pour un ou plusieurs travaux de 'travaux_collection'. Merci de renseigner soit 'cout', soit 'cout_min' et 'cout_max'.",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_presence',
                    related_objects=travaux_all_costs_presents,
                    msg_importance='blocker',
                    is_audit=True)

            travaux_induits_wrong_fourchettes = [travaux for travaux in list(etape_travaux.find('.//travaux_induits_collection')) if (travaux.find('cout_min') is not None) ^ (travaux.find('cout_max') is not None)]
            if len(travaux_induits_wrong_fourchettes) > 0:
                report.generate_msg(
                    "la fourchette de coûts est mal déclarée, pour un ou plusieurs travaux_induits de 'travaux_induits_collection', puisque l'une des deux balises nécessaires : 'cout_max', 'cout_min', est manquante",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_fourchette',
                    related_objects=travaux_induits_wrong_fourchettes,
                    msg_importance='blocker',
                    is_audit=True)

            travaux_induits_cost_missing = [travaux for travaux in list(etape_travaux.find('.//travaux_induits_collection')) if not ((travaux.find('cout_min') is not None) ^ (travaux.find('cout_max') is not None)) and (travaux.find('cout') is None) and (travaux.find('cout_max') is None)]
            if len(travaux_induits_cost_missing) > 0:
                report.generate_msg(
                    "aucun coûts n'est déclaré, pour un ou plusieurs travaux_induits de 'travaux_induits_collection'. Merci de renseigner soit 'cout', soit 'cout_min' et 'cout_max'.",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_missing',
                    related_objects=travaux_induits_cost_missing,
                    msg_importance='blocker',
                    is_audit=True)

            travaux_induits_all_costs_presents = [travaux for travaux in list(etape_travaux.find('.//travaux_induits_collection')) if not ((travaux.find('cout_min') is not None) ^ (travaux.find('cout_max') is not None)) and (travaux.find('cout') is not None) and (travaux.find('cout_max') is not None)]
            if len(travaux_induits_all_costs_presents) > 0:
                report.generate_msg(
                    "à la fois le coût ET la fourchette de coûts sont déclarés, pour un ou plusieurs travaux_induits de 'travaux_induits_collection'. Merci de renseigner soit 'cout', soit 'cout_min' et 'cout_max'.",
                    msg_type='erreur_saisie',
                    msg_theme='error_travaux_cout_presence',
                    related_objects=travaux_induits_all_costs_presents,
                    msg_importance='blocker',
                    is_audit=True)

            # Contrôles MIX/MAX pour 'travaux_collection' et 'travaux_induits_collection'
            for collection_name, travaux_name in zip(['travaux_collection', 'travaux_induits_collection'], ['travaux', 'travaux_induits']):
                travaux_elements = etape_travaux.findall(f'.//{collection_name}/{travaux_name}')

                for travaux in travaux_elements:
                    cout_min_presence = travaux.find('cout_min') is not None
                    cout_max_presence = travaux.find('cout_max') is not None

                    if cout_min_presence and cout_max_presence:
                        cout_min = float(travaux.find('cout_min').text)
                        cout_max = float(travaux.find('cout_max').text)
                        if cout_min > cout_max:
                            report.generate_msg(
                                f"'cout_min' est supérieur à 'cout_max' pour un ou plusieurs travaux dans '{collection_name}'.",
                                msg_type='erreur_saisie',
                                msg_theme='error_travaux_cout_order',
                                related_objects=travaux,
                                msg_importance='blocker',
                                is_audit=True)

    # Pour les « scénario multi étapes "principal" » et « scénario en une étape "principal" », il faut au moins 2 postes de travaux sur l'isolation de l'enveloppe (fenêtres comprises).
    def controle_coherence_deux_postes_isolation(self, audit, report):
        enum_modele_audit_id = audit.find('*//enum_modele_audit_id')
        not_audit_copro = enum_modele_audit_id.text in ['1', '2']
        if not_audit_copro:
            all_lot_travaux_in_mono = []
            all_lot_travaux_in_1er_etape_multi = []
            all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
            for caracteristique_generale in all_caracteristique_generale:
                enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
                enum_etape_id = caracteristique_generale.find('enum_etape_id').text
                # Mono-etapes - etape finale
                if enum_scenario_id == "2" and enum_etape_id == "2":
                    if caracteristique_generale.getparent().find('etape_travaux') is not None:
                        all_lot_travaux_in_mono += list(
                            caracteristique_generale.getparent().find('etape_travaux').iterfind(
                                '*//enum_lot_travaux_audit_id'))
                # Multi-etape - etape 1er
                elif enum_scenario_id == "1" and enum_etape_id == "1":
                    if caracteristique_generale.getparent().find('etape_travaux') is not None:
                        all_lot_travaux_in_1er_etape_multi += list(
                            caracteristique_generale.getparent().find('etape_travaux').iterfind(
                                '*//enum_lot_travaux_audit_id'))

            lot_travaux_to_check = {"1": "murs",
                                    "2": "planchers bas",
                                    "3": "toiture/plafond",
                                    "4": "portes et fenêtres", }
            for enum_scenario_etape_id, all_lot_travaux in zip(["2", "1"],
                                                               [all_lot_travaux_in_mono, all_lot_travaux_in_1er_etape_multi]):
                all_lot_travaux_values = [lot_travaux.text for lot_travaux in all_lot_travaux]
                lot_travaux_isolation = [lib for id_, lib in lot_travaux_to_check.items() if
                                         id_ in all_lot_travaux_values]
                if len(lot_travaux_isolation) < 2:
                    report.generate_msg(
                        f"dans le scenario {list(self.display_enum_traduction('enum_scenario_id', int(enum_scenario_etape_id)).values())[0]}, l'étape {list(self.display_enum_traduction('enum_etape_id', int(enum_scenario_etape_id)).values())[0]}, un nombre insuffisant ({len(lot_travaux_isolation)}) de postes de travaux sur l'enveloppe a été réalisé. Or, il est normalement nécessaire que 2 postes de travaux d'isolation soit réalisés (murs, toit, plancher bas, menuiseries) dès la première étape.",
                        msg_type='warning_saisie',
                        msg_theme='warning_missing_work',
                        related_objects=all_lot_travaux,
                        msg_importance='major',
                        is_audit=True)

    # Pour le « scénario multi étapes "principal" », il faut que l’ « étape première », si elle n'est pas "A", "B" ou "C", permette de réaliser un gain d'au moins 2 classes et au minimum d'atteindre la classe E
    # Si dérogation, alors le controle de s'applique pas.
    def controle_coherence_etape_premiere_saut_2_classes(self, audit, report):
        # Vérification de la presence de derogation
        derogation_technique = audit.find('.//enum_derogation_technique_id').text != '1'
        derogation_economique = audit.find('.//enum_derogation_economique_id').text != '1'
        if not derogation_technique and not derogation_economique:
            class_multi_etape_premiere = None
            class_etat_initial = None
            all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
            for caracteristique_generale in all_caracteristique_generale:
                enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
                enum_etape_id = caracteristique_generale.find('enum_etape_id').text
                if enum_scenario_id == "0" and enum_etape_id == "0":
                    class_etat_initial = caracteristique_generale.getparent().find('.//classe_bilan_dpe')
                elif enum_scenario_id == "1" and enum_etape_id == "1":
                    if caracteristique_generale.getparent().find('etape_travaux') is not None:
                        class_multi_etape_premiere = caracteristique_generale.getparent().find('etape_travaux').find(
                            'classe_bilan_dpe')

            if (class_multi_etape_premiere is not None) and (class_etat_initial is not None) and (class_etat_initial.text not in ["A", "B", "C"]):
                class_score = {"A": 6, "B": 5, "C": 4, "D": 3, "E": 2, "F": 1, "G": 0}
                gap_class_multi_etape = class_score[class_multi_etape_premiere.text] - class_score[class_etat_initial.text]
                if gap_class_multi_etape < 2:
                    report.generate_msg(
                        f"le saut de classe DPE entre l'étape première du « scénario multi étapes principal » : {class_multi_etape_premiere.text} et l'état initial : {class_etat_initial.text} n'est pas suffisant. En effet, pour l'étape première du « scénario multi étapes principal », l'audit exige un saut d'au moins 2 classes DPE. Ici le saut n'est que de : {gap_class_multi_etape} classe",
                        msg_type='erreur_saisie',  # TODO : est-ce une erreur saisie ou logiciel ? ??
                        msg_theme='error_class_etape_finale',
                        related_objects=class_multi_etape_premiere,
                        msg_importance='blocker',
                        is_audit=True)
                if class_multi_etape_premiere.text in ['G', 'F']:
                    report.generate_msg(
                        f"la classe DPE : {class_multi_etape_premiere.text},  de l'étape première du « scénario multi étapes principal » n'atteint pas la classe E. Or, l'audit exige l'atteinte de la classe E pour l'étape première du « scénario multi étapes principal »",
                        msg_type='erreur_saisie',  # TODO : est-ce une erreur saisie ou logiciel ? ??
                        msg_theme='error_class_etape_finale',
                        related_objects=class_multi_etape_premiere,
                        msg_importance='blocker',
                        is_audit=True)


    # Contrôle que la somme des gains (énergie, carbone, facture) pour un scénario soit strictement négative,
    # sauf pour les émissions de GES où une tolérance de +10 kgCO2/m2/an est autorisée.
    # Objectif : s'assurer que les balises dans etape_travaux concernant le "gain" et le "gain_relatif"
    # soient bien comptabilisées en négatif (gain d'énergie = valeur négative),
    # sauf tolérance spécifique définie.

    def controle_coherence_gain_cumule(self, audit, report):
        # La vérification ne s'applique que si les deux scénarios (1 et 2) sont présents
        scenario_ids = {el.text for el in audit.findall('.//enum_scenario_id')}
        if {'1', '2'}.issubset(scenario_ids):
            el_gain_to_check = ["ep_conso_5_usages_m2_gain", "ef_conso_5_usages_m2_gain", "emission_ges_5_usages_m2_gain", "facture_gain"]
            el_gain_cumule_relatif_to_check = ["ep_conso_5_usages_m2_gain_cumule_relatif", "ef_conso_5_usages_m2_gain_cumule_relatif", "emission_ges_5_usages_m2_gain_cumule_relatif"]

            TOLERANCE_GES_ABSOLUE = 10  # +10 kgCO2/m2/an autorisé

            wrong_gain_cumule_relatif_in_mono = {}
            wrong_gain_cumule_relatif_in_multi = {}
            all_gain_in_mono = {el:0 for el in el_gain_to_check}
            all_gain_in_multi = {el:0 for el in el_gain_to_check}
            all_gain_in_mono_related_objects = {el:[] for el in el_gain_to_check}
            all_gain_in_multi_related_objects = {el:[] for el in el_gain_to_check}
            all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
            for caracteristique_generale in all_caracteristique_generale:
                enum_etape_id = caracteristique_generale.find('enum_etape_id').text
                # Cas Etat initial
                if enum_etape_id == '0':
                    emission_ges_5_usages_m2_initial = float(caracteristique_generale.getparent().find('sortie').find('emission_ges').find('emission_ges_5_usages_m2').text)

            # Calcul du seuil de tolerance GES relatif par rapport au GES de l'état initial
            tolerance_ges_relative = TOLERANCE_GES_ABSOLUE / emission_ges_5_usages_m2_initial

            flag_gain_in_mono_missing_data = True
            flag_gain_in_multi_missing_data = True
            for caracteristique_generale in all_caracteristique_generale:
                enum_scenario_id = caracteristique_generale.find('enum_scenario_id').text
                enum_etape_id = caracteristique_generale.find('enum_etape_id').text
                etape_travaux = caracteristique_generale.getparent().find('etape_travaux')

                if etape_travaux is not None:
                    for el in all_gain_in_mono.keys():
                        value = float(etape_travaux.find(el).text)
                        if enum_scenario_id == "2":
                            flag_gain_in_mono_missing_data = False
                            all_gain_in_mono[el] += value
                            all_gain_in_mono_related_objects[el].append(etape_travaux.find(el))
                        elif enum_scenario_id == "1":
                            flag_gain_in_multi_missing_data = False
                            all_gain_in_multi[el] += value
                            all_gain_in_multi_related_objects[el].append(etape_travaux.find(el))

                    # Vérification des gains relatifs cumulés à l’étape finale uniquement
                    if enum_etape_id == "2":
                        for el in el_gain_cumule_relatif_to_check:
                            value = float(etape_travaux.find(el).text)
                            if enum_scenario_id == "2":
                                if el == "emission_ges_5_usages_m2_gain_cumule_relatif":
                                    if value > tolerance_ges_relative:
                                        wrong_gain_cumule_relatif_in_mono[el] = etape_travaux.find(el)
                                elif value >= 0:
                                    wrong_gain_cumule_relatif_in_mono[el] = etape_travaux.find(el)
                            elif enum_scenario_id == "1":
                                if el == "emission_ges_5_usages_m2_gain_cumule_relatif":
                                    if value > tolerance_ges_relative:
                                        wrong_gain_cumule_relatif_in_multi[el] = etape_travaux.find(el)
                                elif value >= 0:
                                    wrong_gain_cumule_relatif_in_multi[el] = etape_travaux.find(el)

            # Suppression des clés avec des valeurs < 0 (ou < 10 kgCO2/m2/an pour GES)
            def filter_gain_dict(gain_dict, turn_off_control_if_no_data:bool):
                filtered = {}
                if not turn_off_control_if_no_data:
                    for k, v in gain_dict.items():
                        if k == "emission_ges_5_usages_m2_gain":
                            if v > TOLERANCE_GES_ABSOLUE:
                                filtered[k] = v
                        elif v >= 0:
                            filtered[k] = v
                return filtered

            all_gain_in_mono_filtered = filter_gain_dict(all_gain_in_mono, turn_off_control_if_no_data=flag_gain_in_mono_missing_data)
            all_gain_in_multi_filtered = filter_gain_dict(all_gain_in_multi, turn_off_control_if_no_data=flag_gain_in_multi_missing_data)

            # Filtrer et concaténer les objets relatifs
            merged_mono_related_objects = sum((all_gain_in_mono_related_objects[k] for k in all_gain_in_mono_filtered if k in all_gain_in_mono_related_objects), [])
            merged_multi_related_objects = sum((all_gain_in_multi_related_objects[k] for k in all_gain_in_multi_filtered if k in all_gain_in_multi_related_objects), [])

            if len(all_gain_in_mono_filtered) > 0:
                report.generate_msg(
                    f"dans le scenario {list(self.display_enum_traduction('enum_scenario_id', 2).values())[0]} les sommes des gains {list(all_gain_in_mono_filtered.keys())} sur l'ensemble des étapes ne sont pas strictement négatives (non nulles). Or, toute réduction de consommation, d'émissions de GES ou de factures doivent être négatives (tolérance de +{TOLERANCE_GES_ABSOLUE} kgCO2/m2/an pour les émissions de GES).",
                    msg_type='erreur_logiciel',
                    msg_theme='error_wrong_sum_gain',
                    related_objects=merged_mono_related_objects,
                    msg_importance='blocker',
                    is_audit=True)
            if len(all_gain_in_multi_filtered) > 0:
                report.generate_msg(
                    f"dans le scenario {list(self.display_enum_traduction('enum_scenario_id', 1).values())[0]} les sommes des gains {list(all_gain_in_multi_filtered.keys())} sur l'ensemble des étapes ne sont pas strictement négatives (non nulles). Or, toute réduction de consommation, d'émissions de GES ou de factures doivent être négatives (tolérance de +{TOLERANCE_GES_ABSOLUE} kgCO2/m2/an pour les émissions de GES).",
                    msg_type='erreur_logiciel',
                    msg_theme='error_wrong_sum_gain',
                    related_objects=merged_multi_related_objects,
                    msg_importance='blocker',
                    is_audit=True)
            if len(wrong_gain_cumule_relatif_in_mono) > 0:
                report.generate_msg(
                    f"dans le scenario {list(self.display_enum_traduction('enum_scenario_id', 2).values())[0]} les gains relatifs cumulés en étape finale ({list(wrong_gain_cumule_relatif_in_mono.keys())}) ne sont pas strictement négatifs (non nuls). Or, toute réduction de consommation, d'émissions de GES ou de factures doivent être négatives (tolérance de +{TOLERANCE_GES_ABSOLUE} kgCO2/m2/an pour les émissions de GES).",
                    msg_type='erreur_logiciel',
                    msg_theme='error_wrong_sum_gain',
                    related_objects=list(wrong_gain_cumule_relatif_in_mono.values()),
                    msg_importance='blocker',
                    is_audit=True)
            if len(wrong_gain_cumule_relatif_in_multi) > 0:
                report.generate_msg(
                    f"dans le scenario {list(self.display_enum_traduction('enum_scenario_id', 1).values())[0]} les gains relatifs cumulés en étape finale ({list(wrong_gain_cumule_relatif_in_multi.keys())}) ne sont pas strictement négatifs (non nuls). Or, toute réduction de consommation, d'émissions de GES ou de factures doivent être négatives (tolérance de +{TOLERANCE_GES_ABSOLUE} kgCO2/m2/an pour les émissions de GES).",
                    msg_type='erreur_logiciel',
                    msg_theme='error_wrong_sum_gain',
                    related_objects=list(wrong_gain_cumule_relatif_in_multi.values()),
                    msg_importance='blocker',
                    is_audit=True)


    # Contrôle que le taux d'utilisation de "autre" pour enum_lot_travaux_audit_id, enum_type_travaux_id et enum_travaux_resume_id ne dépasse pas 90% sur l'ensemble des travaux de l'audit
    def controle_coherence_travaux_autre(self, audit, report):
        # Récupérer directement tous les éléments enum_lot_travaux_audit_id et enum_type_travaux_id et enum_travaux_resume_id via XPath
        lot_elements = audit.xpath('//enum_lot_travaux_audit_id')
        type_elements = audit.xpath('//enum_type_travaux_id')
        resume_elements = audit.xpath('//enum_travaux_resume_id')

        # Définir les identifiants correspondant à "autre"
        autre_lot_id = "10"
        autre_type_id = "24"
        autre_resume_id = "11"

        # Filtrer les éléments dont le texte correspond aux IDs "autre"
        autre_lot_elements = [el for el in lot_elements if el.text and el.text.strip() == autre_lot_id]
        autre_type_elements = [el for el in type_elements if el.text and el.text.strip() == autre_type_id]
        autre_resume_elements = [el for el in resume_elements if el.text and el.text.strip() == autre_resume_id]

        # Calcul des taux d'utilisation
        taux_lot = len(autre_lot_elements) / len(lot_elements)
        taux_type = len(autre_type_elements) / len(type_elements)
        taux_resume = len(autre_resume_elements) / len(resume_elements)
        seuil = 0.90  # Seuil de 90%

        # Génération du message d'erreur si le taux dépasse le seuil pour enum_lot_travaux_audit_id
        if taux_lot > seuil:
            report.generate_msg(
                f"Le taux d'utilisation de l'ID 'autre' ({autre_lot_id}) pour 'enum_lot_travaux_audit_id' est de {taux_lot * 100:.1f}% sur l'ensemble des travaux, ce qui dépasse le seuil autorisé de {seuil * 100:.1f}%.",
                msg_type='erreur_saisie',
                msg_theme='error_travaux_autre_rate',
                related_objects=autre_lot_elements,
                msg_importance='blocker',
                is_audit=True
            )

        # Génération du message d'erreur si le taux dépasse le seuil pour enum_type_travaux_id
        if taux_type > seuil:
            report.generate_msg(
                f"Le taux d'utilisation de l'ID 'autre' ({autre_type_id}) pour 'enum_type_travaux_id' est de {taux_type * 100:.1f}% sur l'ensemble des travaux, ce qui dépasse le seuil autorisé de {seuil * 100:.1f}%.",
                msg_type='erreur_saisie',
                msg_theme='error_travaux_autre_rate',
                related_objects=autre_type_elements,
                msg_importance='blocker',
                is_audit=True
            )

        # Génération du message d'erreur si le taux dépasse le seuil pour enum_travaux_resume_id
        if taux_resume > seuil:
            report.generate_msg(
                f"Le taux d'utilisation de l'ID 'autre' ({autre_resume_id}) pour 'enum_travaux_resume_id' est de {taux_resume * 100:.1f}% sur l'ensemble des travaux, ce qui dépasse le seuil autorisé de {seuil * 100:.1f}%.",
                msg_type='erreur_saisie',
                msg_theme='error_travaux_autre_rate',
                related_objects=autre_resume_elements,
                msg_importance='blocker',
                is_audit=True
            )


    # CONTROLES EN LIEN AVEC l'AUDIT COPRO

    # Vérifie la cohérence entre enum_modele_audit_id et les scénarios (enum_scenario_id) :
    # - Si audit copro (id = 3) → scénario « audit copro principal » (enum_scenario_id = 7) requis. Les scénarios « multi étapes principal » (enum_scenario_id = 1) et « en une étape principal » (enum_scenario_id = 2) interdits
    # - Sinon → scénario « audit copro principal » (enum_scenario_id = 7) et scénario « complémentaire 4 - audit copro » (enum_scenario_id = 6) interdits
    def controle_coherence_scenario_audit_copro(self, audit, report):

        enum_modele_audit_id = audit.find('*//enum_modele_audit_id')
        is_audit_copro = enum_modele_audit_id is not None and enum_modele_audit_id.text == '3'

        all_caracteristique_generale = list(audit.iterfind('*//caracteristique_generale'))
        scenario_ids = []
        mapping_scenario_to_related_objects = {}

        for cg in all_caracteristique_generale:
            scenario_element = cg.find('enum_scenario_id')
            scenario_id = scenario_element.text
            scenario_ids.append(scenario_id)

            if scenario_id in mapping_scenario_to_related_objects:
                mapping_scenario_to_related_objects[scenario_id].append(scenario_element)
            else:
                mapping_scenario_to_related_objects[scenario_id] = [scenario_element]

        scenario_ids_set = set(scenario_ids)

        if is_audit_copro:
            # 1. Vérifier la présence du scénario copro (7)
            if '7' not in scenario_ids_set:
                related_objects = [enum_modele_audit_id] + [
                    v for sublist in mapping_scenario_to_related_objects.values() for v in sublist
                ]
                report.generate_msg(
                    f"Pour un audit de type copropriété (avec enum_modele_audit_id à {self.display_enum_traduction('enum_modele_audit_id', 3)}), "
                    f"le scénario 'audit copro principal' (enum_scenario_id = {self.display_enum_traduction('enum_scenario_id', 7)}) doit être présent.",
                    msg_type='erreur_logiciel',
                    msg_theme='error_scenario_copro_missing',
                    related_objects=related_objects,
                    msg_importance='blocker',
                    is_audit=True)

            # 2. Vérifier l'absence des scénarios 1 et 2
            for forbidden_id in ['1', '2']:
                if forbidden_id in scenario_ids_set:
                    related_objects = [enum_modele_audit_id] + mapping_scenario_to_related_objects.get(forbidden_id, [])
                    report.generate_msg(
                        f"Pour un audit de type copropriété (avec enum_modele_audit_id à {self.display_enum_traduction('enum_modele_audit_id', 3)}), "
                        f"le scénario {self.display_enum_traduction('enum_scenario_id', int(forbidden_id))} (enum_scenario_id = {forbidden_id}) ne doit pas être présent.",
                        msg_type='erreur_logiciel',
                        msg_theme='error_scenario_non_copro_forbidden',
                        related_objects=related_objects,
                        msg_importance='blocker',
                        is_audit=True)

        else:
            if '7' in scenario_ids_set:
                related_objects = [enum_modele_audit_id] + mapping_scenario_to_related_objects.get('7', [])
                report.generate_msg(
                    f"Pour un audit qui n'est pas de type copropriété (enum_modele_audit_id différent de {self.display_enum_traduction('enum_modele_audit_id', 3)}), "
                    f"le scénario 'audit copro principal' (enum_scenario_id = {self.display_enum_traduction('enum_scenario_id', 7)}) ne doit pas être présent.",
                    msg_type='erreur_logiciel',
                    msg_theme='error_scenario_copro_forbidden',
                    related_objects=related_objects,
                    msg_importance='blocker',
                    is_audit=True)
            if '6' in scenario_ids_set:
                related_objects = [enum_modele_audit_id] + mapping_scenario_to_related_objects.get('6', [])
                report.generate_msg(
                    f"Pour un audit qui n'est pas de type copropriété (enum_modele_audit_id différent de {self.display_enum_traduction('enum_modele_audit_id', 3)}), "
                    f"le scénario 'audit copro principal' (enum_scenario_id = {self.display_enum_traduction('enum_scenario_id', 6)}) ne doit pas être présent.",
                    msg_type='erreur_logiciel',
                    msg_theme='error_scenario_copro_forbidden',
                    related_objects=related_objects,
                    msg_importance='blocker',
                    is_audit=True)

    # Vérifie la cohérence entre enum_modele_audit_id et les dérogations (enum_derogation_technique_id / enum_derogation_economique_id) :
    # - Si audit copro (id = 3) → la dérogation technique doit être à « non applicable - audit copro » (enum_derogation_technique_id = 3), et la dérogation économique à « non applicable - audit copro » (enum_derogation_economique_id = 4)
    # - Sinon → ces valeurs de dérogation « non applicable - audit copro » (3 et 4) sont interdites
    def controle_coherence_derogation_audit_copro(self, audit, report):
        enum_modele_audit_id = audit.find('*//enum_modele_audit_id')
        enum_derogation_technique_id = audit.find('*//enum_derogation_technique_id')
        enum_derogation_economique_id = audit.find('*//enum_derogation_economique_id')

        modele_id = enum_modele_audit_id.text if enum_modele_audit_id is not None else None
        tech_id = enum_derogation_technique_id.text if enum_derogation_technique_id is not None else None
        eco_id = enum_derogation_economique_id.text if enum_derogation_economique_id is not None else None

        is_audit_copro = modele_id == '3'

        if is_audit_copro:
            if tech_id != '3' and enum_derogation_technique_id is not None:
                report.generate_msg(
                    f"Pour un audit de type copropriété (enum_modele_audit_id = {self.display_enum_traduction('enum_modele_audit_id', 3)}), "
                    f"la dérogation technique doit être 'non applicable' (enum_derogation_technique_id = {self.display_enum_traduction('enum_derogation_technique_id', 3)}).",
                    msg_type='erreur_logiciel',
                    msg_theme='error_derogation_technique_copro',
                    related_objects=[enum_modele_audit_id, enum_derogation_technique_id],
                    msg_importance='blocker',
                    is_audit=True
                )
            if eco_id != '4' and enum_derogation_economique_id is not None:
                report.generate_msg(
                    f"Pour un audit de type copropriété (enum_modele_audit_id = {self.display_enum_traduction('enum_modele_audit_id', 3)}), "
                    f"la dérogation économique doit être 'non applicable' (enum_derogation_economique_id = {self.display_enum_traduction('enum_derogation_economique_id', 4)}).",
                    msg_type='erreur_logiciel',
                    msg_theme='error_derogation_economique_copro',
                    related_objects=[enum_modele_audit_id, enum_derogation_economique_id],
                    msg_importance='blocker',
                    is_audit=True
                )
        else:
            if tech_id == '3' and enum_derogation_technique_id is not None:
                report.generate_msg(
                    f"Le type de dérogation technique 'non applicable - audit copro' (enum_derogation_technique_id = {self.display_enum_traduction('enum_derogation_technique_id', 3)}) "
                    f"ne peut pas être utilisé pour un audit qui n’est pas de type copropriété.",
                    msg_type='erreur_logiciel',
                    msg_theme='error_derogation_technique_non_copro',
                    related_objects=[enum_modele_audit_id, enum_derogation_technique_id],
                    msg_importance='blocker',
                    is_audit=True
                )
            if eco_id == '4' and enum_derogation_economique_id is not None:
                report.generate_msg(
                    f"Le type de dérogation économique 'non applicable - audit copro' (enum_derogation_economique_id = {self.display_enum_traduction('enum_derogation_economique_id', 4)}) "
                    f"ne peut pas être utilisé pour un audit qui n’est pas de type copropriété.",
                    msg_type='erreur_logiciel',
                    msg_theme='error_derogation_economique_non_copro',
                    related_objects=[enum_modele_audit_id, enum_derogation_economique_id],
                    msg_importance='blocker',
                    is_audit=True
                )


EngineAudit()  # init the engine singleton


class CoreReport():
    def __init__(self):
        self.xsd_validation = dict()
        self.warning_software = list()
        self.warning_input = list()
        self.error_software = list()
        self.error_input = list()
        self.notification = list()
        self.report = {'validation_xsd': self.xsd_validation,
                       "warning_logiciel": self.warning_software,
                       "warning_saisie": self.warning_input,
                       'erreur_logiciel': self.error_software,
                       "erreur_saisie": self.error_input,
                       "notification": self.notification,
                       "message_principal": '',
                       }

    def generate_msg(self, msg, msg_type, msg_theme, related_objects, msg_importance, is_audit=False):

        related_objects = [el for el in related_objects if el is not None]

        for obj in related_objects:

            if not isinstance(obj, etree._Element):
                raise TypeError(f'object : {obj} of type {type(obj)} is not an etree._Element object. for msg :{msg}')

        if msg_theme not in msg_themes:
            raise KeyError(f'{msg_theme} bad message theme')
        if is_audit:
            self.report[msg_type].insert(0, {"message": msg,
                                             "thematique": msg_theme,
                                             "objets_concerne": related_objects,
                                             'importance': msg_importance
                                             })
        else:
            self.report[msg_type].append({"message": msg,
                                          "thematique": msg_theme,
                                          "objets_concerne": related_objects,
                                          'importance': msg_importance
                                          })

    def generate_report(self, xml_reg, engine):
        msg_importance_for_report = copy.deepcopy(msg_importance)
        msg_importance_for_report = self.manage_blocker_as_warning(xml_reg, engine, msg_importance_for_report)
        self.enrich_issues_message_and_meta_data(xml_reg, msg_importance_for_report, engine)
        if len(self.report['erreur_saisie']) + len(self.report['erreur_logiciel']) > 0:
            self.report[
                'message_principal'] += f" IL EXISTE DES ERREURS BLOQUANTES EMPECHANT LA SOUMISSION {engine.DENOMINATION_OBJET_XML_REG} A L'OBSERVATOIRE."
        return self.report

    def manage_blocker_as_warning(self, xml_reg, engine, msg_importance_for_report):
        # PROCEDURE TEMPORAIRE DE PASSAGE DES CONTROLES DE COHERENCE EN WARNING
        el_version = engine.get_enum_version(xml_reg)
        version_id_str = el_version.text
        TEXT_ERROR_AS_WARNING = "CET AVERTISSEMENT SERA CONSIDERE COMME UNE ERREUR DANS LA PROCHAINE VERSION:\n "

        if version_id_str in engine.VERSION_ANTERIEUR:
            erreur_logiciel = self.report['erreur_logiciel']
            erreur_logiciel_as_warning = list()
            erreur_logiciel_as_error = list()
            for issue in erreur_logiciel:
                if issue['importance'] == 'blocker_as_warning':
                    issue['message'] = TEXT_ERROR_AS_WARNING + issue['message']
                    erreur_logiciel_as_warning.append(issue)
                else:
                    erreur_logiciel_as_error.append(issue)
            self.report['erreur_logiciel'] = erreur_logiciel_as_error
            self.report['warning_logiciel'] += erreur_logiciel_as_warning

            erreur_saisie = self.report['erreur_saisie']
            erreur_saisie_as_warning = list()
            erreur_saisie_as_error = list()
            for issue in erreur_saisie:
                if issue['importance'] == 'blocker_as_warning':
                    issue['message'] = TEXT_ERROR_AS_WARNING + issue['message']
                    erreur_saisie_as_warning.append(issue)
                else:
                    erreur_saisie_as_error.append(issue)
            self.report['erreur_saisie'] = erreur_saisie_as_error
            self.report['warning_saisie'] += erreur_saisie_as_warning
        else:
            # pour les versions > DPE_VERSION_ANTERIEUR les bloquants warning sont bloquants.
            msg_importance_for_report["blocker_as_warning"] = msg_importance_for_report["blocker"]
        return msg_importance_for_report

    def enrich_issues_message_and_meta_data(self, xml_reg, msg_importance_for_report, engine):

        for k, v in self.report.items():

            if k not in ['validation_xsd', 'message_principal']:
                for issue in v:
                    descriptions = [self.get_object_description(el) for el in issue['objets_concerne'] if el is not None]
                    descriptions = set([el for el in descriptions if el is not None])
                    if len(descriptions) > 0:
                        issue['message'] += "\nobjets concernés : \n" + '\n'.join(descriptions)
                    references = [self.get_object_reference(el) for el in issue['objets_concerne'] if el is not None]
                    references = set([el for el in references if el is not None])
                    if len(references) > 0:
                        issue['message'] += "\nréférence des objets concernés : \n" + '\n'.join(references)
                    etape_scenario = [self.get_etape_and_scenario(el, engine) for el in issue['objets_concerne'] if el is not None]
                    etape_scenario = set([el for el in etape_scenario if el is not None])
                    if len(etape_scenario) > 0:
                        issue['message'] += "\netapes et scénarios concernés : \n" + '\n'.join(etape_scenario)
                    issue['thematique'] = msg_themes[issue['thematique']]
                    issue['importance'] = msg_importance_for_report[issue['importance']]
                    issue['objets_concerne'] = [xml_reg.getpath(el) for el in issue['objets_concerne'] if
                                                el is not None]

    @staticmethod
    def get_etape_and_scenario(object, engine):
        parent = object.getparent()
        while parent is not None:
            if parent.tag == "logement":
                break
            else:
                parent = parent.getparent()
        if parent is not None:
            enum_scenario_id = parent.find('*//enum_scenario_id')
            if enum_scenario_id is not None:
                scenario = str(engine.display_enum_traduction(enum_scenario_id.tag, int(enum_scenario_id.text))[
                                   int(enum_scenario_id.text)])
                enum_etape_id = parent.find('*//enum_etape_id')
                etape = str(
                    engine.display_enum_traduction(enum_etape_id.tag, int(enum_etape_id.text))[int(enum_etape_id.text)])
                scenario_etape = f'scenario_id : {scenario}\netape_id: {etape}'
                nom_scenario = parent.find('*//nom_scenario')
                if nom_scenario is not None:
                    scenario_etape = f'nom_scenario : {nom_scenario.text}\n' + scenario_etape
                return scenario_etape

        return None

    @staticmethod
    def get_object_description(object):
        if object is not None:
            parent = object.getparent()
            if parent is not None:
                description = parent.find('description')
                if description is None:
                    parent = parent.getparent()
                    if parent is not None:
                        description = parent.find('description')
            else:
                description = None
        else:
            description = None
        if description is not None:
            description = description.text
        return description

    @staticmethod
    def get_object_reference(object):
        if object is not None:
            parent = object.getparent()
            if parent is not None:
                reference = parent.find('reference')
                if reference is None:
                    parent = parent.getparent()
                    if parent is not None:
                        reference = parent.find('reference')
            else:
                reference = None
        else:
            reference = None
        if reference is not None:
            reference = reference.text
        return reference


class ReportDPE(CoreReport):
    pass


class ReportAudit(CoreReport):
    pass
