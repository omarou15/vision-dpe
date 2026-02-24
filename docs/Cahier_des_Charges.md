# CDC VISION - Cahier des Charges

## Références Document Original
- **Document**: Cahier des Charges - Application VISION DPE
- **Format**: Word (.docx)
- **Contenu**: Spécifications techniques complètes pour application DPE certifiée ADEME

## Extraction du CDC

### Stack Technique (Page 1-2)
- **Frontend**: React Native + Expo
- **Langage**: TypeScript strict
- **State Management**: Zustand ou Redux Toolkit
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Validation**: API ADEME + Règles locales

### Architecture (Page 2-3)

#### Moteur de Validation
- Validation XSD structurelle (XML Schema)
- Contrôles de cohérence métier ADEME
- Validation locale (80% des cas)
- API ADEME pour dépôt final

#### Flux Utilisateur - 13 Étapes
1. Administratif (numéro DPE, identité)
2. Caractéristiques générales (type, surface, année)
3. Enveloppe - Murs
4. Enveloppe - Baies vitrées
5. Enveloppe - Planchers
6. Ponts thermiques
7. Ventilation
8. Chauffage
9. ECS (Eau Chaude Sanitaire)
10. Climatisation
11. Production ENR
12. Validation temps réel
13. Export XML

### Phase 0 - Fondations (Page 4-5)

#### Semaine 1: Architecture & Types

**1.1 Setup projet Expo + React Native**
- [x] Initialiser projet Expo avec template TypeScript
- [x] Configurer ESLint + Prettier
- [x] Setup structure dossiers (/src, /tests)
- [x] Configurer React Native Paper

**1.2 Générer types TypeScript depuis XSD**
- [x] Télécharger XSD DPEv2.6 depuis dépôt ADEME
- [x] Utiliser xsd2ts ou équivalent
- [x] Valider types contre XML exemples
- [x] Créer types manquants si nécessaire

**1.3 Schema Supabase + migrations**
- [ ] Créer projet Supabase
- [ ] Tables: dpe_documents, dpe_drafts, dpe_validations
- [ ] Tables: users_profiles, enum_cache
- [ ] Migrations SQL versionnées

**1.4 Setup CI/CD GitHub Actions + EAS**
- [x] Workflow build sur PR
- [x] Workflow test automatique
- [x] EAS Build configuration
- [x] Déploiement automatique staging

**1.5 Maquettes Figma**
- [ ] Écran login/authentification
- [ ] Wizard navigation (13 étapes)
- [ ] Écrans saisie par module
- [ ] Écran validation et erreurs
- [ ] Écran export XML

### Spécifications Techniques (Page 6-8)

#### Tables de Valeurs (tv_xxx_id)
- tv_coef_transmission_thermique
- tv_pont_thermique
- tv_debit_ventilation
- tv_rendement_generateur
- tv_cop_pac
- tv_facteur_conversion
- tv_emission_ges

#### Enumérateurs (enum_xxx_id)
- enum_type_batiment
- enum_periode_construction
- enum_type_paroi
- enum_type_vitrage
- enum_type_menuiserie
- enum_type_ventilation
- enum_type_generateur_chauffage
- enum_type_generateur_ecs

### Contraintes ADEME (Page 9-10)

#### Cohérence Enum/TV
- enum_type_batiment ↔ tv_coef_transmission_thermique
- enum_type_vitrage ↔ tv_u_vitrage, tv_sw_vitrage
- enum_type_ventilation ↔ tv_debit_ventilation

#### Validation XML
- Structure XSD DPEv2.6
- Variables requises selon type de DPE
- Variables interdites selon contexte

### KPIs (Page 11)

| Métrique | Cible |
|----------|-------|
| Coverage tests | > 95% |
| XML exemples validés | 50/50 |
| Build CI/CD | < 5 min |
| Temps réponse validation | < 2s |

### Risques (Page 12)

1. Évolution réglementaire XSD ADEME
2. Complexité interdépendances enum/tv
3. Performance validation XML sur mobile
4. Adoption diagnostiqueurs (UX complexe)

---

**Note**: Ce document est une synthèse du CDC original. Pour référence complète, consulter le fichier Word original.
