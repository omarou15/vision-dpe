from pathlib import Path

import yaml


def load_version_file():
    current_path = Path(__file__)
    versions_path_list = [current_path.parent.parent/'versions.yml',current_path.parent.parent.parent/'versions.yml']
    versions_path_list = [el for el in versions_path_list if el.is_file()]
    versions_path = versions_path_list[0]
    with open(versions_path,'r') as f:
        versions=yaml.safe_load(f)

    return versions
versions = load_version_file()
# version des différents composants
__xsdversion__ = versions['model_dpe']['version'] # version du XSD DPE
__xsdversion_audit__ = versions['model_audit']['version'] # version du XSD AUDIT
__version_dpe__ = versions['controle_coherence_dpe']['version'] # version du contrôle de cohérence DPE
__version_audit__ = versions['controle_coherence_audit']['version'] # version du contrôle de cohérence AUDIT
__svc_version__ = versions['svc_controle_coherence']['version'] # version du webservice applicatif

# version globale du dépot
__version_global__ = versions['version_globale']['version'] # version globale incrémentée à chaque modification de l'un des composants
