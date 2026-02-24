import pandas as pd
import pytest
import re
from lxml import etree
import copy
from datetime import timedelta, datetime
import os
import json
import inspect
import ast
import textwrap
from controle_coherence.assets_audit import versions_audit_cfg
from controle_coherence.utils import convert_xml_text, remove_sub_el, create_sub_el, remove_null_elements, _restore_version_audit_cfg, _restore_version_dpe_cfg
from controle_coherence.controle_coherence import EngineDPE, EngineAudit
from controle_coherence.utils import element_to_value_dict, set_xml_values_from_dict, _set_version_audit_to_valid_dates, _set_version_dpe_to_valid_dates
from controle_coherence.assets_dpe import expected_components, versions_dpe_cfg, get_datetime_now
from controle_coherence.controle_coherence import ReportDPE, ReportAudit

DATE_TEST_POST_DPE_latest = '2026-01-01'
DATE_TEST_PRE_DPE_24 = '2024-05-03'
DATE_TEST_PRE_DPE_26 = '2025-12-31'

VALID_CASES_DPE = ['cas_test_appt_2_neuf_light_valid.xml', 'cas_test_appt_2_neuf_valid.xml',
                   'cas_test_immeuble_1_valid.xml',
                   'cas_test_maison_1_valid.xml',
                   'cas_test_maison_1_valid_thermodynamique.xml',
                   "cas_test_maison_1_non_proprietaire_valid.xml",
                   'cas_test_appartement_a_partir_immeuble_petite_surface_valid.xml',
                   'cas_test_maison_1_valid_petite_surface.xml',
                   'cas_test_maison_1_valid_thermodynamique_multi_generateur.xml',
                   'cas_test_edl_petite_surface.xml',
                   "cas_test_appartement_1_valid.xml",
                   'cas_test_immeuble_1_valid_double_fenetre.xml',
                   "cas_test_immeuble_1_valid_sans_consentement.xml",
                   # 'cas_test_immeuble_1_valid_v2.2.xml',
                   # 'cas_anomalie_veilleusev2.2.xml',
                   # "cas_test_immeuble_1_valid_reseau_chaleurv2.2.xml",
                   'cas_test_immeuble_1_valid_tout_chaudiere.xml',
                   'cas_test_immeuble_1_valid_avec_reference.xml',
                   'cas_test_tertiaire_1_vierge_valid.xml',
                   'cas_test_tertiaire_1_avec_sous_modele_valid.xml',
                   'cas_test_immeuble_1_valid_reseau_chaleur.xml',
                   'cas_test_immeuble_1_valid_ss_masque_solaire.xml', 'cas_test_tertiaire_1_neuf_valid.xml',
                   'cas_test_appartement_a_partir_immeuble_valid.xml']
# cas test ADEME
VALID_CASES_DPE += [
    '2393E0000360N.xml',
    "DPE tertiaire facture autre qu'habitation.xml",
    'DPE tertiaire facture habitation.xml',
    "DPE tertiaire neuf autre qu'habitation.xml",
    'DPE tertiaire neuf habitation.xml',
    "DPE tertiaire facture autre qu'habitation_sans_sous_modele.xml",
    'DPE tertiaire facture habitation_sans_sous_modele.xml',
    "DPE tertiaire neuf autre qu'habitation_sans_sous_modele.xml",
    'DPE tertiaire neuf habitation_sans_sous_modele.xml',
]

# cas test ADEME
VALID_CASES_DPE_ademe = [
    '2393E0000360N.xml',
    "DPE tertiaire facture autre qu'habitation.xml",
    'DPE tertiaire facture habitation.xml',
    "DPE tertiaire neuf autre qu'habitation.xml",
    'DPE tertiaire neuf habitation.xml',
    "DPE tertiaire facture autre qu'habitation_sans_sous_modele.xml",
    'DPE tertiaire facture habitation_sans_sous_modele.xml',
    "DPE tertiaire neuf autre qu'habitation_sans_sous_modele.xml",
    'DPE tertiaire neuf habitation_sans_sous_modele.xml',
]

VALID_CASES_DPE_ONLY_24 = ['cas_test_maison_1_valid_petite_surface.xml', 'cas_test_appartement_a_partir_immeuble_petite_surface_valid.xml', 'cas_test_edl_petite_surface.xml']

VALID_CASES_DPE_N_MOINS_1 = ['cas_test_immeuble_1_valid_2.5.xml','cas_test_appartement_1_valid_2.5.xml', 'cas_test_maison_1_valid_2.5.xml', 'cas_test_tertiaire_1_avec_sous_modele_valid_2.5.xml']

VALID_CASES_AUDIT = [
    # 'cas_test_audit_maison_1_v2.0_valid.xml',
    #  'cas_test_audit_immeuble_v2.0_valid.xml',
    #  'cas_test_audit_immeuble_v2.1_valid.xml',
    #  'cas_test_audit_immeuble_v2.2_valid.xml',
    'cas_test_audit_copro_latest_valid.xml',
    'cas_test_audit_immeuble_latest_valid.xml',

    # 'cas_test_audit_maison_1_v2.1_valid.xml',
    # 'cas_test_audit_maison_1_v2.2_valid.xml',
    'cas_test_audit_maison_1_latest_valid.xml',

    # 'DPE_Audit_EDL_v2.1_valid.xml'
]
VALID_CASES_AUDIT_N_MOINS_1=[

    'cas_test_audit_immeuble_v2.4_valid.xml',
    'cas_test_audit_maison_1_v2.4_valid.xml',
    'cas_test_audit_copro_v2.4_valid.xml',

]

# Cas tests Audit basés sur le DPE 2.3. Pour tester le passage du 1er Juillet 2024 au DPE 2.4 petites surfaces
CASES_AUDIT_DPE_2_3 = [
    'cas_test_audit_immeuble_v2.1_valid.xml',
    'cas_test_audit_immeuble_v2.2_valid.xml',
    'cas_test_audit_maison_1_v2.1_valid.xml',
    'cas_test_audit_maison_1_v2.2_valid.xml']

CRASH_CASES_EDL_AUDIT = ['23-04-814_envoie-ademe-AUDIT.XML', 'DPE1.1.xml', 'DPE2.2.xml', 'DPE_Audit.xml', 'DPE_Audit 1.xml', 'DPE.xml', 'V1.0-AUDIT.XML', 'DPE_Audit - error derogation ventil.xml']

CRASH_CASES_AUDIT = ['cas_test_audit_maison_1_v2.0_super_invalid.xml', 'DPE_Audit_max_None_no_etape_travaux.xml', 'DPE_Audit_max_None.xml']

CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST = int(os.getenv('CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST', 0))

print('CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST', CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST)


# TODO : _make_all_version_valid
# TODO : test date invalid.


def test_valid_dates_and_versions():
    # A UPDATE à chaque patch
    engine = EngineDPE()
    assert ((set(['1.0', '1.1', '2', "2.1", "2.2"]) & set(engine.get_current_valid_versions(get_datetime_now(None)))) == set())
    engine = EngineAudit()
    assert ((set([]) & set(engine.get_current_valid_versions(get_datetime_now(None)))) == set())


def test_date_valid():
    for k, v in versions_dpe_cfg.items():
        datetime.fromisoformat(v['start_date'])
        datetime.fromisoformat(v['end_date'])
        datetime.fromisoformat(v['end_date_compare_now'])
        if 'end_date_edit' in v:
            datetime.fromisoformat(v['end_date_edit'])

VALID_CASES_DPE
@pytest.mark.parametrize("valid_example", VALID_CASES_DPE + VALID_CASES_DPE_N_MOINS_1)
def test_run_controle_coherence_dpe(valid_example):
    try:
        _set_version_dpe_to_valid_dates()
        engine = EngineDPE()
        parser = etree.XMLParser(remove_blank_text=True)
        f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
        dpe = etree.parse(f, parser)

        remove_null_elements(dpe)

        engine.run_controle_coherence(dpe)
        # f = str((engine.mdd_path / 'exemples_defaut' / 'DPE_logement.xml'))
        # dpe = etree.parse(f, parser)
        engine.run_controle_coherence(dpe)
        el = dpe.find('*//nom_proprietaire_installation_commune')
        el.getparent().remove(el)
        dpe = etree.parse(f, parser)
        engine.run_controle_coherence(dpe)

        # vérification v2
        f = str((engine.mdd_path / 'exemples_metier' / valid_example))
        dpe = etree.parse(f, parser)

        remove_null_elements(dpe)

        report = engine.run_controle_coherence(dpe)
        nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        assert (report['validation_xsd']['valid'] == True)
        assert (nb_errors == 0)

        # vérification rétrocompatibilité
        get_previous_version = { '2.4': '2.4', '2.5': '2.4', '2.6': '2.6'}
        f = str((engine.mdd_path / 'exemples_metier' / valid_example))
        dpe = etree.parse(f, parser)

        remove_null_elements(dpe)


        dpe.find('*//enum_version_id').text=get_previous_version.get(dpe.find('*//enum_version_id').text,dpe.find('*//enum_version_id').text)
        report = engine.run_controle_coherence(dpe)
        nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        assert (report['validation_xsd']['valid'] == True)
        assert (nb_errors == 0)

        # # quand on essaye sur la version précédente cela ne fonctionne pas à cause de changements de modèles entre 2.4 et 2.5
        # if valid_example in VALID_CASES_DPE_N_MOINS_1:
        #     dpe.find('*//enum_version_id').text = '2.5'
        #     report = engine.run_controle_coherence(dpe)
        #     nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        #     assert (report['validation_xsd']['valid'] == False)
        #     # assert (nb_errors == 0)

        # # test rétrocompatibilité 2.2 (OBSOLETE)
        # f = str((engine.mdd_path / 'exemples_metier' / valid_example))
        # dpe = etree.parse(f, parser)
        # dpe.find('*//enum_version_id').text='2.2'
        # report = engine.run_controle_coherence(dpe)
        # nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        # assert (report['validation_xsd']['valid'] == True)
        # assert (nb_errors == 0)

        # test retrocompatibilité numero_fiscal_local (OBSOLETE)

        # f = str((engine.mdd_path / 'exemples_metier' / valid_example))
        # dpe = etree.parse(f, parser)
        # if dpe.find('*//numero_fiscal_local') is not None:
        #     dpe.find('*//numero_fiscal_local').text = '2A01234567'
        # report = engine.run_controle_coherence(dpe)
        # nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        # assert (report['validation_xsd']['valid'] == True)
        # assert (nb_errors == 0)

        # # vérification rétrocompatibilité v1 : ON NE GERE PLUS LA RETROCOMPATIBILITE V1
        # dpe = etree.parse(f, parser)
        # dpe.find('*//enum_version_id').text = '1'
        # report=engine.run_controle_coherence(dpe)
        # nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        # assert (report['validation_xsd']['valid'] == True)
        # assert (nb_errors == 0)
    except AssertionError as e:
        if len(report['validation_xsd']['error_log']) > 0:
            print(report['validation_xsd']['error_log'][0])
        print(f'nombre d erreurs : {nb_errors}')
        for err in report['erreur_logiciel'] + report['erreur_saisie']:
            print("=================== ERROR =========================")
            print(err['thematique'])
            print(err['message'])
            print(err['objets_concerne'])
        print(f)
        raise e


@pytest.mark.parametrize("valid_example", [el for el in VALID_CASES_DPE if el not in VALID_CASES_DPE_ONLY_24])
def test_run_controle_coherence_dpe_n_moins_1(valid_example):
    try:
        engine = EngineDPE()
        parser = etree.XMLParser(remove_blank_text=True)
        os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_PRE_DPE_26

        # vérification v2
        f = str((engine.mdd_path / 'exemples_metier' / valid_example))
        dpe = etree.parse(f, parser)
        dpe.find('.//enum_version_id').text = '2.5'
        report = engine.run_controle_coherence(dpe)
        nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        assert (report['validation_xsd']['valid'] == True)
        assert (nb_errors == 0)
    except AssertionError as e:
        if len(report['validation_xsd']['error_log']) > 0:
            print(report['validation_xsd']['error_log'][0])
        print(f'nombre d erreurs : {nb_errors}')
        for err in report['erreur_logiciel'] + report['erreur_saisie']:
            print("=================== ERROR =========================")
            print(err['thematique'])
            print(err['message'])
            print(err['objets_concerne'])
        print(f)
        raise e


def test_controle_coherence_date():
    if os.getenv('OBS_DPE_DATETIME_NOW') is not None:
        del os.environ['OBS_DPE_DATETIME_NOW']
    _set_version_dpe_to_valid_dates()
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1_v1.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('*//enum_version_id').text = "1"
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    print(report['erreur_logiciel'])
    print(versions_dpe_cfg)
    assert (len(report['erreur_logiciel']) == 0)

    for k, v in versions_dpe_cfg.items():
        v['start_date'] = '2199-01-01'
        v['end_date'] = '2200-01-01'

    dpe = etree.parse(f, parser)
    dpe.find('*//enum_version_id').text = "1"
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    assert (len(report['erreur_logiciel']) == 1)

    for k, v in versions_dpe_cfg.items():
        v['start_date'] = '1999-01-01'
        v['end_date'] = '2000-01-01'

    dpe = etree.parse(f, parser)
    dpe.find('*//enum_version_id').text = "1"
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    assert (len(report['erreur_logiciel']) == 1)

    for k, v in versions_dpe_cfg.items():
        v['start_date'] = '1999-01-01'
        v['end_date'] = '2021-07-30'
    dpe = etree.parse(f, parser)
    dpe.find('*//enum_version_id').text = "1"
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)

    assert (len(report['erreur_logiciel']) == 0)

    for k, v in versions_dpe_cfg.items():
        v['start_date'] = str(datetime.date(datetime.now() - timedelta(days=1)))
        v['end_date'] = '2200-01-01'
    dpe = etree.parse(f, parser)
    dpe.find('*//enum_version_id').text = "1"
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    assert (len(report['erreur_logiciel']) == 0)

    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    assert (len(report['erreur_logiciel']) == 0)

    for k, v in versions_dpe_cfg.items():
        v['start_date'] = str(datetime.date(datetime.now() - timedelta(days=1)))
        v['end_date'] = '2200-01-01'
        v['end_date_compare_now'] = str(datetime.date(datetime.now() - timedelta(days=1)))
    dpe = etree.parse(f, parser)
    dpe.find('*//enum_version_id').text = "1"
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    assert (len(report['erreur_logiciel']) == 1)

    future = (datetime.now() + timedelta(1)).date().strftime('%Y-%m-%d')
    dpe.find('*//date_etablissement_dpe').text = future
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    assert (len(report['erreur_saisie']) == 1)


def test_controle_coherence_dates_audit():
    _set_version_audit_to_valid_dates()
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_immeuble_v2.0_valid.xml'))
    audit = etree.parse(f, parser)
    audit.find('*//enum_version_audit_id').text = "1.1"
    report = ReportAudit()
    engine.validation_version_and_dates(audit, report, now=get_datetime_now(None))
    report = report.generate_report(audit, engine)
    print(report['erreur_logiciel'])
    print(versions_audit_cfg)
    assert (len(report['erreur_logiciel']) == 0)

    for k, v in versions_audit_cfg.items():
        v['start_date'] = '2199-01-01'
        v['end_date'] = '2200-01-01'

    audit = etree.parse(f, parser)
    audit.find('*//enum_version_audit_id').text = "1.1"
    report = ReportAudit()
    engine.validation_version_and_dates(audit, report, now=get_datetime_now(None))
    report = report.generate_report(audit, engine)
    print(report['erreur_logiciel'])
    print(versions_audit_cfg)
    assert (len(report['erreur_logiciel']) == 1)

    _set_version_audit_to_valid_dates()

    for k, v in versions_audit_cfg.items():
        v['start_date'] = '2000-01-01'
        v['end_date'] = '2200-03-01'
        v['end_date_compare_now'] = '2000-03-01'

    audit = etree.parse(f, parser)
    audit.find('*//enum_version_audit_id').text = "1.1"
    report = ReportAudit()
    engine.validation_version_and_dates(audit, report, now=get_datetime_now(None))
    report = report.generate_report(audit, engine)
    print(report['erreur_logiciel'])
    print(versions_audit_cfg)
    assert (len(report['erreur_logiciel']) == 1)

    for k, v in versions_audit_cfg.items():
        v['start_date'] = '2000-01-01'
        v['end_date'] = '2000-03-01'
        v['end_date_compare_now'] = '2200-03-01'

    audit = etree.parse(f, parser)
    audit.find('*//enum_version_audit_id').text = "1.1"
    report = ReportAudit()
    engine.validation_version_and_dates(audit, report, now=get_datetime_now(None))
    report = report.generate_report(audit, engine)
    print(report['erreur_logiciel'])
    print(versions_audit_cfg)
    assert (len(report['erreur_logiciel']) == 1)


def test_controle_coherence_date_edit():
    _set_version_dpe_to_valid_dates()
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    # cas sans dpe_a_remplacer
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('*//enum_version_id').text = "1.1"

    # set all dates to invalid
    for k, v in versions_dpe_cfg.items():
        v['start_date'] = str(datetime.date(datetime.now() - timedelta(days=1)))
        v['end_date'] = str(datetime.date(datetime.now() - timedelta(days=1)))
        v['end_date_compare_now'] = str(datetime.date(datetime.now() - timedelta(days=1)))
        if 'end_date_edit' in v:
            v['end_date_edit'] = str(datetime.date(datetime.now() - timedelta(days=1)))
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    # invalid as it should be
    assert (len(report['erreur_logiciel']) == 1)

    # set dates edit to valid
    for k, v in versions_dpe_cfg.items():

        if 'end_date_edit' in v:
            v['end_date_edit'] = str(datetime.date(datetime.now() + timedelta(days=1)))

    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    # still not valid because no dpe_a_remplacer
    assert (len(report['erreur_logiciel']) == 1)

    # cas avec dpe_a_remplacer
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('*//enum_version_id').text = "1.1"
    report = ReportDPE()
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    report = report.generate_report(dpe, engine)
    # should be valid
    assert (len(report['erreur_logiciel']) == 0)


# def test_blocker_as_warning_for_v2():
#     _set_version_dpe_to_valid_dates()
#
#     engine = EngineDPE()
#     parser = etree.XMLParser(remove_blank_text=True)
#     f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
#     dpe = etree.parse(f, parser)
#
#     dpe.find('*//enum_version_id').text = '2.2'
#     report = engine.run_controle_coherence(dpe)
#
#     nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#     nb_warnings = len(report['warning_saisie']) + len(report['warning_logiciel'])
#     assert (nb_errors > 0)
#     nb_tot = nb_warnings + nb_errors
#
#     # dpe.find('*//enum_version_id').text = '2'
#     # report = engine.run_controle_coherence(dpe)
#     #
#     # nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#     # nb_warnings = len(report['warning_saisie']) + len(report['warning_logiciel'])
#     #
#     # assert (nb_errors == 2)  # controle coherence etiquette
#     # assert (nb_tot == (nb_errors + nb_warnings))


def test_controle_coherence_adminsitratif():
    _set_version_dpe_to_valid_dates()

    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    engine.controle_coherence_administratif(dpe, report)

    assert (len(report.error_software) == 0)
    assert (len(report.warning_input) == 0)

    dpe.find('administratif//enum_statut_geocodage_ban_id').text = '2'
    compl_etage_appartement = dpe.find('*//adresse_bien//compl_etage_appartement')
    compl_etage_appartement.getparent().remove(compl_etage_appartement)
    dpe.find('administratif//ban_score').text = '0.5'
    dpe.find('administratif//ban_type').text = '0.5'
    ban_city = dpe.find('*//adresse_bien//ban_city')
    ban_city.getparent().remove(ban_city)
    ban_housenumber = dpe.find('*//adresse_bien//ban_housenumber')
    ban_housenumber.getparent().remove(ban_housenumber)
    engine.controle_coherence_administratif(dpe, report)
    assert (len(report.error_software) == 2)
    assert (len(report.error_input) == 1)
    assert (len(report.warning_input) == 3)
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    dpe.find('administratif//ban_type').text = 'municipality'
    engine.controle_coherence_administratif(dpe, report)
    assert (len(report.warning_input) == 1)

    report = ReportDPE()
    dpe = etree.parse(f, parser)
    adresse_proprietaire_commun = dpe.find('*//adresse_proprietaire_installation_commune')
    adresse_proprietaire_commun.getparent().remove(adresse_proprietaire_commun)
    dpe.find('administratif//ban_type').text = 'municipality'
    engine.controle_coherence_administratif(dpe, report)
    assert (len(report.warning_input) == 1)


def test_controle_coherence_dpe_tertiaire():
    _set_version_dpe_to_valid_dates()

    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_tertiaire_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = engine.run_controle_coherence(dpe)
    assert (len(report['erreur_logiciel']) == 0)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_tertiaire_1_vierge_valid.xml'))
    dpe = etree.parse(f, parser)
    report = engine.run_controle_coherence(dpe)
    assert (len(report['erreur_logiciel']) == 0)

    dpe.find('*//enum_methode_application_dpe_ter_id').text = '1'
    report = engine.run_controle_coherence(dpe)
    print(report['erreur_logiciel'])

    assert (len(report['erreur_logiciel']) == 2)


def test_controle_coherence_etiquette_dpe_tertiaire():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_tertiaire_1_valid.xml'))
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    engine.controle_coherence_etiquette_tertiaire(dpe, report)
    # s'il n'y a pas la balise enum_sous_modele_dpe_ter_id warning
    assert (len(report.error_software + report.error_input) == 0)
    assert (len(report.warning_software) == 1)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_tertiaire_1_vierge_valid.xml'))
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    engine.controle_coherence_etiquette_tertiaire(dpe, report)
    # s'il n'y a pas la balise enum_sous_modele_dpe_ter_id warning
    assert (len(report.error_software + report.error_input) == 0)
    assert (len(report.warning_software) == 1)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_tertiaire_1_avec_sous_modele_valid.xml'))
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    engine.controle_coherence_etiquette_tertiaire(dpe, report)
    # DPE valid
    assert (len(report.error_software + report.error_input) == 0)
    assert (len(report.warning_software) == 0)

    engine.controle_coherence_etiquette_tertiaire(dpe, report)
    dpe.find('.//bilan_consommation/conso_energie_primaire').text = '211'
    engine.controle_coherence_etiquette_tertiaire(dpe, report)

    # l'étiquette ne correspond pas à la conso
    assert (len(report.error_software + report.error_input) == 0)
    assert (len(report.warning_software) == 1)

    dpe.find('.//bilan_consommation/emission_ges').text = '31'
    report = ReportDPE()
    engine.controle_coherence_etiquette_tertiaire(dpe, report)

    # l'étiquette ne correspond pas à la conso idem pour le GES
    assert (len(report.error_software + report.error_input) == 0)
    assert (len(report.warning_software) == 2)

    dpe.find('.//enum_sous_modele_dpe_ter_id').text = '2'
    report = ReportDPE()
    engine.controle_coherence_etiquette_tertiaire(dpe, report)

    # le modèle batiment à occupation continue décale toutes les étiquettes d'un cran donc plus de problèmes !
    assert (len(report.error_software + report.error_input) == 0)
    assert (len(report.warning_software) == 0)

    # test G
    dpe.find('.//bilan_consommation/classe_conso_energie').text = 'F'

    dpe.find('.//bilan_consommation/classe_emission_ges').text = 'F'
    dpe.find('.//bilan_consommation/conso_energie_primaire').text = '1131'

    dpe.find('.//bilan_consommation/emission_ges').text = '221'

    report = ReportDPE()
    engine.controle_coherence_etiquette_tertiaire(dpe, report)

    assert (len(report.error_software + report.error_input) == 0)
    assert (len(report.warning_software) == 2)

    # test arrondi
    dpe.find('.//bilan_consommation/classe_conso_energie').text = 'A'

    dpe.find('.//bilan_consommation/classe_emission_ges').text = 'A'
    dpe.find('.//bilan_consommation/conso_energie_primaire').text = '100.5'

    dpe.find('.//bilan_consommation/emission_ges').text = '12.5'

    report = ReportDPE()
    engine.controle_coherence_etiquette_tertiaire(dpe, report)

    assert (len(report.error_software + report.error_input) == 0)
    assert (len(report.warning_software) == 0)


def test_controle_coherence_etiquette_dpe():
    engine = EngineDPE()
    report = ReportDPE()
    self = engine
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('*//ep_conso/ep_conso_5_usages_m2').text = '421'
    dpe.find('*//ep_conso/classe_bilan_dpe').text = 'G'
    dpe.find('*//classe_emission_ges').text = "A"
    dpe.find('*//emission_ges_5_usages_m2').text = "5"

    engine.controle_coherence_etiquette(dpe.find('logement'), report)

    assert (len(report.error_software) == 0)

    dpe.find('*//enum_zone_climatique_id').text = "7"
    engine.controle_coherence_etiquette(dpe.find('logement'), report)

    assert (len(report.error_software) == 0)
    dpe.find('*//enum_classe_altitude_id').text = "3"
    engine.controle_coherence_etiquette(dpe.find('logement'), report)

    assert (len(report.error_software) == 1)

    report = ReportDPE()

    dpe.find('*//ep_conso/ep_conso_5_usages_m2').text = '190'
    dpe.find('*//ep_conso/classe_bilan_dpe').text = 'D'
    engine.controle_coherence_etiquette(dpe.find('logement'), report)

    assert (len(report.error_software) == 0)

    dpe.find('*//classe_emission_ges').text = "E"
    dpe.find('*//emission_ges_5_usages_m2').text = "50"

    engine.controle_coherence_etiquette(dpe.find('logement'), report)

    assert (len(report.error_software) == 1)

    report = ReportDPE()
    dpe.find('*//classe_emission_ges').text = "D"
    engine.controle_coherence_etiquette(dpe.find('logement'), report)
    assert (len(report.error_software) == 2)


def test_controle_coherence_conso_5_usages_dpe():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)

    # ========== TEST 1 : CAS IMMEUBLE VALIDE (pas d'erreur) ==========
    report = ReportDPE()
    f = str((engine.mdd_path / 'exemples_metier' / "cas_test_immeuble_1_valid_2.5.xml"))
    dpe = etree.parse(f, parser)

    engine.controle_coherence_conso_5_usages(dpe.find('.//logement'), report, is_arrete_pef_elec=False)
    assert len(report.error_software) == 0, "Test 1 échoué : erreurs détectées alors qu'aucune n'était attendue"

    # ========== TEST 2 : CAS IMMEUBLE avec erreur EF ==========
    report = ReportDPE()
    dpe = etree.parse(f, parser)  # Rechargement du fichier

    # Modifier une valeur de sortie_par_energie pour créer une incohérence EF
    sortie = dpe.find('.//sortie_par_energie_collection/sortie_par_energie')
    valeur_initiale = float(sortie.find('conso_5_usages').text)
    sortie.find('conso_5_usages').text = str(valeur_initiale + 10)  # Ajout d'un écart > tolérance

    engine.controle_coherence_conso_5_usages(dpe.find('.//logement'), report, is_arrete_pef_elec=False)
    assert len(report.error_software) == 2, f"Test 2 échoué : {len(report.error_software)} erreur(s) au lieu de 2 (EF et EP)"

    # ========== TEST 3 : CAS IMMEUBLE avec erreur EP ==========
    report = ReportDPE()
    dpe = etree.parse(f, parser)  # Rechargement du fichier

    # Modifier ep_conso_5_usages pour créer une incohérence EP
    ep_initial = float(dpe.find('.//ep_conso/ep_conso_5_usages').text)
    dpe.find('.//ep_conso/ep_conso_5_usages').text = str(ep_initial + 10)

    engine.controle_coherence_conso_5_usages(dpe.find('.//logement'), report, is_arrete_pef_elec=False)
    assert len(report.error_software) == 1, f"Test 3 échoué : {len(report.error_software)} erreur(s) au lieu de 1"
    assert 'bad_ep_conso_calculation' in str(report.error_software[0]), "Test 3 échoué : erreur EP non détectée"

    # ========== TEST 5 : CAS DPE NEUF VALIDE (pas d'erreur) ==========
    report = ReportDPE()
    f_neuf = str((engine.mdd_path / 'exemples_metier' / "cas_test_appt_2_neuf_valid.xml"))
    dpe_neuf = etree.parse(f_neuf, parser)

    # Chercher logement_neuf ou logement selon la structure du fichier
    logement_neuf = dpe_neuf.find('.//logement_neuf')

    engine.controle_coherence_conso_5_usages(logement_neuf, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 0, "Test 5 échoué : erreurs détectées alors qu'aucune n'était attendue"

    # ========== TEST 6 : CAS DPE NEUF avec erreur EF ==========
    report = ReportDPE()
    dpe_neuf = etree.parse(f_neuf, parser)  # Rechargement du fichier
    logement_neuf = dpe_neuf.find('.//logement_neuf')

    # Modifier ef_conso_5_usages pour créer une incohérence
    ef_initial = float(logement_neuf.find('.//ef_conso/conso_5_usages').text)
    logement_neuf.find('.//ef_conso/conso_5_usages').text = str(ef_initial + 10)

    engine.controle_coherence_conso_5_usages(logement_neuf, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 1, f"Test 6 échoué : {len(report.error_software)} erreur(s) au lieu de 1 (EF)"

    # ========== TEST 7 : CAS DPE NEUF avec erreur EP ==========
    report = ReportDPE()
    dpe_neuf = etree.parse(f_neuf, parser)  # Rechargement du fichier
    logement_neuf = dpe_neuf.find('.//logement_neuf')

    # Modifier ep_conso_5_usages pour créer une incohérence
    ep_initial = float(logement_neuf.find('.//ep_conso/ep_conso_5_usages').text)
    logement_neuf.find('.//ep_conso/ep_conso_5_usages').text = str(ep_initial + 10)

    engine.controle_coherence_conso_5_usages(logement_neuf, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 1, f"Test 7 échoué : {len(report.error_software)} erreur(s) au lieu de 1"
    assert 'bad_ep_conso_calculation' in str(report.error_software[0]), "Test 7 échoué : erreur EP non détectée"

    # ========== TEST 8 : CAS DPE NEUF avec erreurs EF et EP ==========
    report = ReportDPE()
    dpe_neuf = etree.parse(f_neuf, parser)  # Rechargement du fichier
    logement_neuf = dpe_neuf.find('.//logement_neuf')

    # Modifier à la fois ef et ep
    ef_initial = float(logement_neuf.find('.//ef_conso/conso_5_usages').text)
    logement_neuf.find('.//ef_conso/conso_5_usages').text = str(ef_initial + 10)

    ep_initial = float(logement_neuf.find('.//ep_conso/ep_conso_5_usages').text)
    logement_neuf.find('.//ep_conso/ep_conso_5_usages').text = str(ep_initial + 10)

    engine.controle_coherence_conso_5_usages(logement_neuf, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 2, f"Test 8 échoué : {len(report.error_software)} erreur(s) au lieu de 2"

    # ========== TEST 9 : Vérification coefficient électricité (arrêté 2026) ==========
    report = ReportDPE()
    dpe = etree.parse(f, parser)  # Rechargement du fichier

    # Créer une incohérence basée sur le coefficient 2.3 au lieu de 1.9
    logement = dpe.find('.//logement')

    # Calculer l'EP avec le coefficient 1.9 (arrêté 2026)
    somme_ef_elec = 0
    somme_ef_autre = 0
    for sortie in logement.findall('.//sortie_par_energie_collection/sortie_par_energie'):
        energie_id = sortie.find('enum_type_energie_id').text
        conso_ef = float(sortie.find('conso_5_usages').text)
        if energie_id == "1":
            somme_ef_elec += conso_ef
        elif energie_id != "12":
            somme_ef_autre += conso_ef

    # Forcer une valeur EP incorrecte basée sur coef 2.3
    ep_incorrect = somme_ef_elec * 2.3 + somme_ef_autre
    logement.find('.//ep_conso/ep_conso_5_usages').text = str(ep_incorrect)

    # Tester avec le coefficient 1.9 (devrait détecter une erreur)
    engine.controle_coherence_conso_5_usages(logement, report, is_arrete_pef_elec=True)
    assert len(report.error_software) >= 1, "Test 9 échoué : erreur de coefficient non détectée"


def test_controle_coherence_conso_5_usages_tertiaire():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)

    # ========== TEST 1 : CAS TERTIAIRE NEUF VALIDE (pas d'erreur détail, warning global) ==========
    report = ReportDPE()
    f_neuf = str((engine.mdd_path / 'exemples_metier' / "cas_test_tertiaire_1_neuf_valid.xml"))
    dpe = etree.parse(f_neuf, parser)
    tertiaire = dpe.find('.//tertiaire')

    engine.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 0, "Test 1 échoué : erreurs détectées alors qu'aucune n'était attendue au niveau détail"
    assert len(report.warning_software) == 0, "Test 1 échoué : warning global détecté"

    # ========== TEST 2 : CAS TERTIAIRE AVEC SOUS-MODELE VALIDE (pas d'erreur détail, warning global) ==========
    report = ReportDPE()
    f_sous_modele = str((engine.mdd_path / 'exemples_metier' / "cas_test_tertiaire_1_avec_sous_modele_valid.xml"))
    dpe = etree.parse(f_sous_modele, parser)
    tertiaire = dpe.find('.//tertiaire')

    engine.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 0, "Test 2 échoué : erreurs détectées alors qu'aucune n'était attendue au niveau détail"
    assert len(report.warning_software) == 0, "Test 2 échoué : warning global détecté"

    # ========== TEST 3 : CAS TERTIAIRE VIERGE (aucune erreur ni warning) ==========
    report = ReportDPE()
    f_vierge = str((engine.mdd_path / 'exemples_metier' / "cas_test_tertiaire_1_vierge_valid.xml"))
    dpe = etree.parse(f_vierge, parser)
    tertiaire = dpe.find('.//tertiaire')

    engine.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 0, "Test 3 échoué : erreurs détectées dans un cas vierge"
    assert len(report.warning_software) == 0, "Test 3 échoué : warnings détectés dans un cas vierge"

    # ========== TEST 4 : CAS TERTIAIRE NEUF avec erreur EP sur une consommation ==========
    report = ReportDPE()
    dpe = etree.parse(f_neuf, parser)
    tertiaire = dpe.find('.//tertiaire')

    # Modifier une conso_energie_primaire pour créer une incohérence
    conso = tertiaire.find('.//consommation_collection/consommation')
    if conso is not None:
        ep_node = conso.find('conso_energie_primaire')
        ep_initial = float(ep_node.text)
        ep_node.text = str(ep_initial + 10)

    engine.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 1, f"Test 4 échoué : {len(report.error_software)} erreur(s) au lieu de 1"
    assert 'bad_ep_conso_calculation' in str(report.error_software[0]), "Test 4 échoué : erreur EP consommation non détectée"

    # ========== TEST 5 : CAS TERTIAIRE AVEC SOUS-MODELE avec erreur EP sur une consommation ==========
    report = ReportDPE()
    dpe = etree.parse(f_sous_modele, parser)
    tertiaire = dpe.find('.//tertiaire')

    # Modifier une conso_energie_primaire pour créer une incohérence
    conso = tertiaire.find('.//consommation_collection/consommation')
    if conso is not None:
        ep_node = conso.find('conso_energie_primaire')
        ep_initial = float(ep_node.text)
        ep_node.text = str(ep_initial + 10)

    engine.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 1, f"Test 5 échoué : {len(report.error_software)} erreur(s) au lieu de 1"
    assert 'bad_ep_conso_calculation' in str(report.error_software[0]), "Test 5 échoué : erreur EP consommation non détectée"

    # ========== TEST 6 : CAS TERTIAIRE NEUF avec erreurs multiples ==========
    report = ReportDPE()
    dpe = etree.parse(f_neuf, parser)
    tertiaire = dpe.find('.//tertiaire')

    # Modifier plusieurs conso_energie_primaire pour créer des incohérences
    consos = tertiaire.findall('.//consommation_collection/consommation')
    nb_modifications = 0
    for conso in consos[:2]:  # Modifier les 2 premières consommations
        ep_node = conso.find('conso_energie_primaire')
        if ep_node is not None:
            ep_initial = float(ep_node.text)
            ep_node.text = str(ep_initial + 10)
            nb_modifications += 1

    engine.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == nb_modifications, f"Test 6 échoué : {len(report.error_software)} erreur(s) au lieu de {nb_modifications}"

    # ========== TEST 7 : Vérification coefficient électricité (arrêté 2026) ==========
    report = ReportDPE()
    dpe = etree.parse(f_neuf, parser)
    tertiaire = dpe.find('.//tertiaire')

    # Trouver une consommation électricité et calculer avec mauvais coefficient
    for conso in tertiaire.findall('.//consommation_collection/consommation'):
        energie_id = conso.find('enum_type_energie_id').text
        if energie_id == "1":  # électricité
            ef_node = conso.find('conso_energie_finale')
            ep_node = conso.find('conso_energie_primaire')
            ef_value = float(ef_node.text)
            # Appliquer coefficient 2.3 au lieu de 1.9
            ep_node.text = str(ef_value * 2.3)
            break

    # Tester avec coefficient 1.9 (devrait détecter erreur)
    engine.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=True)
    assert len(report.error_software) >= 1, "Test 7 échoué : erreur de coefficient non détectée"

    # ========== TEST 8 : CAS TERTIAIRE NEUF - modification EF impacte EP ==========
    report = ReportDPE()
    dpe = etree.parse(f_neuf, parser)
    tertiaire = dpe.find('.//tertiaire')

    # Modifier uniquement conso_energie_finale (sans ajuster EP)
    conso = tertiaire.find('.//consommation_collection/consommation')
    if conso is not None:
        ef_node = conso.find('conso_energie_finale')
        ef_initial = float(ef_node.text)
        ef_node.text = str(ef_initial + 10)

    engine.controle_coherence_conso_5_usages_tertiaire(tertiaire, report, is_arrete_pef_elec=True)
    assert len(report.error_software) == 1, f"Test 8 échoué : {len(report.error_software)} erreur(s) au lieu de 1"
    assert 'bad_ep_conso_calculation' in str(report.error_software[0]), "Test 8 échoué : erreur EP après modification EF non détectée"


def test_controle_coherence_5_usages_surface_dpe():
    engine = EngineDPE()
    report = ReportDPE()
    self = engine
    parser = etree.XMLParser(remove_blank_text=True)

    # Charger un fichier XML de test
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)

    # Définition de la surface de référence
    surface_reference = float(dpe.find('*//surface_habitable_immeuble').text)

    # Modifier les valeurs pour un premier test sans erreur
    ef_conso_5_usages = 5000
    ep_conso_5_usages = 6000
    emission_ges_5_usages = 250

    dpe.find('*//ef_conso/conso_5_usages').text = str(ef_conso_5_usages)
    dpe.find('*//ep_conso/ep_conso_5_usages').text = str(ep_conso_5_usages)
    dpe.find('*//emission_ges/emission_ges_5_usages').text = str(emission_ges_5_usages)

    dpe.find('*//ef_conso/conso_5_usages_m2').text = str(ef_conso_5_usages / surface_reference)
    dpe.find('*//ep_conso/ep_conso_5_usages_m2').text = str(ep_conso_5_usages / surface_reference)
    dpe.find('*//emission_ges/emission_ges_5_usages_m2').text = str(emission_ges_5_usages / surface_reference)

    engine.controle_coherence_5_usages_surface(dpe.find('logement'), report)

    # Vérifier qu'il n'y a pas d'erreur au départ
    assert len(report.error_software) == 0

    # Modifier une valeur pour introduire une incohérence sur ef_conso
    dpe.find('*//ef_conso/conso_5_usages_m2').text = str((ef_conso_5_usages / surface_reference) + 3)
    engine.controle_coherence_5_usages_surface(dpe.find('logement'), report)

    assert len(report.error_software) == 1  # Une erreur détectée

    # Modifier une autre valeur pour introduire une incohérence sur ep_conso **sans corriger l’erreur précédente**
    dpe.find('*//ep_conso/ep_conso_5_usages_m2').text = str((ep_conso_5_usages / surface_reference) + 3)
    report = ReportDPE()  # Réinitialiser le rapport
    engine.controle_coherence_5_usages_surface(dpe.find('logement'), report)

    assert len(report.error_software) == 2  # Deux erreurs détectées

    # Modifier une autre valeur pour introduire une incohérence sur emission_ges **sans corriger les erreurs précédentes**
    dpe.find('*//emission_ges/emission_ges_5_usages_m2').text = str((emission_ges_5_usages / surface_reference) + 3)
    report = ReportDPE()  # Réinitialiser le rapport
    engine.controle_coherence_5_usages_surface(dpe.find('logement'), report)

    assert len(report.error_software) == 3  # Trois erreurs détectées

    # Introduire plusieurs erreurs simultanément (vérification finale)
    dpe.find('*//ef_conso/conso_5_usages_m2').text = str((ef_conso_5_usages / surface_reference) + 3)
    dpe.find('*//ep_conso/ep_conso_5_usages_m2').text = str((ep_conso_5_usages / surface_reference) + 3)
    dpe.find('*//emission_ges/emission_ges_5_usages_m2').text = str((emission_ges_5_usages / surface_reference) + 3)

    engine.controle_coherence_5_usages_surface(dpe.find('logement'), report)

    assert len(report.error_software) == 6  # 3 erreurs précédentes + 3 nouvelles incohérences


def test_coherence_surface_immeuble_logement():
    engine = EngineDPE()
    report = ReportDPE()
    self = engine
    parser = etree.XMLParser(remove_blank_text=True)

    # Charger un fichier XML de test
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appartement_a_partir_immeuble_valid.xml'))
    dpe = etree.parse(f, parser)

    # Cas 1 : Surface habitable immeuble > surface habitable logement (aucune erreur attendue)
    dpe.find('.//surface_habitable_immeuble').text = '150'
    dpe.find('.//surface_habitable_logement').text = '100'
    engine.controle_coherence_surface_immeuble_logement(dpe.find('logement'), report)
    assert len(report.error_input) == 0

    # Cas 2 : Surface habitable immeuble < surface habitable logement (erreur attendue)
    dpe.find('.//surface_habitable_immeuble').text = '80'
    dpe.find('.//surface_habitable_logement').text = '100'
    report = ReportDPE()  # Réinitialiser le rapport
    engine.controle_coherence_surface_immeuble_logement(dpe.find('logement'), report)
    assert len(report.error_input) == 1

    # Cas 3 : Surface habitable immeuble = surface habitable logement (erreur attendue)
    dpe.find('.//surface_habitable_immeuble').text = '100'
    dpe.find('.//surface_habitable_logement').text = '100'
    report = ReportDPE()  # Réinitialiser le rapport
    engine.controle_coherence_surface_immeuble_logement(dpe.find('logement'), report)
    assert len(report.error_input) == 1


    # Cas 3 : Surface habitable immeuble = surface habitable logement (erreur attendue)
    dpe.find('.//surface_habitable_immeuble').text = '100'
    dpe.find('.//surface_habitable_logement').text = '100'
    dpe.find('.//nombre_appartement').text = '1'
    report = ReportDPE()  # Réinitialiser le rapport
    engine.controle_coherence_surface_immeuble_logement(dpe.find('logement'), report)
    assert len(report.error_input) == 0
    assert len(report.warning_input) == 1


def test_controle_coherence_masque_solaire():

    engine = EngineDPE()
    report = ReportDPE()
    self = engine
    parser = etree.XMLParser(remove_blank_text=True)

    # Charger un fichier XML de test
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appartement_a_partir_immeuble_valid.xml'))
    dpe = etree.parse(f, parser)
    baie = dpe.find('*//baie_vitree/donnee_entree')
    self.controle_coherence_masque_solaire(dpe.find('logement'), report)
    assert len(report.error_software) == 0
    tv_coef_masque_lointain_homogene_id=etree.SubElement(baie, 'tv_coef_masque_lointain_homogene_id')
    tv_coef_masque_lointain_homogene_id.text='4'
    self.controle_coherence_masque_solaire(dpe.find('logement'), report)
    assert len(report.error_software) == 1

def test_controle_coherence_etiquette_petite_surface():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    report_class = ReportDPE()

    cas_test, engine, report_class = ('cas_test_maison_1_valid_2.5.xml', EngineDPE(), ReportDPE)

    f = str((engine.mdd_path / 'exemples_metier' / cas_test))
    xml = etree.parse(f, parser)
    logement = xml.find('logement')

    report = report_class()
    engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=True)
    assert (len(report.error_software) == 0)

    report = report_class()
    xml.find('*//surface_habitable_logement').text = '25.3'

    engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=True)
    assert (len(report.error_software) == 1)
    xml.find('*//ep_conso_5_usages_m2').text = '363'
    report = report_class()
    engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=True)
    assert (len(report.error_software) == 0)
    xml.find('*//surface_habitable_logement').text = '25.3333333333333333333333333333333333333333333333'
    engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=True)
    assert (report.error_software == [])

    xml.find('*//surface_habitable_logement').text = '7'
    report = report_class()
    engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=True)
    assert (len(report.error_software) == 2)

    xml.find('*//emission_ges/emission_ges_5_usages_m2').text = '45'
    logement.find('*//classe_bilan_dpe').text = 'D'
    report = report_class()
    engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=True)
    assert (len(report.error_software) == 0)

    _set_version_dpe_to_valid_dates()
    _set_version_audit_to_valid_dates()

    for cas_test, engine, report_class, nb_surface_error in [('cas_test_maison_1_valid_2.5.xml', EngineDPE(), ReportDPE, 4), ('cas_test_audit_maison_1_latest_valid.xml', EngineAudit(), ReportAudit, 3)]:
        f = str((engine.mdd_path / 'exemples_metier' / cas_test))
        xml = etree.parse(f, parser)
        for i, logement in enumerate(xml.iterfind('.//logement')):
            report = report_class()
            engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=False)

            test_cases_seuils_petites_surfaces = [(12, 105, 8, 'A', 'A', 2), (12, 550, 9, 'F', 'B', 1), (12, 700, 9, 'G', 'B', 0), (12, 700, 12, 'G', 'B', 1)]

            for s, ep, ges, etiquette, etiquette_ges, nb_error in test_cases_seuils_petites_surfaces:
                logement.find('*//surface_habitable_logement').text = str(s)
                logement.find('*//ep_conso_5_usages_m2').text = str(ep)
                logement.find('*//emission_ges/emission_ges_5_usages_m2').text = str(ges)
                logement.find('*//emission_ges/emission_ges_5_usages_m2').text = str(ges)
                logement.find('*//emission_ges/emission_ges_5_usages').text = str(int(ges*s))
                logement.find('*//classe_bilan_dpe').text = str(etiquette)
                logement.find('*//classe_emission_ges').text = str(etiquette_ges)

                report = report_class()
                engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=False)

                assert (len(report.error_software) == nb_error)

            for s, ep, ges, etiquette, etiquette_ges, nb_error in test_cases_seuils_petites_surfaces:
                logement.find('*//surface_habitable_logement').text = str(s)
                logement.find('*//ep_conso_5_usages_m2').text = str(ep)
                logement.find('*//emission_ges/emission_ges_5_usages_m2').text = str(ges)
                logement.find('*//classe_bilan_dpe').text = str(etiquette)
                logement.find('*//classe_emission_ges').text = str(etiquette_ges)

                report = report_class()
                engine.controle_coherence_etiquette(logement, report, is_arrete_petite_surface=True)

                assert (len(report.error_software) == 0)

            os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_POST_DPE_latest
            if xml.find('enum_version_id') is not None:
                xml.find('enum_version_id').text = '2.4'
            if xml.find('*//enum_version_dpe_id') is not None:
                xml.find('*//enum_version_dpe_id').text = '2.4'

            for s, ep, ges, etiquette, etiquette_ges, nb_error in test_cases_seuils_petites_surfaces:
                logement.find('*//surface_habitable_logement').text = str(s)
                logement.find('*//ep_conso_5_usages_m2').text = str(ep)
                logement.find('*//ep_conso_5_usages').text = str(int(ep*s))
                logement.find('*//emission_ges/emission_ges_5_usages_m2').text = str(ges)
                logement.find('*//emission_ges/emission_ges_5_usages').text = str(int(ges*s))
                logement.find('*//classe_bilan_dpe').text = str(etiquette)
                logement.find('*//classe_emission_ges').text = str(etiquette_ges)

                report = engine.run_controle_coherence(xml)
                try:
                    assert (len(report['erreur_logiciel']) == nb_surface_error * (i + 1))  # les 4 erreurs correspondent aux contrôles des surface ventil,chauffage,ecs,clim qui sont sup a shab (x le nombre de logements petites surface dans l'audit
                except:
                    what=1
    # os.environ['OBS_DPE_DATETIME_NOW'] = pd.to_datetime('2024-07-02')
    # xml.find('*//enum_version_id').text = '2.3'
    # for s, ep, ges, etiquette in test_cases_seuils_petites_surfaces:
    #     logement = xml.find('logement')
    #     logement.find('*//surface_habitable_logement').text = str(s)
    #     logement.find('*//emission_ges/emission_ges_5_usages_m2').text = str(ges)
    #     logement.find('*//classe_bilan_dpe').text = 'D'
    #     logement.find('*//emission_ges/emission_ges_5_usages_m2').text = str(ges)
    #     report = engine.run_controle_coherence(xml)
    #     assert (len(report['erreur_logiciel']) == 0)

    # test petite surface valide
    engine = EngineDPE()
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_maison_1_valid_2.5.xml'))
    xml = etree.parse(f, parser)
    os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_POST_DPE_latest
    xml.find('*//enum_version_id').text = '2.4'
    report = engine.run_controle_coherence(xml)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors == 0)

    # # test petite surface crash en 2.3 (obsolète)
    #
    # f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_maison_1_valid_petite_surface.xml'))
    # xml = etree.parse(f, parser)
    # os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_PRE_DPE_24
    # xml.find('*//enum_version_id').text = '2.3'
    # report = engine.run_controle_coherence(xml)
    # errors = report['erreur_logiciel'] + report['erreur_saisie']
    # assert (report['validation_xsd']['valid'] == True)
    # assert (len(errors) == 2)


def test_controle_coherence_pac_air_air():

    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_maison_1_valid_2.5.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_pac_air_air_clim(dpe.find('logement'), report)
    assert (len(report.error_input) == 0)
    for el in dpe.iterfind('*//climatisation_collection/climatisation'):
        el.getparent().remove(el)
    engine.controle_pac_air_air_clim(dpe.find('logement'),report)
    assert(len(report.error_input)==0)
    dpe.find('*//enum_type_generateur_ch_id').text='1'
    engine.controle_pac_air_air_clim(dpe.find('logement'),report)
    assert(len(report.error_input)==1)

def test_controle_coherence_table_valeur_enum():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    self = engine
    logement = dpe.find('logement')
    self.controle_coherence_table_valeur_enum(logement, report)

    assert (len(report.error_software) == 17)

    all_tv_found = list()
    for tv in self.valeur_table_dict:
        all_tv_found.extend(dpe.iterfind(f'*//{tv}'))

    for tv in all_tv_found:
        parent = tv.getparent()
        parent_dict = element_to_value_dict(parent)
        name = tv.tag
        value = convert_xml_text(tv.text)
        if value is not None:
            related_properties = {k: v for k, v in self.valeur_table_dict[name][value].items() if v == v}
            related_enums = {k: v for k, v in related_properties.items() if k.startswith('enum')}
            for related_enum_name, admissible_values in related_enums.items():
                current_parent = parent
                current_parent_dict = parent_dict
                # if enum methode application on va chercher dans caracteristique generale
                if related_enum_name == 'enum_methode_application_dpe_log_id':
                    current_parent = dpe.find('*//caracteristique_generale')
                    current_parent_dict = element_to_value_dict(current_parent)
                # if zone climatique
                elif related_enum_name == 'enum_zone_climatique_id':
                    current_parent = dpe.find('*//meteo')
                    current_parent_dict = element_to_value_dict(current_parent)
                # if not in direct parent getting grand-parent
                elif related_enum_name not in parent_dict:
                    current_parent = parent.getparent().getparent()
                    current_parent_dict = element_to_value_dict(current_parent)

                if related_enum_name in current_parent_dict:
                    if current_parent_dict[related_enum_name] not in admissible_values:
                        enum = current_parent.find(related_enum_name)
                        enum.text = str(admissible_values[0])

    report = ReportDPE()

    self = engine

    self.controle_coherence_table_valeur_enum(dpe.find('logement'), report)

    assert (len(report.error_software) == 12)

    for mur in dpe.iterfind('*//mur/donnee_entree'):
        mur.find('enum_materiaux_structure_mur_id').text = '1'
        mur.find('tv_umur_id').text = '3'

    report = ReportDPE()

    self = engine

    self.controle_coherence_table_valeur_enum(dpe.find('logement'), report)
    assert (len(report.error_software) == 12 + 3 * 2)

    dpe = etree.parse(f, parser)
    report = ReportDPE()

    ets_collection = dpe.find('*//enveloppe/ets_collection')
    ets = etree.SubElement(ets_collection, 'ets')
    de = etree.SubElement(ets, 'donnee_entree')

    set_xml_values_from_dict(de, {'tv_coef_reduction_deperdition_id': 265,
                                  'enum_cfg_isolation_lnc_id': 6})
    di = etree.SubElement(ets, 'donnee_intermediaire')

    set_xml_values_from_dict(di, {'bver': 0.95})
    self.controle_coherence_table_valeur_enum(dpe.find('logement'), report)
    assert (len(report.error_software) == 17)
    dpe.find('*//ets/donnee_entree/enum_cfg_isolation_lnc_id').text = '1'
    report = ReportDPE()
    self.controle_coherence_table_valeur_enum(dpe.find('logement'), report)
    assert (len(report.error_software) == 18)

    # test ajout chauffage mixte
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('*//enum_methode_application_dpe_log_id').text = '30'
    report = ReportDPE()
    self.controle_coherence_table_valeur_enum(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)
    dpe.find('*//installation_chauffage/donnee_entree/enum_type_installation_id').text = '1'
    self.controle_coherence_table_valeur_enum(dpe.find('logement'), report)
    assert (len(report.error_software) == 1)


def test_controle_coherence_bug_enum_tv_valeur():
    report = ReportDPE()
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    # test ajout chauffage mixte
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_maison_1_valid_thermodynamique.xml'))
    dpe = etree.parse(f, parser)

    # vérification qu'une erreur d'enum vs table de valeur était silent

    # on change sur une PAC air/air
    dpe.find('*//enum_type_generateur_ch_id').text = '3'
    engine.controle_coherence_table_valeur_enum(dpe.find('logement'), report)
    assert (len(report.error_software) == 1)
    assert(report.error_software[0]['importance']=='blocker')

    report = ReportDPE()

    # on change sur une pac double service
    dpe.find('*//enum_type_generateur_ecs_id').text = '9'
    engine.controle_coherence_table_valeur_enum(dpe.find('logement'), report)
    assert (len(report.error_software) == 2)
    assert(report.error_software[0]['importance']=='blocker')
    assert(report.error_software[1]['importance']=='blocker')


def test_controle_coherence_variables_requises():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    self = engine
    report = ReportDPE()

    engine.controle_coherence_variables_requises(dpe, report)

    assert (len(report.error_software) == 0)

    for control_varname in self.var_req_dict:
        control_vars = dpe.iterfind(f'//{control_varname}')
        for control_var in control_vars:
            for enum_id in self.var_req_dict[control_varname]:
                for var in [el for el in re.split('[(),|]', self.var_req_dict[control_varname][enum_id]) if el != '']:
                    control_var.text = str(enum_id)
                    element = control_var.getparent()
                    report = ReportDPE()
                    create_sub_el(element, var, 1)
                    engine.controle_coherence_variables_requises(dpe, report)
                    report = ReportDPE()
                    remove_sub_el(element, var)
                    engine.controle_coherence_variables_requises(dpe, report)


def test_controle_coherence_mutually_exclusive():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    self = engine
    report = ReportDPE()

    de = dpe.find('*//mur/donnee_entree')
    s = etree.SubElement(de, 'umur_saisi')
    s.text = str(1)
    engine.controle_coherence_mutually_exclusive(dpe.find('logement'), report)
    assert (len(report.error_software) == 2)


def test_controle_coherence_correspondance_saisi_value():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    self = engine
    report = ReportDPE()

    de = dpe.find('*//mur/donnee_entree')
    s = etree.SubElement(de, 'umur_saisi')
    s.text = str(1)

    de = dpe.find('*//installation_chauffage/donnee_entree')
    s = etree.SubElement(de, 'fch_saisi')
    s.text = str(1)
    engine.controle_coherence_correspondance_saisi_value(dpe.find('logement'), report)
    assert (len(report.error_software) == 2)
    assert (report.error_software[0]['thematique'] == 'bad_value')
    assert (report.error_software[1]['thematique'] == 'missing_required_element')


def test_controle_coherence_tv_values_simple():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    report = ReportDPE()

    self = engine

    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)

    assert (len(report.error_software) == 8)
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    ets_collection = dpe.find('*//enveloppe/ets_collection')
    ets = etree.SubElement(ets_collection, 'ets')
    de = etree.SubElement(ets, 'donnee_entree')

    set_xml_values_from_dict(de, {'tv_coef_reduction_deperdition_id': 265,
                                  'enum_cfg_isolation_lnc_id': 6})
    di = etree.SubElement(ets, 'donnee_intermediaire')

    set_xml_values_from_dict(di, {'bver': 0.95})
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 8)
    dpe.find('*//ets/donnee_intermediaire/bver').text = '0.7'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 9)

    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)
    assert (len(report.warning_software) == 0)
    dpe.find('*//coef_transparence_ets').text = '2'
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)
    assert (len(report.warning_software) == 1)
    tvu = dpe.find('*//tv_umur_id')
    tvu.getparent().getparent().find('*//umur').text = '0.1'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 1)
    assert (len(report.warning_software) == 1)
    tvu = dpe.find('*//tv_upb_id')
    tvu.getparent().getparent().find('*//upb').text = '0.1'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 2)
    assert (len(report.warning_software) == 1)
    tvu = dpe.find('*//tv_uph_id')
    tvu.getparent().getparent().find('*//uph').text = '0.1'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 3)
    assert (len(report.warning_software) == 1)
    tvu = dpe.find('*//tv_upb0_id')
    tvu.getparent().getparent().find('*//upb0').text = '4.4443'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 4)
    assert (len(report.warning_software) == 1)
    tvu = dpe.find('*//tv_uph0_id')
    tvu.getparent().getparent().find('*//uph0').text = '4.4443'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 5)
    assert (len(report.warning_software) == 1)
    tvu = dpe.find('*//tv_umur0_id')
    tvu.getparent().getparent().find('*//umur0').text = '4.4443'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 5)
    assert (len(report.warning_software) == 1)

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    tvu = dpe.find('*//tv_uph_id')
    uph0 = tvu.getparent().getparent().find('*//uph0')
    tvu.getparent().getparent().find('donnee_intermediaire').remove(uph0)
    tvu.getparent().getparent().find('*//uph').text = '0.1'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.error_software) == 1)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    tvsw = dpe.find('*//tv_sw_id')
    tvsw.getparent().getparent().find('*//sw').text = '2.99'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)

    assert (len(report.report['erreur_logiciel']) == 1)

    tvsw.getparent().find('double_fenetre').text = '1'

    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)

    assert (len(report.report['erreur_logiciel']) == 0)

    for tv_value in ['tv_rendement_distribution_ecs_id', 'tv_rendement_distribution_ch_id', "tv_rendement_emission_id",
                     "tv_rendement_regulation_id", 'tv_seer_id', 'tv_rendement_generation_id']:
        print(f'TV VALUE {tv_value}')
        f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_reseau_chaleur.xml'))  # n'utilise que des tv pour les rendements
        dpe = etree.parse(f, parser)
        dpe.find(f'*//{tv_value}').text = '2'
        report = ReportDPE()
        self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
        for erreur_logiciel in report.report['erreur_logiciel']:
            print(erreur_logiciel['message'])
        assert (len(report.report['erreur_logiciel']) == 1)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('*//tv_seer_id').text = '2'
    dpe.find('*//eer').text = '6.175'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.report['erreur_logiciel']) == 0)
    dpe.find('*//tv_seer_id').text = '1'
    dpe.find('*//eer').text = '3.6'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.report['erreur_logiciel']) == 0)

    # test doublage

    # test doublage

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    mur_avec_doublage = list(dpe.iterfind('*//mur'))[1]
    # mur_avec_doublage.find('*//umur').text = '0.77'
    # report = Report()
    # self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    # assert (len(report.report['erreur_logiciel']) == 1)
    # mur_avec_doublage.find('*//umur').text = '0.94'
    # report = Report()
    # self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    # assert (len(report.report['erreur_logiciel']) == 0)
    # cas avec une période d'isolation récente on vérifie que la saisie par tv défaut passe
    mur_avec_doublage.find('*//umur').text = '0.4'
    mur_avec_doublage.find('*//tv_umur_id').text = '42'
    report = ReportDPE()
    self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    assert (len(report.report['erreur_logiciel']) == 0)
    # # cas avec une période d'isolation récente on vérifie que la saisie par tv défaut passe avec application du doublage
    # mur_avec_doublage.find('*//umur').text = '0.36'
    # mur_avec_doublage.find('*//tv_umur_id').text = '42'
    # report = Report()
    # self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    # assert (len(report.report['erreur_logiciel']) == 0)
    # # cas avec une période d'isolation récente on vérifie que la saisie est rejetée si U=U0
    # mur_avec_doublage.find('*//umur').text = '0.94'
    # mur_avec_doublage.find('*//tv_umur_id').text = '42'
    # report = Report()
    # self.controle_coherence_tv_values_simple(dpe.find('logement'), report)
    # assert (len(report.report['erreur_logiciel']) == 1)


def test_paroi_polycarbonate():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('*//enum_type_pose_id').text = '4'
    dpe.find('*//enum_type_baie_id').text = '3'
    report = engine.run_controle_coherence(dpe)
    assert (len(report['erreur_logiciel']) == 3)
    parent = dpe.find('*//enum_type_baie_id').getparent()
    parent.remove(parent.find('tv_ug_id'))
    dpe.find('*//tv_uw_id').text = '3'
    dpe.find('*//tv_sw_id').text = '3'
    dpe.find('*//sw').text = '0.4'
    dpe.find('*//enum_type_materiaux_menuiserie_id').text = '2'
    report = engine.run_controle_coherence(dpe)
    assert (len(report['erreur_logiciel']) == 0)


def test_controle_coherence_energie_vs_generateur():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    engine.controle_coherence_energie_vs_generateur(dpe.find('logement'), report)

    assert (report.error_software == [])

    dpe.find('.//generateur_chauffage//enum_type_energie_id').text = '8'

    engine.controle_coherence_energie_vs_generateur(dpe.find('logement'), report)

    assert (len(report.error_software) == 1)

    dpe.find('.//generateur_ecs//enum_type_energie_id').text = '8'
    report = ReportDPE()

    engine.controle_coherence_energie_vs_generateur(dpe.find('logement'), report)

    assert (len(report.error_software) == 2)


def test_controle_coherence_structure_installation_chauffage():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    report = ReportDPE()

    self = engine
    self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)

    assert (len(report.warning_software) == 0)
    gen = dpe.find('*//generateur_chauffage')
    gen_copy = copy.deepcopy(gen)

    gen_coll = gen.getparent()

    gen_coll.append(gen_copy)
    self = engine
    self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)
    assert (len(report.warning_software) == 1)
    dpe.find('*//emetteur_chauffage//enum_lien_generateur_emetteur_id').text = '3'
    self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)
    assert (len(report.error_software) == 2)
    report = ReportDPE()
    gen.find('*//enum_type_generateur_ch_id').text = '144'
    self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)
    assert (len(report.warning_software) == 0)

    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)

    report = ReportDPE()

    self = engine
    self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)

    assert (len(report.warning_software) == 0)

    gen = dpe.find('*//generateur_chauffage')
    gen_copy = copy.deepcopy(gen)

    gen_coll = gen.getparent()

    gen_coll.append(gen_copy)

    # installation avec sdb (donc deux générateurs)
    dpe.find('.//enum_cfg_installation_ch_id').text = '4'
    self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)

    assert (len(report.warning_software) == 0)

    # installation avec sdb (donc deux générateurs)
    # on ajoute un troisieme generateur et toujours pas d'erreur
    gen_coll.append(gen_copy)
    dpe.find('.//enum_cfg_installation_ch_id').text = '4'
    self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)

    assert (len(report.warning_software) == 0)

    # Nouveau test : Vérification des cas d'appoint avec enum_lien_generateur_emetteur_id incorrect
    for cfg_id in ['3', '4', '5', '7', '9', '10']:
        dpe.find('.//enum_cfg_installation_ch_id').text = cfg_id
        dpe.find('*//emetteur_chauffage//enum_lien_generateur_emetteur_id').text = '1'  # Cas erroné (sans appoint)
        dpe.find('*//generateur_chauffage//enum_lien_generateur_emetteur_id').text = '1'  # Cas erroné (sans appoint)

        report = ReportDPE()
        self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)
        assert (len(report.error_software) > 0), f"Aucune erreur détectée pour la configuration d'appoint {cfg_id} avec mauvais lien générateur-émetteur."


    # contrôle de cohérence sur l'adéquation régulation générateur associé

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_maison_1_valid_thermodynamique_multi_generateur.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)

    assert ((len(report.warning_software)+len(report.error_software)+len(report.error_input)+len(report.warning_input)) == 0)

    for gen, reg,em,em_distrib, nb_error in [('44', '1','7','21', 1), ('44', '14','7','21', 0), ('98', '1','7','1', 1), ('98', '3','7','1', 2), ('98', '7','7','1', 2), ('44', '10','7','21', 0),
                                  ('44', '1', '1','21', 2), ('44', '14', '5','21', 1), ('98', '1', '1','21', 1), ('98', '3', '7','1', 2), ('104', '3', '3','10', 1), ('104', '6', '3','10', 0), ('44', '10', '7','21', 0),
                                  ('49', '7', '7','11', 0), ('49', '11', '5','11', 0), ('91', '1', '1','11', 2), ('91', '7', '7','11', 0), ('91', '7', '5','11', 0), ('91', '6', '3','11', 2),
                                   ('49', '7', '7', '20', 1), ('49', '11', '5', '40', 1), ('91', '1', '1', '20', 3), ('91', '7', '7', '41', 0), ('91', '7', '5', '7', 1), ('91', '6', '3', '5', 2),
                                   ('114', '7', '7', '11', 0),('114', '14', '7', '11', 0),
                                             ]:

        dpe.find('*//enum_type_generateur_ch_id').text = gen
        dpe.find('*//enum_type_emission_distribution_id').text = em_distrib

        dpe.find('*//tv_rendement_regulation_id').text = reg
        dpe.find('*//tv_rendement_emission_id').text = em

        report = ReportDPE()

        self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)

        assert(len(report.error_software)==nb_error),(gen,reg,em,em_distrib,nb_error)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_maison_1_valid_thermodynamique_multi_generateur.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    for gen, reg, em, em_distrib, nb_error in [('44', '1', '7', '21', 1), ('44', '14', '7', '21', 0), ('98', '1', '7', '1', 1), ('98', '3', '7', '1', 2), ('98', '7', '7', '1', 2), ('44', '10', '7', '21', 0),
                                               ('44', '1', '1', '21', 2), ('44', '14', '5', '21', 1), ('98', '1', '1', '21', 1), ('98', '3', '7', '1', 2), ('104', '3', '3', '10', 1), ('104', '6', '3', '10', 0), ('44', '10', '7', '21', 0),
                                               ('49', '7', '7', '11', 0), ('49', '11', '5', '11', 0), ('91', '1', '1', '11', 2), ('91', '7', '7', '11', 0), ('91', '7', '5', '11', 0), ('91', '6', '3', '11', 2),
                                               ('49', '7', '7', '20', 1), ('49', '11', '5', '40', 1), ('91', '1', '1', '20', 3), ('91', '7', '7', '41', 0), ('91', '7', '5', '7', 1), ('91', '6', '3', '5', 2),
                                               ('114', '7', '7', '11', 0), ('114', '14', '7', '11', 0),
                                               ]:

        dpe.find('*//generateur_chauffage[2]//enum_type_generateur_ch_id').text = gen
        dpe.find('*//emetteur_chauffage[2]//enum_type_emission_distribution_id').text = em_distrib
        dpe.find('*//emetteur_chauffage[2]//tv_rendement_regulation_id').text = reg
        dpe.find('*//emetteur_chauffage[2]//tv_rendement_emission_id').text = em

        report = ReportDPE()

        self.controle_coherence_structure_installation_chauffage(dpe.find('logement'), report)

        assert (len(report.error_software) == nb_error), (gen, reg, em, em_distrib, nb_error)


def test_controle_coherence_type_regulation():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    report = ReportDPE()

    self = engine

    # Cas cohérent
    dpe.find('*//emetteur_chauffage//tv_rendement_regulation_id').text = '3' # Autres émetteurs à effet joule
    dpe.find('*//emetteur_chauffage//enum_type_regulation_id').text = '2' # AVEC régulation pièce par pièce
    self.controle_coherence_type_regulation(dpe.find('logement'), report)
    assert len(report.error_software) == 0, "Erreur détectée alors que la configuration est cohérente."

    # Cas incohérent
    dpe.find('*//emetteur_chauffage//tv_rendement_regulation_id').text = '12' # Radiateur eau chaude avec robinet thermostatique
    dpe.find('*//emetteur_chauffage//enum_type_regulation_id').text = '1' # sans régulation pièce par pièce
    report = ReportDPE()
    self.controle_coherence_type_regulation(dpe.find('logement'), report)
    assert len(report.error_software) > 0, "Aucuneerreur détectée alors que la configuration est incohérente."

    # fix du Cas incohérent
    dpe.find('*//emetteur_chauffage//enum_type_regulation_id').text = '2' # AVEC régulation pièce par pièce
    report = ReportDPE()
    self.controle_coherence_type_regulation(dpe.find('logement'), report)
    assert len(report.error_software) == 0, "erreur détectée alors que la configuration est cohérente."

    # cas null
    dpe.find('*//emetteur_chauffage//tv_rendement_regulation_id').text = '10' # Radiateur gaz
    dpe.find('*//emetteur_chauffage//enum_type_regulation_id').text = '2' # AVEC régulation pièce par pièce
    report = ReportDPE()
    self.controle_coherence_type_regulation(dpe.find('logement'), report)
    assert len(report.error_software) == 0, "Aucune Erreur détectée cas null."

    # cas null
    dpe.find('*//emetteur_chauffage//tv_rendement_regulation_id').text = '7'  # Radiateur elec accu
    dpe.find('*//emetteur_chauffage//enum_type_regulation_id').text = '1'  # AVEC régulation pièce par pièce
    report = ReportDPE()
    self.controle_coherence_type_regulation(dpe.find('logement'), report)
    assert len(report.error_software) == 0, "Aucune Erreur détectée cas null."


def test_controle_coherence_surface():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    report = ReportDPE()

    cg = dpe.find('*//caracteristique_generale')

    dpe.find('*//enum_methode_application_dpe_log_id').text = "6"

    etree.SubElement(cg, 'surface_habitable_immeuble').text = '45'
    engine.controle_coherence_surfaces(dpe.find('logement'), report)

    assert (len(report.error_software) == 3)

    etree.SubElement(cg, 'surface_tertiaire_immeuble').text = '45'
    report = ReportDPE()
    engine.controle_coherence_surfaces(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)

    report = ReportDPE()
    dpe.find('*//enum_methode_application_dpe_log_id').text = "1"
    engine.controle_coherence_surfaces(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)
    report = ReportDPE()
    dpe.find('*//surface_habitable_logement').text = "12"
    engine.controle_coherence_surfaces(dpe.find('logement'), report)
    assert (len(report.error_software) == 3)
    dpe.find('*//mur/donnee_entree/surface_aiu').text = '0.1'
    report = ReportDPE()
    engine.controle_coherence_surfaces(dpe.find('logement'), report)
    assert (len(report.error_software) == 4)

    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appartement_a_partir_immeuble_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_surfaces(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)
    # si on passe en appt normal toutes les surfaces sont des surfaces d'immeuble donc erreur
    dpe.find('*//enum_methode_application_dpe_log_id').text = '2'
    report = ReportDPE()
    engine.controle_coherence_surfaces(dpe.find('logement'), report)
    assert (len(report.error_software) >= 0)





def test_controle_coherence_energie():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    report = ReportDPE()

    engine.controle_coherence_energie_entree_sortie(dpe.find('logement'), report)

    assert (len(report.error_software) == 0)

    dpe.find('*//generateur_chauffage/donnee_entree/enum_type_energie_id').text = "13"

    dpe.find('*//sortie_par_energie/enum_type_energie_id').text = "9"

    engine.controle_coherence_energie_entree_sortie(dpe.find('logement'), report)

    assert (len(report.error_software) == 3)

    dpe = etree.parse(f, parser)
    report = ReportDPE()

    # si les consommations en sortie sont = 0 -> warning
    dpe.find('*//sortie_par_energie/conso_ecs').text = "0"
    dpe.find('*//sortie_par_energie/conso_ch').text = "0"

    engine.controle_coherence_energie_entree_sortie(dpe.find('logement'), report)

    assert (len(report.error_software) == 0)
    assert (len(report.warning_software) == 2)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    for el in dpe.iterfind('*//climatisation/donnee_entree/enum_type_energie_id'):
        el.text = "12"

    engine.controle_coherence_energie_entree_sortie(dpe.find('logement'), report)

    assert (len(report.error_software) == 2)


def test_controle_coherence_rset_rsee():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_2_neuf_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_rset_rsee(dpe, report)
    assert (len(report.error_software) == 0)


def test_controle_coherence_hors_methode():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_hors_methode(dpe.find('logement'), report)
    assert (len(report.warning_input) == 0)

    dpe.find('*//enum_materiaux_structure_mur_id').text = "21"
    report = ReportDPE()
    engine.controle_coherence_hors_methode(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)


def test_controle_coherence_pont_thermique():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 0)
    report = ReportDPE()
    for mur in dpe.iterfind('*//mur//enum_type_isolation_id'):
        mur.text = "1"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 0)
    report = ReportDPE()
    dpe.find('*//enum_periode_construction_id').text = "7"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)

    dpe = etree.parse(f, parser)
    dpe.find('*//enum_methode_application_dpe_log_id').text = "1"
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)
    dpe.find('*//enveloppe').remove(dpe.find('*//enveloppe/pont_thermique_collection'))
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    for el in dpe.iterfind('*//pont_thermique/donnee_entree/tv_pont_thermique_id'):
        id_ = int(el.text)
        id_ += 5
        el.text = str(id_)
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    dpe.find('*//pont_thermique/donnee_entree/tv_pont_thermique_id').text = "22"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)
    report = ReportDPE()
    dpe.find('*//pont_thermique/donnee_entree/tv_pont_thermique_id').text = "42"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    # test ossature bois
    dpe.find('*//pont_thermique/donnee_entree/tv_pont_thermique_id').text = "69"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)
    report = ReportDPE()
    dpe.find('*//mur/donnee_entree/enum_materiaux_structure_mur_id').text = "25"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 0)
    dpe.find('*//pont_thermique/donnee_entree/tv_pont_thermique_id').text = "66"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)
    assert ('ossature' in report.warning_input[0]['message'])

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)
    dpe.find('*//porte//enum_type_pose_id').text = "3"
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)
    report = ReportDPE()
    dpe.find('*//pont_thermique//tv_pont_thermique_id').text = "76"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 3)
    report = ReportDPE()
    dpe.find('*//porte//enum_type_pose_id').text = "1"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 3)
    report = ReportDPE()
    dpe.find('*//porte//enum_type_pose_id').text = "2"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)
    report = ReportDPE()
    dpe.find('*//porte//enum_type_pose_id').text = "1"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 3)
    report = ReportDPE()
    dpe.find('*//baie_vitree//enum_type_pose_id').text = "2"
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)


    # contrôles de cohérences pont thermique bloquants

    # test qu'un DPE sans paroi_lourde ne fait pas crasher le calcul
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference_2.4.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (report.error_input == [])

    # test pas d'erreur
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (report.error_input == [])


    # on supprime tous les pt murs/baies -> ERREUR
    type_liaison_num = [(int(el.text),el) for el in
                        list(dpe.find('logement').iterfind('*//pont_thermique/donnee_entree/enum_type_liaison_id'))]
    for i,el in type_liaison_num:
        if i==5:
            el.getparent().getparent().getparent().remove(el.getparent().getparent())

    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)

    # on supprime les murs extérieurs on a plus d'erreur
    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/enum_type_adjacence_id'):
        el.text='3'
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.error_input) == 0)

    dpe = etree.parse(f, parser)
    report = ReportDPE()

    # on supprime tous les pt murs/plancher bas -> ERREUR
    type_liaison_num = [(int(el.text),el) for el in
                        list(dpe.find('logement').iterfind('*//pont_thermique/donnee_entree/enum_type_liaison_id'))]
    for i,el in type_liaison_num:
        if i==1:
            el.getparent().getparent().getparent().remove(el.getparent().getparent())

    # on passe les plancher bas en inertie lourde
    for el in dpe.find('logement').iterfind('*//plancher_bas/donnee_entree/paroi_lourde'):
        el.text='1'

    # on passe les murs extérieurs en inertie lourde
    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/paroi_lourde'):
        el.text='1'

    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 3)

    # un seul mur n'est pas lourd -> plus d'erreur
    el.text='0'
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)
    el.text = '1'
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 3)

    # on passe les plancher bas en inertie légère
    for el in dpe.find('logement').iterfind('*//plancher_bas/donnee_entree/paroi_lourde'):
        el.text='0'
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)

    dpe = etree.parse(f, parser)

    # on supprime tous les pt murs/plancher haut -> ERREUR
    type_liaison_num = [(int(el.text),el) for el in
                        list(dpe.find('logement').iterfind('*//pont_thermique/donnee_entree/enum_type_liaison_id'))]
    for i,el in type_liaison_num:
        if i==3:
            el.getparent().getparent().getparent().remove(el.getparent().getparent())

    # on passe les plancher haut en inertie lourde
    for el in dpe.find('logement').iterfind('*//plancher_haut/donnee_entree/paroi_lourde'):
        el.text='1'
    # on passe les murs extérieurs en inertie lourde
    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/paroi_lourde'):
        el.text='1'
    report = ReportDPE()
    engine.controle_coherence_pont_thermique(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)

def test_controle_coherence_paroi_lourde():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    # test qu'un DPE sans paroi_lourde ne fait pas crasher le calcul
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/paroi_lourde'):
        el.text='0'

    engine.controle_coherence_paroi_lourde(dpe.find('logement'), report)

    assert (len(report.error_input) == 0)

    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/enum_type_isolation_id'):
        el.text='4'
    engine.controle_coherence_paroi_lourde(dpe.find('logement'), report)
    assert (len(report.error_input) == 1)
    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/epaisseur_structure'):
        el.text='4'
    report = ReportDPE()
    engine.controle_coherence_paroi_lourde(dpe.find('logement'), report)
    assert (len(report.error_input) == 0)

    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/epaisseur_structure'):
        el.text='40'
    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/enum_materiaux_structure_mur_id'):
        el.text='10'
    report = ReportDPE()
    engine.controle_coherence_paroi_lourde(dpe.find('logement'), report)
    assert (len(report.error_input) == 0)
    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/enum_materiaux_structure_mur_id'):
        el.text='11'
    report = ReportDPE()
    engine.controle_coherence_paroi_lourde(dpe.find('logement'), report)
    assert (len(report.error_input) == 1)


    for el in dpe.find('logement').iterfind('*//mur/donnee_entree/enum_materiaux_structure_mur_id'):
        el.text='19'
    report = ReportDPE()
    engine.controle_coherence_paroi_lourde(dpe.find('logement'), report)
    assert (len(report.error_input) == 1)

def test_controle_coherence_existence_composants():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_existence_composants(dpe.find('logement'), report)

    assert (len(report.warning_input) == 0)
    dpe.find('*//enum_methode_application_dpe_log_id').text = "1"
    methode_dpe = int(dpe.find('*//enum_methode_application_dpe_log_id').text)
    type_batiment = engine.enum_table['methode_application_dpe_log'].loc[methode_dpe].type_batiment
    for element in expected_components[type_batiment]:
        collection = dpe.find(f'*//{element}_collection')
        collection.getparent().remove(collection)
    engine.controle_coherence_existence_composants(dpe.find('logement'), report)

    assert (len(report.warning_input) == 10)


def test_controle_coherence_enveloppe():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)
    assert (len(report.warning_input) == 0)

    type_isolation = [el for el in dpe.iterfind('*//enum_type_isolation_id')]
    type_isolation_lnc = [el for el in type_isolation if el.getparent().find('enum_cfg_isolation_lnc_id') is not None]
    type_isolation_lnc[0].getparent().find('enum_type_isolation_id').text = '4'
    report = ReportDPE()
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)
    dpe = etree.parse(f, parser)
    type_isolation = [el for el in dpe.iterfind('*//enum_type_isolation_id')]
    type_isolation_lnc = [el for el in type_isolation if el.getparent().find('enum_cfg_isolation_lnc_id') is not None]
    type_isolation_lnc[0].getparent().find('enum_type_isolation_id').text = '1'
    dpe.find('*//enum_periode_construction_id').text = '7'
    report = ReportDPE()
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)
    dpe.find('*//enum_periode_construction_id').text = '1'
    report = ReportDPE()
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)
    assert (len(report.warning_input) == 0)
    de = dpe.find('*//mur/donnee_entree')
    enum_periode_isolation_id = etree.SubElement(de, 'enum_periode_isolation_id')
    enum_periode_isolation_id.text = '1'
    dpe.find('*//enum_periode_construction_id').text = '2'
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)
    assert (len(report.warning_input) == 1)
    report = ReportDPE()
    dpe.find('*//enum_type_adjacence_id').text = '3'
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)
    assert (len(report.warning_input) == 4)

    report = ReportDPE()
    dpe.find('*//b').text = '0'
    aue = dpe.find('*//surface_aue')
    aue.text = '0.01'
    aue.getparent().getparent().find('*//b').text = '0'
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)

    assert (len(report.warning_input) == 6)
    report = ReportDPE()
    dpe.find('*//b').text = '1'
    tv = dpe.find('*//tv_coef_reduction_deperdition_id')
    tv.getparent().remove(tv)
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)
    # for w in report.warning_input:
    #     print(w['message'])
    assert (len(report.warning_input) == 6)

    # test surface non déperditive.
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    dpe.find('*//b').text = '0'
    dpe.find('*//tv_coef_reduction_deperdition_id').text = '283'
    engine.controle_coherence_enveloppe(dpe.find('logement'), report)
    assert (len(report.warning_input) == 0)

    # test matériaux auto isolant qui ne déclenchent plus le warning sur la cohérence d'isolation entre calcul b et déclaration.

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = engine.run_controle_coherence(dpe)
    assert (len(report['warning_saisie']) == 6)

    mur_adj = list(dpe.iterfind('*//mur'))[1]
    mur_adj.find('*//enum_materiaux_structure_mur_id').text = '26'
    mur_adj = list(dpe.iterfind('*//mur'))[2]
    mur_adj.find('*//enum_materiaux_structure_mur_id').text = '24'
    report = engine.run_controle_coherence(dpe)
    assert (len(report['warning_saisie']) == 4)


def test_controle_coherence_systeme():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_systeme(dpe.find('logement'), report)
    assert (len(report.warning_input) == 0)
    dpe.find('*//enum_periode_construction_id').text = '8'

    dpe.find('*//enum_type_ventilation_id').text = '3'
    engine.controle_coherence_systeme(dpe.find('logement'), report)

    assert (len(report.warning_input) == 1)
    dpe.find('*//enum_type_generateur_ch_id').text = '83'
    di = dpe.find('*//generateur_chauffage/donnee_intermediaire')
    set_xml_values_from_dict(di, {'rpn': 0.9,
                                  'rpint': 0.81})
    report = ReportDPE()
    engine.controle_coherence_systeme(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)

    dpe.find('*//enum_type_generateur_ch_id').text = '87'
    set_xml_values_from_dict(di, {'rpn': 0.3,
                                  'rpint': 0.81})
    report = ReportDPE()
    engine.controle_coherence_systeme(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)

    dpe.find('*//enum_classe_inertie_id').text = '4'
    report = ReportDPE()
    engine.controle_coherence_systeme(dpe.find('logement'), report)
    assert (len(report.warning_input) == 3)

    dpe = etree.parse(f, parser)
    dpe.find('*//enum_type_generateur_ch_id').text = '55'
    dpe.find('*//enum_methode_application_dpe_log_id').text = '1'
    dpe.find('*//enum_type_generateur_ecs_id').text = '24'
    report = ReportDPE()
    engine.controle_coherence_systeme(dpe.find('logement'), report)
    assert (len(report.warning_input) == 2)


def test_generateur_cascade_sans_priorite():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_generation_cascade_2.5.xml'))
    dpe = etree.parse(f, parser)
    report = engine.run_controle_coherence(dpe)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors == 0)
    L_warning = len(report['warning_logiciel']) + len(report['warning_saisie'])
    for el in dpe.iterfind('*//priorite_generateur_cascade'):
        el.text = '1'
    for el in dpe.iterfind('*//conso_ch'):
        el.text = '1'
    for el in dpe.iterfind('*//conso_ch_depensier'):
        el.text = '1'
    for el in dpe.iterfind('*//rendement_generation'):
        el.text = '1'
    report = engine.run_controle_coherence(dpe)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors == 0)
    L_warning_sans_priorite = len(report['warning_logiciel']) + len(report['warning_saisie'])

    assert (L_warning_sans_priorite == L_warning)


def test_controle_coherence_consommation_0_generateur_installation():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_generation_cascade_2.5.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()

    for prop in ['rendement_generation', 'conso_ch_depensier', 'conso_ch']:
        for el in dpe.iterfind(f'*//generateur_chauffage//{prop}'):
            el.text = str(0)

    engine.controle_coherence_consommation_0_generateur_installation(dpe.find('logement'), report)
    assert (len(report.error_software) == 3)

    dpe.find('*//enum_cfg_installation_ch_id').text = '10'
    report = ReportDPE()
    engine.controle_coherence_consommation_0_generateur_installation(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)

    dpe.find('*//enum_cfg_installation_ch_id').text = '1'
    dpe.find('*//priorite_generateur_cascade').text = '2'
    report = ReportDPE()
    engine.controle_coherence_consommation_0_generateur_installation(dpe.find('logement'), report)
    assert (len(report.error_software) == 1)

    # TESTS concernants les fch et fecs =1

    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_ecs_solaire_expert_2.5.xml'))
    dpe = etree.parse(f, parser)

    # si les consommations d'ecs sont 0 alors erreur
    dpe.find('*//installation_ecs/donnee_intermediaire/conso_ecs').text = '0'
    dpe.find('*//installation_ecs/donnee_intermediaire/conso_ecs_depensier').text = '0'

    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) == 2)

    # si fecs = 1 plus d'erreur

    dpe.find('*//installation_ecs/donnee_intermediaire/fecs').text = '1'
    dpe.find('*//installation_ecs/donnee_entree/fecs_saisi').text = '1'

    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) == 0)

    dpe = etree.parse(f, parser)  # reinit

    # si les consommations d'ecs sont 0 alors erreur
    dpe.find('*//generateur_ecs/donnee_intermediaire/conso_ecs').text = '0'
    dpe.find('*//generateur_ecs/donnee_intermediaire/conso_ecs_depensier').text = '0'

    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) == 2)

    # si fecs = 1 plus d'erreur

    dpe.find('*//installation_ecs/donnee_intermediaire/fecs').text = '1'
    dpe.find('*//installation_ecs/donnee_entree/fecs_saisi').text = '1'

    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) == 0)

    dpe = etree.parse(f, parser)  # reinit

    # si les consommations d'ecs sont 0 alors erreur
    dpe.find('*//installation_chauffage/donnee_intermediaire/conso_ch').text = '0'
    dpe.find('*//installation_chauffage/donnee_intermediaire/conso_ch_depensier').text = '0'

    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) == 2)

    # si fecs = 1 plus d'erreur

    dpe.find('*//installation_chauffage/donnee_intermediaire/fch').text = '1'
    dpe.find('*//installation_chauffage/donnee_entree/fch_saisi').text = '1'

    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) == 0)

    dpe = etree.parse(f, parser)  # reinit

    # si les consommations de chauffage sont 0 alors erreur
    dpe.find('*//generateur_chauffage/donnee_intermediaire/conso_ch').text = '0'
    dpe.find('*//generateur_chauffage/donnee_intermediaire/conso_ch_depensier').text = '0'
    # suppression de la sortie par énergie gaz car plus aucune consommation de gaz non nulle.
    sortie_par_energie_gaz = list(dpe.iterfind('*//sortie_par_energie'))[1]
    sortie_par_energie_gaz.getparent().remove(sortie_par_energie_gaz)
    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) >= 2)

    # si fecs = 1 plus d'erreur

    dpe.find('*//installation_chauffage/donnee_intermediaire/fch').text = '1'
    dpe.find('*//installation_chauffage/donnee_entree/fch_saisi').text = '1'

    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) == 0)

    # CAS BESOIN CHAUFFAGE 0

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_2.5.xml'))
    dpe = etree.parse(f, parser)
    for prop in ['rendement_generation', 'conso_ch_depensier', 'conso_ch']:
        for el in dpe.iterfind(f'*//generateur_chauffage//{prop}'):
            el.text = str(0)
    report = engine.run_controle_coherence(dpe)
    # les 3 erreurs 0 + l'erreur de conso sortie non cohérente
    assert (len(report['erreur_logiciel']) == 4)

    for prop in ['besoin_ch_depensier', 'besoin_ch']:
        for el in dpe.iterfind(f'*//installation_chauffage//{prop}'):
            el.text = '0'

    report = engine.run_controle_coherence(dpe)
    # l'erreur de conso sortie non cohérente + rendement 0
    assert (len(report['erreur_logiciel']) == 2)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_2.5.xml'))
    dpe = etree.parse(f, parser)
    for prop in ['conso_ch_depensier', 'conso_ch']:
        for el in dpe.iterfind(f'*//generateur_chauffage//{prop}'):
            el.text = str(0)

    report = engine.run_controle_coherence(dpe)
    # les 2 erreurs 0 + l'erreur de conso sortie non cohérente
    assert (len(report['erreur_logiciel']) == 3)

    for prop in ['besoin_ch_depensier', 'besoin_ch']:
        for el in dpe.iterfind(f'*//installation_chauffage//{prop}'):
            el.text = '0'

    report = engine.run_controle_coherence(dpe)
    # l'erreur de conso sortie non cohérente
    assert (len(report['erreur_logiciel']) == 1)

    for prop in ['conso_ch', 'conso_ch_depensier']:
        for el in dpe.iterfind(f'*//sortie//{prop}'):
            el.text = '0'
    report = engine.run_controle_coherence(dpe)

    # l'erreur de conso sortie non cohérente

    assert (len(report['erreur_logiciel']) == 1)

    # suppression de conso sortie non cohérente

    sortie_gaz = list(dpe.iterfind('*//sortie_par_energie'))[1]
    sortie_gaz.getparent().remove(sortie_gaz)

    report = engine.run_controle_coherence(dpe)
    assert (len(report['erreur_logiciel']) == 0)


def test_controle_coherence_cle_repartition_dpe_appartement():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    dpe.find('*//enum_methode_application_dpe_log_id').text = '13'  # passage en dpe à l'appartement
    engine.controle_coherence_cle_repartition_dpe_appartement(dpe.find('logement'), report)
    assert (len(report.error_software) == 5)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appartement_a_partir_immeuble_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_cle_repartition_dpe_appartement(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)


def test_forbid_req():
    engine = EngineDPE()

    self = engine

    for k, v in self.var_req_dict.items():
        for id_, var in v.items():
            if id_ in self.var_forbid_dict.get(k, {}):
                var = re.split('[(),|]', var)
                var_forbid = re.split('[(),|]', self.var_forbid_dict[k][id_])
                if len(set(var) & set(var_forbid)) > 0:
                    raise Exception('{set(var)&set(var_forbid)} both required and forbid')


def test_controle_coherence_conso_nulle():
    _set_version_dpe_to_valid_dates()
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)
    sortie = dpe.find('*//sortie')
    for el in ['ef_conso/conso_ecs', 'ef_conso/conso_ecs_depensier', 'ef_conso/conso_ch', 'ef_conso/conso_ch_depensier',
               'ep_conso/ep_conso_ecs', 'ep_conso/ep_conso_ecs_depensier', 'ep_conso/ep_conso_ch', 'ep_conso/ep_conso_ch_depensier',
               'emission_ges/emission_ges_ecs', 'emission_ges/emission_ges_ecs_depensier', 'emission_ges/emission_ges_ch', 'emission_ges/emission_ges_ch_depensier',
               'cout/cout_ecs', 'cout/cout_ecs_depensier', 'cout/cout_ch', 'cout/cout_ch_depensier',
               ]:
        sortie.find(el).text = '0'
    output = engine.run_controle_coherence(dpe)
    assert (output['validation_xsd']['valid'] == True)


def test_controle_coherence_fch_fecs_saisi():
    engine = EngineDPE()

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_ecs_solaire_expert_2.5.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('*//fecs_saisi').text = '0.42'
    dpe.find('*//fch_saisi').text = '0.42'
    report = engine.run_controle_coherence(dpe)

    assert (len(report['erreur_logiciel']) == 2)


# TODO : @Antoine on ne doit pas l'appliquer lui à l'audit ?
def test_controle_coherence_ref_dpe_immeuble():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appartement_a_partir_immeuble_valid.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_ref_dpe_immeuble(dpe, report)
    assert (len(report.error_input) == 0)
    el = dpe.find('*//dpe_immeuble_associe')
    el.getparent().remove(el)
    report = ReportDPE()
    engine.controle_coherence_ref_dpe_immeuble(dpe, report)
    assert (len(report.error_input) == 1)


def test_controle_coherence_unicite_reference():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_unicite_reference(dpe.find('logement'), report)
    print(report.error_software)
    assert (len(report.error_software) == 0)
    for el in dpe.iterfind('*//reference'):
        el.text = 'toto'
    engine.controle_coherence_unicite_reference(dpe.find('logement'), report)
    assert (len(report.error_software) == 1)


def test_controle_coherence_modele_methode_application():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')
    engine.controle_coherence_modele_methode_application(logement, report)
    assert (len(report.error_software) == 0)
    report = ReportDPE()
    # test incohérence méthode
    dpe.find('*//enum_modele_dpe_id').text = '2'
    engine.controle_coherence_modele_methode_application(logement, report)
    assert (len(report.error_software) == 1)
    # test remise en cohérence neuf
    report = ReportDPE()
    dpe.find('*//enum_methode_application_dpe_log_id').text = '15'
    engine.controle_coherence_modele_methode_application(logement, report)
    assert (len(report.error_software) == 0)

    engine = EngineAudit()
    for valid_example in VALID_CASES_AUDIT:
        f = str((engine.mdd_path / 'exemples_metier' / valid_example))
        audit = etree.parse(f, parser)
        report = ReportAudit()
        # test non homogénéité des méthodes d'application -> Pour l'instant le modèle audit refuse les appartements générés à partir de l'immmeuble
        audit.find('*//enum_methode_application_dpe_log_id').text = '10'
        logement = audit.find('*//logement')
        engine.controle_coherence_modele_methode_application(logement, report)
        assert (len(report.error_software) == 1)
        # test non homogénéité des méthodes d'application -> Pour l'instant le modèle audit refuse tout le neuf par défaut
        audit.find('*//enum_methode_application_dpe_log_id').text = '15'
        logement = audit.find('*//logement')
        report = ReportAudit()
        engine.controle_coherence_modele_methode_application(logement, report)
        assert (len(report.error_software) == 1)
        # test homogénéité des méthodes d'application -> Pour l'instant le modèle audit refuse tout le neuf par défaut
        iter = 0
        for el in audit.iterfind('*//enum_methode_application_dpe_log_id'):
            el.text = '15'
            iter += 1

        report = ReportAudit()
        for logement in audit.iterfind('*//logement'):
            engine.controle_coherence_modele_methode_application(logement, report)
        assert (len(report.error_software) == iter)

        if "audit_copro" in valid_example:
            # test l'Audit Copro n'est pas compatible avec la methode maison individuelle
            iter = 0
            for el in audit.iterfind('*//enum_methode_application_dpe_log_id'):
                el.text = '1' # dpe maison individuelle
                iter += 1
            report = ReportAudit()
            for logement in audit.iterfind('*//logement'):
                engine.controle_coherence_modele_methode_application(logement, report)
            assert (len(report.error_software) == iter)
            # test l'Audit Copro n'est pas compatible avec la methode appartement
            iter = 0
            for el in audit.iterfind('*//enum_methode_application_dpe_log_id'):
                el.text = '2' # dpe appartement individuel chauffage individuel ecs individuel
                iter += 1
            report = ReportAudit()
            for logement in audit.iterfind('*//logement'):
                engine.controle_coherence_modele_methode_application(logement, report)
            assert (len(report.error_software) == iter)
            # test l'Audit Copro EST compatible avec la methode Immeuble
            for el in audit.iterfind('*//enum_methode_application_dpe_log_id'):
                el.text = '6' # dpe immeuble collectif chauffage individuel ecs individuel
            report = ReportAudit()
            for logement in audit.iterfind('*//logement'):
                engine.controle_coherence_modele_methode_application(logement, report)
            assert (len(report.error_software) == 0)


def test_controle_coherence_calcul_echantillonage():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_calcul_echantillonage(dpe.find('logement'), report)
    assert (len(report.error_software) == 0)

    # test que enum_calcul_echantillonage doit déclencher une erreur si non déclaré.
    enum_calcul_echantillonnage_id = dpe.find('*//enum_calcul_echantillonnage_id')
    enum_calcul_echantillonnage_id.getparent().remove(enum_calcul_echantillonnage_id)
    report = ReportDPE()
    engine.controle_coherence_calcul_echantillonage(dpe.find('logement'), report)
    assert (len(report.error_software) == 1)


def test_controle_coherence_logement_visite():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_logement_visite(dpe, report)
    assert (len(report.error_software) == 0)

    # test que enum_calcul_echantillonage doit déclencher une erreur si non déclaré.

    to_remove = dpe.find('dpe_immeuble')
    to_remove.getparent().remove(to_remove)
    report = ReportDPE()
    engine.controle_coherence_logement_visite(dpe.find('logement'), report)
    assert (len(report.error_software) == 1)

    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml'))  # TODO : @Antoine Dois-je créer un cas test immeuble ?
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_logement_visite(audit, report)
    assert (len(report.error_software) == 0)

    # Change la méthode d'un logement en "dpe immeuble collectif", afin d'ajouter 1 erreur : méthode immeuble sans DPE_immeuble renseigné !
    logement = list(audit.iterfind('*//logement'))[0]
    report = ReportAudit()
    logement.find('*//enum_methode_application_dpe_log_id').text = '6'
    engine.controle_coherence_logement_visite(audit, report)
    assert (len(report.error_software) == 1)


def test_controle_coherence_double_fenetre():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_double_fenetre.xml'))
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_double_fenetre(dpe, report)
    assert (len(report.error_software) == 0)
    # si double fenetre sans sous structure -> erreur
    el = dpe.find('*//baie_vitree_double_fenetre')
    el.getparent().remove(el)
    report = ReportDPE()
    engine.controle_coherence_double_fenetre(dpe, report)
    assert (len(report.error_software) == 1)
    # LE DPE 2.2 N EST PLUS ACCEPTÉ !
    ## si ancienne version pas d'erreur
    # dpe.find('*//enum_version_id').text = '2.2'
    # report = engine.run_controle_coherence(dpe)
    # assert (len(report['erreur_logiciel']) == 0)

    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v1.1_valid_double_fenetre.xml'))
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_double_fenetre(audit, report)
    assert (len(report.error_software) == 0)
    # si double fenetre sans sous structure -> erreur
    el = audit.find('*//baie_vitree_double_fenetre')
    el.getparent().remove(el)
    report = ReportAudit()
    engine.controle_coherence_double_fenetre(audit, report)
    assert (len(report.error_software) == 1)


def test_controle_coherence_pveilleuse():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_anomalie_veilleusev2.2.xml'))
    # cas de base génère l'erreur
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_presence_veilleuse(dpe, report)
    assert (len(report.warning_software) == 1)

    # on met une chaudière neuve -> plus d'erreur
    dpe.find('*//enum_type_generateur_ch_id').text = '97'
    report = ReportDPE()
    engine.controle_coherence_presence_veilleuse(dpe, report)
    assert (len(report.warning_software) == 0)

    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_tout_chaudiere.xml'))
    # cas valide sans erreur
    dpe = etree.parse(f, parser)
    report = ReportDPE()
    engine.controle_coherence_presence_veilleuse(dpe, report)
    assert (len(report.warning_software) == 0)
    # suppression des veilleuses lèvent des erreurs

    pveil = dpe.find('*//generateur_ecs/donnee_intermediaire/pveilleuse')
    pveil.getparent().remove(pveil)
    report = ReportDPE()
    engine.controle_coherence_presence_veilleuse(dpe, report)
    assert (len(report.warning_software) == 1)
    pveil = dpe.find('*//generateur_chauffage/donnee_intermediaire/pveilleuse')
    pveil.getparent().remove(pveil)
    report = ReportDPE()
    engine.controle_coherence_presence_veilleuse(dpe, report)
    assert (len(report.warning_software) == 2)
    # on met une chaudière neuve -> plus d'erreur
    dpe.find('*//enum_type_generateur_ch_id').text = '97'
    dpe.find('*//enum_type_generateur_ecs_id').text = '57'
    report = ReportDPE()
    engine.controle_coherence_presence_veilleuse(dpe, report)
    assert (len(report.warning_software) == 0)


def test_controle_coherence_arrete_reseau_chaleur():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_reseau_chaleur_2.4.xml'))
    # cas de base sans erreur
    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    assert (len(report.error_software) == 0)
    assert (len(report.warning_software) == 0)
    assert (len(report.error_input) == 0)
    assert (len(report.warning_input) == 0)
    el = logement.find('*//identifiant_reseau_chaleur').getparent()
    date_arrete_reseau_chaleur = el.find('date_arrete_reseau_chaleur')
    el.remove(date_arrete_reseau_chaleur)
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    assert (len(report.error_software) == 1)

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_reseau_chaleur_2.4.xml'))

    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')

    logement.find('*//identifiant_reseau_chaleur').text = '9999C'
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    assert (len(report.warning_input) == 0)
    assert (len(report.error_input) == 1)

    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')
    # erreur mauvaise date
    logement.find('*//date_arrete_reseau_chaleur').text = '2021-10-22'
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    assert (len(report.error_software) == 1)

    # vérification du contrôle en mode warning
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=False, now=get_datetime_now(None))
    assert (len(report.warning_software) == 1)
    assert (len(report.error_software) == 0)

    # vérification du contrôle en mode warning
    report = engine.run_controle_coherence(dpe, report, datetime_now='2024-07-01')
    assert (len(report['erreur_logiciel'] + report['erreur_saisie']) == 0)
    assert (True in ["réseau de chaleur" in el['thematique'] for el in report['warning_logiciel']])

    # erreur arrêté obsolète
    logement.find('*//date_arrete_reseau_chaleur').text = '2020-10-12'
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    assert (len(report.error_software) == 1)

    # pour les versions futures on laisse passer
    logement.find('*//date_arrete_reseau_chaleur').text = '2200-10-12'
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    assert (len(report.error_software) == 0)

    logement.find('*//identifiant_reseau_chaleur').text = '9999C'
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    assert (len(report.warning_input) == 0)

    logement.find('*//identifiant_reseau_chaleur').text = '9999C'
    logement.find('*//date_arrete_reseau_chaleur').text = engine.arrete_reseau_chaleur[-1]['date_arrete_reseau_chaleur']

    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    assert (len(report.warning_input) == 0)
    assert (len(report.error_input) == 1)

    assert (len(report.error_software) == 0)

    logement.find('*//identifiant_reseau_chaleur').text = '9999C'
    logement.find('*//date_arrete_reseau_chaleur').text = engine.arrete_reseau_chaleur[0]['date_arrete_reseau_chaleur']
    engine.arrete_reseau_chaleur[0]['date_fin'] = '2200-01-01'
    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=get_datetime_now(None))
    # le warning identifiant n'est pas levé car pour les premiers arrêtés réseau il n'y avait pas d'identifiant
    assert (len(report.warning_input) == 0)
    assert (len(report.error_software) == 0)

    # erreur si on est au delà de la date d'expiration
    logement.find('*//identifiant_reseau_chaleur').text = '9999C'
    logement.find('*//date_arrete_reseau_chaleur').text = engine.arrete_reseau_chaleur[-2]['date_arrete_reseau_chaleur']
    now = pd.to_datetime(engine.arrete_reseau_chaleur[-2]['date_fin']) + pd.Timedelta('1D')

    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=now)

    assert (len(report.warning_input) == 0)
    assert (len(report.error_input) == 1)

    assert (len(report.error_software) == 1)
    assert (len(report.warning_software) == 0)

    # avertissement si on est avant la date d'expiration mais après la date d'entrée en vigueur du nouvel arrêté

    logement.find('*//identifiant_reseau_chaleur').text = '9999C'
    logement.find('*//date_arrete_reseau_chaleur').text = engine.arrete_reseau_chaleur[-2]['date_arrete_reseau_chaleur']
    now = pd.to_datetime(engine.arrete_reseau_chaleur[-2]['date_fin']) - pd.Timedelta('1D')

    report = ReportDPE()
    engine.controle_coherence_reseau_chaleur(logement, report, is_blocker=True, now=now)

    assert (len(report.warning_input) == 0)
    assert (len(report.error_input) == 1)
    assert (len(report.warning_software) == 1)
    assert (len(report.error_software) == 0)


def test_controle_coherence_calcul_ue():
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')
    report = ReportDPE()
    engine.controle_coherence_calcul_ue(logement, report, is_blocker=True)
    assert (len(report.error_software) == 0)

    # test suppression des paramètres requis déclenche erreur
    for el in ['surface_ue', 'perimetre_ue', 'ue']:
        dpe = etree.parse(f, parser)
        logement = dpe.find('logement')
        el = logement.find(f'*//{el}')
        el.getparent().remove(el)
        report = ReportDPE()
        engine.controle_coherence_calcul_ue(logement, report, is_blocker=True)
        assert (len(report.error_software) == 1)

    # on ne dit pas que l'on calcule le ue alors qu'on le fait -> erreur
    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')
    logement.find('*//calcul_ue').text = '0'
    report = ReportDPE()
    engine.controle_coherence_calcul_ue(logement, report, is_blocker=True)
    assert (len(report.error_software) == 1)

    # vérification du contrôle en mode warning
    report = ReportDPE()
    engine.controle_coherence_calcul_ue(logement, report, is_blocker=False)
    assert (len(report.warning_software) == 1)
    assert (len(report.error_software) == 0)

    # vérification du contrôle en mode warning
    report = engine.run_controle_coherence(dpe, report, datetime_now=DATE_TEST_POST_DPE_latest)
    assert (len(report['erreur_logiciel'] + report['erreur_saisie']) == 1)
    assert (len(report['warning_logiciel']) == 0)

    # test si on est plus dans le cas d'un calcul ue on a tous les avertissements comme quoi c'est pas bon

    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')
    logement.find('*//plancher_bas//enum_type_adjacence_id').text = '1'
    report = ReportDPE()
    engine.controle_coherence_calcul_ue(logement, report, is_blocker=True)
    assert (len(report.error_software) == 5)

    # test si upb=upb_final on fait disparaitre une erreur

    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')
    logement.find('*//plancher_bas//upb').text = logement.find('*//plancher_bas//upb_final').text
    logement.find('*//plancher_bas//enum_type_adjacence_id').text = '1'
    report = ReportDPE()
    engine.controle_coherence_calcul_ue(logement, report, is_blocker=True)
    assert (len(report.error_software) == 4)
    # test suppression des paramètres ue ne déclenche plus d'erreur associée
    for el in ['surface_ue', 'perimetre_ue', 'ue']:
        logement = dpe.find('logement')
        el = logement.find(f'*//{el}')
        el.getparent().remove(el)
        report = ReportDPE()
        engine.controle_coherence_calcul_ue(logement, report, is_blocker=True)
    assert (len(report.error_software) == 1)

    # si on passe en calcul ue = 0 alors ca y est plus d'erreur
    logement.find('*//plancher_bas//calcul_ue').text = '0'
    report = ReportDPE()
    engine.controle_coherence_calcul_ue(logement, report, is_blocker=True)
    assert (len(report.error_software) == 0)

    # test si ue != u_plancher_bas -> erreur
    dpe = etree.parse(f, parser)
    logement = dpe.find('logement')
    logement.find('*//plancher_bas//ue').text = '1'
    engine.controle_coherence_calcul_ue(logement, report, is_blocker=True)
    assert (len(report.error_software) == 1)


def test_controle_coherence_consentement_proprietaire():
    _set_version_dpe_to_valid_dates()
    engine = EngineDPE()
    report = ReportDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference_2.4.xml'))
    dpe = etree.parse(f, parser)
    el = dpe.find('.//information_consentement_proprietaire//siren_proprietaire')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 1)

    dpe = etree.parse(f, parser)
    report = ReportDPE()
    # si pas téléphone mais mail ok
    el = dpe.find('.//information_consentement_proprietaire/telephone')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 0)

    # si pas mail ni téléphone -> ko
    el = dpe.find('.//information_consentement_proprietaire/mail')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 1)

    dpe = etree.parse(f, parser)
    report = ReportDPE()
    el = dpe.find('.//information_consentement_proprietaire')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 1)

    os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_POST_DPE_latest

    # test blocker si suppression

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference_2.4.xml'))

    dpe = etree.parse(f, parser)
    report = ReportDPE()
    el = dpe.find('.//consentement_proprietaire')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=True)
    assert (len(report.error_software) == 1)
    report = engine.run_controle_coherence(dpe)
    assert (len(report['erreur_logiciel']) == 1)

    # test blocker si suppression

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.3_diag_valid.xml'))

    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine = EngineAudit()
    # rendre le cas valide après 1er juillet
    enum_version_dpe_id = audit.find('.//enum_version_dpe_id')
    enum_version_dpe_id.text = '2.4'
    engine.controle_coherence_administratif_consentement(audit, report, is_blocker=True)
    assert (len(report.error_software) == 0)

    report = engine.run_controle_coherence(audit)
    # Nous sommes sur un cas test en 2.3, OR nous dépassons aujourd'hui la 2.5. Il est normal qu'un cas en 2.3 finisse par retourner des erreurs bloquantes en 2.5 lorsqu'on lance tous les controles "run_controle_coherence".
    # DONC : nous fonctionnons en relatif, en attendant 1 erreur de plus que celle observé sur le cas de base
    nb_erreur_base = len(report['erreur_logiciel'])
    # assert (len(report['erreur_logiciel']) == 0)

    # retire consentement_proprietaire pour créer une erreur
    report = ReportAudit()
    engine = EngineAudit()
    el = audit.find('.//consentement_proprietaire')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(audit, report, is_blocker=True)
    assert (len(report.error_software) == 1)
    report = engine.run_controle_coherence(audit)
    assert (len(report['erreur_logiciel']) == nb_erreur_base + 1)

    # passage en bet_entreprise pour retirer l'erreur
    report = ReportAudit()
    engine = EngineAudit()
    auditeur = audit.find('.//auditeur')
    diagnostiqueur = auditeur.find('diagnostiqueur')
    diagnostiqueur.getparent().remove(diagnostiqueur)
    etree.SubElement(auditeur, 'bet_entreprise')
    bet_entreprise = auditeur.find('bet_entreprise')
    etree.SubElement(bet_entreprise, 'numero_qualification').text = str(1911)
    etree.SubElement(bet_entreprise, 'numero_siret').text = str(91146053300027)
    engine.controle_coherence_administratif_consentement(audit, report, is_blocker=True)
    assert (len(report.error_software) == 0)
    report = engine.run_controle_coherence(audit)
    assert (len(report['erreur_logiciel']) == 0)

    # passage en architecte pour retirer l'erreur
    report = ReportAudit()
    engine = EngineAudit()
    auditeur = audit.find('.//auditeur')
    bet_entreprise = auditeur.find('bet_entreprise')
    bet_entreprise.getparent().remove(bet_entreprise)
    etree.SubElement(auditeur, 'architecte')
    architecte = auditeur.find('architecte')
    etree.SubElement(architecte, 'numero_matricule_national').text = str(1911)
    etree.SubElement(architecte, 'numero_siret').text = str(91146053300027)
    engine.controle_coherence_administratif_consentement(audit, report, is_blocker=True)
    assert (len(report.error_software) == 0)
    report = engine.run_controle_coherence(audit)
    assert (len(report['erreur_logiciel']) == nb_erreur_base)


    # TEST nouveau modèle
    report = ReportDPE()
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)
    el = dpe.find('.//information_formulaire_consentement//siren_formulaire')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 1)

    dpe = etree.parse(f, parser)
    report = ReportDPE()
    # si pas téléphone mais mail ok
    el = dpe.find('.//information_formulaire_consentement/telephone')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 0)

    # si pas mail ni téléphone -> ko
    el = dpe.find('.//information_formulaire_consentement/mail')
    el.getparent().remove(el)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 1)

    # on change le nom pour l'ancien cela génère une erreur
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    el = dpe.find('.//information_formulaire_consentement')
    el.tag = 'information_consentement_proprietaire'
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 1)

    # on change le nom pour l'ancien cela génère une erreur
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    el = dpe.find('.//enum_consentement_formulaire_id')
    el.tag = 'consentement_proprietaire'
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 1)

    # erreur de duplicat + erreur de non correspondance
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    el = dpe.find('.//enum_consentement_formulaire_id')
    copied_child = copy.deepcopy(el)
    copied_child.tag='consentement_proprietaire'
    el.addnext(copied_child)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 2)

    # erreur de duplicat + erreur de non correspondance
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    el = dpe.find('.//information_formulaire_consentement')
    copied_child = copy.deepcopy(el)
    copied_child.tag = 'information_consentement_proprietaire'
    el.addnext(copied_child)
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 2)

    # erreur si consentement non requis mais pas de formulaire
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    el = dpe.find('.//information_formulaire_consentement')
    el.getparent().remove(el)
    dpe.find('.//enum_consentement_formulaire_id').text='2'
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 1)

    # pas erreur si consentement refusé mais pas de formulaire
    report = ReportDPE()
    dpe = etree.parse(f, parser)
    el = dpe.find('.//information_formulaire_consentement')
    el.getparent().remove(el)
    dpe.find('.//enum_consentement_formulaire_id').text='0'
    engine.controle_coherence_administratif_consentement(dpe, report, is_blocker=False)
    assert (len(report.error_software) == 0)

def test_controle_coherence_date_visite():
    engine = EngineDPE()
    report = ReportDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
    dpe = etree.parse(f, parser)
    dpe.find('.//date_visite_diagnostiqueur').text = dpe.find('.//date_etablissement_dpe').text.replace('2021', '2022')
    engine.validation_version_and_dates(dpe, report, now=get_datetime_now(None))
    assert (len(report.error_input) == 1)
    report = engine.run_controle_coherence(dpe)
    L_warning_saisie = len(report['warning_saisie'])
    assert (len(report['erreur_saisie']) == 1)
    # # test blocker as warning (obsolète)
    # dpe.find('.//enum_version_id').text = '2.3'
    # report = engine.run_controle_coherence(dpe)
    # assert (len(report['erreur_saisie']) == 0)
    # assert (len(report['warning_saisie']) == L_warning_saisie + 1)

    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml'))

    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine = EngineAudit()
    audit.find('.//date_visite_auditeur').text = audit.find('.//date_etablissement_audit').text.replace('2022', '2023')
    engine.validation_version_and_dates(audit, report, now=get_datetime_now(None))
    assert (len(report.error_input) == 1)
    report = engine.run_controle_coherence(audit)
    L_warning_saisie = len(report['warning_saisie'])
    assert (len(report['erreur_saisie']) == 1)
    # test blocker as warning (obsolète)
    # audit.find('.//enum_version_audit_id').text = '2.1'
    # report = engine.run_controle_coherence(audit)
    # assert (len(report['erreur_saisie']) == 0)
    # assert (len(report['warning_saisie']) == L_warning_saisie + 1)


def test_controle_coherence_declaration_numero_fiscal_local():

    engine = EngineDPE()
    report = ReportDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))

    dpe = etree.parse(f, parser)
    engine.controle_coherence_declaration_numero_fiscal_local(dpe, report,is_blocker=True)
    assert ((len(report.error_input)+len(report.warning_input))== 0)
    numero_fiscal_local = dpe.find('.//numero_fiscal_local')
    numero_fiscal_local.getparent().remove(numero_fiscal_local)
    engine.controle_coherence_declaration_numero_fiscal_local(dpe, report,is_blocker=True)
    # ne s'applique pas à l'immeuble
    assert (len(report.error_input) == 0)

    report = ReportDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_maison_1_valid_2.5.xml'))
    dpe = etree.parse(f, parser)
    engine.controle_coherence_declaration_numero_fiscal_local(dpe, report,is_blocker=True)
    assert ((len(report.error_input)+len(report.warning_input))== 0)
    numero_fiscal_local = dpe.find('.//numero_fiscal_local')
    numero_fiscal_local.getparent().remove(numero_fiscal_local)
    engine.controle_coherence_declaration_numero_fiscal_local(dpe, report,is_blocker=True)
    assert (len(report.error_input) == 1)
    report = ReportDPE()
    dpe.find('.//enum_commanditaire_id').text='2'
    engine.controle_coherence_declaration_numero_fiscal_local(dpe, report, is_blocker=True)
    assert (len(report.error_input) == 0)


    report = ReportAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml'))
    audit = etree.parse(f, parser)
    engine.controle_coherence_declaration_numero_fiscal_local(audit, report,is_blocker=False)
    assert (len(report.warning_input) == 0)
    numero_fiscal_local = audit.find('.//numero_fiscal_local')
    numero_fiscal_local.getparent().remove(numero_fiscal_local)
    engine.controle_coherence_declaration_numero_fiscal_local(audit, report,is_blocker=False)
    assert (len(report.warning_input) == 1)

# TODO : On pourra supprimer ce test lors du passage audit 2.5 >> 2.6
def test_passage_audit_2_5():
    _restore_version_audit_cfg()
    # TEST le 31 dec 2025
    os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_PRE_DPE_26
    # l'audit 2.4 passe
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.4_valid.xml'))
    # f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml'))
    audit = etree.parse(f, parser)
    report = engine.run_controle_coherence(audit)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors == 0)
    # l'audit 2.5 ne passe pas
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml'))
    audit = etree.parse(f, parser)
    report = engine.run_controle_coherence(audit)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors > 0)

    # TEST le 1er janvier 2026
    os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_POST_DPE_latest
    # l'audit 2.4 ne passe plus
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.4_valid.xml'))
    # f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml'))
    audit = etree.parse(f, parser)
    report = engine.run_controle_coherence(audit)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors > 0)
    # l'audit 2.5 passe
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml'))
    audit = etree.parse(f, parser)
    report = engine.run_controle_coherence(audit)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors == 0)

    # Supresion de la variable d'enrironement
    if os.getenv('OBS_DPE_DATETIME_NOW') is not None:
        del os.environ['OBS_DPE_DATETIME_NOW']
    assert os.getenv('OBS_DPE_DATETIME_NOW') == None


# TODO : On pourra supprimer ce test lors du passage DPE 2.6 >> 2.7
def test_passage_dpe_2_6():
    _restore_version_dpe_cfg()
    # TEST le 31 dec 2025
    os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_PRE_DPE_26
    # le DPE 2.5 passe
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_2.5.xml'))
    dpe = etree.parse(f, parser)
    report = engine.run_controle_coherence(dpe)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors == 0)
    # le DPE 2.6 ne passe pas
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = engine.run_controle_coherence(dpe)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors > 0)

    # TEST le 1er janvier 2026
    os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_POST_DPE_latest
    # le DPE 2.5 ne passe plus
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_2.5.xml'))
    dpe = etree.parse(f, parser)
    report = engine.run_controle_coherence(dpe)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors > 0)
    # le DPE 2.6 passe
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid.xml'))
    dpe = etree.parse(f, parser)
    report = engine.run_controle_coherence(dpe)
    nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
    assert (report['validation_xsd']['valid'] == True)
    assert (nb_errors == 0)

    # Supresion de la variable d'enrironement
    if os.getenv('OBS_DPE_DATETIME_NOW') is not None:
        del os.environ['OBS_DPE_DATETIME_NOW']
    assert os.getenv('OBS_DPE_DATETIME_NOW') == None


# OBSOLETE
# def test_passage_dpe_2_point_3():
#     # test de bon fonctionnement du passage à la 2.3
#     engine = EngineDPE()
#     parser = etree.XMLParser(remove_blank_text=True)
#     f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
#     dpe = etree.parse(f, parser)
#     report = engine.run_controle_coherence(dpe)
#     assert (report['validation_xsd']['valid'] == True)
#     label_brut_avec_complement = dpe.find('*//label_brut_avec_complement')
#     label_brut_avec_complement.getparent().remove(label_brut_avec_complement)
#     report = engine.run_controle_coherence(dpe)
#     assert (report['validation_xsd']['valid'] == False)
#
#     # test de rétrocompatibilité 2.2
#     f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_immeuble_1_valid_avec_reference.xml'))
#     dpe = etree.parse(f, parser)
#     dpe.find('*//enum_version_id').text = '2.2'
#     report = engine.run_controle_coherence(dpe)
#     nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#     assert (report['validation_xsd']['valid'] == True)
#     assert (nb_errors == 0)

# def test_passage_audit_2_2():
#     if datetime.now() > datetime.fromisoformat('2024-06-30') or os.getenv('OBS_DPE_DATETIME_NOW'):
#         # A partir du 1er juillet, on se fixe à la date du 30 juin, afin que le controle de cohérence reste fonctionnel.
#         os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_PRE_DPE_24
#     _set_version_audit_to_valid_dates()
#     try:
#         # test de bon fonctionnement du passage à la 2.2
#         engine = EngineAudit()
#         parser = etree.XMLParser(remove_blank_text=True)
#         f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.2_valid.xml'))
#         audit = etree.parse(f, parser)
#         audit.find('.//enum_version_dpe_id').text='2.3'
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 0)
#
#         # Ajout d'une erreur qui est bloquante en 2.2 (mais pas en 2.1)
#         etape_travaux = list(audit.iterfind('*//logement'))[-1].find('etape_travaux')
#         if etape_travaux is not None:
#             new_child = etree.Element('cout_min')
#             new_child.text = str(1000.0)
#             etape_travaux.append(new_child)
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 1)
#
#         # test de rétrocompatibilité 2.1
#         audit.find('*//enum_version_audit_id').text = '2.1'
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 0)
#
#     except AssertionError as e:
#         print(report['validation_xsd'])
#         print(f'nombre d erreurs : {nb_errors}')
#         for err in report['erreur_logiciel'] + report['erreur_saisie']:
#             print("=================== ERROR =========================")
#             print(err['thematique'])
#             print(err['message'])
#             print(err['objets_concerne'])
#         print(f)
#         raise e


# def test_passage_audit_2_1():
#     _set_version_audit_to_valid_dates()
#     try:
#         # test de bon fonctionnement du passage à la 2.1
#         engine = EngineAudit()
#         parser = etree.XMLParser(remove_blank_text=True)
#         f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.1_valid.xml'))
#         audit = etree.parse(f, parser)
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 0)
#
#         # Ajout d'une erreur qui est bloquante en 2.1 (mais pas en 2.0)
#         enum_derogation_ventilation_id = audit.find('*//enum_derogation_ventilation_id')
#         enum_derogation_ventilation_id.getparent().remove(enum_derogation_ventilation_id)
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == False)
#
#         # test de rétrocompatibilité 2.0
#         audit.find('*//enum_version_audit_id').text = '2.0'
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 0)
#
#     except AssertionError as e:
#         print(report['validation_xsd'])
#         print(f'nombre d erreurs : {nb_errors}')
#         for err in report['erreur_logiciel'] + report['erreur_saisie']:
#             print("=================== ERROR =========================")
#             print(err['thematique'])
#             print(err['message'])
#             print(err['objets_concerne'])
#         print(f)
#         raise e


def test_dpe_version_compatibility():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.2_valid.xml'))
    # cas de base passé en DPE 2.4
    audit = etree.parse(f, parser)
    enum_version_dpe_id = audit.find('*//enum_version_dpe_id')
    enum_version_dpe_id.text = '2.4'
    report = ReportAudit()
    engine.dpe_version_compatibility(audit, report, dpe_2_4_enabled=True)
    assert (len(report.error_software) == 0)

    # Change la version dpe à "2.0", afin d'ajouter 1 erreur d'incompatibilité !
    report = ReportAudit()
    enum_version_dpe_id.text = '2.0'
    engine.dpe_version_compatibility(audit, report, dpe_2_4_enabled=True)
    assert (len(report.error_software) == 1)
    # Vérifie que quand on passe dpe_2_4_enabled à False, l'erreur disparait et qu'un warning apparait
    report = ReportAudit()
    engine.dpe_version_compatibility(audit, report, dpe_2_4_enabled=False)
    assert (len(report.error_software) == 0)
    assert (len(report.warning_software) == 1)

    # Retire la balise enum_version_dpe_id, afin de générer une erreur
    report = ReportAudit()
    enum_version_dpe_id.getparent().remove(enum_version_dpe_id)
    engine.dpe_version_compatibility(audit, report, dpe_2_4_enabled=True)
    assert (len(report.error_software) == 1)
    # Vérifie que quand on passe dpe_2_4_enabled à False, l'erreur disparait et qu'un warning apparait
    report = ReportAudit()
    engine.dpe_version_compatibility(audit, report, dpe_2_4_enabled=False)
    assert (len(report.error_software) == 0)
    assert (len(report.warning_software) == 1)


def test_controle_coherence_type_batiment_constant():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_type_batiment_constant(audit, report)
    assert (len(report.error_software) == 0)

    # Change la méthode d'un logement en "dpe appartement individuel", afin d'ajouter 1 erreur : méthode maison ET méthode appartement ensemble !
    logement = list(audit.iterfind('*//logement'))[0]
    report = ReportAudit()
    logement.find('*//enum_methode_application_dpe_log_id').text = '2'
    engine.controle_coherence_type_batiment_constant(audit, report)
    assert (len(report.error_software) == 1)


# LE CONTROLE DE COHERENCE "controle_coherence_choix_maj_ou_remplacer" N'EST PLUS APPLIQUE SUITE A UN ROLLBACK DE LA 2.0 (voir issue gitlab #129)
# def test_controle_coherence_choix_maj_ou_remplacer():
#     engine = EngineAudit()
#     parser = etree.XMLParser(remove_blank_text=True)
#     f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
#     # cas de base valide
#     audit = etree.parse(f, parser)
#     report = ReportAudit()
#     engine.controle_coherence_choix_maj_ou_remplacer(audit, report)
#     assert (len(report.error_software) == 0)
#
#     # Ajoute audit_a_mettre_a_jour en plus de audit_a_remplacer déjà présent, afin d'ajouter 1 erreur
#     audit_a_mettre_a_jour = copy.deepcopy(audit.find('*/audit_a_remplacer'))
#     audit_a_mettre_a_jour.tag = 'audit_a_mettre_a_jour'
#     audit.find('*/audit_a_remplacer').getparent().insert(0, audit_a_mettre_a_jour)
#     report = ReportAudit()
#     engine.controle_coherence_choix_maj_ou_remplacer(audit, report)
#     assert (len(report.error_software) == 1)


def test_controle_coherence_unicite_etape_par_scenario():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_unicite_etape_par_scenario(audit, report)
    assert (len(report.error_software) == 0)

    # Duplique un logement, afin d'ajouter 1 erreur
    logement = list(audit.iterfind('*//logement'))[0]
    logement_copy = copy.deepcopy(logement)
    p = logement.getparent()
    p.insert(0, logement_copy)
    report = ReportAudit()
    engine.controle_coherence_unicite_etape_par_scenario(audit, report)
    assert (len(report.error_software) == 1)

    # Duplique un autre logement, afin d'ajouter 1 erreur
    logement = list(audit.iterfind('*//logement'))[-1]
    logement_copy = copy.deepcopy(logement)
    p = logement.getparent()
    p.insert(0, logement_copy)
    report = ReportAudit()
    engine.controle_coherence_unicite_etape_par_scenario(audit, report)
    assert (len(report.error_software) == 2)


def test_controle_coherence_presence_etat_initial():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_presence_etat_initial(audit, report)
    assert (len(report.error_software) == 0)

    # passe tous les enum_etape_id en "5": "étape intermédiaire 3" pour créer 1 erreur - pas d'etat_initial
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        enum_etape_id.text = '5'
    report = ReportAudit()
    engine.controle_coherence_presence_etat_initial(audit, report)
    assert (len(report.error_software) == 1)
    assert report.error_software[0]['thematique'] == 'error_missing_etape'


def test_controle_coherence_scenario_multi_etapes():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_scenario_multi_etapes(audit, report)
    assert (len(report.error_input) == 0)

    # passe tous les enum_etape_id en "5": "étape intermédiaire 3" pour créer 2 erreurs - pas d'étape finale et pas d'étape première
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        enum_etape_id.text = '5'
    report = ReportAudit()
    engine.controle_coherence_scenario_multi_etapes(audit, report)
    assert (len(report.error_input) == 2)
    assert report.error_input[0]['thematique'] == 'error_missing_etape'

    # passe tous les enum_etape_id en "1": "étape première" pour créer 1 erreur - pas d'étape finale
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        enum_etape_id.text = '1'
    report = ReportAudit()
    engine.controle_coherence_scenario_multi_etapes(audit, report)
    assert (len(report.error_input) == 1)
    assert report.error_input[0]['thematique'] == 'error_missing_etape'

    # passe tous les enum_etape_id en "0": "état initial" pour créer 1 erreur - pas de scénario multi étapes "principal"
    for enum_etape_id in list(audit.iterfind('*//enum_scenario_id')):
        enum_etape_id.text = '0'
    report = ReportAudit()
    engine.controle_coherence_scenario_multi_etapes(audit, report)
    assert (len(report.error_input) == 1)
    assert report.error_input[0]['thematique'] == 'error_missing_scenario'


def test_controle_coherence_scenario_mono_etape():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_scenario_mono_etape(audit, report)
    assert (len(report.error_input) == 0)

    # passe tous les enum_etape_id en "5": "étape intermédiaire 3" pour créer 1 erreur - pas d'étape finale
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        enum_etape_id.text = '5'
    report = ReportAudit()
    engine.controle_coherence_scenario_mono_etape(audit, report)
    assert (len(report.error_input) == 1)
    assert report.error_input[0]['thematique'] == 'error_missing_etape'

    # passe tous les enum_scenario_id "2": "scénario en une étape \"principal\""
    for enum_scenario_id in list(audit.iterfind('*//enum_scenario_id')):
        enum_scenario_id.text = '2'
    # donne une valeur différente à tous les enum_etape_id pour créer 1 erreur - error_number_etape (trop d'étape pour ce scénario)
    i = 0
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        enum_etape_id.text = str(i)
        i += 1
    report = ReportAudit()
    engine.controle_coherence_scenario_mono_etape(audit, report)
    assert (len(report.error_input) == 1)
    assert report.error_input[0]['thematique'] == 'error_number_etape'

    # passe tous les enum_etape_id en "0": "état initial" pour créer 1 erreur - pas de scénario une seule étape "principal"
    for enum_etape_id in list(audit.iterfind('*//enum_scenario_id')):
        enum_etape_id.text = '0'
    report = ReportAudit()
    engine.controle_coherence_scenario_mono_etape(audit, report)
    assert (len(report.error_input) == 1)
    assert report.error_input[0]['thematique'] == 'error_missing_scenario'


def test_controle_coherence_etape_finale():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_etape_finale(audit, report)
    assert (len(report.error_input) == 0)

    # passe toutes les etapes finales en classe DPE 'D' pour créer 2 erreurs (scénarios principaux) et au moins 1 warning (scénarios complémentaires)- pas d'atteinte de classe B pour les scénarios
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        # if etape finale
        if enum_etape_id.text == '2':
            enum_etape_id.getparent().getparent().find('etape_travaux').find('classe_bilan_dpe').text = 'D'
    report = ReportAudit()
    engine.controle_coherence_etape_finale(audit, report)
    assert (len(report.error_input) == 2)
    assert (len(report.warning_input) > 0)
    assert report.error_input[0]['thematique'] == 'error_class_etape_finale'
    assert report.warning_input[0]['thematique'] == 'warning_class_etape_finale'

    # active la derogation technique - pas d'erreur
    audit.find('.//enum_derogation_technique_id').text = '2'
    report = ReportAudit()
    engine.controle_coherence_etape_finale(audit, report)
    assert (len(report.error_input) == 0)

    # desactive la derogation technique et ACTIVE la derograiton economique - pas d'erreur
    audit.find('.//enum_derogation_technique_id').text = '1'
    audit.find('.//enum_derogation_economique_id').text = '2'
    report = ReportAudit()
    engine.controle_coherence_etape_finale(audit, report)
    assert (len(report.error_input) == 0)

    # passe toutes les etapes finales en classe DPE 'F' pour créer 2 erreurs (scénarios principaux) et au moins 1 warning (scénarios complémentaires) - pas de saut de 2 classes pour les scénarios
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        # if etape finale
        if enum_etape_id.text == '2':
            enum_etape_id.getparent().getparent().find('etape_travaux').find('classe_bilan_dpe').text = 'F'
    report = ReportAudit()
    engine.controle_coherence_etape_finale(audit, report)
    assert (len(report.error_input) == 2)
    assert (len(report.warning_input) > 0)
    assert report.error_input[0]['thematique'] == 'error_class_etape_finale'
    assert report.warning_input[0]['thematique'] == 'warning_class_etape_finale'

    # TEST cas avec un etat initial passsoire ET des etats finaux en C, ne remontent pas d'erreur
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        # if etape initiale
        if enum_etape_id.text == '0':
            enum_etape_id.getparent().getparent().find('.//classe_bilan_dpe').text = 'G'
        # if etape finale
        if enum_etape_id.text == '2':
            enum_etape_id.getparent().getparent().find('etape_travaux').find('classe_bilan_dpe').text = 'C'

    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_etape_finale(audit, report)
    assert (len(report.error_input) == 0)


def test_controle_coherence_six_postes_travaux():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_six_postes_travaux(audit, report)
    assert (len(report.warning_input) == 0)

    # active la derogation technique - pas d'erreur
    audit.find('.//enum_derogation_technique_id').text = '2'
    report = ReportAudit()
    engine.controle_coherence_six_postes_travaux(audit, report)
    assert (len(report.warning_input) == 0)

    # desactive la derogation technique et ACTIVE la derograiton economique - pas d'erreur
    audit.find('.//enum_derogation_technique_id').text = '1'
    audit.find('.//enum_derogation_economique_id').text = '2'
    report = ReportAudit()
    engine.controle_coherence_six_postes_travaux(audit, report)
    assert (len(report.warning_input) == 0)

    # passe toutes les enum_lot_travaux_audit_id en "1" pour "mur" afin de créer 2 erreurs - 1 par scénario principal
    for etape_travaux in list(audit.iterfind('*//etape_travaux')):
        all_lot_travaux = list(etape_travaux.iterfind('*//enum_lot_travaux_audit_id'))
        for lot_travaux in all_lot_travaux:
            lot_travaux.text = '1'

    report = ReportAudit()
    engine.controle_coherence_six_postes_travaux(audit, report)
    assert (len(report.warning_input) == 2)
    assert report.warning_input[0]['thematique'] == 'warning_missing_work'


# CE CONTROLE (QUI ETAIT EN WARNING) DOIT ETRE RETIRE POUR LE 1er JANVIER 2024
# def test_controle_coherence_scenario_multi_etapes_passoire():
#    engine = EngineAudit()
#    parser = etree.XMLParser(remove_blank_text=True)
#    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
#    # cas de base valide
#    audit = etree.parse(f, parser)
#    report = ReportAudit()
#    engine.controle_coherence_scenario_multi_etapes_passoire(audit, report)
#    assert (len(report.warning_input) == 0)
#
#    # passe toutes les etapes intermédiaire en classe DPE 'D' pour créer 1 erreur - pas d'atteinte de classe C pour scénario multi étapes
#    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
#         # if etape intermédiaire
#        if enum_etape_id.text in ["3","4","5"]:
#            enum_etape_id.getparent().getparent().find('.//classe_bilan_dpe').text = 'D'
#    report = ReportAudit()
#    engine.controle_coherence_scenario_multi_etapes_passoire(audit, report)
#    assert (len(report.warning_input) == 1)
#    assert report.warning_input[0]['thematique'] == 'warning_class_etape_intermediaire'
#
#    # passe toutes les etapes intermédiaire en etapes finale - erreur : pas d'étape intermédiaire
#    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
#        # if etape intermédiaire
#        if enum_etape_id.text in ["3", "4", "5"]:
#            enum_etape_id.text = '2'
#    report = ReportAudit()
#    engine.controle_coherence_scenario_multi_etapes_passoire(audit, report)
#    assert (len(report.warning_input) == 1)
#    assert report.warning_input[0]['thematique'] == 'warning_missing_etape'
#
#    # sort le batiment de l'état passoir en état initial - Plus aucune erreur
#    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
#        # if etat initial
#        if enum_etape_id.text in ["0"]:
#            enum_etape_id.getparent().getparent().find('*//classe_bilan_dpe').text = "E"
#    report = ReportAudit()
#    engine.controle_coherence_scenario_multi_etapes_passoire(audit, report)
#    assert (len(report.warning_input) == 0)

def test_controle_coherence_seuil_3_etapes():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_seuil_3_etapes(audit, report)
    assert (len(report.warning_input) == 0)

    # passe toutes les etapes intermédiaire en classe DPE 'D' pour créer 1 erreur - pas d'atteinte de classe C pour scénario multi étapes
    for enum_scenario_id in list(audit.iterfind('*//enum_scenario_id')):
        # if not "scénario multi étapes \"principal\""
        if enum_scenario_id.text != "1":
            enum_scenario_id.text = "1"
    report = ReportAudit()
    engine.controle_coherence_seuil_3_etapes(audit, report)
    assert (len(report.warning_input) == 1)
    assert report.warning_input[0]['thematique'] == 'warning_too_many_etape'


def test_controle_coherence_presence_recommandation():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_presence_recommandation(audit, report)
    assert (len(report.warning_input) == 0)

    # retire tout le contenu du text des balises 'recommandation' - warning : recommandation vides
    for recommandation_scenario in list(audit.iterfind('*//recommandation_scenario')):
        recommandation_scenario.find('recommandation').text = ''
    report = ReportAudit()
    engine.controle_coherence_presence_recommandation(audit, report)
    assert (len(report.warning_input) == 1)

    # supprime les objets recommandation_scenario - warning : pas de recommandation définie
    for recommandation_scenario in list(audit.iterfind('*//recommandation_scenario')):
        recommandation_scenario.getparent().remove(recommandation_scenario)
    report = ReportAudit()
    engine.controle_coherence_presence_recommandation(audit, report)
    assert (len(report.warning_input) == 1)


def test_controle_coherence_presence_numero_dpe():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide (le numéro DPE est manquant, avec un "audit volontaire logement")
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_presence_numero_dpe(audit, report)
    assert (len(report.warning_input) == 0)

    # passage de enum_modele_audit_id en règlementaire - 1 warning
    audit.find('*//enum_modele_audit_id').text = "1"  # "1": "audit réglementaire logement"
    report = ReportAudit()
    engine.controle_coherence_presence_numero_dpe(audit, report)
    assert (len(report.warning_input) == 1)


def test_controle_coherence_reference_travaux_existent():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    logement = list(audit.iterfind('*//logement'))[1]
    report = ReportAudit()
    engine.controle_coherence_reference_travaux_existent(logement, report)
    assert (len(report.error_software) == 0)

    # Cas avec une référence dans travaux_collection non présente dans le logement
    reference = logement.find('etape_travaux').find('travaux_collection')[0].find('reference_collection')[0]
    reference.text = 'ANOMALIE'
    report = ReportAudit()
    engine.controle_coherence_reference_travaux_existent(logement, report)
    assert (len(report.error_software) == 1)


def test_controle_coherence_presence_etape_travaux():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_presence_etape_travaux(logement, report)
        assert (len(report.error_software) == 0)

    # Modifie chaque logement et verifie qu'une erreur soit retournée à chaque fois.
    etape_travaux_copy = copy.deepcopy(list(audit.iterfind('*//etape_travaux'))[0])
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        enum_scenario_id = logement.find('.//caracteristique_generale').find('enum_scenario_id').text
        enum_etape_id = logement.find('.//caracteristique_generale').find('enum_etape_id').text
        logement_etat_initial = enum_scenario_id == '0' and enum_etape_id == '0'
        if logement_etat_initial:
            # insere etape_travaux pour créer une erreur
            logement.insert(0, etape_travaux_copy)
        else:
            # retire etape_travaux pour créer un erreur
            etape_travaux = logement.find('etape_travaux')
            logement.remove(etape_travaux)
        engine.controle_coherence_presence_etape_travaux(logement, report)
        assert (len(report.error_software) == 1)


def test_controle_coherence_etat_composant():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_etat_composant(logement, report)
        assert (len(report.error_software) == 0)

    # Modifie chaque logement et verifie qu'une erreur soit retournée à chaque fois.
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        enum_scenario_id = logement.find('.//caracteristique_generale').find('enum_scenario_id').text
        enum_etape_id = logement.find('.//caracteristique_generale').find('enum_etape_id').text
        logement_etat_initial = enum_scenario_id == '0' and enum_etape_id == '0'
        if logement_etat_initial:
            # change la valeur d'un enum_etat_composant_id pour créer une erreur
            list(logement.iterfind('*//enum_etat_composant_id'))[0].text = '2'
        else:
            # passe tous les enum_etat_composant_id en "1": "initial" pour créer une erreur
            for etat_composant in list(logement.iterfind('*//enum_etat_composant_id')):
                etat_composant.text = '1'
        engine.controle_coherence_etat_composant(logement, report)
        assert (len(report.error_software) == 1)


def test_controle_coherence_etape_travaux_sortie_dpe():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_etape_travaux_sortie_dpe(logement, report)
        assert (len(report.error_software) == 0)

    mapping_etape_travaux_sortie_dpe = {
        "ep_conso_5_usages_m2": "ep_conso_5_usages_m2",
        "ef_conso_5_usages_m2": "conso_5_usages_m2",
        "emission_ges_5_usages_m2": "emission_ges_5_usages_m2",
        "classe_emission_ges": "classe_emission_ges",
        "classe_bilan_dpe": "classe_bilan_dpe",
    }
    # Modifie chaque etape_travaux de chaque logement de façon légère (sous le seuil de tolérance) et vérifie qu'aucune erreur ne soit retournée
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            report = ReportAudit()
            for etape_travaux_name in ["ep_conso_5_usages_m2", "ef_conso_5_usages_m2", "emission_ges_5_usages_m2"]:
                dpe_sortie_name = mapping_etape_travaux_sortie_dpe[etape_travaux_name]
                dpe_sortie_el = logement.find('.//sortie').find(f'.//{dpe_sortie_name}')
                etape_travaux_el = logement.find('.//etape_travaux').find(f'.//{etape_travaux_name}')
                etape_travaux_el.text = str(float(dpe_sortie_el.text) + 0.05)
            engine.controle_coherence_etape_travaux_sortie_dpe(logement, report)
            assert (len(report.error_software) == 0)

    # Modifie les classes (DPE et GES) chaque etape_travaux de chaque logement et vérifie que 2 erreurs n'ajoutent aux 3 erreurs précédentes = 5 erreurs
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            report = ReportAudit()
            for etape_travaux_name in ["ep_conso_5_usages_m2", "ef_conso_5_usages_m2", "emission_ges_5_usages_m2"]:
                dpe_sortie_name = mapping_etape_travaux_sortie_dpe[etape_travaux_name]
                dpe_sortie_el = logement.find('.//sortie').find(f'.//{dpe_sortie_name}')
                etape_travaux_el = logement.find('.//etape_travaux').find(f'.//{etape_travaux_name}')
                etape_travaux_el.text = str(float(dpe_sortie_el.text) + 1.01)
            engine.controle_coherence_etape_travaux_sortie_dpe(logement, report)
            assert (len(report.error_software) == 3)

    # Modifie chaque etape_travaux de chaque logement de façon importante et vérifie que 3 erreurs soit retournée à chaque fois.
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            report = ReportAudit()
            change_classe = {"A": "B", "B": "C", "C": "D", "D": "E", "E": "F", "F": "G", "G": "A"}
            for etape_travaux_name in ["classe_emission_ges", "classe_bilan_dpe"]:
                dpe_sortie_name = mapping_etape_travaux_sortie_dpe[etape_travaux_name]
                dpe_sortie_el = logement.find('.//sortie').find(f'.//{dpe_sortie_name}')
                etape_travaux_el = logement.find('.//etape_travaux').find(f'.//{etape_travaux_name}')
                etape_travaux_el.text = change_classe[dpe_sortie_el.text]
            engine.controle_coherence_etape_travaux_sortie_dpe(logement, report)
            assert (len(report.error_software) == 5)


# def test_controle_coherence_etape_travaux_cout():
#     engine = EngineAudit()
#     parser = etree.XMLParser(remove_blank_text=True)
#     f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
#     # cas de base valide
#     audit = etree.parse(f, parser)
#     for logement in list(audit.iterfind('*//logement')):
#         report = ReportAudit()
#         engine.controle_coherence_etape_travaux_cout(logement, report)
#         assert (len(report.error_software) == 0)
#
#     # Modifie chaque etape_travaux de chaque logement de façon légère (sous le seuil de tolérance de 100€) et vérifie qu'aucune erreur ne soit retournée
#     for logement in list(audit.iterfind('*//logement')):
#         etape_travaux = logement.find('.//etape_travaux')
#         if etape_travaux is not None:
#             report = ReportAudit()
#             logement.find('.//etape_travaux').find(f'.//cout').text = str(int(logement.find('.//etape_travaux').find(f'.//cout').text) + 90)
#             engine.controle_coherence_etape_travaux_cout(logement, report)
#             assert (len(report.error_software) == 0)
#
#     # Modifie chaque etape_travaux de chaque logement de façon importante (au-dessus du seuil de tolérance de 100€) - vérifie qu'une erreur soit retournée
#     for logement in list(audit.iterfind('*//logement')):
#         etape_travaux = logement.find('.//etape_travaux')
#         if etape_travaux is not None:
#             report = ReportAudit()
#             logement.find('.//etape_travaux').find(f'.//cout').text = str(int(logement.find('.//etape_travaux').find(f'.//cout').text) + 200)
#             engine.controle_coherence_etape_travaux_cout(logement, report)
#             assert (len(report.error_software) == 1)


def test_controle_coherence_cout_nul():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_cout_nul(logement, report)
        assert (len(report.warning_input) == 0)

    # Modifie chaque etape_travaux de chaque logement de façon légère (sous le seuil de tolérance de 100€) et vérifie qu'aucune erreur ne soit retournée
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            report = ReportAudit()
            logement.find('.//travaux_collection').find('.//cout').text = str(0)
            engine.controle_coherence_cout_nul(logement, report)
            assert (len(report.warning_input) == 1)


def test_controle_coherence_conso_etape_travaux():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.0_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_conso_etape_travaux(logement, report)
        assert (len(report.warning_software) == 0)

    # Modifie chaque etape_travaux de chaque logement d'un facteur 100 (correspondant à un oubli de division par la SHAB) - Une erreur doit être générée
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            report = ReportAudit()
            conso_etape_travaux = ["ep_conso_ch_m2", "ep_conso_ecs_m2", "ep_conso_eclairage_m2", "ep_conso_totale_auxiliaire_m2", "ep_conso_fr_m2", "ep_conso_5_usages_m2", "ef_conso_ch_m2", "ef_conso_ecs_m2", "ef_conso_eclairage_m2", "ef_conso_totale_auxiliaire_m2", "ef_conso_fr_m2", "ef_conso_5_usages_m2", "emission_ges_5_usages_m2"]
            for etape_travaux_name in conso_etape_travaux:
                etape_travaux.find(f'{etape_travaux_name}').text = str(float(etape_travaux.find(f'{etape_travaux_name}').text) * 100)
            engine.controle_coherence_conso_etape_travaux(logement, report)
            assert (len(report.warning_software) == 1)


def test_controle_coherence_presence_derogation_ventilation():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.1_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_presence_derogation_ventilation(logement, report)
        assert (len(report.error_input) == 0)

    # Modifie chaque logement, pour qu'il y ait une incohérence entre le enum_derogation_ventilation_id et le enum_etat_ventilation_id
    enum_derogation_ventilation_id = audit.find('.//administratif').find('enum_derogation_ventilation_id')
    enum_derogation_ventilation_id.text = "1"  # "1": "abscence de dérogation"
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        enum_etat_ventilation_id = logement.find('*//enum_etat_ventilation_id')
        enum_etat_ventilation_id.text = "3"  # "3": "cas de dérogation"
        engine.controle_coherence_presence_derogation_ventilation(logement, report)
        assert (len(report.error_input) == 1)


def test_controle_coherence_abscence_derogation_ventilation():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.1_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_abscence_derogation_ventilation(audit, report)
    assert (len(report.error_input) == 0)

    # Mettre chaque logement à "ventilation fonctionnelle" (pas de dérogation), et déclare une dérogation dans enum_derogation_ventilation_id
    enum_derogation_ventilation_id = audit.find('.//administratif').find('enum_derogation_ventilation_id')
    enum_derogation_ventilation_id.text = "3"  # "3": "ventilation naturelle efficace"
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        enum_etat_ventilation_id = logement.find('*//enum_etat_ventilation_id')
        enum_etat_ventilation_id.text = "2"  # "2": "ventilation fonctionnelle",

    engine.controle_coherence_abscence_derogation_ventilation(audit, report)
    assert (len(report.error_input) == 1)


def test_controle_coherence_ubat_base_ubat():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.1_valid.xml'))

    # Cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_ubat_base_ubat(logement, report)
        assert (len(report.warning_input) == 0)

    # Modifie chaque logement, pour qu'il y ait une incohérence entre ubat et ubat_base
    ubat_base = audit.find('*//ubat_base')
    if ubat_base is not None:
        ubat_base.text = "10"  # Set le ubat_base pour être sûr de sa valeur
        for logement in list(audit.iterfind('*//logement')):
            enum_scenario_id = logement.find('*//enum_scenario_id')
            enum_etape_id = logement.find('*//enum_etape_id')
            is_scenario_principal = enum_scenario_id.text in ["1", "2"]
            is_etape_finale = enum_etape_id.text == "2"  # "étape finale"
            report = ReportAudit()
            ubat = logement.find('*//ubat')
            ubat.text = "20"  # Modifie ubat pour qu'il soit supérieur à ubat_base
            engine.controle_coherence_ubat_base_ubat(logement, report)

            # Le controle ne doit s'appliquer que si is_scenario_principal ET is_etape_finale
            if is_scenario_principal and is_etape_finale:
                assert (len(report.warning_input) == 1)
            else:
                # le controle ne doit pas s'appliquer !
                assert (len(report.warning_input) == 0)


def test_controle_coherence_etat_ventilation():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.1_valid.xml'))

    # Cas de base valide pour les scénarios principaux
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_etat_ventilation(logement, report)
        assert (len(report.warning_input) == 0)

    # Cas de ventilation non fonctionnelle pour les scénarios principaux
    for logement in list(audit.iterfind('*//logement')):
        enum_etat_ventilation_id = logement.find('*//enum_etat_ventilation_id')
        enum_scenario_id = logement.find('*//enum_scenario_id')
        is_scenario_principal = enum_scenario_id.text in ["1", "2"]
        if is_scenario_principal:
            enum_etat_ventilation_id.text = "1"  # Modifie l'état de ventilation pour "ventilation non fonctionnelle"
            report = ReportAudit()
            engine.controle_coherence_etat_ventilation(logement, report)
            assert (len(report.warning_input) == 1)

    # Cas de ventilation non fonctionnelle pour les scénarios additionnels
    for logement in list(audit.iterfind('*//logement')):
        enum_etat_ventilation_id = logement.find('*//enum_etat_ventilation_id')
        enum_scenario_id = logement.find('*//enum_scenario_id')
        is_scenario_additional = enum_scenario_id.text in ["3", "4", "5"]
        if is_scenario_additional:
            enum_etat_ventilation_id.text = "1"  # Modifie l'état de ventilation pour "ventilation non fonctionnelle"
            report = ReportAudit()
            engine.controle_coherence_etat_ventilation(logement, report)
            assert (len(report.warning_input) == 1)

    # Cas de ventilation fonctionnelle pour tous les scénarios
    for logement in list(audit.iterfind('*//logement')):
        enum_etat_ventilation_id = logement.find('*//enum_etat_ventilation_id')
        enum_scenario_id = logement.find('*//enum_scenario_id')
        enum_etat_ventilation_id.text = "2"  # Modifie l'état de ventilation pour "ventilation fonctionnelle"
        report = ReportAudit()
        engine.controle_coherence_etat_ventilation(logement, report)
        assert (len(report.warning_input) == 0)


def test_controle_coherence_presence_caracteristiques_travaux():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.2_valid.xml'))

    # Cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_presence_caracteristiques_travaux(logement, report)
        assert (len(report.error_input) == 0)

    # Cas sans caracteristiques_travaux pour une isolation murs ITE
    for logement in list(audit.iterfind('*//logement')):
        all_travaux = list(logement.iterfind('.//travaux'))
        if len(all_travaux) > 0:
            for travaux in all_travaux:
                travaux.find('enum_type_travaux_id').text = "1"  # Modifie l'enum_type_travaux_id pour "Isolation murs en ITE"
                caracteristiques_travaux = travaux.find('caracteristiques_travaux')
                if caracteristiques_travaux is not None:
                    travaux.remove(caracteristiques_travaux)
            report = ReportAudit()
            engine.controle_coherence_presence_caracteristiques_travaux(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_caracteristiques_travaux_missing'


def test_controle_coherence_absence_caracteristiques_travaux():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.2_valid.xml'))

    # Cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_absence_caracteristiques_travaux(logement, report)
        assert (len(report.error_input) == 0)

    # Cas AVEC caracteristiques_travaux pour "Installation VMC simple flux"
    for logement in list(audit.iterfind('*//logement')):
        all_travaux = list(logement.iterfind('.//travaux'))
        if len(all_travaux) > 0:
            for travaux in all_travaux:
                travaux.find('enum_type_travaux_id').text = "8"  # Modifie l'enum_type_travaux_id pour "Installation VMC simple flux"
            report = ReportAudit()
            engine.controle_coherence_absence_caracteristiques_travaux(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_caracteristiques_travaux_presence'


def test_controle_coherence_caracteristiques_travaux():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.2_valid.xml'))

    # Cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_caracteristiques_travaux(logement, report)
        assert (len(report.error_input) == 0)

    # Cas enum_type_travaux_id == "Installation PAC géothermique" (incohérent avec son caracteristiques_travaux)
    for logement in list(audit.iterfind('*//logement')):
        all_travaux = list(logement.iterfind('.//travaux'))
        if len(all_travaux) > 0:
            for travaux in all_travaux:
                travaux.find('enum_type_travaux_id').text = "10"  # Modifie l'enum_type_travaux_id pour "Installation PAC géothermique"
            report = ReportAudit()
            engine.controle_coherence_caracteristiques_travaux(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_caracteristiques_travaux_consistency'


def test_controle_coherence_etape_travaux_cout_presence():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.2_valid.xml'))

    # Cas de base valide
    audit = etree.parse(f, parser)
    for logement in list(audit.iterfind('*//logement')):
        report = ReportAudit()
        engine.controle_coherence_etape_travaux_cout_presence(logement, report)
        assert (len(report.error_input) == 0)

    # Erreur définition fourchette (au niveau de etape_travaux)
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('etape_travaux')
        if etape_travaux is not None:
            new_child = etree.Element('cout_min')
            new_child.text = str(1000.0)
            etape_travaux.append(new_child)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_travaux_cout_fourchette'

    # Erreur de coût manquant (au niveau de etape_travaux)
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('etape_travaux')
        if etape_travaux is not None:
            # Supprimer 'cout' si présent
            cout = etape_travaux.find('cout')
            if cout is not None:
                etape_travaux.remove(cout)

            # Assurer que 'cout_min' et 'cout_max' ne sont pas présents pour déclencher l'erreur
            cout_min = etape_travaux.find('cout_min')
            if cout_min is not None:
                etape_travaux.remove(cout_min)
            cout_max = etape_travaux.find('cout_max')
            if cout_max is not None:
                etape_travaux.remove(cout_max)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_travaux_cout_missing'

    # Erreur de coût et fourchette de coûts présents en même temps (au niveau de etape_travaux)
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('etape_travaux')
        if etape_travaux is not None:
            # Ajouter 'cout' si non présent
            if etape_travaux.find('cout') is None:
                new_child_cout = etree.Element('cout')
                new_child_cout.text = str(1500.0)
                etape_travaux.append(new_child_cout)

            # Assurer que 'cout_min' et 'cout_max' sont présents pour déclencher l'erreur
            if etape_travaux.find('cout_min') is None:
                new_child_cout_min = etree.Element('cout_min')
                new_child_cout_min.text = str(1000.0)
                etape_travaux.append(new_child_cout_min)
            if etape_travaux.find('cout_max') is None:
                new_child_cout_max = etree.Element('cout_max')
                new_child_cout_max.text = str(2000.0)
                etape_travaux.append(new_child_cout_max)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_travaux_cout_presence'

    # Reset the audit :
    audit = etree.parse(f, parser)

    # Erreur de fourchette de coûts cumulés définie incorrectement (manque cout_cumule_min ou cout_cumule_max)
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            # Suppression de cout_cumule_min si présent pour tester l'erreur avec cout_cumule_max seul
            cout_cumule_min = etape_travaux.find('.//cout_cumule_min')
            if cout_cumule_min is not None:
                etape_travaux.remove(cout_cumule_min)
            # Assurer que 'cout_min' et 'cout_max' sont présents pour déclencher l'erreur
            if etape_travaux.find('cout_cumule_max') is None:
                cout_cumule_max = etree.Element('cout_cumule_max')
                cout_cumule_max.text = str(1000.0)
                etape_travaux.append(cout_cumule_max)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_travaux_cout_cumule_fourchette'

    # Erreur de coûts cumulés manquants (ni cout_cumule, ni cout_cumule_min, ni cout_cumule_max présents)
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            # Suppression de tous les éléments relatifs aux coûts cumulés
            for elem_name in ['cout_cumule', 'cout_cumule_min', 'cout_cumule_max']:
                elem = etape_travaux.find(f'.//{elem_name}')
                if elem is not None:
                    etape_travaux.remove(elem)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_travaux_cout_cumule_missing'

    # Erreur où à la fois le coût cumulé et la fourchette de coûts cumulés sont déclarés
    for logement in list(audit.iterfind('*//logement')):
        etape_travaux = logement.find('.//etape_travaux')
        if etape_travaux is not None:
            # Ajout de cout_cumule si non présent
            if etape_travaux.find('.//cout_cumule') is None:
                new_cout_cumule = etree.Element('cout_cumule')
                new_cout_cumule.text = str(3000.0)
                etape_travaux.append(new_cout_cumule)

            # Ajout de cout_cumule_min et cout_cumule_max pour déclencher l'erreur
            if etape_travaux.find('.//cout_cumule_min') is None:
                new_cout_cumule_min = etree.Element('cout_cumule_min')
                new_cout_cumule_min.text = str(2000.0)
                etape_travaux.append(new_cout_cumule_min)
            if etape_travaux.find('.//cout_cumule_max') is None:
                new_cout_cumule_max = etree.Element('cout_cumule_max')
                new_cout_cumule_max.text = str(4000.0)
                etape_travaux.append(new_cout_cumule_max)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert (len(report.error_input) == 1)
            assert report.error_input[0]['thematique'] == 'error_travaux_cout_cumule_presence'

    # Reset the audit :
    audit = etree.parse(f, parser)

    # Erreur de fourchette de coûts mal déclarée dans travaux_collection
    for logement in list(audit.iterfind('*//logement')):
        travaux_collection = logement.findall('.//travaux_collection/travaux')
        for travaux in travaux_collection:
            # Suppression de cout_min si présent pour tester l'erreur avec cout_max seul
            cout_min = travaux.find('cout_min')
            if cout_min is not None:
                travaux.remove(cout_min)
            if travaux.find('cout_max') is None:
                etree.SubElement(travaux, 'cout_max').text = str(2000.0)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert any(error['thematique'] == 'error_travaux_cout_fourchette' for error in report.error_input)

    # Erreur de coûts manquants dans travaux_collection
    for logement in list(audit.iterfind('*//logement')):
        travaux_collection = logement.findall('.//travaux_collection/travaux')
        for travaux in travaux_collection:
            # Suppression de tous les éléments relatifs aux coûts pour déclencher l'erreur
            for elem_name in ['cout', 'cout_min', 'cout_max']:
                elem = travaux.find(elem_name)
                if elem is not None:
                    travaux.remove(elem)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert any(error['thematique'] == 'error_travaux_cout_missing' for error in report.error_input)

    # Erreur où à la fois le coût et la fourchette de coûts sont déclarés dans travaux_collection
    for logement in list(audit.iterfind('*//logement')):
        travaux_collection = logement.findall('.//travaux_collection/travaux')
        for travaux in travaux_collection:
            # Ajout de cout, cout_min et cout_max pour déclencher l'erreur
            if travaux.find('cout') is None:
                etree.SubElement(travaux, 'cout').text = str(1500.0)
            if travaux.find('cout_min') is None:
                etree.SubElement(travaux, 'cout_min').text = str(1000.0)
            if travaux.find('cout_max') is None:
                etree.SubElement(travaux, 'cout_max').text = str(2000.0)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert any(error['thematique'] == 'error_travaux_cout_presence' for error in report.error_input)

    # Reset the audit :
    audit = etree.parse(f, parser)

    # Erreur de fourchette de coûts mal déclarée dans travaux_induits_collection
    for logement in list(audit.iterfind('*//logement')):
        travaux_induits_collection = logement.findall('.//travaux_induits_collection/travaux_induits')
        for travaux_induits in travaux_induits_collection:
            # Suppression de cout_min si présent pour tester l'erreur avec cout_max seul
            cout_min = travaux_induits.find('cout_min')
            if cout_min is not None:
                travaux_induits.remove(cout_min)
            if travaux_induits.find('cout_max') is None:
                etree.SubElement(travaux_induits, 'cout_max').text = str(2000.0)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert any(error['thematique'] == 'error_travaux_cout_fourchette' for error in report.error_input)

    # Erreur de coûts manquants dans travaux_induits_collection
    for logement in list(audit.iterfind('*//logement')):
        travaux_induits_collection = logement.findall('.//travaux_induits_collection/travaux_induits')
        for travaux_induits in travaux_induits_collection:
            # Suppression de tous les éléments relatifs aux coûts pour déclencher l'erreur
            for elem_name in ['cout', 'cout_min', 'cout_max']:
                elem = travaux_induits.find(elem_name)
                if elem is not None:
                    travaux_induits.remove(elem)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert any(error['thematique'] == 'error_travaux_cout_missing' for error in report.error_input)

    # Erreur où à la fois le coût et la fourchette de coûts sont déclarés dans travaux_induits_collection
    for logement in list(audit.iterfind('*//logement')):
        travaux_induits_collection = logement.findall('.//travaux_induits_collection/travaux_induits')
        for travaux_induits in travaux_induits_collection:
            # Ajout de cout, cout_min et cout_max pour déclencher l'erreur
            if travaux_induits.find('cout') is None:
                etree.SubElement(travaux_induits, 'cout').text = str(1500.0)
            if travaux_induits.find('cout_min') is None:
                etree.SubElement(travaux_induits, 'cout_min').text = str(1000.0)
            if travaux_induits.find('cout_max') is None:
                etree.SubElement(travaux_induits, 'cout_max').text = str(2000.0)

            report = ReportAudit()
            engine.controle_coherence_etape_travaux_cout_presence(logement, report)
            assert any(error['thematique'] == 'error_travaux_cout_presence' for error in report.error_input)

        # Reset the audit :
        audit = etree.parse(f, parser)

        # Test de cout_min <= cout_max dans etape_travaux
        for logement in list(audit.iterfind('*//logement')):
            etape_travaux = logement.find('.//etape_travaux')
            if etape_travaux is not None:
                cout = etape_travaux.find('cout')
                if cout is not None:
                    etape_travaux.remove(cout)
                cout_min = etree.SubElement(etape_travaux, 'cout_min')
                cout_min.text = '2000.0'  # Intentionally incorrect for testing
                cout_max = etree.SubElement(etape_travaux, 'cout_max')
                cout_max.text = '1000.0'  # Intentionally incorrect for testing

                cout_cumule = etape_travaux.find('cout_cumule')
                if cout_cumule is not None:
                    etape_travaux.remove(cout_cumule)
                cout_cumule_min = etree.SubElement(etape_travaux, 'cout_cumule_min')
                cout_cumule_min.text = '2000.0'  # Intentionally incorrect for testing
                cout_cumule_max = etree.SubElement(etape_travaux, 'cout_cumule_max')
                cout_cumule_max.text = '1000.0'  # Intentionally incorrect for testing

                report = ReportAudit()
                engine.controle_coherence_etape_travaux_cout_presence(logement, report)
                assert (len(report.error_input) == 2)
                assert report.error_input[0]['thematique'] == 'error_travaux_cout_cumule_order'
                assert report.error_input[1]['thematique'] == 'error_travaux_cout_order'

        # Reset the audit :
        audit = etree.parse(f, parser)

        # Test de cout_min <= cout_max dans travaux_collection
        for logement in list(audit.iterfind('*//logement')):
            travaux_collection = logement.findall('.//travaux_collection/travaux')
            for travaux in travaux_collection:
                cout = travaux.find('cout')
                if cout is not None:
                    travaux.remove(cout)
                cout_min = etree.SubElement(travaux, 'cout_min')
                cout_min.text = '3000.0'  # Intentionally incorrect for testing
                cout_max = etree.SubElement(travaux, 'cout_max')
                cout_max.text = '1500.0'  # Intentionally incorrect for testing

                report = ReportAudit()
                engine.controle_coherence_etape_travaux_cout_presence(logement, report)
                assert any(error['thematique'] == 'error_travaux_cout_order' for error in report.error_input)

        # Reset the audit :
        audit = etree.parse(f, parser)

        # Test de cout_min <= cout_max dans travaux_induits_collection
        for logement in list(audit.iterfind('*//logement')):
            travaux_induits_collection = logement.findall('.//travaux_induits_collection/travaux_induits')
            for travaux_induits in travaux_induits_collection:
                cout = travaux_induits.find('cout')
                if cout is not None:
                    travaux_induits.remove(cout)
                cout_min = etree.SubElement(travaux_induits, 'cout_min')
                cout_min.text = '2500.0'  # Intentionally incorrect for testing
                cout_max = etree.SubElement(travaux_induits, 'cout_max')
                cout_max.text = '1000.0'  # Intentionally incorrect for testing

                report = ReportAudit()
                engine.controle_coherence_etape_travaux_cout_presence(logement, report)
                assert any(error['thematique'] == 'error_travaux_cout_order' for error in report.error_input)


def test_controle_coherence_etape_premiere_saut_2_classes():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.2_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_etape_premiere_saut_2_classes(audit, report)
    assert (len(report.error_input) == 0)

    # passe toutes les etapes premières en classe DPE 'G' pour créer 2 erreurs - pas d'atteinte de classe E ET pas de gain de 2 classes
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        # if etape première
        if enum_etape_id.text == '1':
            enum_etape_id.getparent().getparent().find('etape_travaux').find('classe_bilan_dpe').text = 'G'
    report = ReportAudit()
    engine.controle_coherence_etape_premiere_saut_2_classes(audit, report)
    assert (len(report.error_input) == 2)
    assert report.error_input[0]['thematique'] == 'error_class_etape_finale'

    # active la derogation technique - pas d'erreur
    audit.find('.//enum_derogation_technique_id').text = '2'
    report = ReportAudit()
    engine.controle_coherence_etape_premiere_saut_2_classes(audit, report)
    assert (len(report.error_input) == 0)

    # desactive la derogation technique et ACTIVE la derograiton economique - pas d'erreur
    audit.find('.//enum_derogation_technique_id').text = '1'
    audit.find('.//enum_derogation_economique_id').text = '2'
    report = ReportAudit()
    engine.controle_coherence_etape_premiere_saut_2_classes(audit, report)
    assert (len(report.error_input) == 0)
    audit.find('.//enum_derogation_economique_id').text = '1'

    # passe toutes les etapes premières en classe DPE 'F' pour créer 2 erreurs - pas d'atteinte de classe E ET pas de gain de 2 classes
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        # if etape première
        if enum_etape_id.text == '1':
            enum_etape_id.getparent().getparent().find('etape_travaux').find('classe_bilan_dpe').text = 'F'
    report = ReportAudit()
    engine.controle_coherence_etape_premiere_saut_2_classes(audit, report)
    assert (len(report.error_input) == 2)
    assert report.error_input[0]['thematique'] == 'error_class_etape_finale'

    # passe toutes les etapes premières en classe DPE 'E' - pas d'erreurs !
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        # if etape première
        if enum_etape_id.text == '1':
            enum_etape_id.getparent().getparent().find('etape_travaux').find('classe_bilan_dpe').text = 'E'
    report = ReportAudit()
    engine.controle_coherence_etape_premiere_saut_2_classes(audit, report)
    assert (len(report.error_input) == 0)

    # étape première en B et état intial en C => 0 erreur
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        # if etat initial
        if enum_etape_id.text == '0':
            enum_etape_id.getparent().getparent().find('.//classe_bilan_dpe').text = 'C'
        else:
            enum_etape_id.getparent().getparent().find('etape_travaux').find('classe_bilan_dpe').text = 'B'
    report = ReportAudit()
    engine.controle_coherence_etape_premiere_saut_2_classes(audit, report)
    assert (len(report.error_input) == 0)

    # étape première en B et état intial en B => 0 erreur
    for enum_etape_id in list(audit.iterfind('*//enum_etape_id')):
        # if etat initial
        if enum_etape_id.text == '0':
            enum_etape_id.getparent().getparent().find('.//classe_bilan_dpe').text = 'B'
        else:
            enum_etape_id.getparent().getparent().find('etape_travaux').find('classe_bilan_dpe').text = 'B'
    report = ReportAudit()
    engine.controle_coherence_etape_premiere_saut_2_classes(audit, report)
    assert (len(report.error_input) == 0)


def test_controle_coherence_gain_cumule():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_gain_cumule(audit, report)
    assert (len(report.error_software) == 0)

    # cas 2.3 qui utilisait la convention inverse (gain comptabilisé en positif)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.3_valid.xml'))
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_gain_cumule(audit, report)
    assert (len(report.error_software) == 4)

    # cas 2.3 d'un EDL avec une augmentation de GES de +22% soit +3 kgCO2/m²/an
    # => Dans le seuil de tolérance (+10 kgCO2) => ne doit pas remonter d'erreur
    f = str((engine.mdd_path / 'exemples_metier' /  'cas_edl' / 'cas_audit_gain_ges_positif.xml'))
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_gain_cumule(audit, report)
    assert (len(report.error_software) == 0)


def test_controle_coherence_travaux_autre():
    # Création de l'engine et du parser
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str(engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_latest_valid.xml')

    # Cas valide : le taux d'utilisation de "autre" est supposé être inférieur ou égal à 90%
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_travaux_autre(audit, report)
    # On s'attend à ce qu'aucune erreur ne soit générée
    assert len(report.error_input) == 0

    # --- Test 1 : Forcer une erreur sur les lots ---
    # Pour cela, on modifie tous les éléments enum_lot_travaux_audit_id pour qu'ils valent "10" (ID "autre")
    audit = etree.parse(f, parser)
    lot_elements = audit.xpath('//enum_lot_travaux_audit_id')
    for el in lot_elements:
        el.text = "10"
    report = ReportAudit()
    engine.controle_coherence_travaux_autre(audit, report)
    # Comme tous les lots valent "10", le taux est de 100%, supérieur au seuil de 90%
    # On s'attend donc à ce qu'au moins un message d'erreur soit généré
    assert len(report.error_input) == 1
    # Vérification que le message concerne bien le thème "error_travaux_autre_rate"
    assert report.error_input[0]['thematique'] == 'error_travaux_autre_rate'

    # --- Test 2 : Forcer une erreur sur les types ---
    # Remettre à zéro en chargeant à nouveau le XML de base
    audit = etree.parse(f, parser)
    # On modifie tous les éléments enum_type_travaux_id pour qu'ils valent "24" (ID "autre")
    type_elements = audit.xpath('//enum_type_travaux_id')
    for el in type_elements:
        el.text = "24"
    report = ReportAudit()
    engine.controle_coherence_travaux_autre(audit, report)
    # On s'attend à avoir une erreur concernant le taux d'utilisation des types "autre"
    assert len(report.error_input) == 1
    # Vérification que l'un des messages d'erreur concerne bien le thème "error_travaux_autre_rate"
    themes = [error['thematique'] for error in report.error_input]
    assert 'error_travaux_autre_rate' in themes

    # --- Test 3 : Forcer une erreur sur le résumé des travaux ---
    # Recharger le XML de base
    audit = etree.parse(f, parser)
    resume_elements = audit.xpath('//enum_travaux_resume_id')
    for el in resume_elements:
        el.text = "11"  # ID "autre" pour enum_travaux_resume_id
    report = ReportAudit()
    engine.controle_coherence_travaux_autre(audit, report)
    # On s'attend à avoir une erreur concernant le taux d'utilisation des résumés "autre"
    assert len(report.error_input) == 1
    assert report.error_input[0]['thematique'] == 'error_travaux_autre_rate'

    # --- Test 4 : Forcer une erreur sur les trois critères simultanément ---
    # Recharger le XML de base
    audit = etree.parse(f, parser)
    # Modifier tous les éléments pour qu'ils valent "10" pour les lots, "24" pour les types et "11" pour les résumés
    for el in audit.xpath('//enum_lot_travaux_audit_id'):
        el.text = "10"
    for el in audit.xpath('//enum_type_travaux_id'):
        el.text = "24"
    for el in audit.xpath('//enum_travaux_resume_id'):
        el.text = "11"
    report = ReportAudit()
    engine.controle_coherence_travaux_autre(audit, report)
    # On s'attend à avoir trois messages d'erreur (un pour chaque critère)
    assert len(report.error_input) == 3
    themes = [error['thematique'] for error in report.error_input]
    assert themes.count('error_travaux_autre_rate') == 3



def test_controle_coherence_deux_postes_isolation():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_maison_1_v2.2_valid.xml'))
    # cas de base valide
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_deux_postes_isolation(audit, report)
    assert (len(report.warning_input) == 0)

    # passe toutes les enum_lot_travaux_audit_id en "1" pour "mur" afin de créer 2 erreurs - 1 par scénario principal
    for etape_travaux in list(audit.iterfind('*//etape_travaux')):
        all_lot_travaux = list(etape_travaux.iterfind('*//enum_lot_travaux_audit_id'))
        for lot_travaux in all_lot_travaux:
            lot_travaux.text = '1'

    report = ReportAudit()
    engine.controle_coherence_deux_postes_isolation(audit, report)
    assert (len(report.warning_input) == 2)
    assert report.warning_input[0]['thematique'] == 'warning_missing_work'


def test_controle_coherence_scenario_audit_copro():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_copro_latest_valid.xml'))

    # --- Cas valide : audit copro avec scénario 7 présent, scénarios 1 et 2 absents ---
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_scenario_audit_copro(audit, report)
    assert len(report.error_software) == 0

    # --- Cas invalide : audit copro, scénario 7 manquant ---
    audit = etree.parse(f, parser)
    for scenario in audit.iterfind('*//enum_scenario_id'):
        if scenario.text == '7':
            scenario.text = '3'  # change en scénario complémentaire pour simuler l'absence
    report = ReportAudit()
    engine.controle_coherence_scenario_audit_copro(audit, report)
    assert any(err['thematique'] == 'error_scenario_copro_missing' for err in report.error_software)

    # --- Cas invalide : audit copro, scénario interdit 1 présent ---
    audit = etree.parse(f, parser)
    for scenario in audit.iterfind('*//enum_scenario_id'):
        if scenario.text != '7':
            scenario.text = '1'  # ajoute scénario multi étapes interdit
    report = ReportAudit()
    engine.controle_coherence_scenario_audit_copro(audit, report)
    assert any(err['thematique'] == 'error_scenario_non_copro_forbidden' for err in report.error_software)

    # --- Cas invalide : audit copro, scénario interdit 2 présent ---
    audit = etree.parse(f, parser)
    for scenario in audit.iterfind('*//enum_scenario_id'):
        if scenario.text != '7':
            scenario.text = '2'  # ajoute scénario en une étape interdit
    report = ReportAudit()
    engine.controle_coherence_scenario_audit_copro(audit, report)
    assert any(err['thematique'] == 'error_scenario_non_copro_forbidden' for err in report.error_software)

    # --- Cas invalide : audit NON copro, scénario 7 présent ---
    audit = etree.parse(f, parser)
    # simulate audit non copro
    modele = audit.find('*//enum_modele_audit_id')
    modele.text = '1'  # audit maison individuelle
    for scenario in audit.iterfind('*//enum_scenario_id'):
        scenario.text = '7'  # force scénario copro interdit
    report = ReportAudit()
    engine.controle_coherence_scenario_audit_copro(audit, report)
    assert any(err['thematique'] == 'error_scenario_copro_forbidden' for err in report.error_software)


def test_controle_coherence_derogation_audit_copro():
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_audit_copro_latest_valid.xml'))

    # --- Cas valide : audit copro avec valeurs "non applicable" correctes ---
    audit = etree.parse(f, parser)
    report = ReportAudit()
    engine.controle_coherence_derogation_audit_copro(audit, report)
    assert len(report.error_software) == 0

    # --- Cas invalide : audit copro avec mauvaise valeur de dérogation technique (≠ 3) ---
    audit = etree.parse(f, parser)
    audit.find('*//enum_derogation_technique_id').text = '2'
    report = ReportAudit()
    engine.controle_coherence_derogation_audit_copro(audit, report)
    assert any(err['thematique'] == 'error_derogation_technique_copro' for err in report.error_software)

    # --- Cas invalide : audit copro avec mauvaise valeur de dérogation économique (≠ 4) ---
    audit = etree.parse(f, parser)
    audit.find('*//enum_derogation_technique_id').text = '3'  # valide
    audit.find('*//enum_derogation_economique_id').text = '2'
    report = ReportAudit()
    engine.controle_coherence_derogation_audit_copro(audit, report)
    assert any(err['thematique'] == 'error_derogation_economique_copro' for err in report.error_software)

    # --- Cas invalide : audit non copro avec enum_derogation_technique_id = 3 (interdit) ---
    audit = etree.parse(f, parser)
    audit.find('*//enum_modele_audit_id').text = '1'  # "audit réglementaire logement"
    audit.find('*//enum_derogation_technique_id').text = '3'
    audit.find('*//enum_derogation_economique_id').text = '1'
    report = ReportAudit()
    engine.controle_coherence_derogation_audit_copro(audit, report)
    assert any(err['thematique'] == 'error_derogation_technique_non_copro' for err in report.error_software)

    # --- Cas invalide : audit non copro avec enum_derogation_economique_id = 4 (interdit) ---
    audit = etree.parse(f, parser)
    audit.find('*//enum_modele_audit_id').text = '1'
    audit.find('*//enum_derogation_technique_id').text = '1'
    audit.find('*//enum_derogation_economique_id').text = '4'
    report = ReportAudit()
    engine.controle_coherence_derogation_audit_copro(audit, report)
    assert any(err['thematique'] == 'error_derogation_economique_non_copro' for err in report.error_software)



# ==================      TEST CONTROLE COHERENCE AUDIT ================

@pytest.mark.parametrize("valid_example", VALID_CASES_AUDIT+VALID_CASES_AUDIT_N_MOINS_1)
def test_run_controle_coherence_audit(valid_example):
    try:
        os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_POST_DPE_latest

        _set_version_audit_to_valid_dates()
        engine = EngineAudit()
        parser = etree.XMLParser(remove_blank_text=True)

        # vérification v2
        f = str((engine.mdd_path / 'exemples_metier' / valid_example))
        audit = etree.parse(f, parser)
        report = engine.run_controle_coherence(audit)
        nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        assert (report['validation_xsd']['valid'] == True)
        assert (nb_errors == 0)

        # vérification rétrocompatibilité version précédente :
        # SAUF pour la 2.5-2.4 et 2.1-2.0 où la rétrocompatibilité n'est plus assuré.
        get_previous_version = {'1.0': '1.0', '1.1': '1.0', '2.0': '2.0', '2.1': '2.1', '2.2': '2.1', '2.3': '2.3','2.4':'2.3','2.5':'2.5'}
        audit = etree.parse(f, parser)
        audit.find('*//enum_version_audit_id').text = get_previous_version[audit.find('*//enum_version_audit_id').text]
        report = engine.run_controle_coherence(audit)
        nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        assert (report['validation_xsd']['valid'] == True)
        assert (nb_errors == 0)

        # Supresion de la variable d'enrironement
        if os.getenv('OBS_DPE_DATETIME_NOW') is not None:
            del os.environ['OBS_DPE_DATETIME_NOW']
        assert os.getenv('OBS_DPE_DATETIME_NOW') == None


        # quand on essaye sur la version précédente cela ne fonctionne pas à cause de changements de modèles entre 2.4 et 2.5
        # if valid_example in VALID_CASES_AUDIT_N_MOINS_1:
        #     audit.find('*//enum_version_audit_id').text = '2.4'
        #     report = engine.run_controle_coherence(audit)
        #     nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
        #     assert (report['validation_xsd']['valid'] == False)

    except AssertionError as e:
        print(report['validation_xsd'])
        print(f'nombre d erreurs : {nb_errors}')
        for err in report['erreur_logiciel'] + report['erreur_saisie']:
            print("=================== ERROR =========================")
            print(err['thematique'])
            print(err['message'])
            print(err['objets_concerne'])
        print(f)
        raise e


# @pytest.mark.parametrize("valid_example", CASES_AUDIT_DPE_2_3)
# def test_passage_dpe_2_4_sur_audit(valid_example):
#     try:
#         os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_PRE_DPE_24
#         _set_version_audit_to_valid_dates()
#         engine = EngineAudit()
#         parser = etree.XMLParser(remove_blank_text=True)
#
#         # AVANT 1er juillet 2024
#         # vérification que le cas est valide
#         f = str((engine.mdd_path / 'exemples_metier' / valid_example))
#         audit = etree.parse(f, parser)
#         audit.find('.//enum_version_dpe_id').text = '2.3'
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 0)
#
#         # vérification que le cas est INvalide, en DPE 2.4
#         enum_version_dpe_id = audit.find('.//enum_version_dpe_id')
#         enum_version_dpe_id.text = '2.4'
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 1)
#
#         # Verififaction que le cas est valide, en retirant la balise enum_version_dpe_id
#         enum_version_dpe_id = audit.find('.//enum_version_dpe_id')
#         enum_version_dpe_id.getparent().remove(enum_version_dpe_id)
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 0)
#
#         # A PARTIR DU 1er juillet 2024
#         # vérification que le cas est INvalide
#         os.environ['OBS_DPE_DATETIME_NOW'] = DATE_TEST_POST_DPE_latest
#         f = str((engine.mdd_path / 'exemples_metier' / valid_example))
#         audit = etree.parse(f, parser)
#         audit.find('.//enum_version_dpe_id').text = '2.3'
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 1)
#
#         # vérification que le cas est Valide, en DPE 2.4
#         enum_version_dpe_id = audit.find('.//enum_version_dpe_id')
#         enum_version_dpe_id.text = '2.4'
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 0)
#
#         # Verififaction que le cas est INvalide, en retirant la balise enum_version_dpe_id
#         enum_version_dpe_id = audit.find('.//enum_version_dpe_id')
#         enum_version_dpe_id.getparent().remove(enum_version_dpe_id)
#         report = engine.run_controle_coherence(audit)
#         nb_errors = len(report['erreur_logiciel']) + len(report['erreur_saisie'])
#         assert (report['validation_xsd']['valid'] == True)
#         assert (nb_errors == 1)
#
#         # Supresion de la variable d'enrironement
#         del os.environ['OBS_DPE_DATETIME_NOW']
#         assert os.getenv('OBS_DPE_DATETIME_NOW') == None
#     except AssertionError as e:
#         print(report['validation_xsd'])
#         print(f'nombre d erreurs : {nb_errors}')
#         for err in report['erreur_logiciel'] + report['erreur_saisie']:
#             print("=================== ERROR =========================")
#             print(err['thematique'])
#             print(err['message'])
#             print(err['objets_concerne'])
#         print(f)
#         raise e


# CE TEST VERIFIE QUE LA BALISE DE L'AUDIT "enum_version_dpe_id" SOIT TOUJOURS IDENTIFIQUE A CELLE DU DPE "enum_version_id"
def test_unicite_entre_enum_version_dpe_id_et_enum_version_id():
    engine = EngineAudit()
    with open(str((engine.mdd_path / 'enums.json')), 'r') as file:
        # Load its content and turn it into a Python dictionary
        enums_dpe = json.load(file)

    with open(str((engine.mdd_path / 'enums_audit.json')), 'r') as file:
        # Load its content and turn it into a Python dictionary
        enums_audit = json.load(file)
    keys_version = set(enums_dpe["version"].keys())
    keys_version_dpe = set(enums_audit["version_dpe"].keys())

    # Vérifie QUE LES enum_version_dpe_id de l'audit et enum_version_id du DPE aient les mêmes IDs !
    # Si ce n'est pas le cas, il faut mettre à jour.
    if not keys_version == keys_version_dpe:
        raise Exception("enum_version_dpe_id de l'audit et enum_version_id du DPE n'ont pas les mêmes IDs. Or, il faut toujours que ces deux enums soient identiques ! \n Merci de mettre à jour ces enums.")


# verifier que des XML à trous ne fassent pas planter le moteur de controle de cohérence AUDIT
@pytest.mark.parametrize("valid_example", VALID_CASES_AUDIT)
def test_do_not_crash_controle_coherence_audit_(valid_example):
    # Load and parse the xml file
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f_xml = str((engine.mdd_path / 'exemples_metier' / valid_example))
    audit = etree.parse(f_xml, parser)
    xml_root = audit.getroot()

    enum_version_audit_id = audit.find('.//enum_version_audit_id').text
    xsd_file = versions_audit_cfg[enum_version_audit_id]['xsd_file']
    # Load and parse the xsd file

    f_xsd = str((engine.mdd_path / xsd_file))
    xsd_tree = etree.parse(f_xsd, parser)
    xsd_root = xsd_tree.getroot()

    # Find all elements in the xsd file that are optional
    optional_elements = xsd_root.xpath('.//xs:element[@minOccurs="0"][@nillable="true"]',
                                       namespaces={'xs': 'http://www.w3.org/2001/XMLSchema'})

    # Get the names of these elements
    optional_element_names = [element.get('name') for element in optional_elements]

    # Remove the optional elements from the xml file
    for element_name in optional_element_names:
        for element in xml_root.xpath(f'//{element_name}'):
            element.getparent().remove(element)

    # vérification : le moteur ne doit pas planter !
    report = engine.run_controle_coherence(audit)


# verifier que des XML à trous, avec etape_travaux, ne fassent pas planter le moteur de controle de cohérence AUDIT
@pytest.mark.parametrize("valid_example", VALID_CASES_AUDIT)
def test_do_not_crash_with_etape_travaux_controle_coherence_audit_(valid_example):
    # Load and parse the xml file
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f_xml = str((engine.mdd_path / 'exemples_metier' / valid_example))
    audit = etree.parse(f_xml, parser)
    xml_root = audit.getroot()

    enum_version_audit_id = audit.find('.//enum_version_audit_id').text
    xsd_file = versions_audit_cfg[enum_version_audit_id]['xsd_file']
    # Load and parse the xsd file

    f_xsd = str((engine.mdd_path / xsd_file))
    xsd_tree = etree.parse(f_xsd, parser)
    xsd_root = xsd_tree.getroot()

    # Find all elements in the xsd file that are optional
    optional_elements = xsd_root.xpath('.//xs:element[@minOccurs="0"][@nillable="true"]',
                                       namespaces={'xs': 'http://www.w3.org/2001/XMLSchema'})

    # Get the names of these elements
    optional_element_names = [element.get('name') for element in optional_elements]

    # Remove the optional elements from the xml file
    for element_name in optional_element_names:
        # Don't remove 'etape_travaux'
        if element_name == 'etape_travaux':
            continue
        for element in xml_root.xpath(f'//{element_name}'):
            element.getparent().remove(element)

    # vérification : le moteur ne doit pas planter !
    report = engine.run_controle_coherence(audit)


# verifier que des XML (mais qui sont valid pour le XSD) ne fassent pas planter le moteur de controle de cohérence AUDIT
@pytest.mark.parametrize("crash_example", CRASH_CASES_AUDIT)
def test_do_not_crash_files_controle_coherence_audit_(crash_example):
    # Load and parse the xml file
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f_xml = str((engine.mdd_path / 'exemples_metier' / crash_example))
    audit = etree.parse(f_xml, parser)

    # vérification : le moteur ne doit pas planter !
    report = engine.run_controle_coherence(audit)
    stop = 1


# verifier que des XML des EDL (mais qui sont valid pour le XSD) ne fassent pas planter le moteur de controle de cohérence AUDIT
@pytest.mark.parametrize("crash_example", CRASH_CASES_EDL_AUDIT)
def test_do_not_crash_edl_files_controle_coherence_audit_(crash_example):
    # Load and parse the xml file
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True)
    f_xml = str((engine.mdd_path / 'exemples_metier' / crash_example))
    audit = etree.parse(f_xml, parser)

    # vérification : le moteur ne doit pas planter !
    report = engine.run_controle_coherence(audit)


@pytest.mark.skipif(CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST == 0, reason="extensive test is very long")
def test_extensive_random_change_param():
    _set_version_dpe_to_valid_dates()

    import random
    random.seed(0)
    engine = EngineDPE()

    for a_file in ['cas_test_appt_2_neuf_valid.xml', 'cas_test_immeuble_1_valid_avec_reference.xml', "cas_test_tertiaire_1_vierge_valid.xml"]:
        print(a_file)
        parser = etree.XMLParser(remove_blank_text=True)
        f = str((engine.mdd_path / 'exemples_metier' / a_file))
        dpe = etree.parse(f, parser)
        el_tv = dpe.xpath('*//*[starts-with(name(), "tv_")]')
        el_enum = dpe.xpath('*//*[starts-with(name(), "enum_")]')
        el_all = el_tv + el_enum
        for i in range(100):
            random.shuffle(el_all)
            for el in el_all:
                if el.tag.startswith('tv'):
                    el.text = str(random.choice(list(engine.valeur_table_dict[el.tag].keys())))
                else:
                    el.text = str(random.choice(list(engine.enum_dict[el.tag].keys())))
                report = ReportDPE()
                engine.run_controle_coherence(dpe)
    for a_file in ['cas_test_immeuble_1_valid.xml', 'cas_test_appt_2_neuf_valid.xml']:
        print(a_file)
        parser = etree.XMLParser(remove_blank_text=True)
        f = str((engine.mdd_path / 'exemples_metier' / a_file))
        dpe = etree.parse(f, parser)
        el_tv = dpe.xpath('*//*[starts-with(name(), "tv_")]')
        el_enum = dpe.xpath('*//*[starts-with(name(), "enum_")]')
        el_all = el_tv + el_enum
        for i in range(100):
            random.shuffle(el_all)
            for el in el_all:
                if el.tag.startswith('tv'):
                    el.text = str(random.choice(list(engine.valeur_table_dict[el.tag].keys())))
                else:
                    el.text = str(random.choice(list(engine.enum_dict[el.tag].keys())))
                report = ReportDPE()
                engine.run_controle_coherence(dpe)


@pytest.mark.skipif(CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST == 0, reason="extensive test is very long")
def test_extensive_random_remove_optionnel_controle_coherence():
    _set_version_dpe_to_valid_dates()

    import random
    random.seed(0)
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    xs = '{http://www.w3.org/2001/XMLSchema}'
    namespaces = {'xs': 'http://www.w3.org/2001/XMLSchema'}
    f = str((engine.mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    engine.run_controle_coherence(dpe)
    for a_file in ['cas_test_appt_2_neuf_valid.xml', 'cas_test_immeuble_1_valid_avec_reference.xml', "cas_test_tertiaire_1_vierge_valid.xml"]:
        parser = etree.XMLParser(remove_blank_text=True)
        f = str((engine.mdd_path / 'exemples_metier' / a_file))
        dpe = etree.parse(f, parser)
        version_id_str = dpe.find('*//enum_version_id').text

        # path_xsd = r'.\DPE_dev.xsd'
        et_xsd = etree.parse(str((engine.mdd_path / versions_dpe_cfg[version_id_str]['xsd_file']).absolute()), parser=parser)
        root = et_xsd.getroot()
        path_list = list()
        for el in [el for el in root.xpath('//xs:element[@minOccurs="0"]', namespaces=namespaces)]:
            if el.find('xs:annotation/xs:appinfo', namespaces=namespaces) is not None:
                source = el.find('xs:annotation/xs:appinfo', namespaces=namespaces).attrib.get('source')
                source = source[3:]
                path_list.append(source)
        for i in range(100):

            dpe = etree.parse(f, parser)
            all_optional_elements = list()
            for path in path_list:
                all_optional_elements.extend(list(dpe.iterfind(path)))
            random.shuffle(all_optional_elements)
            for el in all_optional_elements:
                el.getparent().remove(el)
                engine.run_controle_coherence(dpe)

    for a_file in ['cas_test_immeuble_1_valid.xml', 'cas_test_appt_2_neuf_valid.xml']:
        parser = etree.XMLParser(remove_blank_text=True)
        f = str((engine.mdd_path / 'exemples_metier' / a_file))
        dpe = etree.parse(f, parser)
        version_id_str = (dpe.find('*//enum_version_id').text)

        # path_xsd = r'.\DPE_dev.xsd'
        et_xsd = etree.parse(str((engine.mdd_path / versions_dpe_cfg[version_id_str]['xsd_file']).absolute()), parser=parser)
        root = et_xsd.getroot()
        path_list = list()
        for el in [el for el in root.xpath('//xs:element[@minOccurs="0"]', namespaces=namespaces)]:
            if el.find('xs:annotation/xs:appinfo', namespaces=namespaces) is not None:
                source = el.find('xs:annotation/xs:appinfo', namespaces=namespaces).attrib.get('source')
                source = source[3:]
                path_list.append(source)
        for i in range(100):

            dpe = etree.parse(f, parser)
            all_optional_elements = list()
            for path in path_list:
                all_optional_elements.extend(list(dpe.iterfind(path)))
            random.shuffle(all_optional_elements)
            for el in all_optional_elements:
                el.getparent().remove(el)
                engine.run_controle_coherence(dpe)


@pytest.mark.skipif(CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST == 0, reason="extensive test is very long")
def test_extensive_random_chaos():
    import random
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True)
    namespaces = {'xs': 'http://www.w3.org/2001/XMLSchema'}

    for a_file in ['cas_test_appt_2_neuf_valid.xml', 'cas_test_immeuble_1_valid_avec_reference.xml', "cas_test_tertiaire_1_vierge_valid.xml"]:
        print(a_file)
        f = str((engine.mdd_path / 'exemples_metier' / a_file))
        dpe = etree.parse(f, parser)
        version_id_str = dpe.find('*//enum_version_id').text
        # path_xsd = r'.\DPE_dev.xsd'
        et_xsd = etree.parse(str((engine.mdd_path / versions_dpe_cfg[version_id_str]['xsd_file']).absolute()), parser=parser)
        root = et_xsd.getroot()
        el_tv = dpe.xpath('*//*[starts-with(name(), "tv_")]')
        el_enum = dpe.xpath('*//*[starts-with(name(), "enum_")]')
        el_all = el_tv + el_enum

        path_list = list()
        for el in [el for el in root.xpath('//xs:element[@minOccurs="0"]', namespaces=namespaces)]:
            if el.find('xs:annotation/xs:appinfo', namespaces=namespaces) is not None:
                source = el.find('xs:annotation/xs:appinfo', namespaces=namespaces).attrib.get('source')
                source = source[3:]
                path_list.append(source)

        for i in range(1000):
            dpe = etree.parse(f, parser)
            all_optional_elements = list()
            for path in path_list:
                all_optional_elements.extend(list(dpe.iterfind(path)))
            random.shuffle(all_optional_elements)
            random.shuffle(el_all)
            for i in range(0, 10):
                for el in el_all:
                    # randomly pop an optional element
                    if random.random() > 0.5:
                        if len(all_optional_elements) > 0:
                            el_opt = all_optional_elements.pop(0)
                            el_opt.getparent().remove(el_opt)
                    if el.tag.startswith('tv'):
                        el.text = str(random.choice(list(engine.valeur_table_dict[el.tag].keys())))
                    else:
                        el.text = str(random.choice(list(engine.enum_dict[el.tag].keys())))
                    report = ReportDPE()
                    engine.run_controle_coherence(dpe)

    for a_file in VALID_CASES_DPE:
        print(a_file)
        f = str((engine.mdd_path / 'exemples_metier' / a_file))
        dpe = etree.parse(f, parser)
        version_id_str = dpe.find('*//enum_version_id').text
        # path_xsd = r'.\DPE_dev.xsd'
        et_xsd = etree.parse(str((engine.mdd_path / versions_dpe_cfg[version_id_str]['xsd_file']).absolute()), parser=parser)
        root = et_xsd.getroot()
        el_tv = dpe.xpath('*//*[starts-with(name(), "tv_")]')
        el_enum = dpe.xpath('*//*[starts-with(name(), "enum_")]')
        el_all = el_tv + el_enum

        path_list = list()
        for el in [el for el in root.xpath('//xs:element[@minOccurs="0"]', namespaces=namespaces)]:
            if el.find('xs:annotation/xs:appinfo', namespaces=namespaces) is not None:
                source = el.find('xs:annotation/xs:appinfo', namespaces=namespaces).attrib.get('source')
                source = source[3:]
                path_list.append(source)

        for i in range(1000):
            dpe = etree.parse(f, parser)
            all_optional_elements = list()
            for path in path_list:
                all_optional_elements.extend(list(dpe.iterfind(path)))
            random.shuffle(all_optional_elements)
            random.shuffle(el_all)
            for i in range(0, 10):
                for el in el_all:
                    # randomly pop an optional element
                    if random.random() > 0.5:
                        if len(all_optional_elements) > 0:
                            el_opt = all_optional_elements.pop(0)
                            el_opt.getparent().remove(el_opt)
                    if el.tag.startswith('tv'):
                        el.text = str(random.choice(list(engine.valeur_table_dict[el.tag].keys())))
                    else:
                        el.text = str(random.choice(list(engine.enum_dict[el.tag].keys())))
                    report = ReportDPE()
                    engine.run_controle_coherence(dpe)

# ==================      TEST BRANCHEMENT DES CONTROLES de COHERENCE ================

# s'assurer que tous les controles de coherence sont bien appelés dans chaque moteur
def test_branchement_des_controles_coherence():
    controle_coherence_not_in_audit = ['controle_coherence_conso_5_usages_tertiaire']
    for dispositif, engine in {'dpe':EngineDPE, 'audit':EngineAudit}.items():
        # Liste les méthodes de la classe
        all_controle_coherence = [
            name for name, func in inspect.getmembers(engine, predicate=inspect.isfunction)
            if name.startswith("controle_coherence")
        ]
        if dispositif == 'audit':
            all_controle_coherence = [el for el in all_controle_coherence if el not in controle_coherence_not_in_audit]

        # Récupère le code source de la classe entière
        class_source = textwrap.dedent(inspect.getsource(engine))
        class_ast = ast.parse(class_source)
        # Cherche la fonction run_controle_coherence dans l'AST de la classe
        for node in class_ast.body:
            if isinstance(node, ast.ClassDef):
                for item in node.body:
                    if isinstance(item, ast.FunctionDef) and item.name == "run_controle_coherence":
                        run_controle_coherence_node = item
                        break

        assert 'run_controle_coherence_node' in locals(), "Impossible de trouver la méthode run_controle_coherence"

        class MethodCallVisitor(ast.NodeVisitor):
            def __init__(self):
                self.called = set()
            def visit_Call(self, node):
                if isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name):
                    if node.func.value.id == "self":
                        self.called.add(node.func.attr)
                self.generic_visit(node)

        visitor = MethodCallVisitor()
        visitor.visit(run_controle_coherence_node)
        called_methods = visitor.called

        missing = [m for m in all_controle_coherence if m not in called_methods]
        assert not missing, (
            f"Pour le moteur {dispositif}, les méthodes suivantes ne sont PAS appelées dans run_controle_coherence: {missing}"
        )