# modele de données DPE

version : 8.0.4
date : 2023-05-16

# modele de données audit

version : 2.0.0
date : 2023-02-14

# ressources

* SOURCE DE VERITE PRINCIPALE : modele_commun_DPE_audit_reg.xsd : modèle commun audit DPE : source de vérité initiale pour les dernières versions de l'audit réglementaire et DPE. 

* audit_reg.xsd : schéma XSD de l'audit réglementaire généré à partir de modele_commun_DPE_audit_reg.xsd

* DPEv2.2.xsd schéma XSD du modèle de donnée DPE pour la version en vigueur (modèle de DPE a utiliser) (ici en version 2.2) généré à partir de modele_commun_DPE_audit_reg.xsd

* DPEv2.xsd schéma XSD du modèle de donnée DPE pour la version 2 généré à partir de modele_commun_DPE_audit_reg.xsd

* DPEV1(OBSOLETE).xsd schéma XSD du modèle de donnée DPE pour la version v1 du modèle de données 1er juillet 2021 -> 09 décembre 2021 

* DPE_complet.xsd  : DPE complet pour la version en vigueur permettant de générer le modèle DPEv2.xsd (à ne pas utiliser)

* modele_donnee.xlsx : description du modèle de données dans un format tableur excel

* enum_tables.xlsx : tables d'énumérateurs associés au modèle de donnée au format tableur excel

* valeur_tables.xlsx : tables de valeurs forfaitaires associés au modèle de donnée au format tableur excel

* document_guide_modele_donnee_DPE.docx : document qui explique et précise la manière de renseigner un xml conformément au modèle de données.

* enums.json enums au format json.

* difference_enum_tribu_observatoire : document qui fait l'inventaire des différences constatées entre les enums tribu et observatoire.

# Processus de mise à jour du XSD à l'attention des développeurs -> Publication d'une nouvelle version

* mise à jour du CHANGELOG

* mise à jour du excel enum_tables.xlsx, enum_tables_audit.xlsx lorsque des énumerateurs doivent être modifiés

* mise à jour du excel valeur_tables.xlsx lorsque des tables de valeurs doivent être modifiées

* mise à jour de modele_donnee.xlsx si un champ doit être modifié ou supprimé ou ajouté ou dont la documentation/description doit être changée

* mise à jour de modele_commun_DPE_audit_reg.xsd si un champ doit être modifié ou supprimé ou ajouté et si l'on doit changer les restrictions sur un champ spécifique

* mise à jour de deleted_enums.json si une possibilité pour un énum est supprimé

* met à jour les numéros de versions dans tous les fichiers
    * bien commit tous les changements précédents
    * mettre à jour les versions dans le fichier de version ET LES DATES : versions.yml 
    * faire un grand search & replace sur tous les numéros de version -> ATTENTION contrôler si modifs de fichiers autres que des XSD ou des fichiers avec des versions (DONT LE README)
    * rollback sur les changelogs des numéros de version et date de l'entrée précédente
    * commit après tous les renommages

* lancement du script auto_generate_xsd.py qui met à jour les éléments suivants de manière automatique depuis les excels vers le xsd
  * Pour info : voilà ce qu'il se passe dans le script auto_generate_xsd.py
    * element : mise à jour de annotation/documentation à partir de la colonne description de modele_donnee.xlsx
    * element : si enum ou table mise à jour des restrictions automatique à partir des excels correspondant et de deleted_enums.json
    * element : mise à jour de appinfo avec la description json de l'énum pour les enums (à partir de l'excel)
    * DPEv2.xsd : généré à partir de DPE_complet.xsd en mettant en optionnel les champs du modèle dans les éléments suivants pour le modèle logement_neuf

    `['enveloppe', 'ventilation_collection',
               'installation_chauffage_collection',
               'installation_ecs_collection', 'climatisation_collection',
               'production_elec_enr', 'deperdition', 'apport_et_besoin', 'meteo']
`

* l'écriture du xsd par le programme python étant très moche reformater le xsd (dans Pycharm Ctrl+alt+L)

# sources de vérités des composants


