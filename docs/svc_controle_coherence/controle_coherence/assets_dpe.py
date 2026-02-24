import json

import numpy as np
from datetime import datetime

import pandas as pd

import os

# configuration des versions du DPE, incluant le nom du fichier XSD à utiliser ainsi que ses dates de validité

# les versions anterieurs documentées ici appliquent les blocker as warning comme des warnings
DPE_VERSION_ANTERIEUR = ['2.4', '2.5']

DPE_VERSION_PETITE_SURFACE = "2.4"

DATE_APPLICATION_PETITE_SURFACE = datetime.fromisoformat('2024-07-01')  # A PARTIR DU 1er JUILLET 2024

DATE_APPLICATION_PEF_ELEC = datetime.fromisoformat('2026-01-01')  # A PARTIR DU 1er Janvier 2026

DATE_APPLICATION_BLOCAGE_CONTROLE_RCU = datetime.fromisoformat('2024-09-20')  # A PARTIR DU 20 09

versions_dpe_cfg = {
    '1': {
        'xsd_file': 'DPEV1(OBSOLETE).xsd',
        'start_date': '2021-07-01',
        'end_date': '2021-11-02',
        'end_date_compare_now': '2021-11-16',
        'is_future': False,

    },
    '1.1': {
        'xsd_file': 'DPEV1(OBSOLETE).xsd',
        'start_date': '2021-10-04',
        'end_date': '2022-01-04',
        'end_date_compare_now': '2022-01-04',
        'end_date_edit': '2022-05-01',  # date limite pour les rééditions
        'is_future': False,

    },
    '2': {
        'xsd_file': 'DPEv2.xsd',
        'start_date': '2021-10-30',
        'end_date': '2022-05-11',
        'end_date_compare_now': '2022-05-11',
        'is_future': False,

    },
    '2.1': {
        'xsd_file': 'DPEv2.xsd',
        'start_date': '2021-12-08',
        'end_date': '2022-09-28',
        'end_date_compare_now': '2022-09-28',
        'is_future': False,

    },
    '2.2': {
        'xsd_file': 'DPEv2.2.xsd',
        'start_date': '2021-12-08',
        'end_date': '2023-08-05',
        'end_date_compare_now': '2023-08-05',
        'end_date_edit': '2023-08-05',  # date limite pour les rééditions
        'is_future': False,

    },
    '2.3': {
        'xsd_file': 'DPEv2.3.xsd',
        'start_date': '2022-12-01',
        'end_date': '2024-07-01',
        'end_date_compare_now': '2024-07-01',
        'is_future': False,

    },
    '2.4': {
        'xsd_file': 'DPEv2.4.xsd',
        'start_date': '2024-07-01',
        'end_date': '2025-09-30',
        'end_date_compare_now': '2025-09-30',
        'is_future': False,

    },
    '2.5': {
        'xsd_file': 'DPEv2.5.xsd',
        'start_date': '2025-03-24',
        'end_date': '2025-12-31',
        'end_date_compare_now': '2025-12-31',
        'is_future': False,

    },
    '2.6': {
        'xsd_file': 'DPEv2.6.xsd',
        'start_date': '2026-01-01',
        'end_date': '2200-01-01',
        'end_date_compare_now': '2200-01-01',
        'is_future': True,

    }
}


# If datetime_now is defined in local env, return it. Else, return actual today datetime
def get_datetime_now(datetime_now):
    if datetime_now is not None:
        return datetime.fromisoformat(datetime_now)

    elif os.getenv('OBS_DPE_DATETIME_NOW') is not None:
        return datetime.fromisoformat(os.getenv('OBS_DPE_DATETIME_NOW'))
    else:
        return datetime.now()


def get_current_valid_versions_dpe(now):
    # liste des versions valides
    current_valid_versions = list()
    for k, cfg in versions_dpe_cfg.items():
        start_date = datetime.fromisoformat(cfg['start_date'])
        end_date = datetime.fromisoformat(cfg['end_date'])
        end_date_compare_now_version = datetime.fromisoformat(cfg['end_date_compare_now'])

        if (start_date <= now) & (end_date >= now) & (end_date_compare_now_version >= now):
            current_valid_versions.append(k)
    return current_valid_versions


def get_latest_dpe_version():
    """
    Returns the highest dpe version in versions_dpe_cfg.

    Returns:
    str: The highest dpe version in versions_dpe_cfg.
    """
    versions = list(versions_dpe_cfg.keys())

    # Convert version string to tuple of integers for proper comparison
    def version_tuple(version):
        return tuple(map(int, version.split('.')))

    # Use max with key to find the maximum version based on tuple comparison
    latest_version = max(versions, key=version_tuple)
    return latest_version


# chemins de vérfication en fonction du type de
modele_verification_paths = {
    1: ['./administratif',
        './logement/caracteristique_generale',
        './logement/sortie',
        ],
    2: ['./administratif',
        './logement_neuf/caracteristique_generale',
        './logement_neuf/sortie',
        ],
    3: ['./administratif',
        './logement_neuf/caracteristique_generale',
        './logement_neuf/sortie',
        ],
    4: ['./administratif',
        './tertiaire/caracteristique_generale',
        ],
}

tv_table_to_value = {'coef_reduction_deperdition': {'values': ['b', 'bver'],
                                                    'atol': 0.01,
                                                    'tv_value_name': 'b'},
                     'uvue': {'values': [], 'atol': 0.01, 'tv_value_name': 'uvue'},
                     'umur0': {'values': ['umur0'], 'atol': 0.01, 'tv_value_name': 'umur0'},
                     'umur': {'values': ['umur'], 'atol': 0.01, 'tv_value_name': 'umur'},
                     'upb0': {'values': ['upb0'], 'atol': 0.01, 'tv_value_name': 'upb0'},
                     'upb': {'values': ['upb'], 'atol': 0.01, 'tv_value_name': 'upb'},
                     'uph0': {'values': ['uph0'], 'atol': 0.01, 'tv_value_name': 'uph0'},
                     'uph': {'values': ['uph'], 'atol': 0.01, 'tv_value_name': 'uph'},
                     'ug': {'values': ['ug'], 'atol': 0.01, 'tv_value_name': 'ug'},
                     'uw': {'values': ['uw'], 'atol': 0.01, 'tv_value_name': 'uw'},
                     'deltar': {'values': [], 'tv_value_name': 'deltar'},
                     'ujn': {'values': ['ujn'], 'atol': 0.01, 'tv_value_name': 'ujn'},
                     'coef_orientation': {'values': [], 'tv_value_name': 'coef_orientation'},
                     'sw': {'values': ['sw'], 'atol': 0.01, 'tv_value_name': 'sw'},
                     'coef_masque_proche': {'values': ['fe1'],
                                            'atol': 0.01,
                                            'tv_value_name': 'fe1'},
                     'coef_masque_lointain_homogene': {'values': ['fe2'],
                                                       'atol': 0.01,
                                                       'tv_value_name': 'fe2'},
                     'coef_transparence_ets': {'values': ['coef_transparence_ets'],
                                               'atol': 0.01,
                                               'tv_value_name': 'coef_transparence_ets'},
                     'pont_thermique': {'values': ['k'],
                                        'atol': 0.01,
                                        'tv_value_name': 'k'},
                     'q4pa_conv': {'values': ['q4pa_conv'],
                                   'atol': 0.01,
                                   'tv_value_name': 'q4pa_conv'},
                     'uporte': {'values': ['uporte'], 'atol': 0.01, 'tv_value_name': 'uporte'},
                     'seer': {'values': ['eer'], 'atol': 0.01, 'tv_value_name': 'eer'},
                     'debits_ventilation': {'values': [],
                                            'atol': 0.01,
                                            'tv_value_name': 'debits_ventilation'},
                     'coef_orientation_pv': {'values': [],
                                             'atol': 0.01,
                                             'tv_value_name': 'coef_orientation_pv'},
                     'facteur_couverture_solaire': {'values': ['fch', 'fecs'],
                                                    'atol': 0.01,
                                                    'tv_value_name': 'facteur_couverture_solaire'},
                     'rendement_distribution_ecs': {'values': ['rendement_distribution'],
                                                    'atol': 0.01,
                                                    'tv_value_name': 'rd'},
                     'generateur_combustion': {'values': ['pveil'],
                                               'atol': 10,
                                               'tv_value_name': 'generateur_combustion'},
                     'pertes_stockage': {'values': [],
                                         'atol': 0.01,
                                         'tv_value_name': 'pertes_stockage'},
                     'scop': {'values': ['scop'], 'atol': 0.01, 'tv_value_name': 'scop'},
                     'reseau_chaleur': {'values': ['contenu_co2'],
                                        'atol': 0.01,
                                        'tv_value_name': 'reseau_chaleur'},
                     'rendement_generation': {'values': ['rendement_generation'],
                                              'atol': 0.01,
                                              'tv_value_name': 'rg'},
                     'temp_fonc_100': {'values': ['temp_fonc_100'],
                                       'atol': 0.01,
                                       'tv_value_name': 'temp_fonc_100'},
                     'temp_fonc_30': {'values': ['temp_fonc_30'],
                                      'atol': 0.01,
                                      'tv_value_name': 'temp_fonc_30'},
                     'rendement_emission': {'values': ['rendement_emission'],
                                            'atol': 0.01,
                                            'tv_value_name': 're'},
                     'rendement_distribution_ch': {'values': ['rendement_distribution'],
                                                   'atol': 0.01,
                                                   'tv_value_name': 'rd'},
                     'rendement_regulation': {'values': ['rendement_regulation'],
                                              'atol': 0.01,
                                              'tv_value_name': 'rr'},
                     'intermittence': {'values': ['i0'],
                                       'atol': 0.01,
                                       'tv_value_name': 'i0'},
                     'coef_masque_lointain_non_homogene': {'values': [],
                                                           'atol': 0.01,
                                                           'tv_value_name': 'coef_masque_lointain_non_homogene'}
                     }

table_interp = {'umur0': 'epaisseur_structure', 'uw': 'ug', 'ujn': 'uw', 'ug': 'epaisseur_lame'}

complex_values_list = ['umur0', 'uw', 'ug', 'ujn', 'pont_thermique',  # valeurs complexes non évaluées pour le moment par le controle
                       'temp_fonc_30', 'temp_fonc_100'  # table de valeurs qui ne sont plus éxigées
                       ]
specific_values_list = ['coef_transparence_ets', 'umur', 'upb', 'uph', 'seer']  # valeurs faisant l'objet d'un traitement spécifique
tv_var_to_modele = {"rd": "rendement_distribution",
                    "rg": "rendement_generation",
                    "re": "rendement_emission",
                    "rr": "rendement_regulation",
                    'facteur_couverture_solaire': ['fch', 'fecs'],
                    'scop': ['cop', 'scop']}

mutually_exclusive_elements = [('umur_saisi', 'tv_umur_id'),
                               ('umur0_saisi', 'tv_umur0_id'),
                               ('tv_ug_id', 'ug_saisi'),
                               ('tv_uw_id', 'uw_saisi'),
                               ('tv_ujn_id', 'ujn_saisi'),
                               ('tv_upb_id', 'upb_saisi'),
                               ('tv_upb0_id', 'upb0_saisi'),
                               ('tv_uph_id', 'uph_saisi'),
                               ('tv_uph0_id', 'uph0_saisi'),
                               ('sw_saisi', 'tv_sw_id'),
                               ('uporte_saisi', 'tv_uporte_id'),
                               ('tv_pont_thermique_id', 'k_saisi'),
                               ('tv_q4pa_conv_id', 'q4pa_conv_saisi'),
                               ('fecs_saisi', 'tv_facteur_couverture_solaire_id'),
                               ('fch_saisi', 'tv_facteur_couverture_solaire_id'),
                               ('tv_rendement_generation_id', 'tv_scop_id', 'tv_generateur_combustion_id'),
                               ('scop', 'cop', 'rendement_generation', 'rendement_generation_stockage'),
                               ('scop', 'cop', 'rpn'),
                               ('rendement_stockage', 'rendement_generation_stockage'),
                               ]

elements_saisi = ['umur_saisi', 'umur0_saisi',
                  'upb_saisi', 'upb0_saisi',
                  'uph_saisi', 'uph0_saisi',
                  'uw_saisi', 'ug_saisi', 'ujn_saisi', 'k_saisi', "uporte_saisi",
                  'sw_saisi', 'fecs_saisi', 'fch_saisi']

expected_pt_liaison = {
    'maison': {1, 5},
    "appartement": {5},
    'immeuble': {1, 5}
}

# règles d'attribution des isolations pour les murs isolé mais dont le type d'isolation est inconnu
default_isol_for_pt_isol_mais_inconnu = {'mur': {
    9: 3},  # pour les murs inconnu -> ITI par défaut
    'plancher_bas': {
        9: 4},  # pour les planchers bas inconnu -> ITE par défaut
    "plancher_haut": {
        9: 4},  # pour les planchers haut inconnu -> ITE par défaut
}

expected_components = {
    'maison': ['mur', 'plancher_bas', 'plancher_haut', 'porte', 'baie_vitree', 'pont_thermique',
               'generateur_chauffage', 'generateur_ecs', 'installation_chauffage', 'installation_ecs'],
    'immeuble': ['mur', 'plancher_bas', 'plancher_haut', 'porte', 'baie_vitree', 'pont_thermique',
                 'generateur_chauffage', 'generateur_ecs', 'installation_chauffage', 'installation_ecs'],
    'appartement': ['mur', 'porte', 'baie_vitree', 'pont_thermique',
                    'generateur_ecs', 'generateur_chauffage', 'installation_chauffage', 'installation_ecs'],
}

bool_trad_fr = {True: "Oui",
                False: "Non"}

ban_types = ['housenumber', 'street', 'locality', 'municipality']

id_generateur_pac_hybride = range(143, 162)

zones_climatiques_altitude = [2, 3, 7]

seuils_energie = {'A': [-np.inf, 70],
                  'B': [70, 110],
                  'C': [110, 180],
                  'D': [180, 250],
                  }
seuils_energie_altitude = seuils_energie.copy()

seuils_energie.update({'E': [250, 330],
                       'F': [330, 420],
                       'G': [420, np.inf]
                       }
                      )
seuils_energie_altitude.update({'E': [250, 390],
                                'F': [390, 500],
                                'G': [500, np.inf]
                                }
                               )

seuils_ges = {'A': [-np.inf, 6],
              'B': [6, 11],
              'C': [11, 30],
              'D': [30, 50],
              }
seuils_ges_altitude = seuils_ges.copy()

seuils_ges.update({'E': [50, 70],
                   'F': [70, 100],
                   'G': [100, np.inf]
                   }
                  )
seuils_ges_altitude.update({'E': [50, 80],
                            'F': [80, 110],
                            'G': [110, np.inf]
                            }
                           )

systeme_to_cle_repartition = {
    'installation_chauffage': 'cle_repartition_ch',
    'installation_ecs': 'cle_repartition_ecs',
    'ventilation': 'cle_repartition_ventilation',
    'climatisation': 'cle_repartition_clim'
}

type_doublage_to_r_doublage = {'3': 0.1,
                               '4': 0.21,
                               '5': 0.21}

materiau_mur_isolant = [
    '15',
    '16',
    '17',
    '18',
    '19',
    '24',
    '26',
]

seuils_tertiaire = {

    (1  # Bureaux, services administratifs, enseignement
     ,
     'energie'
     ):

        {"A": [-np.inf, 50],
         "B": [50, 110],
         "C": [110, 210],
         "D": [210, 350],
         "E": [350, 540],
         "F": [540, 750],
         "G": [750, np.inf], },
    (1  # Bureaux, services administratifs, enseignement
     ,
     'ges'
     ):

        {"A": [-np.inf, 5],
         "B": [5, 15],
         "C": [15, 30],
         "D": [30, 60],
         "E": [60, 100],
         "F": [100, 145],
         "G": [145, np.inf], },
    (2  # Bâtiments à occupation continue
     ,
     'energie'
     ):
        {"A": [-np.inf, 100],
         "B": [100, 210],
         "C": [210, 370],
         "D": [370, 580],
         "E": [580, 830],
         "F": [830, 1130],
         "G": [1130, np.inf], },
    (2  # Bâtiments à occupation continue
     ,
     'ges'
     ): {
        "A": [-np.inf, 12],
        "B": [12, 30],
        "C": [30, 65],
        "D": [65, 110],
        "E": [110, 160],
        "F": [160, 220],
        "G": [220, np.inf], },
    (3,  # Autres
     'energie'
     ):
        {"A": [-np.inf, 30],
         "B": [30, 90],
         "C": [90, 170],
         "D": [170, 270],
         "E": [270, 380],
         "F": [380, 510],
         "G": [510, np.inf], },
    (3,  # Autres
     'ges'
     ):

        {"A": [-np.inf, 3],
         "B": [3, 10],
         "C": [10, 25],
         "D": [25, 45],
         "E": [45, 70],
         "F": [70, 95],
         "G": [95, np.inf], },
    (4,  # Centre commercial
     'energie'
     ):
        {"A": [-np.inf, 80],
         "B": [80, 120],
         "C": [120, 180],
         "D": [180, 230],
         "E": [230, 330],
         "F": [330, 450],
         "G": [450, np.inf], },
    (4,  # Centre commercial
     'ges'
     ):
        {"A": [-np.inf, 10],
         "B": [10, 15],
         "C": [15, 25],
         "D": [25, 35],
         "E": [35, 55],
         "F": [55, 80],
         "G": [80, np.inf], }

}
