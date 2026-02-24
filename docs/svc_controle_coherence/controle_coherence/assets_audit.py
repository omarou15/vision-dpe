import numpy as np
from datetime import datetime

# configuration des versions de l'audit, incluant le nom du fichier XSD à utiliser ainsi que ses dates de validité

# les versions anterieurs documentées ici appliquent les blocker as warning comme des warnings

AUDIT_VERSION_ANTERIEUR = ['2.0', '2.1','2.2','2.3','2.4']
# AUDIT_VERSION_ANTERIEUR = ['1.0', '0.1']


versions_audit_cfg = {
    '0.1': {
        'xsd_file': 'audit_regv1.xsd',
        'start_date': '2000-01-01',
        'end_date': '2023-09-01',
        'end_date_compare_now': '2023-09-01',
        'is_future': False,

    },
    '1.0': {
        'xsd_file': 'audit_regv1.xsd',
        'start_date': '2000-01-01',
        'end_date': '2023-09-01',
        'end_date_compare_now': '2023-09-01',
        'is_future': False,

    },
    '1.1': {
        'xsd_file': 'audit_regv1.1.xsd',
        'start_date': '2000-01-01',
        'end_date': '2023-09-01',
        'end_date_compare_now': '2023-09-01',
        'is_future': False,

    },
    '2.0': {
        'xsd_file': 'audit_v2.0.xsd',
        'start_date': '2000-01-01',
        'end_date': '2024-02-01',
        'end_date_compare_now': '2024-03-01',
        'is_future': False,

    },
    '2.1': {
        'xsd_file': 'audit_v2.1.xsd',
        'start_date': '2023-10-01',
        'end_date': '2024-09-01',
        'end_date_compare_now': '2024-09-01',
        'is_future': False,
        'version_dpe_min': '2.4',
        'version_dpe_max': None,

    },
    '2.2': {
        'xsd_file': 'audit_v2.2.xsd',
        'start_date': '2024-03-04',
        'end_date': '2025-02-01',
        'end_date_compare_now': '2025-02-01',
        'is_future': False,
        'version_dpe_min': '2.4',
        'version_dpe_max': None,

    },
    '2.3': {
        'xsd_file': 'audit_v2.3.xsd',
        'start_date': '2024-09-30',
        'end_date': '2025-09-30',
        'end_date_compare_now': '2025-09-30',
        'is_future': False,
        'version_dpe_min': '2.4',
        'version_dpe_max': '2.5',

    },
    '2.4': {
        'xsd_file': 'audit_v2.4.xsd',
        'start_date': '2025-03-24',
        'end_date': '2025-12-31',
        'end_date_compare_now': '2025-12-31',
        'is_future': False,
        'version_dpe_min': '2.5',
        'version_dpe_max': '2.5',

    },
    '2.5': {
        'xsd_file': 'audit_v2.5.xsd',
        'start_date': '2026-01-01',
        'end_date': '2200-01-01',
        'end_date_compare_now': '2200-01-01',
        'is_future': True,
        'version_dpe_min': '2.6',
        'version_dpe_max': None,

    }

}


def get_current_valid_versions_audit(now):
    # liste des versions valides
    current_valid_versions = list()
    for k, cfg in versions_audit_cfg.items():
        start_date = datetime.fromisoformat(cfg['start_date'])
        end_date = datetime.fromisoformat(cfg['end_date'])
        end_date_compare_now_version = datetime.fromisoformat(cfg['end_date_compare_now'])

        if (start_date <= now) & (end_date >= now) & (end_date_compare_now_version >= now):
            current_valid_versions.append(k)
    return current_valid_versions
