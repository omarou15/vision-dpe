# 2020 02 15 livraison 0.2.1

* ajout des scénarios dépensiers dans le schéma neuf

* ajout de la possiblité de saise d'un système collectif par défaut ch/ecs -> chaudière fioul pénalisante

* suppresion de la fraction des apports gratuits pour le froid

* ajout cle repartition ecs pour le logement neuf

* ajout du calcul de deperdition pour la clé de répartition de chauffage pour le logement neuf

* ajout du coef_ifc pour le logement neuf

* ajout du dpe_a_remplacer, motif_remplacement dans la partie administratif

# 2020 03 19 v2.2 Retours EDL + livraison tables de valeurs

## enumérateurs

* suppression de enum_bouclage_reseau_ch et intégration de la notion monotube/bitube dans l'énumérateur
  type_emission_distribution

* remplacement des énumerateurs radiateur par radiateur monotube ou bitube dans l'énumérateur type_emission_distribution

* suppression de sous-sols (14) pour type_adjacence : les enums suivants sont réindéxés 15-22 -> 14-21

* methode_saisie_perf_vitrage -> ajout d'une nouvelle modalité (5 :Ug,Uw,Ujn saisi directement à partir des documents
  justificatifs autorisés , autres paramètres calculés avec les tables forfaitaires
  ) déplacement des modalités anciennement 5 et 6 -> 6 et 7

* type_baie : suppression de la modalité (5 : portes fenetres battantes) déplacement des modalités 6-9 -> 5-8

* type_generateur_ecs :
    - suppression de la mention mixte pour les chaudières
    - 48 Chaudière mixte gaz classique 1981-1990 suppression de l'énumérateur -> décalage des autres énumérateurs
      49-85 -> 48 -> 84
    - 43 : Chaudière fioul à condensation 1991-2015 -> Chaudière fioul à condensation 1996-2015
    - ajout des chaudières charbon et gpl/propane/butane enum 85 à 104

* type_generateur_ch :

    - Chaudière fioul à condensation 1991-2015 -> Chaudière fioul à condensation 1996-2015
    - distinction des générateurs à air chaud et radiateurs gaz avant/après 2006 modification et insertion
      d'enumerateurs 50-54 décalage des énumérateurs 52-116 -> 55-119
    - Poêle fioul ou GPL -> Poêle fioul ou GPL ou charbon
    - ajout des chaudières charbon et gpl/propane/butane enum 120 à 139

* equipement_intermittence : ajout 6 - central collectif, 7 - central collectif avec détection de présence

* suppression de l'énumérateur methode_saisie_pvent_moy

* cfg_installation_ch ajout de 14 -> installation avec un générateur alimentant plusieurs émissions en lien avec la
  section 9.1.3 de la méthode.

## tables de valeurs

* publications des tables de valeurs

## Modifications Modèle de données

### corrections modèle PV

* ajout de la sous structure panneaux_pv_collection.panneaux_pv pour pouvoir saisir les panneaux sur les différentes
  orientations les paramètres des panneaux ne sont plus demandées au niveau de production_elec_enr mais au niveau de
  cette sous
  structure :

    - surface_totale_capteurs
    - ratio_virtualisation
    - nombre_module
    - tv_coef_orientation_pv_id
    - enum_orientation_pv_id
    - enum_inclinaison_pv_id

* suppression de tv_coef_orientation_pv_id pour le modèle neuf.

* renommage des variables tv_temp_100_id,tv_temp_30_id -> tv_temp_fonc_100_id,tv_temp_fonc_30_id

### suppression de l'option saisie pour pvent

conformément à la nouvelle méthode pvent n'est pas saisissable directement par le diagnostiqueur : suppresion de
pvent_moy_saisi,enum_methode_saisie_pvent_moy_id

### mise en optionnel des tables de valeur strictement redondante avec les enums

* tv_coef_orientation_pv_id -> optionnel

### corrections systeme

* précision des unités et intervalles pour les caractéristiques des générateurs

* ajout de valeurs max dans le XSD pour les rendements générateurs

* ajout de valeurs max pour pn,rpn,rpint,qp0

* NOUVEAU : ajout du paramètre reseau_distribution_isole pour le chauffage et l'ECS.

### corrections sorties

* classe_conso_energie rebasculée dans la structure de sortie ep_conso (précédemment mis dans ef_conso)

## document guide

* ajout d'un complément d'aide à la saisie des installations avec un générateur multiémission.

* ajout de la section table de valeurs.

# 2020 03 23 v2.3 version finale méthode de calcul

## enumérateurs

inclinaison_vitrage -> ajout de la modalité 4 -> horizontal

## tables de valeurs

suppression de la table de valeur coef_orientation

ajout de la table de valeur coef_transparence_ets (T pour les espaces tampons solarisés)

## Modifications Modèle de données

suppresion du paramètre tv_coef_orientation_id pour les baies et espaces tampons solarisés

ajout du paramètre tv_coef_transparence_ets_id pour la table de valeur correspondante pour les ETS.

ajout de la surface tertiaire de l'immeuble

suppresion de SSE,SSD,SSI pour les espaces tampons solarisés

# 2020 03 31 v2.4 corrections retour EDL n°2

## enumérateurs

* type_generateur_ecs : ajout des accumulateurs et chauffe eau gpl (ajout enum -> 105 -114)

* type_generateur_ecs : ajout des énumérateurs 115 et 116 pour les poeles bouilleur à granules

* type_generateur_ecs : renommage enum 13 et 14 poele à bois bouilleur -> poele à bois bouilleur bûche

* type_generateur_ch : ajout des énumérateurs 140 et 141 pour les poeles bouilleur à granules

* type_generateur_ch : renommage enum 48 et 49 poele à bois bouilleur -> poele à bois bouilleur bûche

## tables de valeurs

* ajout des énumérateurs accumulateurs et chauffe eau gpl dans la table de valeur : generateur_combustion

* ajout des énumérateurs des poeles bouilleurs dans la table de valeur : generateur_combustion

# 2020 04 08 v2.5 corrections diverses

## Modifications Modèle de données

* typage oublié sur apport_interne_fr -> type double rajouté sur apport_interne_fr.

* sw_saisi obligatoire -> optionnel pour les ETS

## tables de valeurs

* temp_fonc_30 mal indexée (index non unique) -> corrigé.

* uw, id = 609 mauvaise syntax pour enum type_baie corrigé

# 2020 04 08 v2.6 modifications nouvelle méthode SSE

## Modifications Modèle de données

* suppression du coefficient c1 en donnée intermédiaire pour baies et ETS car passage mensuel
* suppression des coefficients fe1 fe2 et de masque_lointain_non_homogene_collection,tv_coef_masque_proche_id
  tv_coef_masque_lointain_homogene_id tv_coef_masque_lointain_non_homogene_id pour les ETS car Fe1xFe2 mis à 1
* ajout enum_type_baie_id pour les objets baie_ets

# 2020 04 22 v3 retours GT éditeurs et modification(s) méthode de calcul

* ajout d'un document qui liste les différences des enum entre tribu et observatoire.

## Fonctionalités XSD

* A LA DEMANDE DE CERTAINS EDL le XSD permet de déclarer les variables optionelles en nillable xsi:nil="true"

## enumérateurs

### corrections diverses

* categorie_descriptif_simplifie ajout d'un énumérateur 9 : dispositifs de pilotage chauffage/climatisation

* ajout d'un nouvel énumérateur methode_saisie_pont_thermique

* type_generateur_ecs : ajout des énumérateurs 117 pour les chauffe eau electriques instantanés et 118 pour les
  chaudières electriques

* cfg_installation_ch : suppression de l'énumérateur 14 installation avec un générateur alimentant plusieurs émissions
  qui n'est plus nécessaire.

* type_plancher_haut : ajout enumerateur 16 : toiture en bac acier.

### modification des ossatures bois

* materiaux_structure_mur : remplacement du label de l'enum 18 : murs en ossature bois (sans isolation rapportée) ->
  Murs en ossature bois avec isolant en remplissage ≥ 2006

* materiaux_structure_mur : ajout de l'énumérateur 24 : Murs en ossature bois avec isolant en remplissage 2001-2005

* materiaux_structure_mur : ajout de l'énumérateur 25  : Murs en ossature bois sans remplissage

### ajout de la possibilité de saisie de umur0 comme Umur_ITI

methode_saisie_u0 : ajout enum 4 -> saisie direct U0 correspondant à la performance de la paroi avec son isolation
antérieure ITI (Umur_ITI) lorsqu'il y a une surisolation ITE réalisée

## tables de valeurs

### corrections/améliorations diverses

* pont_thermique : une inversion a été faite sur les pt baies/mur les enums type_pose Tunnel ont été inversés avec les
  enums type_pose Nu intérieur tv_pont_thermique_id impactés : 73, 74, 75, 76, 79, 80, 81, 82, 85, 86, 87, 88, 91, 92,
  93, 94, 97,
  98, 99, 100, 104, 105, 106, 107, 110, 111, 112, 113, 116, 117, 118, 119, 122, 123, 124, 125, 128, 129, 130, 131, 134,
  135, 136, 137 les enums modifiés sont en remplissage jaune dans le tableur.

* rendement_distribution_ecs -> renommage de la colonne "valeur" en "rd"

* ajout d'aides complémentaires sur les tables valeur:

    * enum_zone_climatique_id en complément de zone climatique pour les tables
      umur,uph,upb,seer,facteur_couverture_solaire

    * enum_methode_application_dpe_log_id en complément de type_habitation pour les tables q4pa_conv,et en complément de
      configuration_chauffage dans intermittence

* correction oubli enum_zone_climatique_id et zone_climatique pour CET et pac double service dans scop

* uph0 : id 12 ajout toiture bac acier comme enum correspondant à cette valeur suite à modification méthode. (enum 16)

### correction b de la méthode

* correction des valeurs de b érronées de tv_coef_reduction_deperdition_id impactés : 8,140,156,172,188,195,196

### ajout/modification ossature bois pour umur0

umur0 : modification des tv 118-125 murs en ossature bois (sans isolation rapportée) remplacement par les valeurs :
ossature bois avec isolant en remplissage ≥ 2006

umur0 : ajout des tv 130 à 143 pour les Murs en ossature bois avec isolant en remplissage 2001-2005 et Murs en ossature
bois sans remplissage

## modele de données

## SIMPLIFICATION MODELE ETS

* suppresion de tous les paramètres correspondant à la saisie du SW pour les ETS.

## CHANGEMENT DE STRUCTURE systeme :

Alignement de la structure sur celle du moteur de TRIBU

* ajout de nouveaux objets emetteur_collection.emetteur qui contiennent les propriétés de calcul du Rd,Re,Rr,I0 ainsi
  qu'une surface chauffée associée.

* ajout d'un enum lien_generateur_emetteur qui fait le lien entre les emetteurs et générateurs (
  principal,appoint,appoint sdb)

* pour les installations : échantillonage des installations individuelles pour le calcul DPE immeuble (calcul effectué
  sur un logement représentatif d'un ensemble de logements puis extrapolation sur l'ensemble de logements du groupe)
  la surface_chauffee/surface_clim/surface_habitable de l'installation chauffage/ecs/clim à saisir est la surface totale
  des logements shmoy*nb_logement_echantillon Attention! précédement c'était la surface du logement moyen qui était
  demandée pour
  ces cas

## autres simplifications/corrections

* suppresion de seer_saisi

* suppression de rpint pour les générateurs d'ECS.

## DPE NEUF:

### PASSAGE EN OPTIONNEL DES ELEMENTS SUIVANTS :

* enveloppe et tout sous schemas et propriétés

* ventilation_collection et tout sous schemas et propriétés

* climatisation_collection et tout sous schemas et propriétés

* production_elec_enr et tout sous schemas et propriétés

* installation_ecs_collection et tout sous schemas et propriétés

* installation_chauffage_collection et tout sous schemas et propriétés

* sorties apport et besoin et deperditions.

### les éléments conservés

* administratif (identique DPE existant)

* caractéristiques générales

* sortie : consommations ef,ep,co2,cout

* fiche_technique (identique DPE existant) necessaire pour l'afficage

* descriptif_simplifie (identique DPE existant) necessaire pour l'affichage

* clé de répartition ch/ecs pour le neuf (nécessaire pour le calcul à l'appartement)

* descriptif ENR necessaire pour l'affichage (identique DPE existant)  necessaire pour l'affichage

## administratif

* ajout d'un champ enum_version_id pour gérer les futures évolutions du DPE.

## ventilation

* Modification de la structure pour gérer de multiples ventilations ->  structure ventilation inclus dans
  ventilation_collection.

* ajout du paramètre surface_ventile (= SHAB dans la plupart des cas ) à différencier de la SHAB totale lors d'un calcul
  multi ventilation.

## pont thermique

ajout de la possibilité d'une saisie experte des ponts thermiques

* ajout de enum_methode_saisie_pont_thermique_id

* ajout de k_saisi (optionnel à ne renseigner qu'en cas de pont thermique saisi de manière experte.)

## sorties

* indicateur de confort passé en optionnel car non éxigé pour les DPE immeuble.

# 2020 05 05 v4 modèle de donnée optionnel pour existant + corrections

## DPE EXISTANT:

### PASSAGE EN OPTIONNEL DES ELEMENTS SUIVANTS :

* enveloppe et tout sous schemas et propriétés

* ventilation_collection et tout sous schemas et propriétés

* climatisation_collection et tout sous schemas et propriétés

* production_elec_enr et tout sous schemas et propriétés

* installation_ecs_collection et tout sous schemas et propriétés

* installation_chauffage_collection et tout sous schemas et propriétés

* sorties apport et besoin et deperditions.

### les éléments conservés

* administratif

* caractéristiques générales

* sortie : consommations ef,ep,co2,cout

* fiche_technique necessaire pour l'afficage

* descriptif_simplifie necessaire pour l'affichage

* descriptif ENR necessaire pour l'affichage necessaire pour l'affichage

## document guide

* ajout d'une section pour décrire le cas particulier des immeubles avec hybride chauffage collectif/chauffage
  individuel

* ajout d'une section pour décrire le cas particulier des réseaux de chaleurs inconnu ou non répertoriés.

* ajout d'une section pour décrire les cas particuliers pac hybride et generateur bi energie.

## modele de données

* ajout de tv_facteur_couverture_solaire_id pour les installations de chauffage (paramètre oublié)

* surface_ventile était par erreur proposé en optionnel -> repassée en requis

* correction d'une erreur de type pour "b" d'une porte String -> double

* passage de epaisseur_structure en optionnel pour gérer les types de parois inconnues

* passage de tv_coef_reduction_deperdition_id en optionnel pour gérer le cas où aue = 0

* réajustement des restrictions min max pour l'ensemble des paramètres numériques

* suppression de emetteur_plancher_fr pour être en cohérence avec la suppresion du calcul des auxiliaires de froid.

## enumerateurs

* type_generateur_ch ajout d'un énumérateur 142 réseau de chaleur non répertorié ou inconnu

* type_generateur_ecs ajout d'un énumérateur 119 réseau de chaleur non répertorié ou inconnu

* orientation : ajout de l'enumerateur 5 : horizontal pour gérer les baies vitrées parfaitement horizontales

* harmonisation avec tribu energie sur les pompes à chaleurs hybrides et générateurs bi énergie

Pour les générateurs bi énergies : déclarer deux installations différentes réparties 50/50 en surface

Pour les Pompe à chaleur hybride on ne modélise pas cela comme un unique générateur mais comme deux générateurs séparés
en utilisant les nouveaux énumérateurs pompe à chaleur hybride.

* suppression des installations de chauffage 12 : générateur bi energie et 13 : pac hybride
* ajout des nouveaux type de générateurs 143,144 Pompe à chaleur hybride : partie pompe à chaleur, Pompe à chaleur
  hybride : partie chaudière

* materiaux_structure_mur : ajout enum 26 et 27 pour les nouvelles ossatures bois.

AIDES A LA SAISIE

* ajout d'un champ d'aide "variables_requises" qui spécifie quelles variables sont attendues lorsque l'on se trouve dans
  certaines configuration de la méthode représentées par les enums
* ajout d'un champ d'aide "variables_interdites" qui spécifie quelles variables sont interdies en saisie lorsque l'on se
  trouve dans certaines configuration de la méthode représentées par les enums

## table valeur

* coef_reduction_deperdition correction des id 27 à 40 qui avaient des valeurs erronées

* tv_coef_transparence_ets_id ajout du type de vitrage survitrage comme équivalent double vitrage

* tv_ug_id ajout de enum_type_gaz_lame_id = 3 : inconnu comme équivalent du type gaz lame : air

* mise à jour de la table de valeur rendement_generation avec les enums réseaux de chaleurs équivalents pour les
  systèmes collectifs multi batiments

* mise à jour de la table de valeur generateur_combustion avec l'enum pac hybride : partie chaudière.

* mise à jour de la table de valeur scop avec l'enum pac hybride : partie PAC.

* mise à jour de la table de valeur pertes_stockage avec l'enum chaudière electrique

* tv_umur0_id : ajout des nouveaux type d'ossature bois : 144 à 157

# 2021 05 06 v4.1 correction DPE_complet.xsd

* correction d'une coquille où le DPE_complet.xsd avait été accidentellement pris comme étant le DPE léger optionnel.

* ajout dans tv_reseau_chaleur_id de deux colonnes vides taux_enr et est_vertueux .

# 2020 05 20 4.2 Modèle avec meilleure prise en compte de l'autoconsommation + corrections diverses

# modèle de données

* passage de nombre_niveau_logement en optionnel pour les DPE immeubles

* ajustement des documentations sur tv_masque_proche,tv_masque_lointains et umur0_sais

* ajout des autoconsommations par usages comme nouvelle donnée dans sortie dpe.logement.sortie.production_electricite

* ajout de documentation qui précise que les consommations 5 usages RT sont déduites de l'autoconsommation PV.

## tables de valeur

* réseau de chaleur : ajout d'un hash réseau (EXPERIMENTAL) pour faire le lien entre différentes versions de la table.

* réseau de chaleur : Réseau de Brossac n'avais pas le label C pour réseau de chaleur.

* pont thermique : homogénéisation des typos plus d'espaces entre les + dans ITI+ITR ITI+ITE etc...

* scop :  correction de la dénomination des CET sur air exterieur ou ambiant -> ajout des périodes

* coef_masque_proche : ajout de 19 : absence de masque proche

* coef_reduction_deperdition : correction de la ligne id 36 valeur 0.5 -> 0.55

## enumerateurs

* methode_application_dpe_log : modification des enum 15,16,19,20 qui précisent le type d'installation d'ECS (collectif)

* methode_application_dpe_log : ajout des enums 22 à 25 qui gère les configurations manquantes pour les DPE neufs : ECS
  individuelle

* methode_application_dpe_log : mise à jour des variables_requises et variables_interdites

* type_generateur_ecs, type_generateur_ch : changement des energies possibles par toutes les énergies combustibles pour
  prendre en compte la possibilité laissée par le document guide de remplir partiellement les informations.

* picto_geste_entretien ajout des enums 13 à 17 isolation, climatisation, système chauffage, système ecs, baies et
  portes

# 2021 05 27 4.3 Version du 1er juillet.

## modèle de données

* ajout dans dpe/logement/sortie/qualite_isolation de qualite_isol_plancher_haut_toit_terrasse
  qualite_isol_plancher_haut_comble_perdu qualite_isol_plancher_haut_comble_amenage suppression
  qualite_isol_plancher_haut

* ajout de la propriété valeur dans sous_fiche_technique

* ajout de la propriété emission_ges_5_usages_apres_travaux dans pack_travaux

* renommage de indicateur_confort_ete en enum_indicateur_confort_ete_id pour gérer la triple modalité :
  insuffisant,moyen,bon

* pack_travaux_collection peut maintenant être vide.

* suppression de usr_diagnostiqueur_id. l'identification du diagnostiqueur est réalisée par ailleurs.

* mise en optionnel des propriétés de pack travaux pour pouvoir saisir le bouquet 1,2 en description des travaux et
  leurs couts et faire le calcul de consommation énergétique sur le bouquet 1 et 1+2

### FROID

* réajout de emetteur_plancher_fr en optionnel car les auxiliaires de distribution de froid sont de retour

* ajout de enum_type_energie_id pour le froid en optionnel pour permettre de déclarer des type d'energie de type gaz ou
  réseau froid même si absent de la méthode.

## enumérateurs

* categorie_fiche_technique : ajout de 11 "général" 12 "description échantillon logement pour DPE immeuble"
* methode_calcul_conso : ajout des cas permettant de gérer les immeubles collectifs mixtes 5 installation collective
  immeuble mixte rapporté à la partie logement : cas générateur à combustion virtuel ou ECS collective virtuelle 6
  installation
  collective immeuble mixte rapporté à la partie logement : cas générateurs simples (réseau de chaleur, effet joule,
  PAC, CET)

* indicateur_confort_ete : ajout de cet énumérateur.

* type_usage : ajout d'un énumérateur usage inconnu pour gérer les cas tertiaires bis.

* type_generateur_fr : ajout de 23 reseau de froid

* type_energie : ajout de 15: Réseau de froid urbain , renommage de 8 : Réseau de Chaleur urbain

# 2021-06-18 4.4 corrections 1er juillet

## modèle de données

* suppression de la restriction >0 pour les ponts thermiques

* changement de la restriction ban_date_appel au 1er janvier 2021

* changement de la restriction ep_conso_totale_auxiliaire comme pouvant être 0

* restriction temporairement levée sur la saisie de fraction_apport_gratuit

* passage en optionnel de qualite_isol_plancher_bas

## enumérateurs

* lot_travaux : ajout de 9 énergie renouvelable.

# 2021-06-29 4.5 corrections 1er juillet

## modèle de données

* correction sur surface_habitable_logement et nombre_logement qui n'étaient pas en optionnel pour le modèle logement
  neuf.

* passage de l'année de construction en optionnelle pour le modèle tertiaire.

* consommmations d'ECS autorisées en saisie nulle dans les sorties.

# 2021-07-05 4.6 ajout dpe vierge et neuf tertiaire

* ajout de enum_methode_application_dpe_ter dans dpe/tertiaire/caracteristique_generale

* bilan_consommation passé en optionnel pour les dpe tertiaires vierges

* consommation_collection peut avoir 0 éléments pour les dpe tertiaires vierges.

# 2021-07-16 4.6.2 corrections diverses

* année de construction minimum à 1200

* correction b des baies/portes autorisé dorénavant en saisie = 0

# 2021-07-23 4.6.3 corrections restrictions sur champs non exigés V1 + ajout des énums PAC hybride.

## modèle de donnée (corrections restrictions sur champs non exigés V1)

* restriction déperdition mur >0 -> >= 0 (pour permettre saisie murs non déperditifs)

* surface_aue des planchers hauts >0 -> >=0

* Fe2 >0 -> >=0

* suppression des valeurs max sur pn,qp0,pveilleuse

* abaissement valeur min pn 200->100 (objectif pouvoir quand même attraper les saisies en kW au lieu de W)

* i0 : <=1 -> <=1.2

* nadeq >0 -> >=0 (possibilté de saisie 0 pour l'ECS)

* v40_ecs_journalier >0 -> >=0 (possibilté de saisie 0 pour l'ECS)

* v40_ecs_journalier_depensier >0 -> >=0 (possibilté de saisie 0 pour l'ECS)

* besoin_ch >0 -> >=0 (possibilté de saisie 0 pour chauffage)

* besoin_ch_depensier >0 -> >=0 (possibilté de saisie 0 pour chauffage)

* besoin_ecs >0 -> >=0 (possibilté de saisie 0 pour l'ecs)

* besoin_ecs_depensier >0 -> >=0 (possibilté de saisie 0 pour l'ecs)

* abaissement de la restriction min annee_construction pour le tertiaire 1800->700

* annee_consommation -> optionnel pour le tertiaire. (pour autoriser saisie depuis RSET.)

* surface_aiu >0 logement neuf (homogène avec logement)

* hvent >0 -> >=0 logement neuf. (homogène avec logement)

* installation_chauffage et installation_ecs -> possibilité de ne déclarer aucune installation en V2

## enumerateur

type_generateur_ch ajout des enums 145 à 161 pour détailler les deux sous générateur d'une PAC hybride.

type_generateur_ecs ajout des enums 120 à 133 pour détailler les chaudières incluses dans un système de PAC hybride.

# 2021-07-23 4.6.4 corrections

* levée temporaire de la restriction sur le cout de l'éclairage.

# 2021-09-10 : 5.0.0 changements version 30 octobre

NB : a partir de cette version certains changements ne concernent que la version 2 du DPE prévu pour le 30 octobre. La
version 1 valable du 1er juillet 2021 au 30 octobre 2021 n'est pas altérée pour toutes les modifications de type
suppression ou
ajout de variables requises ou pour tout renforcement de contraintes (pour éviter de provoquer des erreurs sur les
dépôts de DPE en cours).  
Les changements commencant par V2 signifient qu'ils concernent uniquement les changements pour la version 2 du modèle (
30 octobre).

## modèle de données

### NOUVEAUX CHAMPS

* V2 !!BLOQUANT!! : dpe.logement.sortie.ep_conso.classe_bilan_dpe ajouté et remplace  ~~classe_conso_energie~~. Ceci est
  mis en place afin que l'étiquette soit bien l'étiquette de synthèse energie/CO2 des arrêtés et non la sous classe
  énergie qui n'a
  plus d'existence légale. en V1 les deux champs sont passés en optionnels pour laisser la transition s'opérer.

* V2 BLOQUANT : ajout d'une information entreprise_diagnostiqueur (requis en V2 optionnel en v1) à renseigner dans la
  section administratif/diagnostiqueur

* V2 BLOQUANT : installation_chauffage : ajout de nombre_niveau_installation_ch (requis en V2 optionnel en v1) pour
  déclarer le nombre de niveau par installation (modification méthode 15/06/2021)

* V2 BLOQUANT : installation_ecs : ajout de nombre_niveau_installation_ecs (requis en V2 optionnel en v1) pour déclarer
  le nombre de niveau par installation (modification méthode 15/06/2021)

* V2 BLOQUANT : confort_ete : ajout inertie_lourde (booléen requis en V2 optionnel en v1) pour déterminer si le bâtiment
  possède une inertie lourde ou très lourde pour le confort d'été

### SUPPRESSION DE CHAMPS EXISTANTS (BLOQUANT SI EXISTANT)

* V2 !!BLOQUANT!! : dpe.logement.sortie.ep_conso.~~classe_conso_energie~~ supprimé

* V2 : suppression de emetteur_plancher_fr dans climatisation car il n'est plus fait de calcul d'auxiliaires de
  distribution sur la climatisation.

### AUTRES CORRECTIONS

* V2 : possibilité de ne saisir aucun pont thermique

* V2 : possibilité de saisir plusieurs ventilations.

* V2 : ajout d'une restriction <=1 pour les b.

* V2 : remise en place la restriction sur la fraction des apports gratuits.

* V2 : remise en place la restriction sur les couts d'éclairage.

* V2 : ajouter des restrictions pour imposer de saisir des valeurs non nulles text pour les champs d'adresse et de
  commune.

* surface_aiu optionnelle pour toutes les parois.

## enumérateurs

* type_generateur_ch : variables_requises pour radiateurs gaz : suppression de qp0.

* V2 : type_generateur_ch : suppression des énumérateurs 143 et 144 pour les pompes à chaleur hybride remplacé par les
  énums détaillés.

* V2 : usage_fonctionnel_batiment : suppresion des énumérateurs 23 à 30 sur les IGH. En effet les IGH n'nont aucune
  disposition particulière dans le DPE.

* type_adjacence :  ajout d'une possibilité de saisie de paroi non déperditive 22: Local non déperditif ( local à usage
  d'habitation chauffé)

## tables de valeurs

* q4pa_conv : ajout des id 10 et 11 pour la table de valeur q4pa pour les maisons individuelles >50% isolées avant 1974

* intermittence :  correction d'une inversion de enum_type_emission_distribution_id entre plancher et plafond chauffants

* intermittence :  pour le collectif chauffage collectif inversion des valeurs affectées à la présence de comptage
  individuel -> abscence de comptage individuel et inversement conformément à la correction de méthode datée du mail du
  08/09/2021. **Les
  identifiants des valeurs ne sont pas changés seule est fait l'inversion dans la colonne comptage_individuel**

* generateur_combustion : ajout des énumérateurs correspondant aux nouveaux libéllés des parties chaudières des pac
  hybrides (120 à 133 pour les générateurs ECS et 145 à 161 pour les générateurs chauffage ) pour les colonnes
  enum_type_generateur_ch_id enum_type_generateur_ecs_id Ceci a un impact sur le contrôle de cohérence (V2) sur la
  vérification des systèmes de type PAC hybride. Suppression de l'énumérateur 144 qui n'est plus valide.

* temp_fonc_30 :  ajout des énumérateurs correspondant aux nouveaux libéllés des parties chaudières des pac hybrides
  correspondant à des chaudières condensation : 148|149|150|151|160|161 pour la colonne enum_type_generateur_ch_id Ceci
  a un impact sur
  le contrôle de cohérence (V2) sur la vérification des systèmes de type PAC hybride. Suppression de l'énumérateur 144
  qui n'est plus valide.

* coef_reduction_deperdition :  ajout d'une possibilité de saisie de paroi non déperditive  (adjacente à un local
  d'habitation chauffé)

## règles additionelles documentées dans le document guide modele donnee

* pour les adresses propriétaires à l'étranger le code postal doit être saisi à 00000 et l'ensemble du libéllé doit être
  fourni dans le champs adresse_brut précédé de la mention "ETRANGER : " (voir exemple dans le document guide)

# 5.1.0 2021-05-10 modification méthode arrêté + ajout de version_moteur_calcul

ATTENTION : Une bascule de version(enum_version_id) 1 -> 1.1 sera opérée pour tracer les DPE avec la méthode de calcul
corrigée. à partir d'une certaine date les DPE en version 1 ne seront plus autorisés en dépôt.

## Dates prévisionnelles de validités des différentes version de DPE

enum_version_id : 1 -> 1er juillet 2021 au 1er novembre 2021

enum_version_id : 1.1 15 octobre au 1er décembre 2021

enum_version_id : 2 1er novembre 2021 au 1er décembre 2021

## modele de donnée

* BLOQUANT enum_version_id : passage de l'objet du type int au type string. (cela ne change pas le fait que la valeur 1
  soit toujours valide donc aucun impact sur les modèles v1), il est en revanche possible que des adaptations de code
  soit
  nécessaire côté EDL pour changer cet objet en string et autoriser des valeurs comme 1.1.

* restriction valeur minimale sur surface_habitable_logement passée de 8m² à 1m²

* (non exigé à SUPPRIMER) consommation des auxiliaires de distribution froid : mise en optionnel des variables
  cout,consommation emission de auxiliaire_distribution_fr

* V2 : BLOQUANT epaisseur structure des murs imposée >0.

* ajout d'un champ optionnel version_moteur_calcul dans administratif.diagnostiqueur. Format à respecter (
  3cl_bbslama_X.X.X.X ou 3cl_tribu_X.X.X.X)

## enumerateur

* enum_version_id : ajout de la version 1.1 pour les DPE réalisés après correction des arrêtés. les versions gérées sont
  donc 1, 1.1 et 2

## tables de valeur

* q4pa_conv : les valeurs pour id 10,11 sont valables pour les appartements/immeubles en plus des maisons.
* q4pa_conv : ajout de la valeur id 12 pour les bâtiments <1948 avec des joints sur les menuiseries.
* debits_ventilation : modification de qvarep_conv pour id 1 et 2

# 5.2.0 2021-10-14 ajout du type doublage (arrêté 1er novembre)

Attention ces changements ne seront déployés effectivement que fin octobre. Il est suggéré d'intégrer
enum_type_doublage_id uniquement à partir du 1er novembre.

## modèle de données

* V1.1(OPTIONNEL) V2 (REQUIS/BLOQUANT) ajout de enum_type_doublage_id pour les murs. Ce champs décrit le type de
  doublage des murs et est un champ requis en V2.

## enumerateurs

* ajout de type_doublage enum de 1 à 5.

# 5.3.0 2021-10-18 ajout de la possibilité de saisir des immeubles avec des installations mixtes individuelles/collectives + corrections diverses

Ces modifications concernent la version 2 et permettent de saisir des immeubles/appartements avec des configurations
d'installation mixte de chauffage et d'ECS.
(mixte collectif et individuel). En plus de ces modifications, une correction a été faite sur deux champs qui étaient de
manière érronnée déclaré en requis dans le modèle de données.

## modèle de données

* V2 passage en optionnel de tv_sw_id dans baie_vitree/donnee_entree

* V2 passage en optionnel de tv_seer_id dans climatisation/donnee_entree

## enumerateurs

* methode_application_dpe_log : ajout des enums 26 à 34 pour gérer les configurations mixtes (collectif/individuel) sur
  un immeuble/appartement.

* type_usage : ajout des enum 13 à 15 pour déclarer des factures multiusages CVC (chauffage/climatisation/ECS) pour les
  DPE tertiaires

* type_installation : ajout de l'enum 4 (installation hybride collective-individuelle à utiliser pour (chauffage base +
  appoint individuel ou convecteur bi-jonction)

## table valeur

* V2 intermittence : ajout des enums 26 à 34 pour methode_application_dpe_log pour gérer les configurations mixtes(
  individuel/collectif) pour le chauffage et l'ECS

* V2 intermittence (AJOUT CONTRAINTE) : ajout d'une dépendance à enum_type_installation_id (de l'installation de
  chauffage)

* tv_q4pa_conv : ajout des enums 26 à 34 pour methode_application_dpe_log pour gérer les configurations mixtes

* tv_debits_ventilation_id : modification des valeurs de débits de ventilation par ouverture de fenêtre (id :1) et de
  Ventilation par entrées d'air hautes et basses (id:2)

## 5.3.1 2021-10-27 Correction pour les parois en polycarbonate et brique de verre.

## modèle de données

* V2 : ug dans baie_vitree.donnee_intermediaire passé en optionel (cas des parois en brique de verre)

## enumerateurs

* type_vitrage :  ajout de Polycarbonate , Brique de verre en enum pour ce champ requis.

## 5.3.2 2021-11-09 Correction diverses

## modèle de données

* allègement de restriction de consommation positive pour les générateurs de chauffage pour prendre en compte une
  cascade avec priorité où
  le second générateur n'est jamais utilisé

## table valeur

* intermittence : ajout de possibilité de saisie enum_type_emission_distribution_id : 10 et 40 (radiateur accumulation
  elec et bijonction)  
  pour les id :
  6,10,18,22,30,34,42,49,56,60,68,72,80,84,92,99,106,110,118,122,130,134,142,146,149,152,156,160,164,168,171,175,179,183,187

* rendement_regulation : ajout de possibilité de saisie enum_type_emission_distribution_id : 41 pour l'id 11

# 5.4.0 2021-11-15 mise en place de contrôles de cohérences bloquants en warning temporaire

Pour la version 2 les contrôles de cohérences métier bloquants sont remplacés par des avertissements

## enumerateurs

* enum_version_id : ajout d'une version 2.1 pour préparer la bascule vers les contrôles de cohérences métiers rétablis
  en erreur bloquante

* enum_methode_saisie_perf_vitrage_id : ajout de la possibilité de saisir Uw sans Ug et Ujn sans Uw,Ug dans le cas de
  saisie experte. Ajout des enums 8
  9 10 11 12 pour prendre en compte ces configurations conformément à la possibilité laissée par la méthode.

## modele de données

* allègement de restriction de rendement_generation positif pour les générateurs de chauffage pour prendre en compte une
  cascade avec priorité où
  le second générateur n'est jamais utilisé.
  (un contrôle de cohérence vérifie que cette déclaration à 0 n'est possible que dans le cas d'une cascade avec
  priorité)

## tables de valeurs

intermittence : correction des valeurs pour les id : 45,46,47,48,49,50

# 5.4.1 2021-11-18 retours réunion EDL

## modèle de données

* tv_pont_thermique_id : mise en optionnel de ce paramètre (requis uniquement en méthode forfaitaire)

## enumerateurs

* type_generateur_ch : temp_fonc_100 et temp_fonc_30 en variables interdites pour les chaudières bois et chaudières
  charbon (non exigé dans la méthode.) et radiateurs gaz. rpn et rpint proprement mis en variables interdites pour les
  pompes à chaleur (erreur typo)

* methode_saisie_carac_sys : simplification de la saisie experte système combustion :  suppression des enums de saisie 3
  et 5 qui sont obsolète. Seul l'enum 4 est autorisé pour la saisie experte des systèmes à combustion.

# 5.5.0 2021-12-03 ajout options emission/distribution/regulation + etiquette H+I DPE tertiaire

Les modifications apportées permettent de gérer proprement les emetteurs de type ventiloconvecteur sur distribution eau
et distribution par fluide frigorigène. d'autres systèmes plus anecdotiques sont aussi gérés par la même occasion

## modèle de données

* ajout des étiquettes H et I pour les DPE tertiaires.

* mise en optionnel de isolation_toiture, aspect_traversant,brasseur_air pour la section confort_ete

## enumerateurs

* enum_type_emission_distribution_id :

  Ajout de nouvelles options

    * emetteur à détente directe (directement connecté à une distribution par fluide frigorigène) : enum 42 à 45 :
      Soufflage d'air (courant), plafond (cas rare), plancher (cas rare) et radiateurs (cas très très rare)
    * Soufflage d'air chaud (Ventiloconvecteur) connecté à une distribution à eau enum : 46 à 49 (réseau
      collectif/individuel à haute ou moyenne/basse température)
    * Soufflage d'air chaud sans réseau de distribution (ventiloconvecteur éléctrique) enum : 50

  Précision sur l'enum 5

    * description de l'enum 5 modifié Soufflage d'air chaud (air soufflé) -> Soufflage d'air chaud (air soufflé) avec
      distribution par réseau aéraulique

## tables de valeurs

* rendement_emission : ajout des nouvelles options de enum_type_emission_distribution_id

* rendement_distribution_ch :

    * ajout des nouvelles options de enum_type_emission_distribution_id

    * ajout de la ligne 12 réseau de distribution par fluide frigorigène rd = 1

* rendement_regulation :

    * ajout de la ligne 15 : Autres cas -> enum_type_emission_distribution_id : 41,43,44,45

    * ajout des nouvelles options pour l'air soufflé de enum_type_emission_distribution_id

* intermittence :

    * ajout des nouvelles options de enum_type_emission_distribution_id

# 5.6.0 2021-12-03 ajout nouveaux arrêtés réseau de chaleur

la publication des nouveaux arrêtés réseau de chaleur ajoute un identifiant de réseau unique
Cet identifiant identifiant_reseau_chaleur remplacera à compter du 18 janvier le champ tv_reseau_chaleur_id.

Les nouveaux réseaux de chaleurs sont disponible dans la table reseau_chaleur_2021 dans valeur_tables.xlsx.

une correspondance a été réalisée avec l'ancienne table (reseau_chaleur renommée : reseau_chaleur_2020)

# fonctionnement de la saisie réseau de chaleur

## generateur_chauffage

**si le réseau est répertorié :**

* fournir identifiant_reseau_chaleur

* choisir 107 ou 108 pour enum_type_generateur_ch_id

**si le réseau est non répertorié**

* ne pas fournir identifiant_reseau_chaleur

* choisir 142 pour enum_type_generateur_ch_id

## generateur_ecs

**si le réseau est répertorié :**

* fournir identifiant_reseau_chaleur

* choisir 72 ou 73 pour enum_type_generateur_ch_id

**si le réseau est non répertorié**

* ne pas fournir identifiant_reseau_chaleur

* choisir 119 pour enum_type_generateur_ecs_id

# modèle de données

* le fichier DPE.xsd est renommé : DPEV1(OBSOLETE).xsd et ne doit plus être utilisé à partir de maintenant.

* conso_5_usages dans sorties par energie -> possibilité de saisir 0 pour gérer les générateurs cascades non utilisés.

* DPE logement/logement_neuf ajout de identifiant_reseau_chaleur comme nouveau identifiant réseau pour
  generateur_chauffage.donnee_entree et generateur_ecs.donnee_entree (remplace tv_reseau_chaleur_id)

## tables de valeurs :

* ajout de la table reseau_chaleur_2021 dans valeur_tables.xlsx

* renommage de la table reseau_chaleur en reseau_chaleur_2020 dans valeur_tables.xlsx

* erreur de typo corrigée id_periode_construction_id -> enum_periode_construction_id sur umur,uph,upb (ce problème
  empêchait le déclenchement
  d'un contrôle de cohérence sur les tables de valeurs umur,uph,upb)

* type_generateur_chauffage : 108,109 remplacement de la variable obligatoire : tv_reseau_chaleur_id par
  identifiant_reseau

* type_generateur_ecs : 72,73 remplacement de la variable obligatoire : tv_reseau_chaleur_id par identifiant_reseau

## enumerateurs

* enum_usage_id : ajout 16 auxiliaires et ventilation

* enum_methode_saisie_perf_vitrage_id :

    * 1 : supression de l'obligation d'avoir tv_ug_id en variable requise
    * ajout de enum 13 : Uw saisi directement à partir des documents justificatifs autorisés , Ujn,Sw calculés avec les
      tables forfaitaires
    * ajout de enum 14 : Sw saisi directement à partir des documents justificatifs autorisés , Ujn,Uw calculés avec les
      tables forfaitaires
    * ajout de enum 15 : Ug,Sw saisi directement à partir des documents justificatifs autorisés , Ujn,Uw calculés avec
      les tables forfaitaires

* enum_typologie_logement_id : correction du libéllé 7 : T6+ -> T7 ou plus.

# 5.6.1 2021-12-13 consommation négatives sur DPE tertiaire

## modèle de données

* suppression des restrictions qui empêchait la saisie de données de consommation négative pour le tertiaire.

# 6.0.0 2022-01-14 ajout dpe_immeuble_associe + retours éditeurs modèle de données.

## Explications essentielles

CETTE VERSION DU XSD INCLUS UN NOMBRE IMPORTANT DE CHANGEMENTS.

Cette modification du XSD est assez conséquente et prend en compte les retours éditeurs de la réunion du 2022-01-14.

La plupart des modifications détaillées dans les paragraphes suivants n'invalideront pas les xml établis avec les
versions antérieures car la grande majorité
des changements concernent des champs pour l'instant ajoutés en optionnel ou des relachement de contraintes (int passés
en double par exemple). Certains champs seront exigés requis à partir d'un certain moment mais ont été laissé en
optionnel pour ne pas
engendrer d'erreurs pendant cette phase de transition entre la 1.1 et la version 2 et 2.1 du modèle de données.

Les modifications ayant un impact de nature à bloquer l'implémentation actuelle du XSD v2 sont les suivants :

**CHANGEMENTS BLOQUANTS**

* q4pa_conv_saisi : changement de type ce paramètre était mal affecté en booléen (oui/non) alors qu'il s'agit bien de la
  valeur numérique d'un q4pa saisi par un diagnostiqueur lorsqu'il a
  à sa disposition un essai d'étanchéité à l'air. Le type est maintenant un double strictement positif. ce changement de
  type peut engendrer des erreurs si non corrigé.

* si vous déclariez plusieurs collections logement_visite_collection pour le DPE immeuble. Cela ne sera plus possible
  dans cette version. (c'est bien logement_visite qui peut être instancié plusieurs fois et non plus la collection.)

Lors d'une saisie DPE logement d'un appartement réalisé à partir d'un DPE immeuble il est possible de saisir le numéro
de DPE immeuble associé au DPE à l'appartement.

## modèle de données

* V2 ajout dans administratif de dpe_immeuble_associe qui permet de saisir le numéro de DPE associé

* V2 BLOQUANT : q4pa_conv_saisi : changement de type ce paramètre était mal affecté en booléen (oui/non) alors qu'il s'
  agit bien de la valeur numérique d'un q4pa saisi par un diagnostiqueur lorsqu'il a
  à sa disposition un essai d'étanchéité à l'air. Le type est maintenant un double strictement positif.

* V2 surface_aiu , surface_aue pour plancher_haut : changement du type decimal -> double. Les saisies de type double
  fonctionnaient auparavant ce changement de type est effectué pour être homogène avec les autres types numériques.

* V2 nombre_logement dans installation_ecs changement de type int -> double pour permettre la saisie de nombre de
  logements non entier avec règle d'échantillonage.

* V2 nombre_logement_echantillon dans installation_chauffage/climatisation changement de type int -> double pour
  permettre la saisie de nombre de logements non entier avec règle d'échantillonage.

* V2 nb_baie dans baie_vitree : changement de type int -> double pour permettre la saisie de nombre de baies non entier
  avec règle d'échantillonage.

* **porte** :

    * V2 ajout de nb_porte (OPTIONNEL de manière temporaire sera rendu obligatoire lors d'une prochaine version)

    * V2 ajout de largeur_dormant (OPTIONNEL de manière temporaire sera rendu obligatoire lors d'une prochaine version)

    * V2 ajout de presence_retour_isolation (OPTIONNEL de manière temporaire sera rendu obligatoire lors d'une prochaine
      version)

* pont thermique :

    * V2 ajout de pourcentage_valeur_pont_thermique (OPTIONNEL) : paramètre qui permet de renseigner le % de valeur de
      pont thermique pris en compte
      Ceci est utile pour renseigner le fait qu'un pont thermique refend/mur ou plancher intermediaire/mur n'est pris
      que partiellement en compte conformément à la méthode.

* plancher bas :

    * V2 ajout de surface_ue pour le calcul de ue (OPTIONNEL)

* generateur_chauffage:

    * V2 SUPPRESSION : tv_temp_fonc_30_id (Le paramètre est toujours existant pour ne pas casser des implémentation
      existantes mais n'est plus à utiliser il sera supprimé effectivement dans une prochaine version)

    * V2 SUPPRESSION : tv_temp_fonc_100_id (Le paramètre est toujours existant pour ne pas casser des implémentation
      existantes mais n'est plus à utiliser il sera supprimé effectivement dans une prochaine version)

* changement de tous les type positiveInteger -> int avec restriction. Le type positiveInteger était mal interprété par
  des librairies de certains éditeurs de logiciel.

* DPE immeuble :

    * V2 correction de logement_visite_collection. Il était possible de déclarer plusieurs collections. La collection
      est maintenant bien unique

    * V2 logement_visite : il n'était pas possible de déclarer plusieurs logements dans la collection. il est donc
      maintenant possible de déclarer plusieurs logement_visite

* V2 AJOUT(OPTIONNEL) de reference pour les composants
  mur,plancher_bas,plancher_haut,baie_vitree,porte,baie_ets,ets,ventilation,climatisation,installation_chauffage,generateur_chauffage,emetteur_chauffage,installation_ecs,generateur_ecs,production_elec_enr

* V2 AJOUT(OPTIONNEL) de reference_1,reference_2 pour les composants pont_thermique

* V2 : possibilité de saisir 0 en consommation ecs et chauffage dans le cas extrêmement particulier où fecs ou fch vaut
  1. (un contrôle de cohérence vérifie ce point pour ne pas laisser des saisies 0 dans les autres cas)

* V2 : correction de confort_ete/aspect_traversant confort_ete/brasseur_air confort_ete/isolation_toiture en optionnel
  pour le modèle existant

## table valeur

* uw : ajout de la possibilité de saisir les portes fenêtres avec ou sans soubassement pour les menuiseries
  métalliques (seules les portes fenetres sans soubassement étaient prises en compte)

## document guide

ajout d'une section sur les références

DONNEES DESCRIPTION ET REFERENCE

Pour la plupart des composants les champs description et reference sont disponible sous format texte champ libre pour
pouvoir documenter le composant

Description :  description libre du composant qui peut inclure des détails qui ne sont pas des éléments de calcul. (
position, référence produit etc…)

Reference : la référence est un identifiant interne du composant dans chaque logiciel DPE. Cette référence peut être
utilisée pour faire des liens entre objets du modèle de données.

Exemple , si le logiciel utilise un modèle de paroi incluant la paroi opaque et les menuiseries il peut avoir une
référence « mur1 » et avoir en sous référence les composants suivants

mur1-paroi_opaque

mur1-fenetre-1

mur1-porte-1

mur1-portefenetre-1

Attention :les références ne sont pas standardisées car chaque éditeur de logiciel a sa propre manière d’implémenter les
éléments. Il n’y a pas de standardisation prévue de ces éléments et donc ces références peuvent être utilisés par des
éditeurs pour faire des recalculs à partir de DPE édités par leur propre logiciel mais la compatibilité entre logiciels
sera forcément problématique.

# 6.1.0 2022-01-06 corrections diverses

## modèle de données

* restriction homogènes sur les cop/scop de 1 à 8 pour ECS et chauffage.

* BLOQUANT : cle_repartition_clim : passé de int à double compris de 0 à 1

* logement_neuf : consommations et emission ges 5 usages en sortie peuvent être = 0

* logement : emission_ges 5 usages peuvent être = 0 (les consommations sont toujours >0)

* ajout de restriction sur les longueurs (255 char) sur les champs textes suivants pour être homogène avec la base de
  données ADEME

    * nom_proprietaire, nom_proprietaire_installation_commune
    * ref_produit_generateur_ecs, ref_produit_generateur_ch,ref_produit_fr, ref_produit_ventilation,
    * adresse_brut,nom_commune_brut,label_brut,ban_label ,ban_housenumber ,ban_street ,ban_citycode ,ban_postcode
      ,ban_city ,compl_nom_residence ,compl_ref_batiment ,compl_ref_cage_escalier ,compl_ref_logement
    * avertissement_travaux,performance_recommande
    * version_logiciel nom_diagnostiqueur prenom_diagnostiqueur mail_diagnostiqueur telephone_diagnostiqueur
      adresse_diagnostiqueur entreprise_diagnostiqueur numero_certification_diagnostiqueur organisme_certificateur

* ajout de restriction sur les longueurs (32char) sur les champs textes suivants pour être homogène avec la base de
  données ADEME

    * version_moteur_calcul

* eer limite basse passée à 0.9 pour laisser passer les réseaux de froid + documentation eer = seer*.095

## enumérateurs

* ajout des énumérateurs 162 à 170 qui permettent de décrire des pompes à chaleur hybrides qui sont de type eau/eau ou
  géothermique.

* correction d'une erreur sur enum_methode_saisie_perf_vitrage_id = 13 qui interdisait la saisie de tv_ujn_id ceci est
  désormais possible.

* ajout de identifiant_reseau_chaleur en variable interdite pour tous les systèmes qui ne sont pas des réseaux de
  chaleurs connus.

* methode_saisie_carac_sys : ajout de SEER saisi pour permettre la saisie de réseau de froid ou de système de
  climatisations qui ne sont pas éléctriques
  pour permettre la saisie du SEER correspondant à un réseau de froid ou un système non éléctrique pour la
  climatisation.

## tables de valeur

* ajout de la possibilité de saisir un enum_type_emission_distribution_id de 41 (autres équipements) pour n'importe
  quelle distribution.

* rendement_emission : correction d'enum plafond/plancher rayonnant qui était affecté comme "autres emetteurs à effet
  joule". Ils sont dorénavant classé respectivement en plafond et plancher chauffant pour le rendement d'émission.

# 2022 01 21 6.2.0 règles DPE appartement à partir immeuble

Cette version en plus de corrections réalisées sur des erreurs du modèle, simplifie/clarifie la saisie des dpe logements
réalisés à partir d'un DPE immeuble.
Une nouvelle section 8.5
du [document_guide](https://gitlab.com/observatoire-dpe/observatoire-dpe/-/blob/master/modele_donnee/document_guide_modele_donnee_DPE.docx)
précise comment gérer les cas particulier
notamment les DPE immeubles et DPE appartement à partir des données de l'immeuble.

## document guide

* détail sur la prise en compte des dpe logements réalisés à partir d'un DPE immeuble. (section 8.5.4 du document guide)

* reprécision de la doc sur les méthodes de calculs nécessitant une virtualisation/extrapolation/echantillon

* précision sur les référénces cadastrales

## modèle de données

* AJOUT : enum_type_pose_id pour les portes (OPTIONNEL pour le moment il sera rendu OBLIGATOIRE dans une future
  version).
  Si non renseigné cela peut entrainer des warning de contrôle de cohérence pont thermique.

* AJOUT(OPTIONNEL -> uniquement cas DPE appartement à l'immeuble) cle_repartition_ecs pour les installations d'ECS

* AJOUT(OPTIONNEL -> uniquement cas DPE appartement à l'immeuble) cle_repartition_ventilation pour la ventilation.

* AJOUT(OPTIONNEL) reference_paroi pour les portes et baies vitrées pour permettre de référencer la paroi qui porte la
  fenetre ou porte.

* AJOUT(OPTIONNEL) position_volume_chauffe_stockage pour les générateurs d'ECS pour spécifier la position du stockage de
  l'ECS.

* AJOUT(OPTIONNEL) enum_periode_installation_emetteur_id dans emetteur_chauffage à renseigner dans le cas d'une
  chaudière gaz ou fioul

* passage de la limite basse du eer à 0 (exclusive)

* cle_repartition_ch,cle_repartition_ecs,cle_repartition_clim et cle_repartition_ventilation sont des paramètres à
  utiliser uniquement pour les DPE appartement à partir de l'immeuble
  et doivent être calculés conformément à la section 8.5.4 du document_guide_modele_donnee_DPE.docx. Un contrôle de
  cohérence vérifiera que ces données sont saisies pour ce type de DPE.

* emission_ges_5_usages_apres_travaux : autorisation de saie 0

## enumérateurs

* passage de la surface_reference des dpe appartement depuis immeuble à surface_habitable_immeuble pour être en
  cohérence avec les nouvelles règles de saisie appartement à partir de l'immeuble

* type_generateur_ch : variables_requises : suppression de l'obligation de presence_regulation_combustion sur les
  chaudières bois/charbon et poeles bouilleurs.

* type_generateur_ch : documentation des pompes à chaleur hybride bois comme étant hors_methode. (à n'utiliser que pour
  la description de DPE neufs.)

## tables de valeur

* précision ajoutés pour les réseaux bouclés/non bouclés pour les réseaux collectifs ECS. le réseau non bouclé non tracé
  isolé doit être traité comme un réseau tracé isolé (ligne )

* scop : enum_generateur_ch_id ajout des enums 143-147 162-170 pour les pompes à chaleur hybrides.

* intermittence : ajout des enum plancher/plafond rayonnant electrique aux intermittence correspondantes (plancher
  chauffant/plafond chauffant) au lieu de convecteur/radiateur

## tests

* ajout d'un cas test exemple appartement issu d'un immeuble

* ajout d'un cas test exemple tertiaire neuf.

# 2022 03 02 6.3.0

## document guide

### ajout d'une section sur emission_distribution

**Fonctionnement de l’émission/distribution/régulation/intermittence**

Pour l’emission, la distribution, la régulation et l’intermittence du chauffage il est demandé de renseigner un unique
énumérateur qui caractérise les propriétés du système de distribution et d’émission enum_ type_emission_distribution_id.
Cet énum est lié aux tables rendement_distribution_ch,rendement_emission, rendement_regulation et intermittence et
conditionne les valeurs qui peuvent être prises dans chacune des tables.

Si le type d’émission/distribution ne peut être associé à aucun des énumérateurs signifiants il peut être utilisé l’enum
41 autres équipements. Les règles suivantes s’appliquent :

Si vous avez recours à cet enum sur la partie existant alors il est appliqué un comportement par défaut en régulation (
0.9)et emission(0.95) et considéré comme un radiateur ou radiateur/convecteur en intermittence. En revanche tout type de
distribution est autorisée pour cet énumérateur.

### ajout d'une section sur les installations hybrides collective/individuelles pour le chauffage

8.4.5.2 CAS PARTICULIERS : installations hybrides : convecteurs bi-jonction ou chauffage base collective + appoint
individuel

Certaines installations sont considérées comme hybrides à savoir qu’elles ont un mode de fonctionnement de type «
chauffage collectif » et un autre de type « chauffage individuel » ce cas se présente pour les convecteurs bi-jonction
et les chauffages en base collective et appoint individuel.
Dans ces cas particuliers il faut alors :

1) Décrire l’installation avec la propriété enum_type_installation_id comme une installation hybride (enum 4)
2) Dans le cas d’un convecteur bi-jonction il faut alors déclarer deux émetteurs différents. Ces deux émetteurs sont
   équivalents sur la plupart des éléments sauf l’intermittence qui diffère entre la partie collective (1er émetteur) et
   la partie individuelle (2eme émetteur)
3) Décrire la méthode d’application DPE appartement ou immeuble comme étant une méthode incluant un mixte entre
   chauffage individuel et collectif : enum_methode_application_log_id

Dans le cas très particulier d’un DPE immeuble où l’immeuble serait hybride en termes de chauffage collectif ou
individuel une partie des logements de l’immeuble ont des installations individuelles de chauffage et l’autre partie des
logements rattachés à une installation collective de chauffage alors il faut aussi utiliser ces enum de méthode
d’application « mixte » individuel/collectif.  
Ce passage d’une méthode d’application « mixte » permet de passer les contrôles de cohérences au niveau de
l’intermittence lorsque des intermittences collectives et individuelles sont déclarées pour le même DPE.

### précision du cas chaufferie collective multi-batiment multi énergie

Ajout dans la section 8.4.5.1 CAS PARTICULIERS : Générateur PAC hybride et générateur bi energie et installations
collectives multibâtiments multi énergies

Pour les installations collectives multibâtiments avec multiples sources d’énergies différentes (par exemple chaudière
gaz + PAC) à ce moment là il faut appliquer la même règle que les générateurs bi énergie à savoir déclarer une
installation affectée à chaque énergie avec une surface de chaque installation qui est la surface totale divisée par le
nombre d’installation (donc d’énergies associées).

## modèle de données

* excel modele_donnee.xlsx : documentation des propriétés qui concernent le tertiaire/logement ou logement neuf.

* documentation de paroi_ancienne (qui a un nom peu à propos il s'agit bien de préciser si l'on a un enduit isolant pour
  une paroi ancienne). la paroi est une paroi ancienne sur laquelle a été appliquée un enduit isolant (
  Renduit=0,7m².K.W-1)  0 : non 1 : oui. (Attention ! nom de propriété pas tout à fait explicite)

* correction maximum sur rendement_stockage : 1 -> 1.08

## enumerateurs

* type_generateur_ch : ajout de 171 Chaudière(s) charbon multi bâtiment modélisée comme un réseau de chaleur

* type_generateur_ecs : ajout de 134 Chaudière(s) charbon multi bâtiment modélisée comme un réseau de chaleur

* enum_type_pose_id : ajout de l'énumérateur 4 : Sans Objet pour les parois en polycarbonate et briques de verre.

* methode_application_dpe_log : ajout des enums 35 à 40 pour gérer les configurations d'ECS mixte.

## tables de valeur

* scop : précision de la définition cop ou scop pour chaque ligne.

* seer : ajout d'une colonne eer (qui est le resultat final utilisé dans le calcul (eer = seer *0.95)) -> cela corrige
  des erreurs de tables de valeur pour les climatisations <2008

* seer : précision de la définition eer ou seer pour chaque ligne.

* AJOUT : table ue (A TITRE PUREMENT INFORMATIF: non utilisée dans les contrôles de cohérences ni dans le XSD)

# 2022 04 15 6.4.0 ajout siren

## modele de données

* qualite_isol_mur : passage en optionnel pour prendre en compte le cas des logements sous rampants ou avec des facaces
  100% vitrées.

* ajout : reference (OPTIONNEL) pour les ponts thermiques. L'ajout de cette référence permet de fournir une référence
  propre au pont thermique en plus des deux références des composants associés.

* ajout : siren_proprietaire dans administratif (OPTIONNEL) pour attribuer un siren de propriétaire personne morale

* ajout : rpls_log_id dans geolocalisation (OPTIONNEL) pour attribuer un numéro de logement RPLS au DPE

* ajout : rpls_org_id dans geolocalisation (OPTIONNEL) pour attribuer un numéro d'organisation bailleur social RPLS au
  DPE

* pack_travaux.conso_5_usages : précision qu'il s'agit d'une consommation en énergie primaire.

## enumérateurs

* version : changement de la description des dates des arrêtés dans enum_version_id pour reprendre les dates officielles

* methode_saisie_u0 : ajout d'un énum 5 qui permet de ne pas saisir de U0 dans le cas d'une saisie de U justifiée
  directe pour les parois opaques. Cette méthode de saisie impose la saisie de umur_saisi.
  Le problème est qu'il n'était pas possible précédement de ne pas déclarer U0. La seule solution précédent ce
  changement était recourir à des artifices de type Usaisi=U0saisi pour contourner ce manque.

* methode_saisie_pont_thermique : enum 3 correction d'une typo saisie direct U -> saisie direct k

## tables de valeur

* generateur_combustion : correction de enum_type_generateur_ecs_id pour : Chaudière bois bûche ou plaquette >2019

* rendement_generation : ajout de enum_type_generateur_ch_id :171 pour le rendement réseau de chaleur.

* intermittence : ajout des enum_methode_application_id 35 à 40 dans la table de valeur (chauffage collectif/individuel
  en logement collectif.)

* intermittence : ajout de enum_type_emission_distribution_id = 10 pour les enums 152 155 156 160 164 168 171 175 179
  183 187

* rendement_regulation : BLOQUANT enum_type_emission_distribution_id = 41 était possible en saisie
  tv_rendement_regulation_id = 11 (Radiateur à eau chaude sans robinets thermostatiques). Ceci a été supprimé au profit
  de l'utilisation de la ligne tv_rendement_regulation_id = 15 (autres cas).
  La seule option possible pour enum_type_emission_distribution_id = 41 est donc bien uniquemenent la ligne 15 autres
  cas.

## document guide

**modification de la section 8.4.5.1 CAS PARTICULIERS : Générateur PAC hybride et générateur bi energie et installations
collectives multibâtiments multi énergies. au sujet des installations collectives multi batiment multi énergie**

Pour les installations collectives multibâtiments avec multiples sources d’énergies différentes.
Si la configuration de l’installation multi énergie correspond aux scénarios prévus par la méthode comme :

• Installation de chauffage avec chaudière en relève de PAC

• PAC Hybride

• Installation simple avec générateurs à combustion en cascade avec des énergies différentes

Alors la description dans le modèle de données de l’ADEME est identique à l’équivalent mono bâtiment avec pour seule
différence la prise en compte de la simplification de modélisation comme un réseau de chaleur des générateurs.  
Ainsi par exemple dans le cas d’une « Installation de chauffage avec chaudière en relève de PAC ». On modélise une
installation normale de ce type avec deux générateurs modélisés comme des réseaux de chaleur

1er générateur : Une « Pompe(s) à chaleur multi bâtiment modélisée comme un réseau de chaleur »

2eme générateur : Une « Chaudière(s) gaz multi bâtiment modélisée comme un réseau de chaleur»

Pour les (rares) autres cas qui ne seraient pas gérés par les installations standard il faut alors procéder à une
modélisation multi installation qui peut correspondre à la configuration rencontrée.

**ajout de deux nouvelles sections dans le document guide sur l'intermittence**

8.4.5.4 CAS PARTICULIERS :  intermittence d’un chauffage divisé déclaré chauffage collectif.

Dans le cas d’un chauffage de type divisé comme un plancher chauffant électrique déclaré en chauffage collectif, il peut
être utilisé la configuration chauffage central en lieu et place du chauffage divisé car c’est la seule option fournie
par la méthode. La table intermittence autorise la saisie de ce type de configuration.

8.4.5.5 CAS PARTICULIERS :  intermittence dans le cas d’une installation base + appoint

Dans le cas d’une installation base + appoint il est demandé de saisir les deux intermittences des émetteurs de base et
d’appoint même si comme il est spécifié dans la méthode seule l’intermittence de l’appoint est prise en compte pour le
calcul du coefficient INT

## documentation open data

* ajout d'un document accompagnant la sortie en open data du jeu de données

* ajout de colonnes categorie_open_data pour les enums type_ventilation,type_generateur_ch, type_generateur_ecs

# 2022 04 15 6.4.1 hotfix tv_q4pa_conv_id

## tables de valeurs

* q4pa_conv : ajout des enum_methode_application_id 35 à 40 dans la table de valeur (chauffage collectif/individuel en
  logement collectif.)

# 2022-06-02 7.0.0 mutualisation audit DPE + nouvelles contraintes modèle DPE.

## nouvelle version DPE

* nouvelle version 2.2 du modèle DPE -> XSD DPEv2.2 implémente tous les changements BLOQUANTS détaillés ci dessous.
* le XSD DPEv2 ne prend en compte que les évolutions non bloquante.
* une période de transition est prévue pour migration de la version DPE de 2.1 à 2.2

## modele commun DPE audit réglementaire

* production d'un modèle de donnée commun DPE / audit réglementaire qui est la source de vérité pour les deux sous
  modèles et qui permet de les générer.

* AJOUT OPTIONNEL de reference_lnc pour pouvoir ajouter une référence du LNC en contact avec la paroi. Lorsque la paroi
  est un espace tampon solarisé ceci est la reference de l'espace tampon solarisé.

* AJOUT OPTIONNEL :reference_generateur_mixte pour generateur_chauffage et generateur_ecs. référence commune pour les
  générateurs mixtes.

* AJOUT d'un mode TEST: option à préciser dans l'appel à l'API ADEME (la documentation de ce mode sera précisé par
  l'ADEME)
  le mode test permet de déclencher un contrôle de cohérence sans déposer le DPE à l'observatoire.

  le retour de l'observatoire est donc que le DPE est valide ou non mais n'a pas été déposé car en mode test.

  Ce mode test permet donc de faire un dépôt en plusieurs étapes :

  étape 1 : envoi du DPE en mode test et retour des avertissements.

  etape 2 : en fonction des avertissements retournés, le diagnostiqueur peut corriger son DPE et le renvoyer en mode
  test

  etape finale : le DPE est valide et les avertissements ont été traités par le diagnostiquer -> il transmet son DPE
  sans mode_test

* BLOQUANT : passage de reference pour tous les objets en obligatoire

* BLOQUANT : passage de pourcentage_valeur_pont_thermique en obligatoire

* BLOQUANT geolocalisation : invar_logement : BLOQUANT restriction de saisie imposée (10 chiffres)

* BLOQUANT geolocalisation : idpar : BLOQUANT restriction de saisie imposée 14 caractères <xs:pattern value="[0-9]
  {1}[A-Z0-9]{1}[0-9]{3}[0-9]{3}[A-Z0-9]{2}[0-9]{4}"/>

## modele donnee DPE

* mise à jour de documentations dans le fichier excel modele_donnee.xlsx

* corrections de source érronnées

## énumérateurs DPE

* ajout de nouvelles methode_application_dpe_ter : enum 5 à 8 qui sont les versions "dans un bâtiment de logement" des 4
  méthodes précédentes. Ceci permet donc de réaliser des DPE tertiaires
  dans des immeubles d'habitation sans avoir besoin d'une certification avec mention pour le diagnostiqueur

* ajout dans methode_application_dpe_log et methode_application_dpe_ter une colonne niveau_certification_diagnostiqueur
  qui précise si la méthode peut être réalisé par un diagnostiqueur avec une certification standard ou avec mention.

* ajout d'un enum_version_id = 2.2 qui permet d'identifier un DPE compatible avec un import audit.

* enum_modele_dpe_id changement du libéllé de l'énum 1 : DPE 3CL 2020 méthode logement -> DPE 3CL 2021 méthode logement

# 2022-09-28 DPE 7.1.0 - Audit 1.0.0 modèle audit finalisé avec trame

## modele de données

* doc : amélioration de la documentation d'enum_version_id.

* doc/precision : priorite_generateur_cascade -> explicitation de la règle pour gérer les générateurs cascades sans
  priorité (les deux générateurs sont classés avec le même niveau de priorité)

* doc/precision : umur0, umur0_saisi précision qu'il s'agit du U du mur "nu" qui inclus le calcul du doublage et de
  l'enduit isolant

* BLOQUANT : categorie_geste_entretien,detail_origine_donnee -> limite à 255 CHAR pour être en accord avec les
  spécifications de la base ADEME.

## énumérateurs DPE

* doc : ajout de periode_installation_min, periode_installation_max pour type_generateur_ch

* doc : ajout de periode_installation_min, periode_installation_max pour type_generateur_ecs

* doc : ajout de periode_installation_min, periode_installation_max pour type_generateur_fr

* fix : correction de catégories open data sur pac air/eau avant 2008 pour type_generateur_ch

* fix : ajout d'un traitement de type TRIM des libéllés (suppression des espaces prefixes et suffixes) dans l'excel pour
  s'assurer de l'homogénéité des libéllés avec le xsd sur les enums
  Tables concernées :

    * version
    * modele_dpe
    * methode_application_dpe_ter
    * methode_saisie_u0
    * methode_saisie_perf_vitrage
    * type_plancher_haut
    * type_porte
    * type_generateur_ch
    * type_emission_distribution
    * type_generateur_ecs
    * type_energie
    * qualite_composant
    * num_pack_travaux
    * type_justificatif
    * picto_geste_entretien

## table de valeurs

* fix : correction d'un prefix espace (typo) sur coef_masque_proche/type_masque_proche

## modele donnee audit

* prise en compte des dernières mises à jour de l'arrêté concernant l'audit règlementaire.
    * mise à jour de l'appinfo de enum_lot_travaux_audit_id
    * mise à jour de la documentation de description_travaux
    * AJOUT dans l'objet etape_travaux, des balises correspondants à la consommation en EP/EF pour chaque usage
    * correction de la doc des conso pour l'etape_travaux
    * AJOUT des conso par usage pour l'xml exemple: cas_test_audit_maison_1_v0.xml

* mises à jour suite à la nouvelle trame : 11/08/2022
    * mise à jour de la partie administratif du xsd. AJOUT d'un 'choice' pour choisir entre : diagnostiqueur,
      BET_entreprises et architecte
    * suppression de info_traitement_interfaces et info_renouvellement_air car pris en compte différemment dans la trame
      de l'audit
    * AJOUT de vue_ensemble_logement avec les sous parties : description_du_bien, descriptif_enveloppe_collection et
      descriptif_equipements_collection correspondants aux pages 5 et 6 de la trame
    * AJOUT dans etape_travaux de travaux_resume_collection, liste de travaux à cocher par l'auditeur (page 8 trame)
    * Modification dans travaux_collection de descriptif_travaux en description_travaux_collection avec 2 items (
      enum_picto_travaux_id,description)
    * AJOUT dans etape_travaux de travaux_induits_collection : détail des travaux induits (page 9 de la trame)
    * AJOUT de la partie : expertise_auditeur, contenant : pathologie_caracteristique_collection (trame p.6),
      recommandation_auditeur_collection (trame p.15), explications_personnalisees (trame p.6) et
      observations_auditeur (trame p.7)
    * AJOUT dans etape_travaux : distinction de aide_financiere en aide_financiere_locale et aide_financiere_nationale
    * AJOUT section fiches techniques : identique au DPE.
    * AJOUT uri_interne_image dans pathologie_caracteristique pour permettre de stocker des liens d'images pour la
      génération de rapport à partir du xml
* fix : passage de l'element description_du_bien en description_du_bien_collection dans vue_ensemble_logement.

## énumérateurs audit

* Ajout d'une version 1.0 de l'audit énergétique (version initiale de septembre 2022)

* prise en compte des dernières mises à jour de l'arrêté concernant l'audit règlementaire.
    * AJOUT du lot de travaux 'autre' dans l'enum lot_travaux_audit : enum_tables_audit.xlsx

* mises à jour, suite à la nouvelle trame : 11/08/2022
    * AJOUT de categorie_descriptif_enveloppe : lot pour la description de l'etat existant de l'enveloppe à la page 5 de
      la trame de l'audit
    * AJOUT de categorie_descriptif_sys : lot pour la description de l'etat existant des equipements à la page 6 de la
      trame de l'audit
    * AJOUT de travaux_resume_collection : travaux élémentaire à sélectionner par l'auditeur, pour affichage en p.8 de
      la trame de l'audit
    * AJOUT de picto_travaux : pictogrammes «point de vigilance» et «matériaux bio-sourcés» à cocher par l’auditeur si
      besoin pour accompagner la description du travaux (p.9 de la trame)
    * AJOUT de type_observation : type d'observation concernant l'état existant du bâtiment : pathologie,
      architecturale, patrimoniale ou technique (trame p.6)
    * mise à jour de la partie administratif du xsd. Ajout d'un 'choice' pour choisir entre : diagnostiqueur,
      BET_entreprises et architecte

* doc : ajout dans description_du_bien_collection/description_du_bien, de l'enumerateur : rubrique_description:
* doc : ajout dans travaux_collection/travaux de l'enumerateur : type_travaux, pour specifier le type de travaux à
  réaliser.

# 2023-02-23 XSD DPE 8.0.1 - XSD Audit 2.0.1 (DPE V2.3, Audit 1.1)

ANNULE ET REMPLACE 8.0.0 et 2.0.0

> correctif 8.0.1/2.0.1 :
>  * baie_vitree_double_fenetre est positionné au niveau de la baie_vitree et plus dans la sous structure
     baie_vitree.donnee_entree
>  * l'audit réglementaire v1 (audit_regv1.xsd) a été mis en rétrocompatibilité avec les évolutions comme pour le DPE
>  * ajout de altitude dans logement.meteo


les changements décrits ci-dessous deviennent complètement effectifs avec la bascule du DPE en version 2.3 et de l'audit
en 1.1

la période de transition s'étend de mars 2023 au (DATE NON DEFINIE)

## Résumé

modifications DPE 2.3/audit 1.1

* adresse : ajout du champ label_brut_avec_complement
* administratif : renommage invar_logement -> remplacé par numero_fiscal_local
* meteo : ajout du champs altitude
* baies vitrées : ajout du champ presence_joint
* baies vitrées : ajout du champ presence_protection_solaire_hors_fermeture
* baies vitrées : ajout d'un modèle de double fenetre
* installation (chauffage/ECS) : ajout du paramètre rdim pour le calcul par échantillonage
* caracterisitque_generale : ajout de enum_calcul_echantillonage_id pour tracer les méthodes d'échantillonages
* murs : renommage de paroi_ancienne -> remplacé par enduit_isolant_paroi_ancienne
* dpe_immeuble/logement visite : ajout de surface_habitable_logement
* audit : travaux_resume , renommage du champ enum_travaux_resume_collection_id -> enum_travaux_resume_id

## modele commun

IMPORTANT : Clarification des champs adresses!
Les compléments d'adresses comme le numéro de résidence, de bâtiment d'étage , de logement etc. Sont **à proscrire** des
champs adresse_brut et label_brut qui sont dédiés à gérer des formats de type adresse postale

* doc adresse_brut changement de la description : libéllé l'adresse postale du bien saisi par le diagnostiqueur **sans
  le code postal ni la commune** (FORMAT ATTENDU :  Numéro de l’adresse dans la voie + Indice de répétition associé au
  numéro (par exemple bis, a…) + Nom de la voie en minuscules accentuées)

* doc label_brut changement de la description : libellé complet de l'adresse postale du bien saisi par le
  diagnostiqueur (FORMAT ATTENDU :  Numéro de l’adresse dans la voie + Indice de répétition associé au numéro (par
  exemple bis, a…) + Nom de la voie en minuscules accentuées + Code postal du bureau de distribution de la voie + Nom
  officiel de la commune actuelle). **NE PAS RENSEIGNER DE COMPLEMENT D'ADRESSE DANS CE CHAMPS**

* **BLOQUANT** (DPE v2.3,audit v1.1) : ajout d'un nouveau champ OBLIGATOIRE  **label_brut_avec_complement** -> Ce champs
  est utilisé pour fournir le libéllé complet d'adresse avec les compléments à afficher nottament dans les
  rapports.libellé complet d'adresse complète qui est l'adresse postale du bien précédé par l'ensemble des compléments
  d'adresses nécessaires à la bonne localisation du bien saisi par le diagnostiqueur (FORMAT ATTENDU : Compléments
  d'adresses + Numéro de l’adresse dans la voie + Indice de répétition associé au numéro (par exemple bis, a…) + Nom de
  la voie en minuscules accentuées + Code postal du bureau de distribution de la voie + Nom officiel de la commune
  actuelle)

* OPTIONNEL ajout d'un nouveau champs **reference_interne_projet** permettant de renseigner une référence logicielle
  interne de projet

* OPTIONNEL ajout d'un nouveau champs altitude qui permet de saisir l'altitude exacte du logement dans logement.meteo

* besoin_ch : autoriser le besoin de chauffage sur installation_chauffage à 0 pour prendre en compte les cas où les
  apports gratuits des systèmes compensent le faible besoin

* **BLOQUANT** (DPE v2.3,audit v1.1) : suppression de invar_logement -> remplacé par numero_fiscal_local. En DPE 2.2 les
  deux champs sont autorisés pendant la phase transitoire

* **BLOQUANT** (DPE v2.3,audit v1.1) : ajout d'un nouveau champ OBLIGATOIRE rdim pour les installations d'ecs et de
  chauffage. Ce champ est utilisé pour déterminer la quantité d'installations représentées par l'installations décrite
  dans le cas de la méthode par échantillonage (en dpe 2.2 rdim est optionnel)

* **BLOQUANT** (DPE v2.3,audit v1.1) : ajout d'un nouveau champ OBLIGATOIRE presence_joint pour les baie_vitree et
  porte. ce champs est utilisé pour calculer les déperditions par infiltration (en DPE 2.2 il est optionnel pendant la
  phase de transition.)

* **BLOQUANT** (DPE v2.3,audit v1.1) : ajout d'un nouveau champ OBLIGATOIRE presence_protection_solaire_hors_fermeture
  pour les baie_vitree. ce champs est utilisé pour calculer le confort d'été en l'absence de fermeture (en DPE 2.2 il
  est optionnel pendant la phase de transition.)

* **BLOQUANT** (DPE v2.3,audit v1.1) : suppression de paroi_ancienne -> remplacé par enduit_isolant_paroi_ancienne pour
  les murs.  (en DPE 2.2 les deux sont optionnel pendant la phase de transition.)

* **BLOQUANT** (DPE v2.3,audit v1.1) : ajout de date_arrete_reseau_chaleur ce champ sera obligatoire lors de la saisie
  d'un réseau de chaleur répertorié. Il doit correspondre à une des dates d'arrêté présent dans le json de
  documentation : modele_donnee/arrete_reseau_chaleur.json. (voir le détail du contrôle de cohérence associé
  controle_coherence_reseau_chaleur)

* **BLOQUANT** (DPE v2.3,audit v1.1) : ajout de enum_calcul_echantillonnage_id ce champ sera obligatoire lors de la
  saisie d'un DPE immeuble.

* **BLOQUANT** (DPE v2.3) : ajout de surface_habitable_logement (OBLIGATOIRE) dans logement_visite

* ajout d'un fichier de documentation des arrêtés de réseau de chaleur et de leurs propriétés associés (dates de
  validité, date d'arrêté, lien legifrance)

### ajout du sous objet baie_vitree.baie_vitree_double_fenetre

ce sous objet est OBLIGATOIRE EN v2.3 lorsque double_fenetre = 1 (controle de cohérence). Elle permet de déclarer le
modèle complet de double fenêtre nécessaire et suffisant pour calculer ug,uw,sw de la double fenêtre
ce sous objet ne contient pas les éléments de calcul du Ujn,d'adjacence ou de dimensions ces éléments sont traités au
niveau de baie_vitree.

contient les champs suivants :

* donnee_entree.tv_ug_id
* donnee_entree.enum_type_vitrage_id
* donnee_entree.enum_inclinaison_vitrage_id
* donnee_entree.enum_type_gaz_lame_id
* donnee_entree.epaisseur_lame
* donnee_entree.vitrage_vir
* donnee_entree.enum_methode_saisie_perf_vitrage_id
* donnee_entree.ug_saisi
* donnee_entree.tv_uw_id
* donnee_entree.enum_type_materiaux_menuiserie_id
* donnee_entree.enum_type_baie_id
* donnee_entree.uw_saisi
* donnee_entree.tv_sw_id
* donnee_entree.sw_saisi
* donnee_entree.enum_type_pose_id
* donnee_intermediaire.uw
* donnee_intermediaire.sw
* donnee_intermediaire.ug

## modele donnee audit

* doc/fix : path(appinfo source) des consommations dans etape_travaux redocumentés proprement
* audit_a_remplacer : changement du pattern matching pour correspondre à la codification audit A[2-3][0-9]
  {2}[0-9A-B][0-9]{7}[A-Z]
* ajout d'un xsd audit_regv1.xsd : ancienne version pour gérer la transition audit v1.0 -> v1.1

Passage des informations sur la facture énergétique d'une logique de fourchette (min/max) à une valeur unique, car le
calcul est forfaitaire.

* BLOQUANT (audit v1.1) : Suppression des balises dans etape_travaux : facture_gain_min, facture_gain_max,
  facture_gain_cumule_min, facture_gain_cumule_max
* BLOQUANT (audit v1.1) : ajout des balises dans etape_travaux : facture_gain et facture_gain_cumule
* Alignement des contraintes minInclusive/minExclusive = 0 pour les balises de sorties dans "etape_travaux". L'ensemble
  des balises est désormais aligné avec le contenu de sortie.

* BLOQUANT : ajout de enum_version_id = 1.1 qui rend bloquant l'ensemble des changements pour cette version

* Modification du minInclusive/minExclusive = 0 pour les balises de "etape_travaux". Alignement des contraintes (
  permettant d'être à 0) des balises en lien avec la conso et les emissions (ges) dans "etape_travaux" à partir des
  balises dans "sortie" (du DPE)

* Levé de la contrainte strictement positif (minInclusive value="0") pour les balises de "etape_travaux" se terminant
  par "_gain", "_gain_relatif","_gain_cumule", "_gain_cumule_relatif". Ces balises peuvent maintenant contenir des
  valeurs négatives.

* **BLOQUANT** (v1.1) : renommage l'enum "enum_travaux_resume_collection_id" en "enum_travaux_resume_id"
* Modification de "enum_travaux_resume_id" : ajout de "10": "installation d’un système de production photovoltaïque"
  et "11": "autre"

* Mise de recommandation_auditeur_collection/recommandation_scenario en optionnel : minOccurs="0" nillable="true"

## enumérateurs DPE

* BLOQUANT : ajout de enum_version_id = 2.3 qui rend bloquant l'ensemble des changements pour cette version
* methode_application_log : ajout d'une colonne qui précise le modèle de DPE associé.(un contrôle de cohérence renvoi
  une erreur si enum_modele_dpe_id et enum_methode_application_log_id ne sont pas cohérents)
* methode_application_log : ajout d'une colonne qui précise le modèle de Audit associé. (par défaut toutes les méthodes
  d'applications sont autorisées pour l'audit)
* type_adjacence : précision des types d'adjacences concernées par le calcul de ue pour les planchers bas
* ajout d'un enum 10 : système de production d'électricité d'origine renouvelable pour
  enum_categorie_descriptif_simplifie_id

## modifications base ademe à prévoir

### DPE + Audit

* ajout de colonne de administratif.geolocalisation.numero_fiscal_local
* ajout de colonne caracteristique_generale.enum_calcul_echantillonnage_id
* ajout de colonne enduit_isolant_paroi_ancienne dans mur
* ajout de colonne baie_vitree.presence_joint, baie_vitree.presence_protection_solaire_hors_fermeture dans baie_vitree
* ajout de colonne d'une nouvelle table baie_vitree_double_fenetre + lien avec id baie_vitree

    * donnee_entree.tv_ug_id
    * donnee_entree.enum_type_vitrage_id
    * donnee_entree.enum_inclinaison_vitrage_id
    * donnee_entree.enum_type_gaz_lame_id
    * donnee_entree.epaisseur_lame
    * donnee_entree.vitrage_vir
    * donnee_entree.enum_methode_saisie_perf_vitrage_id
    * donnee_entree.ug_saisi
    * donnee_entree.tv_uw_id
    * donnee_entree.enum_type_materiaux_menuiserie_id
    * donnee_entree.enum_type_baie_id
    * donnee_entree.uw_saisi
    * donnee_entree.tv_sw_id
    * donnee_entree.sw_saisi
    * donnee_entree.enum_type_pose_id
    * donnee_intermediaire.uw
    * donnee_intermediaire.sw
    * donnee_intermediaire.ug

* ajout de generateur_chauffage.date_arrete_reseau_chaleur
* ajout de generateur_ecs.date_arrete_reseau_chaleur
* ajout de logement_visite.surface_habitable_logement

**reprise de données**

une fois la 2.2 close

* reprise de données pour faire la bascule invar_logement -> numero_fiscal_local
* reprise de données pour faire la bascule mur.paroi_ancienne -> mur.enduit_isolant_paroi_ancienne

### Audit

* ajout de travaux_resume.enum_travaux_resume_id
* ajout des balises dans etape_travaux : facture_gain et facture_gain_cumule
* ajout de enum_travaux_resume_id

**reprise de données**

une fois la 1.1 close

* reprise de données pour faire la bascule invar_logement -> numero_fiscal_local
* reprise de données pour faire la bascule mur.paroi_ancienne -> mur.enduit_isolant_paroi_ancienne
* reprise de données facture_gain = (facture_gain_min+facture_gain_max)/2
* reprise de données facture_gain_cumule = (facture_gain_cumule_min+facture_gain_cumule_max)/2
* reprise de données enum_travaux_resume_collection_id -> enum_travaux_resume_id

# 2023-03-28 Ajout nouvel arrêté réseau de chaleur (2022) - XSD DPE 8.0.2 - XSD Audit 2.0.2

A compter du 2023-04-22 il faudra dorénavant saisir les données sur les réseaux de chaleur issu de l'arrêté du 16 mars
2023

Cela veut dire concrètement que

* identifiant_reseau doit être dans la liste des identifiants réseau du nouvel arrêté (valeur_table.reseau_chaleur_2022)

* date_arrete_reseau_chaleur doit être saisi à 2023-03-16 jusqu'à la parution d'un prochain arrêté réseau de chaleur.

une date sera actée pour l'expiration du précédent arrêté réseau de chaleur. Une fois la date définie et dépassée les
DPE/audit seront refusés s'ils utilisent la mauvaise date.

## table de valeur

* ajout de la table de valeur reseau_chaleur_2022 qui contient les valeurs pour l'arrêté réseau de chaleur du 16 mars
  2023 https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047329716

## arrete_reseau_chaleur.json

ajout du nouvel arrêté réseau de chaleur

```
 {
    "nom_table_valeur": "reseau_chaleur_2022",
    "date_arrete_reseau_chaleur": "2023-03-16",
    "lien_legifrance": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047329716",
    "date_debut": "2023-03-16",
    "date_fin": "2200-01-01"
  }
```

## modele donnee

* correction de la documentation de presence_protection_solaire_hors_fermeture dans les XSD
* correction de la documentation de reference_interne_projet dans les XSD
* correction de la documentation des propriétés de logement_visite

# 2023-04-20 XSD DPE 8.0.1 - XSD Audit 3.0.0 Passage Audit V2.0 (DPE V2.3, Audit 2.0)

## modele donnee audit

* BLOQUANT - AJOUT de la section "dpe_immeuble" issue du modèle de données du DPE:
    * contient une "logement_visite_collection" avec des objets "logement_visite"
    * avec les balises suivantes : "description", "enum_position_etage_logement_id","enum_typologie_logement_id" et "
      surface_habitable_logement"
* BLOQUANT - AJOUT de la section "justificatif_audit_collection":
    * contient des objets "justificatif_audit" avec les balises suivantes : "description" et "
      enum_type_justificatif_audit_id"
* AJOUT des balises, dans la section "administratif", des balises suivantes :
    * "audit_a_mettre_a_jour" - de type string numéro d'audit
    * "motif_mise_a_jour" - de type string

## enumérateurs AUDIT

* AJOUT dans "enum_rubrique_description_id" des libellés suivants : "nombre de logements" et "description des logements"

* AJOUT de colonnes pour le contrôle des méthodes d'application de la 3CL en fonction du niveau de qualification des
  auditeurs
    * AJOUT de la colonne "enum_modele_audit_id" (valeurs : ‘1’) dans la table methode_application_dpe_log:
      enum_tables.xlsx
    * AJOUT de la colonne "type_habilitation_auditeur" (valeurs : ‘MI’,’LC’) dans la table methode_application_dpe_log:
      enum_tables.xlsx

* BLOQUANT - AJOUT dans "enum_version_audit_id" de la version "2.0"

# 2023-05-16 XSD DPE 8.0.3 - XSD Audit 3.1.0 : fix numero_fiscal_local et suppression audit_a_mettre_a_jour (DPE V2.3, Audit 2.0)

## modele commun

* (fix) : numero_fiscal_local était mal contraint à 10 caractères (comme invar_logement). Le numéro fiscal local est
  bien de **12** caractères. un correctif est apporté pour permettre la saisie du numero_fiscal_local à 12 caractères.

## modele audit

* (fix) : ajout de "justificatif_audit_collection" en optionnel au XSD audit_regv1.xsd afin de rendre les versions 0.1
  et 1.0 de l'audit compatibles avec la 2.0.

* (fix) BLOQUANT : Suppression des balises, dans la section "administratif", des balises suivantes :
    * "audit_a_mettre_a_jour"
    * "motif_mise_a_jour"

# 2023-05-16 XSD DPE 8.0.4 - XSD Audit 3.1.1 : ajout de la donnée administrative/geolocalisation id_batiment_rnb (DPE V2.3, Audit 2.0)

* (feat) : ajout de id_batiment_rnb en tant que propriété optionnelle dans geolocalisation. c'est l'identifiant batiment
  du le Référentiel National des Bâtiments (RNB) à venir sur les bâtiments en
  France (https://beta.gouv.fr/startups/bat-id.html)

# 2023-08-29 suppression de cellules groupées dans valeur_tables.xlsx

* (fix) : des cellules groupées étaient présentes dans la table : generateur_combustion (elles sont maintenant répétées
  à chaque ligne)

# 2023-10-12 XSD DPE 8.0.4 - XSD Audit 3.2.0 : passage du numero_dpe en optionnel (DPE V2.3, Audit 2.0)

## modele audit

* Passage de la balise "numero_dpe" en optionnel
* AJOUT dans "enum_modele_audit_id" l'id "2": "audit volontaire logement". Permettant de faire la distinction concernant
  le contexte de l'audit (règlementaire/volontaire)

# 2023-10-25 XSD DPE 8.0.4 - XSD Audit 4.0.0 : passage à l'audit 2.1 (DPE V2.3, Audit 2.1)

## modele audit

* BLOQUANT (en 2.1):
    - AJOUT dans "enum_version_audit_id" de la version "2.1" : "version de l'audit pour la fusion de l'audit
      réglementaire et volontaire"
    - AJOUT de enum_derogation_ventilation_id dans administratif pour déclarer une dérogation sur l'état de la
      ventilation
    - AJOUT de enum_etat_ventilation_id dans "ventilation_collection/ventilation/donnee_entree", pour saisir l'état de
      la ventilation
    - AJOUT du "ubat_base", dans "qualite_isolation", pour comparer au ubat (condition BBC réno)

* AJOUT de derogation_ventilation_detail dans administratif pour préciser une dérogation sur l'état de la ventilation

## traducteur XML >> XLSX audit

* fix : correctif sur le traducteur pour afficher les données des champs : "architecte" et "bet-entreprise"

# 2023-11-29 XSD DPE 8.0.4 - XSD Audit 4.0.0 : prolongement de la période de transition audit 2.0 >> 2.1 au 01/02/2024

Changement de la date de fin de validité de l'audit 2.0 : nouvelle date 01/02/2024

# 2024-02-23 XSD DPE 8.1.0 - XSD Audit 4.1.0 : ajout d'un formulaire de consentement propriétaire (non obligatoire dans un premier temps)

## modèle dpe et audit

* AJOUT(OPTIONNEL) d'un booleen administratif.consentement_proprietaire qui déclare si le propriétaire a donné son
  consentement pour XXX
* AJOUT(OPTIONNEL) d'une structure de formulaire de consentement pour les propriétaires (
  administratif.information_consentement_proprietaire) avec les champs suivants :
    * nom_proprietaire (obligatoire) : le nom du propriétaire (personne physique ou personne morale)

    * personne_morale (obligatoire): si 1 -> c'est une personne morale

    * siren_proprietaire (obligatoire si personne morale) 

    * mail (optionnelle et/ou téléphone) : l'email proprietaire

    * telephone (optionnelle et/ou mail) : telephone proprietaire

    * label_adresse(obligatoire) : libéllé postal de l'adresse

    * label_adresse_avec_complement (obligatoire) : libéllé de l'adresse incluant les compléments d'adresse (étage, porte,
    numéro de bâtiment etc.)


# 2024-03-04 XSD DPE 8.0.4 - XSD Audit 4.2.0 : passage en audit 2.2 - ajout caracteristiques_travaux et fourchettes couts

## modele audit

Mise en place de la Fourchette de coûts dans etape_travaux:
* AJOUT (OPTIONNEL) : "cout_min", "cout_max", "cout_cumule_min" et "cout_cumule_max"
* MODIFICATION : les balises "cout" et "cout_cumule" sont maintenant optionnelles 
Mise en place de la Fourchette de coûts dans travaux_collection/travaux et dans travaux_induits_collection/travaux_induits :
* AJOUT (OPTIONNEL) : "cout_min", "cout_max"
* MODIFICATION : la balise "cout" sont maintenant optionnelle 

Mise en place de la structure de caractéristiques des Travaux :
L'élément caracteristiques_travaux a pour objectif de collecter des propriétés spécifiques à certains travaux (pour les travaux : VMC, Chaudières, Poêle, radiateur, plancher chauffant, panneaux solaire et autre, aucune caractéristique n'est attendue).
Les travaux sont tels que définis dans enum_type_travaux_id.
* AJOUT (OPTIONNEL) dans travaux_collection/travaux de l'élément "caracteristiques_travaux"
* AJOUT dans "caracteristiques_travaux", d'une structure de type "choice" (un seul des éléments peut apparaitre), avec les éléments suivants (doit être cohérent avec enum_type_travaux_id) :
  * "isolation_mur_ite", "isolation_mur_iti", "isolation_sous_rampants", "isolation_combles_non_amenages", "isolation_toiture_terrasse", "isolation_planchers_bas". Ils contiennent tous les balises "resistance_isolant" et "surface_isolant".
  * "menuiseries_double_vitrage", "menuiseries_triple_vitrage". Ils contiennent tous les balises "uw", "sw" et "nombre_fenetres".
  * "pac_geothermique", "pac_eau_eau", "pac_air_eau", "pac_air_air". Ils contiennent tous la balise "scop".
  * "chauffe_eau_thermodynamique", il contient la balise "cop".
  * "ballon_ecs_effet_joule", il contient la balise "volume_stockage".

* AJOUT (OPTIONNEL) dans descriptif_equipements_collection/descriptif_equipements du champ de description string "description_etat_systeme" pour venir décrire l'état de fonctionnement du système.

* AJOUT (BLOQUANT) dans "enum_version_audit_id" de la version "2.2" : "version de l'audit pour l'intégration des caractéristiques travaux et des fourchettes de couts"

# 2024-05-20 XSD DPE 8.2.0 - XSD Audit 4.3.0 : passage en DPE 2.4 - petites surfaces

CHANGEMENTS MAJEURS : AU 1ER JUILLET 00:00 bascule réglementaire

* le calcul des biens dits de "petite surface" s'applique
* recueillir le consentement du propriétaire à des fins de contrôle est obligatoire
* AUDIT : la saisie de la balise enum_version_dpe_id = 2.4
* DPE : la version 2.4 entre en vigueur 

## modifications communes DPE/Audit

* OPTIONNEL : ajout de ban_id_ban_adresse dans les structures adresses. Ceci est l'identifiant BAN stable pérenne pour les adresses. 

## doc 

* ajout de RDIM dans le fichier excel modele_donnees.xlsx

## modele DPE :

* AJOUT (BLOQUANT) dans "enum_version_id" de la version "2.4" (obligatoire à partir du 1er juillet 2024). la version 2.3 est la seule accepté avant cette date. 

* AJOUT (OPTIONNEL) DPE tertiaire : ajout de enum_sous_modele_dpe_ter_id qui détaille le sous modèle utilisé et qui conditionne les seuils d'étiquettes à utiliser 

| id | lib                                            |
|----|------------------------------------------------|
| 1  | Bureaux, services administratifs, enseignement |
| 2  | Bâtiments à occupation continue                |
| 3  | Autres                                         |
| 4  | Centre commercial                              |

cette balise sera rendue obligatoire dans une future version du DPE. 

## modele audit

* AJOUT (BLOQUANT à partir du 1er juillet) de la balise "enum_version_dpe_id" la section administratif. 
  * version du DPE avec lequel l'audit a été réalisé. Ceci permet de savoir de quelle version réglementaire du DPE dépend l'audit


# 2024-06-14 modification des compétences diagnostiqueur pour les dpe appartement neuf

* methode_application_dpe_log la compétence diagnostiqueur pour les dpe appartement neuf passe de Performance énergétique (DPE individuel) à  Performance énergétique (DPE par immeuble, bâtiments à  usage autre que d'habitation) pour les appartements à partir de données immeubles 


# 2024-07-11 ajout de l'arrêté réseau chaleur 2023

* le nouvel arrete reseau de chaleur du 7 juillet 2024 entre en vigueur le 9 aout 2024

* la table correspondante est disponible dans valeur_tables.xlsx -> reseau_chaleur_2023

* l'arrêté précédent ne sera plus accepté à compter du 15 septembre 2024


# 2024-09-30 XSD DPE 8.2.1 - XSD Audit 4.4.0 : passage en Audit 2.3 - nom de l'organisme de qualification

* AUDIT :
  * Ajout BLOQUANT de la balise "nom_organisme_qualification" pour les BET et les entreprises dans la section "administratif"
  * Ajout d'un controle pour empêcher la saisie d'une balise vide pour les éléments : numero_qualification, nom_organisme_qualification, numero_certification_auditeur, organisme_certificateur, numero_matricule_national. Toute balise déclarée doit être renseignée.


# 2025-03-17 XSD DPE 9.0.0 - XSD Audit 5.0.0 : passage en DPE 2.5 et Audit 2.4

## modèle commun

suppression de la mention "propriétaire" dans le formulaire de consentement. Evolution du modèle 

* BLOQUANT ajout de enum_consentement_formulaire_id en lieu et place de consentement_proprietaire (obligatoire à partir de DPE 2.5//audit 2.4)
* ajout de la structure information_formulaire_consentement en lieu et place de la structure information_consentement_proprietaire
* BLOQUANT ajout de enum_commanditaire_id pour identifier le commanditaire du DPE, si le commanditaire est un propriétaire il devra fournir le numéro fiscal de logement du bien dans le cas d'un DPE maison ou appartement. (obligatoire à partir de DPE 2.5//audit 2.4)
* BLOQUANT : ajout pour les paroi opaques (mur, plancher haut, plancher bas) du paramètre "paroi_lourde" pour identifier si une paroi est considérée lourde ou non pour le calcul de l'inertie. 

NB : les champs supprimés restent disponible sur le DPE version 2.4 et Audit version 2.3 et ne seront effectivement supprimés que sur les versions DPE 2.5 et Audit 2.4

## audit

 * Documentation : 
    * Etape travaux : 
      * Correction de l'unité pour les gains relatifs (de "%" à "sans unité")
      * Précision pour les gains : "réduction = gain négatif" (concerne les balises avec en suffixe "gain" ou "gain_cumule")
  * BLOQUANT : 
    * AJOUT dans "enum_version_audit_id" de la version "2.4", compatible avec la version DPE 2.5
  * Mineur : 
    * AJOUT dans "enum_rubrique_description_id" des ID 7 et 8 correspondant à la mise à jour de la trame : "intégration du bien dans son environnement", "aptitude au confort d'été"
  
## enum et tables

* enum_tables.xlsx/materiaux_structure_mur :  documentation des parois considérées comme lourde pour le contrôle de cohérence (non exhaustif), documentation des parois qui ne sont pas exclues d'un calcul de pont thermique baie/mur
* enum_tables.xlsx/type_emission_distribution :  ajout de la liste des générateurs compatibles avec les types d'emission distributions associées
* valeur_tables.xlsx/rendement_regulation :  ajout de la liste des générateurs compatibles avec les types de régulations utilisées
* valeur_tables.xlsx/rendement_emission :  ajout de la liste des générateurs compatibles avec les types d'émissions utilisées


# 2025-04-02-XSD DPE 9.1.0 - XSD Audit 5.1.0

* BLOQUANT : pour les numéros fiscaux de locaux ne sont acceptés que les numéros à 12 caractères [0-9][0-9A-B][0-9]{10}
* fix: enum_tables.materiaux_structure_mur : oubli de pont_thermique_baie = 1 pour les Murs en briques creuses
* fix: valeur_tables.rendement_emission : correction des planchers et plafonds electriques en planchers/plafonds chauffants pour l'emission (au lieu d'autre emetteur à effet joule)


# fixs

* enum_tables.type_generateur_ch : fix d'un problème qui faisait que les générateurs à air chaud n'étaient pas compatibles avec le type d'énergie "gaz naturel" ce sera desormais possible.
* enum_tables.type_generateur_ch : les types d'énergies possibles pour les inserts et cuisinières sont étendus au gpl, butane, propane
* valeur_tables.rendement_emission : ajout des convecteurs bi jonction dans les emetteurs à effet joule compatibles avec "autres emetteurs à effet joule"
* valeur_tables.rendement_regulation : suppression de l'obligation de déclarer sans régulation pièce par pièce un plancher chauffant sans régulation car la configuration divisé sans régulation pièce par pièce n'est pas prévu dans la méthode
* enum_tables.type_generateur_ch : pour les chaudières multi bâtiments la déclaration en type d'énergie RCU est temporairement possible en attente d'une gestion plus explicite des réseaux de chaleur locaux.



# 2025-04-22 : fixs

* enum_tables.type_generateur_ecs : pour les chaudières multi bâtiments la déclaration en type d'énergie RCU est temporairement possible en attente d'une gestion plus explicite des réseaux de chaleur locaux.


# 2025-04-30 : nouvel arrêté réseau de chaleur

* fix : les chaudières multi bâtiments charbon sont de nouveau compatibles avec les emétteurs à eau.
* fix : la documentation du nombre de caractères possible pour un identifiant fiscal de local est de 12 ce qui correspond bien à l'expression régulière en place
* ajout : table_valeur.reseau_chaleur_2024 : contient les valeurs de contenu CO2 et identifiants des réseaux de chaleurs de l'arrêté du 11 avril 2025
   `{
    "nom_table_valeur": "reseau_chaleur_2024",
    "date_arrete_reseau_chaleur": "2025-04-11",
    "lien_legifrance": "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051520810",
    "date_debut": "2025-04-11",
    "date_application_arrete": "2025-05-26",
    "date_fin": "2200-01-01"
  }`
la valeur à renseigner est date_arrete_reseau_chaleur = 2025-04-11. La valeur correspondant à l'arrêté de 2023 sera refusée au 1er juillet 2025

# 2025-05-20-XSD DPE 9.1.1 - XSD Audit 5.2.0 : intégration de l'Audit Copro

## audit
* Ajout d’un id 3 dans enum_modele_audit_id correspondant à l’audit copro
* Ajout d’un id 3 et 4 respectivement dans enum_derogation_technique_id et enum_derogation_economique_id correspondant à « non applicable – audit copro» car les dérogations techniques et économiques ne sont pas pertinentes pour l’audit copro.
* Ajout dans l’enum_scenario_id des id 6 et 7 correspondants à « scénario complémentaire 4 » et « scénario audit copro ‘’principal’’ »
* MAJ du libellé associé à l'id 2.4 de l'enum_version_audit_id pour mentionner l'intégration de l'audit copro

## traducteur XML >> XLSX audit

* fix : correctif sur le traducteur pour afficher correctement les systèmes associés à chaque étape de travaux (avant, tous les systèmes de l'audit étaient affichés et dupliqués sur toutes les étapes)

## clarification des XSD Audit et du fichier rétrocompatible

* Les fichiers XSD de l’Audit sont renommés explicitement selon leur version (ex. : `audit_v2.4.xsd`, `audit_v2.3.xsd`), suivant la même logique que les fichiers DPE (`DPE_complet.xsd`, `DPE_v2.5.xsd`, etc.).
* Le fichier `audit.xsd` assure la **rétrocompatibilité entre les versions Audit 2.3 et 2.4** :
  * Il contient l’ensemble des balises compatibles avec les deux versions.
  * Il est **plus permissif** que le fichier de la version 2.4 stricte. Par exemple, les balises comme `paroi_lourde` y restent optionnelles.


# 2025-05-26-XSD DPE 9.1.1 - XSD Audit 5.2.1 : intégration de l'Audit Copro retro-compatible en audit 2.3

## audit
* MAJ du schéma de données de l'audit 2.3 (audit_v2.3.xsd) afin de permettre le dépot d'un Audit Copro en Audit 2.3

# 2025-06-05-XSD DPE 9.1.1 - XSD Audit 5.2.2 : fix autorisation de déclarer seulement 2 logements

## audit
* Abaissement de la contrainte sur le nombre de logements minimum à déclarer dans logement_collection (de 4 à 2), dans les schémas de données de l'audit 2.3 et 2.4, afin de permettre le dépot d'un Audit Copro avec une seule étape de travaux.

# 2025-10-10-XSD DPE 9.2.0 - XSD Audit 5.3.0 : passage DPE 2.6 et Audit 2.5

## Bloquant
* **Ajout de la version 2.6** dans les énumérations `enum_version_dpe_id` et `enum_version_id` (en lien avec le DPE).
* **Ajout de la version 2.5** dans l’énumération `enum_version_audit_id` (en lien avec l'Audit).

## DPE et Audit
* Ajout d’une **balise optionnelle d’horodatage** dans la section `<administratif>` :
  * Nom : `horodatage_historisation`
  * Objectif : permettre l’**historisation** et la **traçabilité** des générations de fichiers XML.
  * Format attendu : ISO 8601 avec fuseau horaire de Paris (`YYYY-MM-DDThh:mm:ss+01:00` ou `+02:00`)
  * Exemple : 2025-10-01T14:35:45+02:00

# 2025-10-17-XSD DPE 9.2.1 - XSD Audit 5.3.1 : fix horodatage_historisation

* (fix) MAJ de la restriction sur l' `horodatage_historisation`, en utilisant datetime


# 2026-01-23- Ajout de priorite_generateur_principal_defaut et documentations

* Ajout dans type_generateur_ch de enum_tables.xlsx la colonne : `priorite_generateur_principal_defaut` :
  * Permet de définir quel générateur est considéré par défaut comme principal dans l'observatoire DPE/Audit lorsque plusieurs générateurs sont présents et ont des niveaux de consommations similaires.
  * Se base sur des données statistiques pour définir cette priorité issues des la base ADEME, via la BDNB

* Ajout des onglets `pecs_combustion` et `pn_generateur_combustion` dans valeur_tables.xlsx à des fins de documentation de la méthode