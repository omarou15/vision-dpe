from lxml import etree
from pathlib import Path
from controle_coherence.utils import remove_null_elements
from controle_coherence.controle_coherence import EngineDPE,EngineAudit


def procedure_validation(dpe,debug=False,datetime_now=None):
    resp = dict()

    engine = EngineDPE()

    # remove nil
    remove_null_elements(dpe)

    return engine.run_controle_coherence(dpe,debug=debug,datetime_now=datetime_now)

def procedure_validation_audit(xml,debug=False,datetime_now=None):
    resp = dict()

    engine = EngineAudit()

    # remove nil
    remove_null_elements(xml)

    return engine.run_controle_coherence(xml,debug=debug,datetime_now=datetime_now)
