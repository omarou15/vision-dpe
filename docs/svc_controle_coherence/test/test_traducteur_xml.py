from controle_coherence.controle_coherence import EngineDPE, EngineAudit
from lxml import etree
import os
import time
import logging
from pathlib import Path
from test_controle_coherence import _set_version_dpe_to_valid_dates
from controle_coherence.utils_convert_excel import traduction_xml_excel, cleanup_excel_folder
from controle_coherence.utils import traduction_xml_new_element
import pytest
VALID_EXPORTED_DPE_CASE = [
    "2292E1204763Q.xml", '2294T0304804M.xml', '2193N0000135D.xml', '2193N0000155X.xml','2100E0110064G_v1.xml','2101E0880267M_v1.xml',
                           '2254N3226633T.xml',
    '2471E4005342M_oui.xml'
                           ]

VALID_EXPORTED_AUDIT_CASE = ['audit-bet-entreprise.xml', 'audit-architecte.xml', 'FAKEAUDIT804M.xml']

CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST = int(os.getenv('CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST', 0))

print('CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST', CONTROLE_COHERENCE_RUN_EXTENSIVE_TEST)


@pytest.mark.parametrize("xml_name",VALID_EXPORTED_DPE_CASE)
def test_traduction_xml_excel_dpe(xml_name):

    _set_version_dpe_to_valid_dates()
    engine = EngineDPE()
    parser = etree.XMLParser(remove_blank_text=True,recover=True)
    excel_folder = Path('excel_folder')
    excel_folder.mkdir(exist_ok=True, parents=True)

    number_of_xlsx_in_folder_before = len([i for i in excel_folder.iterdir() if ".xlsx" in i.name])
    logging.info(xml_name)
    f = str((engine.mdd_path / 'exemples_metier' / xml_name))
    xml = etree.parse(f, parser)
    response = traduction_xml_excel(xml, excel_folder)
    number_of_xlsx_in_folder = len([i for i in excel_folder.iterdir() if ".xlsx" in i.name])
    # Check if a new XLSX file has been generated
    assert number_of_xlsx_in_folder == number_of_xlsx_in_folder_before + 1
    number_of_xlsx_in_folder_before = number_of_xlsx_in_folder
@pytest.mark.parametrize("xml_name",VALID_EXPORTED_DPE_CASE)
def test_traduction_xml_traduit_dpe(xml_name):


    _set_version_dpe_to_valid_dates()
    parser = etree.XMLParser(remove_blank_text=True,recover=True)

    engine = EngineDPE()



    f = str((engine.mdd_path / 'exemples_metier' / xml_name))
    xml = etree.parse(f, parser)
    response = traduction_xml_new_element(xml,engine)

@pytest.mark.parametrize("xml_name", VALID_EXPORTED_AUDIT_CASE)
def test_traduction_xml_traduit_audit(xml_name):
    _set_version_dpe_to_valid_dates()
    parser = etree.XMLParser(remove_blank_text=True,recover=True)
    engine = EngineAudit()

    for xml_name in VALID_EXPORTED_AUDIT_CASE:
        f = str((engine.mdd_path / 'exemples_metier' / xml_name))
        xml = etree.parse(f, parser)
        response = traduction_xml_new_element(xml,engine)
@pytest.mark.parametrize("xml_name", VALID_EXPORTED_AUDIT_CASE)
def test_traduction_xml_excel_audit(xml_name):

    _set_version_dpe_to_valid_dates()
    engine = EngineAudit()
    parser = etree.XMLParser(remove_blank_text=True,recover=True)
    excel_folder = Path('excel_folder')
    excel_folder.mkdir(exist_ok=True, parents=True)

    number_of_xlsx_in_folder_before = len([i for i in excel_folder.iterdir() if ".xlsx" in i.name])
    f = str((engine.mdd_path / 'exemples_metier' / xml_name))
    xml = etree.parse(f, parser)
    response = traduction_xml_excel(xml, excel_folder)
    number_of_xlsx_in_folder = len([i for i in excel_folder.iterdir() if ".xlsx" in i.name])
    # Check if a new XLSX file has been generated
    assert number_of_xlsx_in_folder == number_of_xlsx_in_folder_before + 1
    number_of_xlsx_in_folder_before = number_of_xlsx_in_folder



def test_cleanup_excel_folder():
    excel_folder = Path('excel_folder')
    excel_folder.mkdir(exist_ok=True, parents=True)
    test_traduction_xml_excel_audit(VALID_EXPORTED_AUDIT_CASE[0])
    test_traduction_xml_excel_dpe(VALID_EXPORTED_DPE_CASE[0])
    len_excel = len([el for el in excel_folder.iterdir()])
    cleanup_excel_folder(excel_folder, delat_t_delete=3600)
    assert (len([el for el in excel_folder.iterdir()]) == len_excel)
    cleanup_excel_folder(excel_folder, delat_t_delete=0)
    assert (len([el for el in excel_folder.iterdir()]) == 0)
