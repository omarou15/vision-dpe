from datetime import datetime
from pathlib import Path
import lxml
from lxml import etree
import os
import re
import pytest
import requests
from pkg_resources import resource_filename
from controle_coherence.assets_dpe import versions_dpe_cfg, DATE_APPLICATION_BLOCAGE_CONTROLE_RCU
from controle_coherence.utils import _set_version_audit_to_valid_dates, _set_version_dpe_to_valid_dates
from test_traducteur_xml import VALID_EXPORTED_DPE_CASE, VALID_EXPORTED_AUDIT_CASE
from test_controle_coherence import VALID_CASES_AUDIT, VALID_CASES_DPE, VALID_CASES_DPE_N_MOINS_1, VALID_CASES_AUDIT_N_MOINS_1
from controle_coherence.controle_coherence import EngineDPE, EngineAudit
import itertools

URLS_AUDIT = ["http://localhost:5000/controle_coherence_audit", "http://localhost:5000/controle_coherence_audit_test_1_janvier_2026"]

URLS_DPE = ["http://localhost:5000/controle_coherence", "http://localhost:5000/controle_coherence_test_1_janvier_2026"]

# TODO : J'ai séparé temporairement les deux tests suivants sur les "controle_coherence" DPE, en 1 test DPE 2.5 (n - 1) et un test DPE 2.6 (1 er janvier)
# TODO : A partir du 1er janvier, on pourra supprimer le test 1 er janvier, et rétablir "test_route"  avec itertools.product(URLS_DPE, VALID_CASES_DPE)
# @pytest.mark.parametrize("url,cas_test_valide", itertools.product(URLS_DPE, VALID_CASES_DPE))
@pytest.mark.parametrize("url,cas_test_valide", itertools.product([URLS_DPE[0]], VALID_CASES_DPE_N_MOINS_1))
def test_route(url, cas_test_valide):
    _set_version_dpe_to_valid_dates()
    _set_version_audit_to_valid_dates()

    url = "http://localhost:5000/controle_coherence"

    mdd_path = EngineDPE().mdd_path

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    r = requests.post(url, data=etree.tostring(dpe))
    assert (r.status_code == 200)
    dpe.find('*//enum_version_id').text = '1'
    r = requests.post(url, data=etree.tostring(dpe))
    assert (r.status_code == 200)
    r = requests.get('http://localhost:5000//ui')
    assert (r.status_code == 200)
    r = requests.post(url, data='<badxml></badxml>')
    assert (r.status_code == 200)
    assert (r.json()['validation_xsd']['valid'] == False)
    r = requests.post(url, data='bad_content')
    assert (r.status_code == 400)
    parser = etree.XMLParser(remove_blank_text=True)
    try:
        f = str((mdd_path / 'exemples_metier' / cas_test_valide))
        dpe = etree.parse(f, parser)
        r = requests.post(url, data=etree.tostring(dpe))
        assert (r.status_code == 200)
        resp = r.json()
        errors = resp['erreur_logiciel'] + resp['erreur_saisie']

        assert (errors == [])
        assert (resp['validation_xsd']['valid'] == True)
    except AssertionError as e:
        print(cas_test_valide)
        print(resp)
        raise e
    # for cas_test_v1 in( mdd_path / 'exemples_editeurs').iterdir():
    #     dpe = etree.parse(str(cas_test_v1.absolute()), parser)
    #     print(cas_test_v1)
    #     r=requests.post(url,data=etree.tostring(dpe))
    #     resp = r.json()
    #     nb_errors = len(resp['erreur_logiciel']) + len(resp['erreur_saisie'])
    #
    #     assert (r.status_code == 200)
    #     assert(nb_errors==0)
    #     assert(resp['validation_xsd']['valid']==True)

@pytest.mark.parametrize("url,cas_test_valide", itertools.product([URLS_DPE[1]], VALID_CASES_DPE))
def test_route_1_janvier_2026(url, cas_test_valide):

    mdd_path = EngineDPE().mdd_path

    parser = etree.XMLParser(remove_blank_text=True)
    f = str((mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)

    r = requests.post(url, data=etree.tostring(dpe))
    assert (r.status_code == 200)
    dpe.find('*//enum_version_id').text = '1'
    r = requests.post(url, data=etree.tostring(dpe))
    assert (r.status_code == 200)
    r = requests.get('http://localhost:5000//ui')
    assert (r.status_code == 200)
    r = requests.post(url, data='<badxml></badxml>')
    assert (r.status_code == 200)
    assert (r.json()['validation_xsd']['valid'] == False)
    r = requests.post(url, data='bad_content')
    assert (r.status_code == 400)
    parser = etree.XMLParser(remove_blank_text=True)
    try:
        f = str((mdd_path / 'exemples_metier' / cas_test_valide))
        dpe = etree.parse(f, parser)
        r = requests.post(url, data=etree.tostring(dpe))
        assert (r.status_code == 200)
        resp = r.json()
        errors = resp['erreur_logiciel'] + resp['erreur_saisie']

        assert (errors == [])
        assert (resp['validation_xsd']['valid'] == True)
    except AssertionError as e:
        print(cas_test_valide)
        print(resp)
        raise e

def test_route_debug():
    _set_version_dpe_to_valid_dates()
    _set_version_audit_to_valid_dates()
    mdd_path = EngineDPE().mdd_path

    parser = etree.XMLParser(remove_blank_text=True)

    f = str((mdd_path / 'exemples_metier' / 'cas_test_appt_1_invalid.xml').absolute())
    dpe = etree.parse(f, parser)
    coll = dpe.find('*//pont_thermique_collection')
    for child in coll.getchildren():
        coll.remove(child)
    r = requests.post("http://localhost:5000/controle_coherence", data=etree.tostring(dpe))
    assert (r.status_code == 200)
    resp = r.json()
    nb_errors = len(resp['erreur_logiciel']) + len(resp['erreur_saisie'])
    assert (nb_errors == 0)
    nb_warning = len(resp['warning_logiciel']) + len(resp['warning_saisie'])
    assert (nb_warning == 0)
    assert (resp['validation_xsd']['valid'] == False)

    r = requests.post("http://localhost:5000/controle_coherence_debug", data=etree.tostring(dpe))
    assert (r.status_code == 200)
    resp = r.json()
    nb_errors = len(resp['erreur_logiciel']) + len(resp['erreur_saisie'])
    assert (nb_errors > 0)
    nb_warning = len(resp['warning_logiciel']) + len(resp['warning_saisie'])
    assert (nb_warning > 0)
    assert (resp['validation_xsd']['valid'] == False)

# TODO : J'ai séparé temporairement les deux tests suivants sur les "controle_coherence_audit", en 1 test Audit 2.4 (n - 1) et un test Audit 2.5 (1 er janvier)
# TODO : A partir du 1er janvier, on pourra supprimer le test 1 er janvier, et rétablir "test_route"  avec itertools.product(URLS_AUDIT, VALID_CASES_AUDIT))
# @pytest.mark.parametrize("url,cas_test_valide", itertools.product(URLS_AUDIT, VALID_CASES_AUDIT))
@pytest.mark.parametrize("url,cas_test_valide", itertools.product([URLS_AUDIT[0]], VALID_CASES_AUDIT_N_MOINS_1))
def test_route_audit(url, cas_test_valide):
    mdd_path = EngineAudit().mdd_path

    parser = etree.XMLParser(remove_blank_text=True)

    r = requests.post(url, data='<badxml></badxml>')
    assert (r.status_code == 200)
    assert (r.json()['validation_xsd']['valid'] == False)
    r = requests.post(url, data='bad_content')
    assert (r.status_code == 400)
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((mdd_path / 'exemples_metier' / cas_test_valide))
    audit = etree.parse(f, parser)
    r = requests.post(url, data=etree.tostring(audit))
    assert (r.status_code == 200)
    resp = r.json()
    assert (resp['validation_xsd']['valid'] == True)
    errors = resp['erreur_logiciel'] + resp['erreur_saisie']

    assert (errors == [])

@pytest.mark.parametrize("url,cas_test_valide", itertools.product([URLS_AUDIT[1]], VALID_CASES_AUDIT))
def test_route_audit_1_janvier_2026(url, cas_test_valide):
    mdd_path = EngineAudit().mdd_path

    parser = etree.XMLParser(remove_blank_text=True)

    r = requests.post(url, data='<badxml></badxml>')
    assert (r.status_code == 200)
    assert (r.json()['validation_xsd']['valid'] == False)
    r = requests.post(url, data='bad_content')
    assert (r.status_code == 400)
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((mdd_path / 'exemples_metier' / cas_test_valide))
    audit = etree.parse(f, parser)
    r = requests.post(url, data=etree.tostring(audit))
    assert (r.status_code == 200)
    resp = r.json()
    assert (resp['validation_xsd']['valid'] == True)
    errors = resp['erreur_logiciel'] + resp['erreur_saisie']

    assert (errors == [])

def test_additional_routes():
    excel_folder = Path('.').parent / 'excel_folder'
    xml_folder = Path('.').parent / 'excel_folder'
    xml_folder.mkdir(exist_ok=True, parents=True)
    url = "http://localhost:5000"
    mdd_path = EngineDPE().mdd_path

    r = requests.get(url + '/version')
    assert (r.status_code == 200)
    resp = r.json()
    resp['msg']['xsd_dpe_version']
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((mdd_path / 'exemples_metier' / 'cas_test_appt_1.xml'))
    dpe = etree.parse(f, parser)
    r = requests.post(url + '/traduction_xml', data=etree.tostring(dpe))

    dpe_traduit = etree.fromstring(r.content, parser)
    assert (dpe_traduit.find('*//enum_modele_dpe_id').text == 'dpe 3cl 2021 méthode logement')


@pytest.mark.parametrize("cas_test_valide", VALID_CASES_DPE + VALID_EXPORTED_DPE_CASE)
def test_route_traduction_xml_dpe(cas_test_valide):
    xml_folder = Path('.').parent / 'excel_folder'
    xml_folder.mkdir(exist_ok=True, parents=True)
    url = "http://localhost:5000"
    mdd_path = EngineDPE().mdd_path
    parser = etree.XMLParser(remove_blank_text=True, recover=True)

    f = str((mdd_path / 'exemples_metier' / cas_test_valide))
    dpe = etree.parse(f, parser)
    r = requests.post(url + '/traduction_xml', data=etree.tostring(dpe))
    assert (r.status_code == 200)
    dpe_traduit = etree.fromstring(r.content, parser)


@pytest.mark.parametrize("cas_test_valide", VALID_CASES_DPE + VALID_EXPORTED_DPE_CASE)
def test_route_traduction_xml_no_enum_dpe(cas_test_valide):
    xml_folder = Path('.').parent / 'excel_folder'
    xml_folder.mkdir(exist_ok=True, parents=True)
    url = "http://localhost:5000"
    mdd_path = EngineDPE().mdd_path
    parser = etree.XMLParser(remove_blank_text=True, recover=True)

    f = str((mdd_path / 'exemples_metier' / cas_test_valide))
    dpe = etree.parse(f, parser)
    r = requests.post(url + '/traduction_xml_no_enum', data=etree.tostring(dpe))
    assert (r.status_code == 200)
    dpe_traduit = etree.fromstring(r.content, parser)
    # with open((mdd_path / 'exemples_metier' / cast_test_valide).name,'w',encoding='utf-8') as f:
    #     f.write(etree.tostring(dpe_traduit,pretty_print=True,encoding='utf-8').decode('utf-8'))


@pytest.mark.parametrize("cas_test_valide", VALID_CASES_AUDIT + VALID_EXPORTED_AUDIT_CASE)
def test_route_traduction_xml_audit(cas_test_valide):
    xml_folder = Path('.').parent / 'excel_folder'
    xml_folder.mkdir(exist_ok=True, parents=True)
    url = "http://localhost:5000"
    mdd_path = EngineDPE().mdd_path
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((mdd_path / 'exemples_metier' / cas_test_valide))
    audit = etree.parse(f, parser)
    r = requests.post(url + '/traduction_xml_audit', data=etree.tostring(audit))
    assert (r.status_code == 200)
    audit_traduit = etree.fromstring(r.content, parser)
    assert (audit_traduit.find('*//enum_modele_audit_id').text in ['audit copro','audit réglementaire logement', 'audit volontaire logement'])
    # assert(audit_traduit.find('*//enum_methode_application_dpe_log_id').text=='dpe maison individuelle')


@pytest.mark.parametrize("cas_test_valide", VALID_EXPORTED_DPE_CASE)
def test_route_traduction_xml_excel_dpe(cas_test_valide):
    xml_folder = Path('.').parent / 'excel_folder'
    xml_folder.mkdir(exist_ok=True, parents=True)
    url = "http://localhost:5000"
    mdd_path = EngineDPE().mdd_path
    parser = etree.XMLParser(remove_blank_text=True)
    excel_folder = Path('excel_folder')
    excel_folder.mkdir(exist_ok=True, parents=True)
    f = str((mdd_path / 'exemples_metier' / cas_test_valide))
    with open(f, 'rb') as f:
        xml_string = f.read()

    r = requests.post(url + '/traduction_xml_to_excel_dpe', data=xml_string)
    # Ajoutez cette ligne pour afficher le contenu de la réponse en cas d'échec
    if r.status_code != 200:
        print("Erreur de réponse HTTP :")
        print(r.text)
    assert (r.status_code == 200)

    d = r.headers['content-disposition']
    fname = re.findall("filename=(.+)", d)[0]
    with open(excel_folder / fname, 'wb') as f:
        f.write(r.content)


@pytest.mark.parametrize("cas_test_valide", VALID_EXPORTED_AUDIT_CASE)
def test_route_traduction_xml_excel_audit(cas_test_valide):
    xml_folder = Path('.').parent / 'excel_folder'
    xml_folder.mkdir(exist_ok=True, parents=True)
    url = "http://localhost:5000"
    mdd_path = EngineDPE().mdd_path
    parser = lxml.etree.XMLParser(remove_blank_text=True, recover=True)
    excel_folder = Path('excel_folder')
    excel_folder.mkdir(exist_ok=True, parents=True)
    f = str((mdd_path / 'exemples_metier' / cas_test_valide))
    # with open(xml_folder/cast_test_valide, 'wb') as f:
    #     f.write(r.content)
    with open(f, 'rb') as f:
        xml_string = f.read()
    r = requests.post(url + '/traduction_xml_to_excel_audit', data=xml_string)
    # Ajoutez cette ligne pour afficher le contenu de la réponse en cas d'échec
    if r.status_code != 200:
        print("Erreur de réponse HTTP :")
        print(r.text)
    assert (r.status_code == 200)

    d = r.headers['content-disposition']
    fname = re.findall("filename=(.+)", d)[0]
    # with open(excel_folder/fname, 'wb') as f:
    #     f.write(r.content)


def test_controle_blocage_reseau_20_septembre():

    _set_version_dpe_to_valid_dates()
    _set_version_audit_to_valid_dates()

    cas_test_valide = 'cas_test_immeuble_1_valid_reseau_chaleur.xml'
    mdd_path = EngineDPE().mdd_path
    parser = etree.XMLParser(remove_blank_text=True)
    f = str((mdd_path / 'exemples_metier' / cas_test_valide))
    dpe = etree.parse(f, parser)

    dpe.find('.//date_arrete_reseau_chaleur').text = EngineDPE().arrete_reseau_chaleur[-3]['date_arrete_reseau_chaleur']

    url = "http://localhost:5000/controle_coherence"

    if datetime.now()<DATE_APPLICATION_BLOCAGE_CONTROLE_RCU:
        r = requests.post(url, data=etree.tostring(dpe))
        assert (r.status_code == 200)
        resp = r.json()
        errors = resp['erreur_logiciel'] + resp['erreur_saisie']

        assert (errors == [])
        assert (resp['validation_xsd']['valid'] == True)
    else:
        r = requests.post(url, data=etree.tostring(dpe))
        assert (r.status_code == 200)
        resp = r.json()
        errors = resp['erreur_logiciel'] + resp['erreur_saisie']

        assert (len(errors)>0)
        assert (resp['validation_xsd']['valid'] == True)

    url = "http://localhost:5000/controle_coherence_test_1_janvier_2026"

    r = requests.post(url, data=etree.tostring(dpe))
    assert (r.status_code == 200)
    resp = r.json()
    errors = resp['erreur_logiciel'] + resp['erreur_saisie']

    assert (len(errors) > 0)
    assert (resp['validation_xsd']['valid'] == True)
