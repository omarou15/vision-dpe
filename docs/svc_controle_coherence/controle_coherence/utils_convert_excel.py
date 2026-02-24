import uuid

import pandas as pd
from lxml import etree
import lxml
from pathlib import Path
from datetime import datetime
import copy
import logging

from controle_coherence.utils import element_to_value_dict, traduction_xml_new_element
from controle_coherence.controle_coherence import EngineDPE,EngineAudit


def dump_dataframe_to_excel(df, currow, max_col, current_config, transform=False):
    sheet_name = current_config['sheet_name']
    writer = current_config['writer']
    header_format = current_config['header_format']

    if transform is False:
        df.to_excel(excel_writer=writer, startcol=0, startrow=currow, sheet_name=sheet_name)
    else:
        df = df.T
        df.to_excel(excel_writer=writer, startcol=0, startrow=currow, sheet_name=sheet_name)

    if header_format:
        worksheet = writer.sheets[sheet_name]
        # Write the column headers with the defined format.
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(currow, col_num + 1, value, header_format)
    currow += df.shape[0] + 2
    max_col = max(max_col, df.shape[1])
    return currow, max_col


def reorder_dataframe(df, ordered_names):
    ordered_elements = pd.unique([el for el in ordered_names if el in df.index]).tolist()
    missing = [el for el in df.index if el not in ordered_elements]
    df = df.reindex(missing + ordered_elements)
    return df


def convert_element_to_dataframe(el, ordered_names):
    if el.find('donnee_entree') is not None:
        el_dict = element_to_value_dict(el.find('donnee_entree'))
        if el.find('donnee_intermediaire') is not None:
            for k, v in element_to_value_dict(el.find('donnee_intermediaire')).items():
                el_dict[k] = v
    else:
        el_dict = element_to_value_dict(el)
    df = pd.Series(el_dict, dtype='str').to_frame(el.tag)
    df = reorder_dataframe(df, ordered_names)
    return df


def dump_collection_to_excel(name, root, currow, max_col, current_config, dump_empty=True, transform=False, title=False):
    all_df = list()
    ordered_names = current_config['ordered_names']
    # components
    for el in list(root.iterfind(f'*//{name}')) + list(root.iterfind(f'{name}')):
        df_iter = convert_element_to_dataframe(el, ordered_names)
        if not df_iter.empty:
            all_df.append(df_iter)
    if len(all_df) > 0:

        df = pd.concat(all_df, axis=1)
        df = reorder_dataframe(df, ordered_names)
        df.columns = [f'{name}_{i}' for i in range(len(df.columns))]
        if title is True:
            df_title = pd.DataFrame(columns=[name])
            currow, max_col = dump_dataframe_to_excel(df_title, currow, max_col, current_config)
        currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config, transform=transform)
    else:
        if dump_empty:
            df = pd.DataFrame(columns=[name])
            currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config)
    return currow, max_col


def simple_element_to_excel(name, root, currow, max_col, current_config, dump_empty=True):
    el = root.find(f'*//{name}')
    if el is None:
        el = root.find(f'{name}')
    ordered_names = current_config['ordered_names']
    if el is not None:
        df = convert_element_to_dataframe(el, ordered_names)

        currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config)
    else:
        if dump_empty:
            df = pd.DataFrame(columns=[name])
            currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config)

    return currow, max_col


def reformat_sheet(current_config, max_col):
    sheet_name = current_config['sheet_name']
    index_format = current_config['index_format']
    content_format = current_config['content_format']
    writer = current_config['writer']
    if sheet_name in writer.sheets:
        worksheet = writer.sheets[sheet_name]
        worksheet.set_column(0, 0, 46, index_format)
        worksheet.set_column(1, max_col + 1, 30, content_format)


def traduction_xml_excel(xml,excel_folder):
    excel_folder = Path(excel_folder)
    if excel_folder.is_dir() is False:
        excel_folder.mkdir(exist_ok=True,parents=True)

    is_audit = xml.getroot().tag == 'audit'
    if is_audit:
        engine = EngineAudit()
    else:
        engine = EngineDPE()

    file_name = str(uuid.uuid4()) + '.xlsx'
    file_path = excel_folder/file_name
    xml_traduit = traduction_xml_new_element(xml, engine)

    if file_path.is_file():
        file_path.unlink()
    try:
        writer = pd.ExcelWriter(file_path,
                                engine='xlsxwriter')
        workbook = writer.book

        index_format = workbook.add_format({
            'bold': True,
            'text_wrap': True,
            'valign': 'center',
            'align': 'left',
            'border': 1})

        content_format = workbook.add_format({
            'bold': False,
            'text_wrap': True,
            'valign': 'center',
            'align': 'left',
            'num_format':'0,000',
            'border': 1})

        # Add a header format.
        header_format = workbook.add_format({
            'bold': True,
            'text_wrap': True,
            'valign': 'center',
            'align': 'left',
            'fg_color': '#D7E4BC',
            'border': 1})
        current_config = dict()
        current_config['writer'] = writer
        current_config['header_format'] = header_format
        current_config['content_format'] = content_format
        current_config['index_format'] = index_format
        # INIT DOC

        root_xml_complet = list(engine.xsd_dict.values())[-1]

        namespaces = {'xs': 'http://www.w3.org/2001/XMLSchema',
                      'obsdpe': "https://gitlab.com/observatoire-dpe/observatoire-dpe/-/tree/master/modele_donnee"}

        ordered_names = [el.attrib.get('name', el.attrib.get('ref')) for el in list(root_xml_complet.iterfind('*//xs:element', namespaces=namespaces))]
        current_config['ordered_names'] = ordered_names
        doc = {el.attrib.get('name', el.attrib.get('ref')): el for el in list(root_xml_complet.iterfind('*//xs:element', namespaces=namespaces))}

        for k, v in doc.items():
            if v.find('xs:annotation/xs:documentation', namespaces=namespaces) is not None:
                doc[k] = v.find('xs:annotation/xs:documentation', namespaces=namespaces).text
            else:
                doc[k] = None

        doc = {k: v for k, v in doc.items() if v is not None}

        doc = dict([(k.replace('enum_', '').replace('_id', ''), v) if 'enum_' in k else (k, v) for k, v in doc.items()])

        ordered_names = [el.replace('enum_', '').replace('_id', '') if 'enum_' in el else el for el in ordered_names]
        doc = pd.Series(doc).to_frame('lexique')

        # ADMINISTRATIF

        current_config['sheet_name'] = 'administratif'
        max_col = 0
        currow = 0

        el = xml_traduit.find('administratif')

        df = convert_element_to_dataframe(el, ordered_names)
        currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config)

        # sub administratif
        for name in ['auditeur', 'diagnostiqueur', 'bet_entreprise', 'architecte', 'geolocalisation','information_consentement_proprietaire','information_formulaire_consentement']:
            currow, max_col = simple_element_to_excel(name, xml_traduit, currow, max_col, current_config, dump_empty=False)

        # adresses
        all_df = list()
        # adresses
        for el in xml_traduit.iterfind('*//adresses/*'):
            df_iter = convert_element_to_dataframe(el, ordered_names)
            all_df.append(df_iter)

        df = pd.concat(all_df, axis=1)
        df = df.reindex(df_iter.index)
        currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config)

        reformat_sheet(current_config, max_col)


        # LOGEMENT

        if is_audit:
            # Get the audit logement_collection
            get_scenario_id = {lib: id for id, lib in engine.enum_dict['enum_scenario_id'].items()}
            get_etape_id = {lib: id for id, lib in engine.enum_dict['enum_etape_id'].items()}
            def _get_logement_audit_name(logement):
                scenario_id = get_scenario_id[logement.find('caracteristique_generale').find('scenario').text]
                etape_id = get_etape_id[logement.find('caracteristique_generale').find('etape').text]
                logement_name = f"scenario_{scenario_id}_etape_{etape_id}"
                return logement_name
            logement_name_logement_mapping = {_get_logement_audit_name(el):el for el in xml.iterfind('*//logement')}
        else:
            # Get the DPE logement
            logement_name_logement_mapping = {el_name:xml_traduit.find(el_name) for el_name in ['logement', 'logement_neuf']}
        for logement_name,logement in logement_name_logement_mapping.items():
            current_config['sheet_name'] = logement_name
            max_col = 0
            currow = 0

            if logement is not None:

                for name in ['caracteristique_generale', 'meteo', 'inertie']:
                    currow, max_col = simple_element_to_excel(name, logement, currow, max_col, current_config, dump_empty=True)

                for name in ['mur', 'plancher_bas', 'plancher_haut', 'baie_vitree', 'porte', 'pont_thermique', 'ventilation', 'climatisation', 'production_elec_enr', 'panneaux_pv']:
                    currow, max_col = dump_collection_to_excel(name, logement, currow, max_col, current_config, dump_empty=True)

                name = 'installation_ecs'

                all_df = list()
                # components
                for i, el in enumerate(logement.iterfind(f'.//{name}')):
                    df_iter = convert_element_to_dataframe(el, ordered_names)
                    df_iter.columns = [f'{name}_{i}']
                    currow, max_col = dump_dataframe_to_excel(df_iter, currow, max_col, current_config)

                    currow, max_col = dump_collection_to_excel('generateur_ecs', el, currow, max_col, current_config, dump_empty=True)

                    all_df.append(df_iter)
                if len(all_df) == 0:
                    df = pd.DataFrame(columns=[name])
                    currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config)

                name = 'installation_chauffage'

                all_df = list()
                # components
                for i, el in enumerate(logement.iterfind(f'.//{name}')):
                    df_iter = convert_element_to_dataframe(el, ordered_names)
                    df_iter.columns = [f'{name}_{i}']
                    currow, max_col = dump_dataframe_to_excel(df_iter, currow, max_col, current_config)

                    currow, max_col = dump_collection_to_excel('generateur_chauffage', el, currow, max_col, current_config, dump_empty=True)
                    currow, max_col = dump_collection_to_excel('emetteur_chauffage', el, currow, max_col, current_config, dump_empty=True)

                    all_df.append(df_iter)
                if len(all_df) == 0:
                    df = pd.DataFrame(columns=[name])
                    currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config)

                reformat_sheet(current_config, max_col)

                current_config['sheet_name'] = logement_name + '_sortie'
                max_col = 0
                currow = 0
                for name in ['deperdition', 'apport_et_besoin', 'ef_conso', 'ep_conso', 'emission_ges', 'cout', 'production_electricite', 'confort_ete', 'qualite_isolation']:
                    currow, max_col = simple_element_to_excel(name, logement, currow, max_col, current_config, dump_empty=True)

                for name in ['sortie_par_energie']:
                    currow, max_col = dump_collection_to_excel(name, logement, currow, max_col, current_config, dump_empty=True)

                if logement.find('etape_travaux') is not None:
                    for name in ['etape_travaux']:
                            currow, max_col = simple_element_to_excel(name, logement, currow, max_col, current_config, dump_empty=True)
                    for name in ['travaux','travaux_induits','travaux_resume']:
                        currow, max_col = dump_collection_to_excel(name, logement, currow, max_col, current_config, dump_empty=True, transform=True, title=True)
                reformat_sheet(current_config, max_col)

        # DPE TERTIAIRE
        tertiaire = xml_traduit.find('tertiaire')
        if tertiaire is not None:
            current_config['sheet_name'] = 'tertiaire'
            max_col = 0
            currow = 0

            currow, max_col = simple_element_to_excel('caracteristique_generale', tertiaire, currow, max_col, current_config, dump_empty=True)
            currow, max_col = simple_element_to_excel('bilan_consommation', tertiaire, currow, max_col, current_config, dump_empty=True)
            currow, max_col = dump_collection_to_excel('consommation', tertiaire, currow, max_col, current_config, dump_empty=True)
            reformat_sheet(current_config, max_col)

        # DPE IMMEUBLE
        current_config['sheet_name'] = 'dpe_immeuble'
        max_col = 0
        currow = 0
        for name in ['logement_visite']:
            currow, max_col = dump_collection_to_excel(name, xml_traduit, currow, max_col, current_config, dump_empty=False, transform=True, title=True)

        reformat_sheet(current_config, max_col)

        # RAPPORT
        current_config['sheet_name'] = 'rapport'
        max_col = 0
        currow = 0

        for el in xml_traduit.iterfind('*//sous_fiche_technique'):
            parent = el.getparent().getparent()
            categorie_fiche_technique = etree.Element('categorie_fiche_technique')
            categorie_fiche_technique.text = parent.find('categorie_fiche_technique').text
            el.insert(0, categorie_fiche_technique)

        if is_audit:
            # Rapport Audit
            for name in ['description_du_bien', 'descriptif_enveloppe', 'descriptif_equipements']:
                currow, max_col = dump_collection_to_excel(name, xml_traduit, currow, max_col, current_config, dump_empty=True, transform=True, title=True)

            for name in ['expertise_auditeur']:
                currow, max_col = simple_element_to_excel(name, xml_traduit, currow, max_col, current_config, dump_empty=True)
            for name in ['pathologie_caracteristique', 'recommandation_scenario', 'sous_fiche_technique']:
                currow, max_col = dump_collection_to_excel(name, xml_traduit, currow, max_col, current_config, dump_empty=True, transform=True, title=True)

        else:
            # Rapport DPE
            for name in ['descriptif_enr', 'descriptif_simplifie', 'sous_fiche_technique', 'justificatif', 'descriptif_geste_entretien']:
                currow, max_col = dump_collection_to_excel(name, xml_traduit, currow, max_col, current_config, dump_empty=True, transform=True, title=True)

            currow, max_col = simple_element_to_excel('descriptif_travaux', xml_traduit, currow, max_col, current_config, dump_empty=True)

            name = 'pack_travaux'

            all_df = list()
            # components
            for i, el in enumerate(xml_traduit.iterfind(f'*//{name}')):
                df_iter = convert_element_to_dataframe(el, ordered_names)
                df_iter.columns = [f'{name}_{i}']
                currow, max_col = dump_dataframe_to_excel(df_iter, currow, max_col, current_config)

                currow, max_col = dump_collection_to_excel('travaux', el, currow, max_col, current_config, dump_empty=True, transform=True, title=True)

                all_df.append(df_iter)
            if len(all_df) == 0:
                df = pd.DataFrame(columns=[name])
                currow, max_col = dump_dataframe_to_excel(df, currow, max_col, current_config)

        reformat_sheet(current_config, max_col)

        # LEXIQUE
        current_config['sheet_name'] = 'lexique'
        max_col = 0
        currow = 0
        doc = doc.sort_index()
        dump_dataframe_to_excel(doc, currow, max_col, current_config)

        reformat_sheet(current_config, max_col)

        # SAVING FILE
        writer.close()
        return file_path
    except Exception as e:
        try:
            writer.close()
        except:
            pass
        if Path(file_path).is_file():
            Path(file_path).unlink()
        raise e


def cleanup_excel_folder(excel_folder,delat_t_delete=3600,logger=None):
    if logger is None:
        logger = logging

    now_tstamp = datetime.now().timestamp()
    date_min = now_tstamp-delat_t_delete
    files_to_del = [el for el in excel_folder.iterdir() if el.stat().st_ctime<date_min]
    for file in files_to_del:

        try:
            file.unlink()
        except Exception as e:
            logger.error(f'impossible de supprimer le fichier {file} , raison : {e.args[0]}')
