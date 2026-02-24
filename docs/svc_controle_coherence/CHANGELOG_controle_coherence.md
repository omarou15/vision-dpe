# 2021 12 05 1.1.0

* ajout d'un système de logging

* ajout d'une route health

* ajout d'une route version

* ajout de cas test valide pour dépot sur logement existant :
  
    * cas_test_immeuble_1_valid.xml
    
* requalification des cas tests valids pour le neuf et le tertiaire

# 2021 05 20 1.2.0

* ajout d'un warning spécifique pour gérer le cas particulier des coef_transparence_ets pour lesquels un vitrage majoritaire ne peut être déterminé.

* ajout des controles de cohérences des Umur,Upb,Uph,Uph0,Upb0

# 2021 05 27 1.3

* ajout documentation warning baie/mur -> cas des débords de façade. 

* passage de certains contrôles bloquants en warning logiciels sur les énergies pour prendre en compte le cas des énergies autres pour des usages != chauffage et ecs.

# 2021 07 02 1.4

* corrections de bugs sur le controle de cohérence administratif.

* ajout du controle de cohérence sur le tertiaire en v2

# 2021 07 16 1.5.0

* affichage des versions xsd et application

# 2021 07 23 1.5.3

* amélioration du catch d'erreur non prévues. 

# 2021 09 10 1.6.0

## améliorations application. 

* ajout de la version du moteur et du XSD dans les réponses.

* ajout d'une route controle_coherence_debug pour permettre de debugger la partie contrôle cohérence même avec des problèmes de validation xml en amont

## modification de controle de cohérences existants 

* gestion des parois non déperditives dans le contrôle de cohérence.  

* controle_coherence_existence_composants : ajout de warnings si installation chauffage et ecs sont vides. 

## ajout de controle de coherence etiquette

* V2 erreur bloquant si l'étiquette energie bilan ne correspond pas aux règles des doubles seuils de l'arrêté. 

* V2 erreur bloquant si l'étiquette GES ne correspond pas aux seuils sur les emissions GES.  

# 2021 10 08 1.7.0 

## ajout de contrôle de cohérence vérifiant les dates de validité des versions du DPE.

* un contrôle de cohérence est ajouté pour vérifier la version des DPE et les rejeter s'ils correspondent à une version 
qui n'est plus en vigueur. 

# 2021 10 14 1.8.0

## ajout d'un contrôle de cohérence qui refuse les dépôt de DPE avec des dates d'etablissement supérieure à la date du jour

* pour palier à des dérives constatées, un contrôle de cohérence est mis en place pour refuser le dépôt de DPE avec des dates d'établissement > date du jour. 

# 2021 10 18 1.9.0

* correction d'un bug qui limitait le controle de cohérence sur les tables de valeurs.

* ajout d'une fonctionalité pour desactiver les contrôles de date pour debug (variable environement)

# 2021 11 16 1.10.0 Contrôles bloquants passés en warning uniquement pour la version 2

## ajout d'une restriction de date butoire à partir desquels des DPE "en retard" sont refusés

* pour chaque version une date butoire est mise en place à partir de laquelle plus aucun DPE de cette version n'est acceptée y compris
si la date d'établissement du DPE précède cette date butoir (à partir de cette date plus de publication "en retard" de DPE établis avec des anciennes versions ne sont autorisés)

## ajout controle de cohérence générateur cascade

* vérifie que la déclaration de valeur 0 sur rendement_generation,conso_ch se fait bien uniquement pour les générateurs combustion cascade ou un appoint de base+ appoint collectif. 

## contrôles de cohérences bloquants passés en warning

de manière temporaire les contrôles de cohérences bloquants sont passés en warning dans la version 2 du modèle de données. 
Cette adaptation est réalisée pour permettre aux éditeurs de progressivement corriger ces problèmes sans pour autant bloquer le processus de dépôt de DPE
pendant une durée déterminée. 
Les versions ultérieures du modèle rétabliront ces contrôles de cohérences comme bloquants. 
Certains contrôles qui étaient opérés en v1 (contrôle des dates, contrôles de la structure du xml ) sont conservés en erreurs. Seuls les contrôles de cohérence métier sont 
basculés en avertissement.

ainsi les messages des contrôles de cohérences basculés en warnings sont transférés comme suit

erreur_saisie -> warning_saisie

erreur_logiciel -> warning_logiciel

le type de message est basculé de "bloquant" à "bloquant_avertissement"

un texte en préambule précise pour chaque message que ce problème sera basculé en erreur dans la prochaine version

Exemple :

```

CET AVERTISSEMENT SERA CONSIDERE COMME UNE ERREUR DANS LA PROCHAINE VERSION:
 
mauvaise correspondance entre la valeur tv_uw_id:343
avec les données connexes suivantes :
{'enum_type_baie_id': [4], 'type_baie': 'Fenêtres battantes', 'enum_type_materiaux_menuiserie_id': [5], 'type_materiaux_menuiserie': 'PVC', 'ug': 2.4, 'uw': 2.4}
et l'énumérateur enum_type_materiaux_menuiserie_id:{3: 'Bois'}.
La valeur attendue de l'énumérateur enum_type_materiaux_menuiserie_id doit être une des suivantes:
{5: 'PVC'}

```


# 2021 11 23 1.10.1 controle coherence étiquette bloquant

* passage de contrôle de cohérence etiquette en bloquant

* ajout de la listes des descriptions des objets concernés dans le message en cas de warning ou d'erreur. 


# 2021 12 03 1.10.2 contrôle cohérence d'énergie en warning bloquant.  

* passage du contrôle de cohérence energie en warning bloquant 

* ajout d'une vérification que l'electricité est déclarée dans sortie_par_energie

* fix sur le contrôle de cohérence sur enum_periode_construction_id et les tv_umur_id,tv_uph_id,tv_upb_id dans le cas d'un enum_periode_isolation_id déclaré.
la période d'isolation écrase bien la période de construction lorsque celle ci est déclarée. 

# 2021 12 10 1.10.3 fix d'un bug sur controle de cohérence tv_value_simple 

* fix bug quand u0 n'est pas déclaré -> remplacement par un message explicite controle de cohérence

# 2021 12 14 1.11.0 ajout d'un contrôle de cohérence sur les consommation 0 ECS et chauffage

* pour gérer le cas particulier où fecs et fch peuvent être égaux à 1. Un contrôle de cohérence vérifie que les consommations = 0 sont utilisés uniquement dans ce cas

* ajout du contrôle de cohérence système (oubli d'activation) : contrôle de cohérence qui ne génère que des warnings

* ajout du contrôle de cohérence pont thermique (oubli d'activation) : contrôle de cohérence qui ne génère que des warnings

* ajout d'une possibilité de passer des DPE en version antérieure dans le cas d'une réédition. 

# 2022 01 06 1.12.0 corrections diverses
 
* desactivation d'une partie du contrôle de cohérence pont thermique/menuiserie en attendant le rajout de enum_type_pose_id pour les portes. 

* correction du contrôle de cohérence energie pour ne pas bloquer un dépôt lorsqu'un générateur consomme 0 et que l'energie n'est pas déclarée en sortie. 

* ajout d'un bypass pour ne pas contrôler la correspondance tv vs valeur dans le cas d'une double fenêtre pour sw

* fix sur le contrôle de cohérence sur la table SEER qui n'était pas proprement déclenchée.  

* bugfix : le nom du composant dans le cas d'une vérification de cohérence d'isolation pouvait ne pas être le bon ceci a été corrigé

# 2022 01 21 1.13.0
 
* fix controle de cohérence pont thermique avec ajout des portes dans le contrôles des ponts thermiques menuiseries/mur. 

* AJOUT : contrôle de cohérence qui vérifie que les cle_repartition_ch, cle_repartition_ecs,cle_repartition_clim et cle_repartition_ventilation sont bien déclarées dans le cas d'un DPE appartement à partir de l'immeuble

# 2022 03 02 1.14.0

* controle_coherence tv_value correction sur le contrôle sur le seer

# 2022 04 15 1.15.0

* controle_coherence_correspondance_saisi_value : désactivation du contrôle de cohérence lorsque l'on est dans le cas d'une double fenêtre. 

* désactivation du warning période isolation pour les composants qui ne sont pas murs,plancher bas ou plancher haut

* ajout d'une gestion des paroi dont l'isolation est déjà prise en compte dans la paroi nue pour ne pas déclencher le warning du controle_coherence_enveloppe
sur la cohérence d'isolation entre la déclaration d'isolation et le calcul du b. 

# 2021 04 21 Audit 1.0.0

* initialisation d'un contrôle cohérence audit qui est une simple validation xml

# 2022 06 02 DPE-1.16.0 Audit 0.1.0

* ajout d'un contrôle de cohérence qui vérfie que dpe_immeuble_associe est bien déclaré pour un dpe appartement à partir de l'immeuble

* ajout d'un contrôle de cohérence d'unicité de reference

# 2022-09-28 DPE-1.17.0 Audit-1.0.0

## controle coherence dpe

* desactivation du warning appel BAN suggestif dans le controle de cohérence administratif

## controle coherence audit

* Audit reg : Modification du contrôle de cohérence controle_coherence_unicite_reference(), pour être compatible avec les logements de l'audit règlementaire (etape_travaux)

* rapport d'erreur : ajout des références des objets concernés en plus des descriptions dans les messages

* rapport d'erreur audit : ajout d'etape travaux et scénario travaux dans les messages de warning pour retrouver plus facilement les éléments qui posent problème

## refactoring classe mutualisée

* feat(controle_coherence) : fusion des engine controle coherence audit et DPE et partage de la plupart des méthodes dans CoreEngine 

# 2023-02-14 DPE-1.18.0 Audit-1.1.0

## controle coherence commun DPE/AUDIT 

* ajout d'un contrôle de cohérence entre la méthode d'application (enum_methode_application_dpe_log_id) et le modèle de DPE (enum_modele_dpe_id)

* ajout de la condition besoin_ch = 0 pour autoriser une saisie conso_ch = 0 au niveau des générateurs

* ajout d'un contrôle de cohérence si double_fenetre = 1 alors vérification que la sous structure de double fenetre est déclarée

* ajout d'un contrôle de cohérence qui vérifie que pveilleuse est déclarée pour les systèmes à combustion avec veilleuse lorsque ceux cis sont saisis par défaut. 

* ajout d'un contrôle de cohérence réseau de chaleur :

  * avertissement si un identifiant réseau n'existe pas dans la table de l'arrêté. Si un identifiant réseau est saisi mais qu'il n'est pas documenté dans l'arrêté cela envoi un avertissement

  * contrôle bloquant : si la date d'arrêté de réseau de chaleur est non déclarée ou expirée (remplacée par un arrêté plus récent), le DPE est refusé pour dépôt.

* ajout d'un controle de cohérence sur le calcul de ue:

  * vérifie que calcul_ue = 1 pour les 3 adjacences pour lesquelles le calcul de UE doit être effectué et que calcul_ue = 0 pour les autres

  * vérifie que surface_ue,ue,perimetre_ue sont bien déclarés pour les 3 adjacences pour lesquelles le calcul de UE doit être effectué

  * vérifie que surface_ue,ue,perimetre_ue ne sont pas déclarés pour les autres adjacences

  * vérifie que ue = upb_final pour les 3 adjacences pour lesquelles le calcul de UE doit être effectué 

  * vérifie que upb = upb_final pour les autres adjacences 

* ajout d'un contrôle de cohérence qui vérifie qu'au moins un logement_visite est déclaré dans dpe_immeuble.logement_visite_collection

# 2023-03-21 DPE-1.18.0 Audit-1.1.1

* fix: correction d'un bug du contrôle de cohérence pour l'audit 1.0 qui entrainait des contrôles bloquants indésirés 

# 2023-03-27 DPE-1.18.2 Audit-1.1.2

* le contrôle de cohérence sur l'arrêté de réseau de chaleur prend en compte le nouvel arrêté du 16 mars 2023

# 2023-04-26 DPE-1.18.2 Audit-1.2.0 V2.0 Audit règlementaire

## contrôle coherence commun

* (fix) : contrôle de cohérence pveilleuse ne se déclenchait pas proprement, il est réintroduit sous forme d'avertissement non bloquant pour ne pas bloquer de manière indésirable le dépôt de DPE ou d'audit

## contrôles coherence DPE

* (fix) : contrôle de cohérence rsee. suppression du contrôle sur les balises RSENV (la partie RSENV n'est pas obligatoire pour un RSEE en phase DP)

## Contrôles coherences audit

**Contrôles Bloquants en v2.0 :**
	
1. Technique : 

* 	Contrôler l'unicité id d'étape par scénario - controle_coherence_unicite_etape_par_scenario
*   Contrôler que tous les logements, SAUF logement de type « état initial », possèdent « etape_travaux » - controle_coherence_presence_etape_travaux
* 	Contrôler que les références dans « travaux/reference_collection » existent bien dans le « logement » - controle_coherence_reference_travaux_existent
* 	Contrôler que les consommations 5 usages, les emissions de CO2 5 usages et les classes dans « etape_travaux » correspondent bien à celles dans « sortie » issues du calcul 3CL (tolérance à l’unité). - controle_coherence_etape_travaux_sortie_dpe
* 	Contrôler que pour le logement « état initial » que tous les « enum_etat_composant_id » soit à "1"="initial" - controle_coherence_etat_composant
* 	Contrôler que pour toutes les étapes de travaux (qui ne sont pas « état initial »), au moins 1 objet ait un « enum_etat_composant_id » à "2"="neuf ou rénové" - controle_coherence_etat_composant
* 	Contrôler que pour toutes les étapes de travaux, le « cout » de l’étape corresponde à la somme des coûts dans « travaux_collection » et « travaux_induits_collection » (tolérance à 100€ près) - controle_coherence_etape_travaux_cout



2. Métiers : 
*  Existence d'un seul logement de type « état initial » - controle_coherence_presence_etat_initial
*  Le « scénario en une étape "principal" » existe ET ne contient qu’une seule étape de travaux correspondant à l’ « étape finale » - controle_coherence_scenario_mono_etape
*  Le « scénario multi étapes "principal" » existe ET contient au moins 2 étapes de travaux dont une « étape première » et une « étape finale »  - controle_coherence_scenario_multi_etapes
*  Pour ces deux scénarios, l’ « étape finale » doit atteindre l’étiquette B. Si dérogation, alors il faut un saut de deux classes entre l’ « état initial » (avant travaux) et l’étape finale. - controle_coherence_etape_finale
*  Pour le « scénario multi étapes "principal" », il faut que l’ « étape première » permette de réaliser un gain d'au moins une classe et au minimum d'atteindre la classe E - controle_coherence_etape_premiere
*  Vérifier pour chaque logement, que la méthode DPE (dans :"enum_methode_application_dpe_log_id") soit valide pour l'audit règlementaire. - controle_coherence_modele_methode_application
*  Vérifier que tous les logements ont une méthode DPE cohérents (dans :"enum_methode_application_dpe_log_id"), c'est à dire un même type de bâtiment (maison, appartement, immeuble) - controle_coherence_type_batiment_constant
*  Vérifier que lors que la méthode DPE immeuble est utilisée dans l'état initial (dans :"enum_methode_application_dpe_log_id") que les logements visités doivent être déclarés dans le xml - controle_coherence_logement_visite (Reprise du controle de cohérence DPE)
*  Vérifier l'audit ne contienne pas à la fois un numéro audit à remplacer et un numéro audit à mettre à jour - controle_coherence_choix_maj_ou_remplacer

**Contrôles non bloquants - Warnings :** 

* Pour les bâtiments de classe de performance F ou G avant travaux, le « scénario multi étapes "principal" » comporte une « étape intermédiaire » permettant d'atteindre au moins la classe C - controle_coherence_scenario_multi_etapes_passoire
* Lorsqu'il y a plus de 3 étapes dans un scénario de travaux - controle_coherence_seuil_3_etapes
* Lorsque l'auditeur n'a renseigné aucun encadré destiné aux observations (recommandation) - controle_coherence_presence_recommandation
* Lorsque la date d'établissement de l'audit est antérieure, ou même jour, par rapport à la date de visite - controle_coherence_date_visite_date_etablissement
* Pour les dérogations, vérifier que les six postes de travaux de rénovation énergétique ont été traités pour les deux scénarios : isolation des murs, l'isolation des planchers bas, l'isolation de la toiture, le remplacement des menuiseries extérieures, la ventilation, la production de chauffage et d'eau chaude sanitaire (via « enum_lot_travaux_audit_id ») - controle_coherence_six_postes_travaux
* Lorsque des travaux, dans "travaux_collection", ont des coûts nuls - controle_coherence_cout_nul
* Contrôler l'ordre de grandeur (facteur 10) des consommations dans etape_travaux par rapport aux sorties DPE - objectif, signaler un oubli de division par la surface habitable - controle_coherence_conso_etape_travaux
* Pour les scénarios complémentaires, l’ « étape finale » doit atteindre l’étiquette B. Si dérogation, alors il faut un saut de deux classes entre l’ « état initial » (avant travaux) et l’étape finale. - controle_coherence_etape_finale


# 2023-05-16 DPE-1.18.2 Audit-1.3.0 V2.0 Audit règlementaire

## Contrôles coherences audit

* (fix) Suppression de "controle_coherence_choix_maj_ou_remplacer()"


# 2023-06-09 DPE-1.18.2 Audit-1.4.0 V2.0 Audit règlementaire

## Contrôles coherences audit

* Modification du comportement du controle de cohérence audit: 
  * Les controles de cohérence spécifiques à l'audit ne sont lancés que si les controles de cohrences de l'application de la méthode de calcul 3CL (methode DPE) n'ont pas remonté d'erreurs bloquantes.

* (fix) correction des controles pour éviter un crash du moteur dans le cas d'un XML sans aucun etape_travaux:
  * controle_coherence_etape_premiere
  * controle_coherence_six_postes_travaux
  * controle_coherence_etape_finale
  * controle_coherence_scenario_mono_etape
  * controle_coherence_scenario_multi_etapes
  * controle_coherence_logement_visite
  * controle_coherence_presence_etat_initial
  * controle_coherence_presence_etape_travaux
  * controle_coherence_scenario_multi_etapes_passoire
  * controle_coherence_type_batiment_constant


# 2023-06-09 DPE-1.18.2 Audit-1.4.1 V2.0 Audit règlementaire

## Contrôles coherences audit

* (fix) correction du controle de cohérence audit : controle_coherence_presence_recommandation() pour gérer le cas des recommandations à None.


# 2023-06-12 DPE-1.18.3 Audit-1.4.2 V2.0 Audit règlementaire

## Contrôles coherences DPE et Audit

* (fix) correction d'un bug qui écrasait les avertissement logiciels lorsque des avertissements qui vont devenir bloquant dans une future version sont présents

## Contrôles coherences audit

* (fix) controle_coherence_etape_premiere() et controle_coherence_etape_finale() ajout d'une condition 'class_etat_initial is not None'
* (fix) controle_coherence_scenario_multi_etapes_passoire() utilisation de la classe dpe issue de l'élément 'sortie' au lieu de l'élément 'etape_travaux' (qui peut être nulle)


# 2023-06-12 DPE-1.18.3 Audit-1.4.3 V2.0 Audit règlementaire

## Contrôles coherences audit

* (fix) controle_coherence_etape_travaux_cout() pour que le controle puisse fonctionner normalement indépendamment du positionnement de la balise 'coût' dans 'etape_travaux'

# 2023-06-20 DPE-1.18.3 Audit-1.4.4 fix controle audit

## Contrôles coherences audit

* (fix) fix d'un bug du moteur de contrôle de cohérence pour gérer un cas spécifique où aucun état initial n'était déclaré et une dérogation existe. 

# 2023-08-29 DPE-1.18.4 Audit-1.4.5 fix message d'erreur version antérieures

## Contrôles coherences dpe/audit

* (fix) fix d'un bug sur le message de retour quand une version n'est plus valide. La liste des versions valides est maintenant corrigée

# 2023-09-04 DPE-1.18.4 Audit-1.4.6 fix d'un bug de non déclenchement de l'erreur de version obsolète pour les audit

## Contrôles coherences audit

* (fix) fix d'un bug de non déclenchement de l'erreur de version obsolète pour les audit avec des dates d'établissement inférieures au 01-09-2023

# 2023-10-12 DPE-1.18.4 Audit-1.4.7 ajout contrôle coherence sur la présence d'un numéro dpe

## Contrôles coherences audit

* AJOUT du controle_coherence_presence_numero_dpe, qui contrôle la présence d'un numéro DPE, lors que le contexte de l'audit est règlementaire (contrôle non bloquant)


# 2023-10-25 DPE-1.18.4 Audit-1.5.0 ajout contrôle coherence pour l'audit 2.1 (ubat_base et ventilation)

## Contrôles coherences audit

* BLOQUANT (en 2.1):
  - AJOUT du controle_coherence_presence_derogation_ventilation : si la dérogration ventilation est utilisée pour l'étape (objet logement), alors une dérogation doit être présente dans enum_derogation_ventilation_id
  - AJOUT du controle_coherence_abscence_derogation_ventilation : si aucune étape (objet logement) de l'audit n'utilise la dérogration ventilation, alors la balise enum_derogation_ventilation_id doit être à "abscence de dérogation"

* Warning (non bloquant):
  - AJOUT du controle_coherence_ubat_base_ubat : vérifie que pour les scénarios mono et multi étapes principaux, que le Ubat de l'étape finale soit inférieur au Ubat_base (condition BCC réno)
  - AJOUT du controle_coherence_etat_ventilation : vérifie que pour les étapes de travaux ont un état de ventilation fonctionnelle (condition BCC réno)

* Retire le controle_coherence_scenario_multi_etapes_passoire (non bloquant), qui contrôlait que, pour les batiments passoires, le « scénario multi étapes "principal" » comporte une « étape intermédiaire » permettant d'atteindre au moins la classe C


# 2023-12-08 DPE-1.18.4 Audit-1.5.1 fix du controle_coherence_presence_derogation_ventilation pour l'audit 2.1

## Contrôles coherences audit

* (fix) fix du controle_coherence_abscence_derogation_ventilation concernant l'affichage des objets concernés par le controle.

# 2024-02-23 DPE-1.19 Audit-1.6 contrôle de cohérence sur le formulaire de consentement

* AJOUT (BLOQUANT si formulaire de consentement renseigné, sinon non déclenché) d'un contrôle de cohérence sur le formulaire de consentement
  *  vérification que les information_proprietaire_consentement sont saisies
  * vérification que si personne_morale alors siren renseigné
  * vérification qu'au moins mail ou téléphone est renseigné

* AJOUT WARNING : si le numéro fiscal de local n'est pas renseigné pour un DPE ou un Audit logement alors un avertissement est produit. 


# 2024-03-04 DPE-1.18.4 Audit-1.7.0 ajout de controles pour l'audit 2.2

## Contrôles coherences audit

* BLOQUANT (en 2.1):
  CES CONTROLES NE S'APPLIQUENT QUE SI L'ELEMENT "caracteristiques_travaux" A ETE AJOUTE DANS UN TRAVAUX
  - AJOUT du controle_coherence_absence_caracteristiques_travaux : Contrôle l'absence de l'élément "caracteristiques_travaux", pour tous les travaux, dans "travaux_collection", qui NE nécessitent PAS la présence de caractéristiques techniques.
  - AJOUT du controle_coherence_caracteristiques_travaux : Contrôle la cohérence entre enum_type_travaux_id et l'élément renseigné dans "caracteristiques_travaux", pour tous les travaux, dans "travaux_collection".

* BLOQUANT (en 2.2):
  - AJOUT du controle_coherence_presence_caracteristiques_travaux : Contrôle la présence de l'élément "caracteristiques_travaux", pour tous les travaux, dans "travaux_collection", qui nécessitent la présence de caractéristiques techniques.
  - AJOUT du controle_coherence_etape_travaux_cout_presence : 
    Contrôler que pour toutes les étapes de travaux, travaux_collection et travaux_induits_collection, que les balises de couts soient correctement renseignées : cout, cout_min, cout_max, cout_cumule, cout_cumule_min, cout_cumule_max.
      - Déclaration des fourchettes : les balises 'cout_min', 'cout_max' et 'cout_cumule_min', 'cout_cumule_max' doivent toujours être présentes ensemble OU ne pas être présentes du tout.
      - Ordre Min/Max des fourchettes : la valeur 'cout_min' doit être inférieure à 'cout_max' et 'cout_cumule_min' doit être inférieure à 'cout_cumule_max'.
      - Présence des coûts dans étapes de travaux, travaux_collection et travaux_induits_collection : soit la balise 'cout' soit la fourchette de couts 'cout_min', 'cout_max' doivent être renseignées. Pour etape_travaux, il faut aussi renseigner soit 'cout_cumule', soit la fourchette 'cout_cumule_min', 'cout_cumule_max'.
      - Choix d'une méthode de saisie de coûts : Il n'est pas permis de saisir la balise de coût 'cout' et la fourchette de couts 'cout_min', 'cout_max'. L'utilisateur doit choisir une méthode. Cela s'applique aussi au 'cout_cumule'.
  - AJOUT du controle_coherence_etape_premiere_saut_2_classes : Pour le « scénario multi étapes "principal" », il faut que l’ « étape première » permette de réaliser un gain d'au moins 2 classes et au minimum d'atteindre la classe E

* Warning (non bloquant):
  - AJOUT du controle_coherence_deux_postes_isolation : Pour les « scénario multi étapes "principal" » et « scénario en une étape "principal" », il faut au moins 2 postes de travaux sur l'isolation de l'enveloppe (fenêtres comprises).

* Autre information : 
  - desactivation du controle : controle_coherence_etape_travaux_cout - car impossible à controler avec les fourchettes


# 2024-03-11  DPE-1.18.4 Audit-1.7.1 fix date limite audit 2.1

## Contrôles coherences audit

* (fix) fix de la date limite de validité de l'audit 2.1 : nouvelle date - 1er septembre 2024


# 2024-04-29  DPE-1.18.4 Audit-1.7.2 fix du controle_coherence_etape_finale

## Contrôles coherences audit

* (fix) fix du controle de cohérence "controle_coherence_etape_finale" afin de permettre une étiquette "C" en étape finale de scenarios principaux dans le cas d'un état existant passoire (en "F" ou "G")


# 2024-05-20 DPE-1.20.0 Audit-1.8.0 Ajout des controles de cohérence DPE 2.4

## Contrôles de cohérences communs DPE/Audit

* BLOQUANT : à compter du 1er juillet les nouveaux seuils s'appliquent pour les logements de petites surfaces <40m². le contrôle de cohérence des consommations et des étiquettes associées est mis à jour pour effectuer le calcul conformément aux tables de l'arrêté.
* BLOQUANT : à compter du 1er juillet recueillir le consentement du propriétaire dans la balise consentement_proprietaire est obligatoire 
* BLOQUANT : sur les versions DPE 2.4 et audit 2.2 déposer un audit/DPE avec une date de visite > date d'etablissement renverra une erreur
* WARNING/FIX : le contrôle de cohérence qui validait que la valeur de scop correspondait bien au bon générateur déclaré en cas de valeur par défaut ne fonctionnait pas. Il a été rétabli sous forme de warning et repassera en erreur dans une future version
* WARNING : un contrôle de cohérence est mis en place pour vérifier que le type d'énergie est cohérent avec le type de générateur (deviendra bloquant dans une future version)
* FIX : pour les installations avec des appoints de salle de bain et les base + appoint aucun warning n'est emis lorsque le nombre de générateurs dépasse 2

## Contrôles de cohérences DPE tertiaire

* WARNING : un contrôle de cohérence vérifie que la balise enum_sous_modele_dpe_ter_id est bien renseignée et que le calcul d'étiquette est conforme au modèle utilisé pour un DPE non vierge. 

## Contrôles coherences audit

* Ajout du controle de cohérence : dpe_version_compatibility, qui controle la cohérence de la version DPE saisie par rapport à la version de l'audit.
  * BLOQUANT jusqu'au 1er juillet uniquement : 
    * Controle que le DPE 2.4 ne soit pas utilisé avant le 1er juillet 2024.
  
  * Warning jusqu'au 30/06/2024 PUIS **BLOQUANT** au 01/07/2024 :
    * Controle la présence la balise "enum_version_dpe_id" dans la section administatif.
    * Controle que la version du DPE soit bien compatible avec la version de l'audit : Ainsi UNIQUEMENT le DPE 2.4 pourra être utilisé à partir du 1er juillet 2024, pour les audit 2.1 et 2.2

# 2024-05-24 DPE-1.21.0 Audit-1.9.0 Fix contrôles de cohérences qui ne se déclenchent pas

* arrondi sur les surfaces à 5 décimales pour le calcul des étiquettes en mode "petite surface"

* WARNING/FIX : le contrôle de cohérence qui validait les données correspondant aux réseaux de chaleurs ne fonctionnait pas. Il a été rétabli sous forme de warning et repassera en erreur dans une future version

* WARNING/FIX : le contrôle de cohérence qui validait le calcul du UE ne fonctionnait pas. Il a été rétabli sous forme de warning et repassera en erreur dans une future version

# 2024-06-12 DPE-1.21.1 Audit-1.9.1 Fix contrôle cohérence étiquette petite surface sur appartement à partir de l'immeuble

* fix : le contrôle de cohérence des étiquettes sur les appartements à partir de l'immeuble ne prenait pas en compte correctement les petites surfaces

# 2024-06-14 DPE-1.21.2 Audit-1.9.2 desactivation du contrôle de cohérence de consentement pour les dpe appartement à partir de l'immeuble

* fix : désactivation du contrôle de cohérence de consentement pour les dpe appartement à partir de l'immeuble

# 2024-06-17 DPE-1.21.2 Audit-1.9.3 desactivation du contrôle de cohérence de consentement pour les audits qui ne sont pas réalisés par un diagnostiqueur (bureau d'étude, entreprise, architecte)

* fix : desactivation du contrôle de cohérence de consentement pour les audits qui ne sont pas réalisés par un diagnostiqueur (bureau d'étude, entreprise, architecte)

# 2024-06-20 DPE-1.21.3 Audit-1.9.4 corrections consentement

* fix : si information_consentement_proprietaire contient des éléments alors que consentement_proprietaire =0 -> cela renvoie une erreur bloquante
* fix : contrôle cohérence etiquette dpe tertiaire correction d'une mauvaise clef sur message_importance. 


# 2024-07-01 DPE-1.21.4 Audit-1.9.5 correction période d'installation poele sans flamme verte

* fix : la période d'installation maximale d'un poele sans flamme verte est n'est plus contrainte

# 2024-07-01 DPE-1.21.5 Audit-1.9.6 correction calcul petite surface arrondi

* fix : l'emission de GES et la consommation n'étaient pas arrondies à la valeur inférieure pour le calcul de petite surface

# fix-correction-warning-lc-non-accessible

* fix d'un avertissement qui se déclenchait en cas de local non chauffé non accessible sur l'isolation

* fix d'une erreur lorsque la surface de référence n'est pas renseignée. Le message d'erreur est maintenant explicite et non une erreur interne 500.

# 2024-07-12-controle-coherence-nouvel-arrete-reseau

* à compter du 15 septembre 2024 les contrôles sur les arrêtés réseau de chaleur seront bloquants
* le contrôle de réseau de chaleur envoi un avertissement entre la date d'entrée en vigueur du nouvel arrêté et la date de fin de validité de l'ancien arrêté dans l'observatoire (une transition d'environ 1 mois)

# 2024-07-26-controle-identifiant-reseau-bloquant

* modification de la date bloquante au 20 septembre 2024 pour les contrôles sur les réseaux de chaleur
* BLOQUANT passage en bloquant de la validation des identifiants reseau de chaleur qui doivent correspondre à la liste d'identifiants de l'arrêté en vigueur

# 2024-08-30 fix des contrôles de cohérence réseau de chaleur et étape premiere saut 2 classes

* contrôles de cohérence réseau de chaleur (DPE/AUDIT) - controle_coherence_reseau_chaleur:
  * fix d'un problème qui renvoyait un avertissement même dans le cas d'une date valide de réseau de chaleur (non bloquant) 

* contrôles de cohérence étape premiere saut 2 classes (AUDIT) - controle_coherence_etape_premiere_saut_2_classes:
  * fix afin de ne plus appliquer le contrôle, qui exigeait un saut de deux classes dès la première étape, pour les cas avec une classe initiale en A, B ou C

# 2024-10-28 desactive le contrôle de cohérence sur le saut 2 classes à l'étape premiere pour les dérogations

* contrôles de cohérence étape premiere saut 2 classes (AUDIT) - controle_coherence_etape_premiere_saut_2_classes:
  * fix afin de ne plus appliquer le contrôle, qui exigeait un saut de deux classes dès la première étape, pour les cas avec une derogation (technique ou économique)

# 2024-11-15 fix sur le contrôle de cohérence étiquette tertiaire

* fix d'un problème d'arrondi sur le contrôle de cohérence des étiquettes du DPE tertiaire. Les consommations seront bien arrondies à l'entier inférieur pour la comparaison aux seuils

# 2025-03-24 DPE-1.23.0 Audit-1.11.0 

* commun :
  * BLOQUANT contrôle de cohérence du formulaire de consentement : ajouts de logiques empêchant de déclarer des informations de l'ancien et du nouveau formulaire en même temps.
  * WARNING contrôle de cohérence du numero fiscal de local : la saisie d'un numéro fiscal de local fait l'objet d'un avertissement pour un DPE logement (appartement ou maison) non neuf et dont le commanditaire est le propriétaire du logement.
  * BLOQUANT ajout de "controle_coherence_5_usages_surface" : contrôle que les valeurs de conso ep, ef et de ges par metre carré (conso_5_usages_m2, ep_conso_5_usages_m2 et emission_ges_5_usages_m2) sont cohérentes avec les valeurs globales (conso_5_usages, ep_conso_5_usages et emission_ges_5_usages) avec une précision de ±1 unité.
  * BLOQUANT ajout de "coherence_surface_immeuble_logement" :
    * Contrôle que la surface habitable de l'immeuble est strictement supérieure à celle du logement.
    * Ce contrôle ne s'applique que si les balises "surface_habitable_immeuble" et "surface_habitable_logement" existent et contiennent des valeurs numériques valides.
  * BLOQUANT mise à jour du "controle_coherence_administratif" pour exiger l'étage de l'appartement ("compl_etage_appartement") quand le DPE est de type appartement.
  * BLOQUANT mise à jour du "controle_coherence_structure_installation_chauffage" afin que les installations avec de appoint et/ou des chauffage électrique dans la salle de bain contiennent effectivement des couples générateurs/émetteurs avec des "enum_lien_generateur_emetteur_id" correspondant à l'appoint et/ou à l'appoint electrique salle de bain.
  * BLOQUANT ajout de "controle_coherence_type_regulation" : contrôle que "tv_rendement_regulation_id" soit cohérent avec "enum_type_regulation_id" (avec/sans régulation terminale) pour chaque émetteur
  * BLOQUANT le contrôle de coherence sur tv_scop_id et la déclaration de générateurs correspondant devient bloquant (si le générateur ne correspond pas à la table de valeur déclarée cela génère une erreur)
  * BLOQUANT le contrôle de cohérence sur le calcul de ue devient bloquant
  * BLOQUANT le contrôle de cohérence entre le type d'énergie et les générateurs d'ECS et chauffage est bloquant

  * BLOQUANT contrôle de cohérence entre générateurs et émetteurs

    ce contrôle de cohérence valide les éléments suivants :
    
    * les générateurs sont associés à un couple émission/distribution cohérent avec ce générateur 
        * dans la table d'enumérateur type_emission_distribution il est précisé les identifiants de générateurs de chauffage compatibles (colonne enum_type_generateur_ch_id)
        * un générateur est considéré associé à un émetteur s'ils partagent le même enum_lien_generateur_emetteur_id au sein d'une même installation
        * dans le cas de plusieurs générateurs partageant le même enum_lien_generateur_emetteur_id il suffit d'un seul générateur compatible pour passer le contrôle
    * un contrôle de cohérence vérifie que les valeurs des rendements d'emission et de régulation utilisés via les tables de valeurs tv_rendement_emission_id et tv_rendement_regulation_id sont cohérents avec les générateurs associés
        * dans les tables rendement_regulation et rendement_emission, il est précisé les identifiants de générateurs de chauffage compatibles (colonne enum_type_generateur_ch_id)
        * un générateur est considéré associé à un émetteur s'ils partagent le même enum_lien_generateur_emetteur_id au sein d'une même installation
        * dans le cas de plusieurs générateurs partageant le même enum_lien_generateur_emetteur_id il suffit d'un seul générateur compatible pour passer le contrôle

  * BLOQUANT contrôle d'obligation de déclaration de pont thermique
     ce contrôle n'est pas exhaustif et déclenche des contrôles sur la déclaration de ponts thermiques dans des situations particulières où l'on est capable d'assurer que les ponts thermiques pour certaines intéractions doivent être déclarés. En particulier les parois isolées par l'intérieur ne sont pas considérées comme lourdes au sens de l'inertie et ne sont donc pas contrôlées dans cette version.
  
    * au moins un pont thermique baie/mur doit être déclaré si les murs extérieurs ne sont pas en bois et que les baies ne sont pas en brique de verre
    * au moins un pont thermique plancher haut/mur doit être déclaré si tous les murs extérieurs sont lourds et que les planchers hauts sont tous lourds (lourds au sens de l'inertie)
    * au moins un pont thermique plancher bas/mur doit être déclaré si tous les murs extérieurs sont lourds et que les planchers bas sont tous lourds (lourds au sens de l'inertie)

  * BLOQUANT contrôle de déclaration de paroi lourdes (au sens de l'inertie) : pour certaines combinaisons de matériaux/type isolation pour les murs extérieurs il est vérifié la déclaration de ces parois comme des parois lourdes

* BLOQUANT contrôle de cohérence masque lointain : il n'est plus possible de déclarer des masques lointains homogènes et masques lointains non homogènes

* BLOQUANT contrôle de cohérence pac air/air climatisation : il est obligatoire de déclarer un système de climatisation lorsqu'une pac air/air existe en generation de chauffage

* Audit : 
  * Fix : le contrôle "controle_coherence_etape_premiere" a été retiré puisqu'il est remplacé par "controle_coherence_etape_premiere_saut_2_classes"
  * Ajout de "controle_coherence_gain_cumule" : 
    * Contrôle que la somme des gains (énergie, carbone, facture) pour un scénario soit strictement négative. 
    * Objectif : s'assurer que les balises dans "etape_travaux" concernant le "gain" et le "gain_relatif" soient bien comptabilisées en négatif (gain d'énergie = négatif)
  * Ajout de "controle_coherence_travaux_autre" : 
    * Contrôle que le taux d'utilisation de l'option "autre" pour les balises "enum_lot_travaux_audit_id" (ID 10), "enum_type_travaux_id" (ID 24) et "enum_travaux_resume_id" (ID 11) ne dépasse pas 90% sur l'ensemble des travaux de l'audit.
    * Objectif : garantir une classification correcte des travaux et éviter une sur-représentation de la catégorie "autre"

# 2025-04-02 DPE-1.23.1 Audit-1.11.1 

* commun :
  * Fix du controle_pac_air_air_clim afin de ne plus retourner de related_objects à None
* audit :
  * fix d'une erreur audit qui considérait les contrôles avertissement à venir des DPE comme des erreurs dans les versions antérieures

# 2025-04-07  DPE-1.23.2 Audit 1.11.2

* fix d'un problème du code de génération des messages des erreurs 
* fix : controle coherence pont thermique, en cas d'erreur un objet concerné n'était pas de type etree._Element

# 2025-04-16  DPE-1.23.3 Audit 1.11.3

* commun :
  * fix : message paroi lourde : changement de description "paroi lourde" -> "paroi à inertie lourde"
  * le contrôle de cohérence sur les ponts thermiques plancher bas / mur et plancher haut mur est passé en avertissement car il existe des configurations très particulières qui empêchent de rendre ce contrôle bloquant à coup sur 
* audit :
  * fix du seuil affiché dans le message d'erreur du controle_coherence_travaux_autre (90% au lieu de 25%)
  * fix : le controle_coherence_gain_cumule dorénavant tolère une augmentation de GES de +10 kgCO2/m2/an entre l'état initial et l'étape finale des scénarios principaux (scénarios complémentaires ne sont pas controlés)


# 2025-04-22  DPE-1.23.4 Audit 1.11.4

* fix - crash moteur : contrôle cohérence paroi lourde épaisseur calculée en float plutôt qu'en int

# 2025-04-30 DPE-1.23.5 Audit 1.11.5

* fix : contrôle de cohérence pac air/air climatisation obligatoire passage en avertissement non bloquant pour les versions antérieures


# 2025-05-20 DPE-1.23.5 Audit 1.12.0 : intégration de l'Audit Copro

## Contrôles coherences DPE

* (fix) fix de la date limite de validité de le DPE 2.4 : nouvelle date - 30 septembre 2025

## Contrôles coherences audit :
  * (fix) fix de la date limite de validité de l'audit 2.3 : nouvelle date - 30 septembre 2025
  * Ajout du "controle_coherence_scenario_audit_copro" :
    * Contrôle la cohérence entre enum_modele_audit_id et les scénarios (enum_scenario_id) :
      * Si audit copro (enum_modele_audit_id = 3) :
        * Le scénario « audit copro principal » (enum_scenario_id = 7) est requis
        * Les scénarios « multi étapes principal » (enum_scenario_id = 1) et « en une étape principal » (enum_scenario_id = 2) sont interdits
      * Sinon (audit non copropriété) :
        * Les scénarios « audit copro principal » (enum_scenario_id = 7) et « complémentaire 4 - audit copro » (enum_scenario_id = 6) sont interdits
  * Ajout du "controle_coherence_derogation_audit_copro" :
    * Contrôle la cohérence des valeurs de dérogation en fonction du type d’audit :
      * Si audit copro (enum_modele_audit_id = 3) :
        * enum_derogation_technique_id doit être à 3 (« non applicable - audit copro »)
        * enum_derogation_economique_id doit être à 4 (« non applicable - audit copro »)
      * Sinon (audit non copropriété) :
        * enum_derogation_technique_id ne doit pas être à 3
        * enum_derogation_economique_id ne doit pas être à 4
  * Mise à jour du controle_coherence_modele_methode_application:
    * Dans le cas d'un Audit Copro, seuls les méthodes DPE immeuble (enum_methode_application_dpe_log_id) sont autorisées 
  * Mise à jour pour déactiver les contrôles suivants si l'audit est de type Copro : 
    - controle_coherence_scenario_multi_etapes
    - controle_coherence_scenario_mono_etape
    - controle_coherence_gain_cumule
  * Exige pour les Audit 2.4 (enum_version_audit_id) une version DPE (enum_version_dpe_id) supérieur ou égale à 2.5


# 2025-06-06 fix date validité DPE 2.4 et audit 2.3 

* (fix) fix dates DPE et audit au 30 septembre (end_date_compare_now)

# 2025-07-07 fix pont thermique et warning audit copro

## Contrôles coherences commun DPE-Audit
* (fix) fix du controle_coherence_pont_thermique concernant la détection de murs en bois

## Contrôles coherences audit :
* (fix) desactivation des controles Warning controle_coherence_six_postes_travaux et controle_coherence_deux_postes_isolation pour l'audit copro (car il n'y a pas d'objectifs de nombre de postes à traiter dans ce cadre)


# 2025-10-10 DPE-1.24.0 Audit-1.13.0 : passage au PEF élec à 1,9

* commun :  
  * **BLOQUANT** : passage au **PEF électricité = 1,9** à compter du **01/01/2026**  
    * Les versions **DPE 2.5** et **Audit 2.4** sont valides jusqu’au **31/12/2025 inclus**  
    * Les versions **DPE 2.6** et **Audit 2.5** prennent effet au **01/01/2026**

* DPE :  
  * **BLOQUANT ajout de `controle_coherence_conso_5_usages`**  
    * Vérifie la **cohérence entre les consommations par énergie et les totaux** (énergie finale et primaire)  
    * S’applique à tous les **DPE logement** et **DPE neufs**  
    * **BLOQUANT à partir du DPE 2.6**  
    * Contrôle la bonne application du **coefficient de conversion (PEF)** :  
      * 2.3 pour l’électricité jusqu’au 31/12/2025  
      * 1.9 pour l’électricité à partir du 01/01/2026  
      * 1.0 pour les autres énergies  
    * Tolérance fixée à ±3 kWh  
    * Objectif : garantir la cohérence entre les valeurs détaillées et celles utilisées pour les étiquettes.
  * **BLOQUANT ajout de `controle_coherence_conso_5_usages_tertiaire`**  
    * S’applique aux **DPE tertiaires non vierges**  
    * Deux niveaux de vérification :  
      * **Cohérence par énergie** → BLOQUANT à partir du DPE 2.6  
      * **Cohérence du bilan global** → WARNING (non bloquant)  
    * Vérifie l’utilisation du bon PEF et la cohérence entre les consommations détaillées et la consommation totale.

* Audit :  
  * **BLOQUANT ajout de `controle_coherence_conso_5_usages`**  
    * Même logique que pour le DPE, appliqué à chaque étape de travaux  
    * Devient **bloquant à partir de l’Audit 2.5**  
    * Garantit la cohérence entre les consommations par type d’énergie et les valeurs globales  
    * Vérifie l’application du bon **PEF électricité (2.3 → 1.9 au 01/01/2026)**

* Documentation (sans conséquence sur les contrôles):
  * Tables de valeur : ajout de la colonne hauteur_alpha dans coef_masque_lointain_non_homoge
  * Création d'un fichier Excel faisant l'inventaire de l'ensemble des messages d'erreur et warning remontés par les controles de cohérences. 

# 2025-10-17 fix pont thermique fenetre toit

* (fix) desactivation du controle_coherence_pont_thermique, sur la partie ponts thermique baie/mur, dans la configuration d'un appartement avec plancher haut déperditif (appartement sous les toits)

# 2025-11-03 fix désactivation contrôle tertiaire bilan total

* `controle_coherence_conso_5_usages_tertiaire`
  * Désactivation temporaire du contrôle "cohérence du bilan total" (ne remonte plus de warning)
  * Remarque : Le contrôle de cohérence par énergie reste actif et deviendra BLOQUANT à partir du DPE 2.6.