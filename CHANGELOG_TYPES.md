# CHANGELOG Types DPE - Vision DPE

## [2.6.0] - 2025-02-25

### Ajouté
- **Types InstallationChauffage complets** (validés contre XSD ADEME v2.6)
  - `InstallationChauffage` avec donnee_entree, donnee_intermediaire
  - `GenerateurChauffage` avec tous les champs XSD
  - `EmetteurChauffage` avec tous les champs XSD
  - Enums: `EnumCfgInstallationCh`, `EnumTypeInstallation`, `EnumMethodeCalculConso`, `EnumTypeGenerateurCh`, `EnumTypeEmissionDistribution`, `EnumEquipementIntermittence`, `EnumTypeRegulation`, `EnumTypeChauffage`, `EnumTempDistributionCh`, `EnumPeriodeInstallationEmetteur`, `EnumLienGenerateurEmetteur`

- **Types InstallationECS complets** (validés contre XSD ADEME v2.6)
  - `InstallationECS` avec donnee_entree, donnee_intermediaire
  - `GenerateurECS` avec tous les champs XSD (pn, qp0, pveilleuse, rpn, cop, etc.)
  - Enums: `EnumCfgInstallationEcs`, `EnumTypeGenerateurEcs`, `EnumTypeStockageEcs`, `EnumBouclageReseauEcs`, `EnumTypeInstallationSolaire`, `EnumMethodeSaisieFactCouvSol`

- **Types Ventilation complets** (validés contre XSD ADEME v2.6)
  - `Ventilation` avec donnee_entree, donnee_intermediaire
  - Enums: `EnumTypeVentilation` (34 types de ventilation), `EnumMethodeSaisieQ4paConv`

- **Types Sortie complets** (validés contre XSD ADEME v2.6)
  - `Sortie` avec toutes les sous-sections:
    - `SortieDeperdition`: hvent, hperm, deperdition_mur, etc.
    - `SortieApportEtBesoin`: surface_sud_equivalente, besoin_ch, besoin_ecs, etc.
    - `SortieEfConso`: conso_ch, conso_ecs, conso_5_usages, etc.
    - `SortieEpConso`: ep_conso_ch, ep_conso_ecs, classe_bilan_dpe
    - `SortieEmissionGes`: emission_ges_ch, emission_ges_ecs, classe_emission_ges
    - `SortieCout`: cout_ch, cout_ecs, cout_5_usages
    - `SortieProductionElectricite`: production_pv, conso_elec_ac_*
    - `SortieParEnergie`: conso par type d'énergie
    - `SortieConfortEte`: isolation_toiture, protection_solaire_exterieure, etc.
    - `SortieQualiteIsolation`: ubat, qualite_isol_*

- **XMLGenerator** (`src/utils/xml-generator.ts`)
  - Génération XML complète pour tous les types DPE
  - Support des collections (mur, baie_vitree, plancher_bas, etc.)
  - Support des installations (chauffage, ECS, ventilation)
  - Support complet de la section Sortie
  - Échappement XML sécurisé

- **XMLValidator** (`src/utils/xml-validator.ts`)
  - Validation structurelle du XML
  - Validation de cohérence des données
  - Vérification des champs obligatoires
  - Vérification des plages de valeurs

- **Script de test** (`scripts/test-xml-ademe.ts`)
  - Création d'un DPE de test complet
  - Génération et validation du XML
  - Vérification des sections principales

### Modifié
- Mise à jour de `src/types/dpe.ts` avec tous les nouveaux types
- Ajout de la documentation JSDoc pour tous les types
- Organisation des types par catégorie (Enveloppe, Chauffage, ECS, Ventilation, Sortie)

### Validé
- ✅ Validation contre XSD ADEME v2.6 officiel
- ✅ Validation contre 5 fichiers XML exemples ADEME
- ✅ Tests de génération XML réussis
- ✅ Cohérence des types avec la méthode 3CL

### Références
- XSD ADEME: `docs/ademe-official/DPEv2.6.xsd`
- Exemples XML: `docs/ademe-official/exemples_xml/`
- Documentation: `docs/ademe-official/document_guide_modele_donnee_DPE.docx`

## [2.5.0] - 2025-02-20

### Ajouté
- Types de base pour le DPE
- Enveloppe du bâtiment (mur, baie_vitree, plancher_bas, plancher_haut)
- Types administratifs (diagnostiqueur, geolocalisation, adresse)
- Enums de base (EnumModeleDpe, EnumVersionDpe, EnumPeriodeConstruction, etc.)

## [2.0.0] - 2025-02-15

### Ajouté
- Structure initiale du projet
- Configuration TypeScript
- Documentation de base
