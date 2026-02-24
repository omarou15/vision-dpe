# versions

## moteur contrôle cohérence DPE

version : 1.15.0
date : 2022-04-15

## moteur contrôle cohérence audit

version : 1.0.0
date : 2023-02-14

## service contrôle cohérence (webservice)

version : 2.0.0
date : 2023-02-14


# Description des contrôles de cohérence

Les contrôles de cohérences sont une série de contrôles executés sur chaque xml transmis dans l'observatoire DPE de l'ADEME. Ces contrôles vérifient que les informations saisies sont cohérentes entre elles et cohérentes avec un certain nombre d'informations de contexte du DPE. 

Les contrôles de cohérences peuvent être bloquants ou de simples avertissements à destination des diagnostiqueurs DPE. 

**contrôles de cohérences de type bloquants**

Les contrôles de cohérences bloquants sont principalement à destination des éditeurs de logiciels DPE pour vérifier que leur implémentation du modèle de données est conforme à la logique de saisie de l'observatoire qui est une implémentation de la logique de la méthode de calcul DPE 3CL pour les DPE ayant un modèle 3CL existant.  Un nombre plus limité de contrôles de cohérences bloquants concernent les diagnostiqueurs sur des incohérences dont il est sûr qu'elles ne suivent pas la logique de la méthode de calcul.  

**contrôles de cohérences de type avertissement**

Ces contrôles de cohérences ont pour objectif de faire remonter au diagnostiqueur qu'un élément de saisie est suffisamment inhabituel ou remarquable pour l'alerter dans le cas où cette saisie serait une erreur de sa part.  Ces contrôles ne sont pas bloquants car il existe des conditions spécifiques dans lesquelles l'anomalie détectée est un faux positif.  Ainsi par exemple une alerte est remontée si aucun mur ne porte de fenêtres pour un DPE. Ceci est une anomalie dans une très grande majorité de cas mais il existe des situations rare dans lesquelles ce type de saisie est possible.

**contrôles de cohérences de type notification**

Ce type de contrôle de cohérences informatifs n'a pas encore été mis en place dans cette version. 

## controles de cohérences organiques (BLOQUANT)

ces contrôles de cohérences sont présents pour contrôler la bonne intégrité du modèle de données et vérifier que l'ensemble
des informations sont cohérentes entre elles. Ces contrôles de cohérences contrôlent la logique du modèle et vérifient la bonne implémentation des différentes possibilités de la méthode de calcul DPE pour chaque composant.  
Ces contrôles de cohérences sont à destination des editeurs de logiciels DPE pour controler la bonne implémentation du modèle de donnée.

LES CONTROLES ORGANIQUES SONT TOUS BLOQUANTS POUR VALIDER UN DEPOT DE DPE DANS L'OBSERVATOIRE !

### contrôle de cohérence date de validité de la version DPE. 

Les versions du modèle de DPE ne sont valables que pour certaines périodes de temps. Une erreur bloquante est émise si la version du DPE transmise n'est plus valide ou correspond à une version future qui n'est pas encore validée en production.  

### contrôle de cohérence entre table de valeur et enumérateurs

ce contrôle de cohérence vérifie que lorsqu'une table de valeur est utilisée, les enumérateurs renseignés correspondent bien à la valeur utilisée.
Exemple il est vérifié que pour une valeur de Ug d'un vitrage déclarée elle correspond bien aux propriétés correspondantes.
Ug =  2 tv_ug_id = 29  -> on vérifie que le gaz de remplissage est bien argon/krypton qu'il s'agit d'un double vitrage, vertical, avec 6mm d'epaisseur avec un traitement à isolation renforcé. Si la cohérence de ces éléments n'est pas vérifié le DPE est refusé. 

Ce contrôle de cohérence utilise les liens tables de valeurs/énumérateurs que l'on peut retrouver dans l'excel de table de valeur du modèle de données. 

### controle de cohérence table de valeur -> valeur intermédiaire

Lorsqu'une table de valeur de données forfaitaire est utilisée dans le calcul DPE, il doit être saisi le numéro de ligne correspondant dans la table de valeur.  Ce contrôle de cohérence vérifie que les valeurs de performance associées à cette table de valeur utilisées dans le calcul sont bien celles de la table de valeur.  

Exemple :  On vérifie que le U du mur (umur) correspond bien à tv_umur_id correspondant quand tv_umur_id est utilisé. tv_umur_id = 1 alors umur doit être égal à 2.5. 

Ce contrôle de cohérence associé au précédent permet d'assurer donc la cohérence entre les informations techniques saisies sur le composant et les valeurs numériques de performances utilisées pour le calcul. 

### controle de cohérence saisie experte -> valeur intermédiaire

Lorsque le diagnostiqueur procède à une saisie experte de données numériques de performance dans le DPE et n'a donc pas recours aux tables de valeur forfaitaires, il est vérifié que la donnée numérique utilisée pour le calcul est bien la donnée experte saisie.

Ce contrôle de cohérence est le pendant "saisie experte" du contrôle cohérence précédent.

### controle de cohérence variables interdites et requises

la méthode de calcul laisse le choix entre un certain nombre de solutions pour renseigner et modéliser chaque composant. Ces choix dépendent des informations qu'arrive à collecter le diagnostiqueur sur le composant en question. En fonction de la méthode choisie il est alors vérifié que les données nécessaire à cette variante du calcul sont bien toutes renseignées. 

Ainsi par exemple si un diagnostiqueur veut calculer le coefficient de transmission thermique d'un mur grâce à la méthode de calcul basé sur l'epaisseur d'isolation, il est bien vérifié que l'épaisseur d'isolation a bien été saisie dans le modèle. 

En plus de ces choix de méthodes il existe un certain nombre de champs qui ne doivent être renseignés que pour certains types de composants. Ainsi par exemple  si on déclare une pompe à chaleur en générateur de chauffage on s'assure que le scop est saisi mais que rpn , rpint ,rendement_generation etc.. qui sont des éléments qui ne concernent pas la pompe à chaleur ne sont pas utilisés. 

Ce contrôle de cohérence utilise les champs **variables_requises** et **variables_interdites** que l'on peut retrouver dans l'excel de table d'énumérateur du modèle de données pour les énumérateurs qui imposent ce type de contraintes. 

Ce contrôle de cohérence a une importance particulière car il garanti que les propriétés de composants saisis sont bien à propos et cohérents avec la méthode de saisie de ce composant et son type. Ainsi par exemple on ne peut pas avoir de table de valeur forfaitaire utilisée quand le diagnostiqueur utilise des données de saisie expertes et inversement. 

### controle de cohérence valeur mutuellement exclusives

lorsque deux valeurs sont mutuellement exclusives ce contrôle de cohérence avertit que l'une des deux doit être supprimée. C'est un complément du contrôle de cohérence précédent. 

### controle de cohérence nombre de générateurs de chauffage

On vérfie que le nombre de générateurs correspond bien à la configuration d'installation de chauffage déclarée. En fonction de la configuration d'installation de chauffage choisie pour un DPE il est attendu un nombre de générateurs spécifique à cette configuration. Si le nombre de générateurs est différent du nombre attendu alors il est renvoyé une erreur.

**Ce contrôle de cohérence est passé en avertissement pour le moment.** 

### controle de cohérence du lien emetteur générateur

Il existe un élément dans le modèle de données qui fait le lien entre générateurs et émetteurs de chauffage (enum_lien_generateur_emetteur_id). Cela permet de faire le lien entre des émetteurs liés à des générateurs principaux et des générateurs d'appoints. Il est vérifié que l'on a bien au moins un émetteur par type de générateur (principal, appoint) correspondant.

### controle de cohérence des surfaces

vérification que la sommes des surfaces des installations de chaque catégorie est inférieure à la surface du logement ou bâtiment en fonction du type de DPE. Ce contrôle de cohérence permet de vérifier que les surfaces renseignées dans les différents composants sont bien conforme à la surface de référence du DPE (surface de l'immeuble ou du logement). Si par exemple la somme des surfaces d'installation de chauffage est plus grande que la surface de référence alors le DPE est refusé. 

### controle de cohérence des energies

vérification que les énergies déclarées en sortie correspondent aux énergies déclarées sur les générateurs en entrée.

Pour chaque générateur de chauffage, d'ECS ou chaque installation de climatisation il est demandé de préciser l'énergie correspondante.  Ce contrôle de cohérence vérifie que la déclaration des énergies dans les sorties de calcul sont cohérentes avec les énergies déclarées dans les générateurs. Ainsi on ne peut avoir des énergies déclarées en sorties qui ne sont pas dans les générateurs et inversement (à l'exception de électricité qui existe en sortie dans tous les cas )

Il est aussi vérifié dans les sorties par énergie que les consommations de chauffage et ou d'ECS ne sont pas 0 pour chaque energie associée à un générateur de chauffage ou ecs

### controle coherence rset/rsee

Pour les DPE neufs il est possible de joindre le RSET/RSEE (xml de donnée RT2012 ou RE2020) . Il est effectué une vérification rapide qu'à priori il s'agit bien de ce type de fichier en vérifiant la présence de certaines balises clés de ces xml. 

### controle de coherence etiquette

Ce contrôle de cohérence vérifie que l'étiquette calculée correspond bien aux données de consommation 5 usages en énergie primaire et en CO2 fourni en sorti de fichier. 

* erreur bloquant si l'étiquette energie bilan ne correspond pas aux règles des doubles seuils de l'arrêté. 

* erreur bloquant si l'étiquette GES ne correspond pas aux seuils sur les emissions GES.  

## controle de cohérence Warning saisie  (NON BLOQUANT)

### controle coherence existence élément d'enveloppe

vérification qu'au moins un composant de chaque type de composant d'enveloppe est déclaré (exception planchers bas/haut pour appartement.). Si un logement est déclaré sans murs ou fenêtres cela est inhabituel et un avertissement est émis

### controle coherence pont thermique

Il est vérifié que les ponts thermiques déclarés pour un logement correspondent bien aux types d'isolations des parois (ITE/ITI) et au type de pose des baies du logement.  Un avertissement est émis si l'on constate qu'un pont thermique est déclaré avec des types d'isolations qui n'existent pas dans les parois du logement (idem pour les type de poses des baies).

Ce contrôle de cohérence gère les cas particuliers de murs en ossature bois et les types d'isolation par défaut lorsque l'isolation est inconnue.

contrôle d'obligation de déclaration de pont thermique

  * au moins un pont thermique baie/mur doit être déclaré si les murs extérieurs ne sont pas en bois et que les baies ne sont pas en brique de verre
  * au moins un pnt thermique plancher haut/mur doit être déclaré si tous les murs extérieurs sont lourds et que les planchers hauts sont tous lourds
  * au moins un pnt thermique plancher bas/mur doit être déclaré si tous les murs extérieurs sont lourds et que les planchers bas sont tous lourds

### controle coherence d'enveloppe

Ce contrôle de cohérence est une série de contrôle de cohérences concernant les composants d'enveloppe

**cohérence entre le b et le type d'isolation déclaré pour la parois dans le cas contact LNC**

Il est vérifié que le b (coefficient de réduction des déperditions) est cohérent avec le type d'isolation de la paroi donnant sur le local chauffé et le caractère isolé ou non de la paroi donnant sur l'extérieur du LNC. 

**cohérence entre période construction et période isolation (période isolation >= période construction)**

Une simple vérification est opérée pour vérifier que la période d'isolation (lorsqu'elle est différente de la période de construction)  est bien systématiquement supérieure à la période de construction. 

**cohérence des adjacences déclarées avec les types de parois** 

Il est vérifié que les adjacences déclarées pour chaque parois sont cohérentes avec le type de paroi correspondante.  Il est très exceptionnel d'avoir un planchers bas donnant sur des combles par exemple.

**contrôle des dimensions d'epaisseur d'isolation et de mur**

Il est contrôlé que les épaisseurs sont bien fournies en cm. Si épaisseur d'un mur ou de son isolant est trop faible ou trop élevé un avertissement est émis. 

**contrôle b = 0 -> aue =0**

il est vérifié que lorsque b (coefficient de réduction des déperdition) est égal à 0 alors cela correspond forcément à une configuration aue = 0 ou à une paroi non déperditive.  (adjacence avec un autre logement)

**contrôle b>0 -> table de valeur b**

il est vérifié que lorsqu'un b > 0 alors il correspond bien à la table de valeur correspondant.  Ce contrôle a été séparé du contrôle de cohérence table valeur -> valeur intermédiaire car il devait gérer certaines spécificités du calcul de b.

**contrôle que épaisseur du mur est saisie si le mur est de type connu.**

Il est vérifié qu'une épaisseur est saisie systématiquement si le type de mur est connu et correspond à un mur dont l'épaisseur doit être renseignée. 

### contrôle cohérence système

ce contrôle de cohérence est une collection de contrôle de cohérence "métier" concernant les systèmes énergétiques. 

**cohérence période construction et période de ventilation (periode ventilation >= période construction)**

La période de ventilation ne peut être inférieure à la période de construction. 

**cohérence rpn/rpint **

Pour certains types de générateurs à combustion il existe une logique d'ordre de performance entre rpn et rpint. Par exemple, pour les chaudières à condensation Rpint > Rpn. Si ce n'est pas le cas dans le DPE saisi par le diagnostiqueur alors un avertissement est émis. 

**cohérence inertie intermittence**

Il est vérifié que l'inertie du bâtiment et l'intermittence utilisée sont bien cohérentes

**cohérence de la position des générateurs en volume chauffé avec le type de générateur et d'installation.**

Certains types de générateurs sont très souvent positionnés en volume chauffé ou hors volume chauffé. Si le type de générateur ne correspond pas à sa position "habituelle" un avertissement est émis. Exemple : une chaudière collective gaz est dans une très grande majorité de cas située dans un local chaufferie qui n'est pas dans le volume chauffé du bâtiment.  Si ce type de chaudière est déclaré en volume chauffé alors un avertissement est émis.  

## controle de coherence adminsitratif

ces controles de cohérences sont principalement concentrés sur le géocodage

**erreur BLOQUANT si le retour géocodeur est incomplet ou erroné.**

s'il manque des données renvoyées systématiquement par le géocodeur BAN alors le DPE est bloqué

**warning lorsque le score de géocodage est faible**

un avertissement est émis lorsque le score de géocodage est faible. Cela peut traduire une erreur potentielle de saisie d'adresse. 

**warning lorsque le type de géocodage n'est pas au housenumber**

un avertissement est émis lorsque le résultat adresse du géocodage n'est pas une adresse au numéro mais est plus imprécise que cela (la rue , la commune)

**warning si un appartement ne possède pas de complément d'étage.**

Un avertissement est émis si un appartement ne possède pas de complément d'étage dans ses données administratives. 

## controle de coherence tertiaire

**erreur BLOQUANT si un dpe non vierge n'a pas de consommations associées.**

Un DPE tertiaire peut être vierge dans le cas où il n'est pas possible de récupérer les consommations du bâtiment. Si un DPE tertiaire n'est pas mentionné comme étant vierge alors il doit y avoir des données de consommations fournies pour ce DPE. 

## controle de cohérence sur la présence des clés de répartitions dans le cas d'un DPE appartement à partir de l'immeuble

contrôle de cohérence qui vérifie que les cle_repartition_ch, cle_repartition_ecs,cle_repartition_clim et cle_repartition_ventilation sont bien déclarées dans le cas d'un DPE appartement à partir de l'immeuble. Ces clé de répartitions permettent de savoir quelle est la part de consommation de l'immeuble qui est affectée à l'appartement en utilisant la méthode de calcul du DPE appartement à partir de l'immeuble.  

## contrôle de cohérence unicité des références

contrôle que les références sont uniques dans les DPE (pas de doublons autorisés)

## contrôle de cohérence dpe_immeuble_associe

vérification qu'un DPE immeuble associé est systématiquement renseigné 

## contrôle de cohérence réseau de chaleur

* avertissement si un identifiant réseau n'existe pas dans la table de l'arrêté. Si un identifiant réseau est saisi mais qu'il n'est pas documenté dans l'arrêté cela envoi un avertissement

* contrôle bloquant : si la date d'arrêté de réseau de chaleur est non déclarée ou expirée (remplacée par un arrêté plus récent), le DPE est refusé pour dépôt.

## contrôle de cohérence de la bonne implémentation du calcul du UE

* vérifie que calcul_ue = 1 pour les 3 adjacences pour lesquelles le calcul de UE doit être effectué et que calcul_ue = 0 pour les autres

* vérifie que surface_ue,ue,perimetre_ue sont bien déclarés pour les 3 adjacences pour lesquelles le calcul de UE doit être effectué

* vérifie que surface_ue,ue,perimetre_ue ne sont pas déclarés pour les autres adjacences

* vérifie que ue = upb_final pour les 3 adjacences pour lesquelles le calcul de UE doit être effectué 

* vérifie que upb = upb_final pour les autres adjacences 

## contrôle de cohérence de déclaration des pveilleuse pour les systèmes par défaut

* ajout d'un contrôle de cohérence qui vérifie que pveilleuse est déclarée pour les systèmes à combustion avec veilleuse lorsque ceux cis sont saisis par défaut. 

## contrôle de cohérence entre la source d'énergie et le générateur

* vérification que la source d'énergie est compatible avec le générateur déclaré pour le chauffage et l'ecs.

## contrôle de cohérence sur les étiquettes tertiaires

* vérification que les étiquettes DPE tertiaires correspondent bien aux consommations déclarées. 

## contrôle de cohérence entre générateurs et émetteurs

ce contrôle de cohérence valide les éléments suivants :

* les générateurs sont associés à un couple émission/distribution cohérent avec ce générateur 
    * dans la table d'enumérateur type_emission_distribution il est précisé les identifiants de générateurs de chauffage compatibles (colonne enum_type_generateur_ch_id)
    * un générateur est considéré associé à un émetteur s'ils partagent le même enum_lien_generateur_emetteur_id au sein d'une même installation
    * dans le cas de plusieurs générateurs partageant le même enum_lien_generateur_emetteur_id il suffit d'un seul générateur compatible pour passer le contrôle
* un contrôle de cohérence vérifie que les valeurs des rendements d'emission et de régulation utilisés via les tables de valeurs tv_rendement_emission_id et tv_rendement_regulation_id sont cohérents avec les générateurs associés
    * dans les tables rendement_regulation et rendement_emission, il est précisé les identifiants de générateurs de chauffage compatibles (colonne enum_type_generateur_ch_id)
    * un générateur est considéré associé à un émetteur s'ils partagent le même enum_lien_generateur_emetteur_id au sein d'une même installation
    * dans le cas de plusieurs générateurs partageant le même enum_lien_generateur_emetteur_id il suffit d'un seul générateur compatible pour passer le contrôle

## contrôle de cohérence sur les masques solaires

* il n'est plus possible de déclarer des masques lointains homogènes et masques lointains non homogènes

## contrôle de cohérence pac air/air clim

il est obligatoire de déclarer un système de climatisation lorsqu'une pac air/air existe en generation de chauffage

# Contrôles bloquants passés en warning uniquement pour la version 2

de manière temporaire les contrôles de cohérences bloquants sont passés en warning dans la version 2 du modèle de données. 
Cette adaptation est réalisée pour permettre aux éditeurs de progressivement corriger ces problèmes sans pour autant bloquer le processus de dépôt de DPE pendant une durée déterminée. 
Les versions ultérieures du modèle rétabliront ces contrôles de cohérences comme bloquants. 
Certains contrôles qui étaient opérés en v1 (contrôle des dates, contrôles de la structure du xml ) sont conservés en erreurs. Seuls les contrôles de cohérence métier sont basculés en avertissement.

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

# Contrôles de cohérences audit energétique réglementaire

Des contrôles de cohérences spécifiques à l'audit énergétique réglementaire sont mis en place pour vérifier la bonne application des arrêtés et des
éléments exigés spécifique à l'audit énergétique.

Les contrôles suivants sont effectués et opérationnels à partir de la version 2.0 de l'audit énergétique

**Contrôles bloquants :**

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




# instruction déploiement svc_controle_coherence 

ces instructions de déploiement sont à destination de développeurs qui voudraient déployer le webservice Flask(python) qui permet d'effectuer les contrôles de cohérence sur un fichier xml DPE. 

## build 

démarrer une console dans le dossier root observatoire-dpe

docker build -t controle_coherence . -f svc_controle_coherence/Dockerfile

## run

docker run -p 5000:5000 controle_coherence

pour démarrer le docker sans logs de debug (par défaut l'application tourne avec les logs en debug.) :

docker run -p 5000:5000 -e LOG_LEVEL='INFO' controle_coherence

pour démarrer le docker en mode test (ignorer les vérifications de dates + logs de debug)  :

docker run -p 5000:5000 -e LOG_LEVEL='DEBUG' -e DISABLE_DATE_RESTRICTION='1' controle_coherence

# routes

/openapi.yaml -> accès à la documentation openapi 3.0

/controle_coherence route de run du controle de cohérence

# instruction de développement

## mise à jour d'une version du DPE ou de l'audit : checklist

- [ ] passer tous les blocker_as_warning de la version précédente en blocker (puisque normalement on doit être effectivement sur la dernière version en date et donc tous les blocker_as_warning sont des blockers). Si l'on ne fait pas cela alors les blocker_as_warning redeviendront des avertissement au déploiement de la nouvelle version(regression). Exception faite d'une période où 3 versions différentes sont valides en même temps.

- [ ] mettre à jour assets_dpe/assets_audit.DPE/AUDIT_VERSION_ANTERIEUR et inclure la version actuelle dedans. 

- [ ] ajouter la nouvelle version de l'audit/DPE dans assets_audit/dpe.py avec les dates associées et tu passes is_future = True sur cette version et is_future = False pour toutes les autres précédentes. 

- [ ] fixer la start_date de la nouvelle version avec validation DHUP/ADEME (si la modification de version est liée à un arrêté c'est la date d'application de l'arrêté qui s'applique)

- [ ] fixer la end_date de la version précédente avec validation DHUP/ADEME (si la modification de version est liée à un arrêté c'est la date d'application de l'arrêté qui s'applique)

- [ ] fixer la end_date de la version précédente avec validation DHUP/ADEME (si la modification de version est liée à un arrêté c'est la date d'application de l'arrêté qui s'applique)

- [ ] si on autorise à ce que des anciens DPE/audit établis avant la date d'arrêté soient déposé dans l'observatoire pendant une phase de transition end_date_compare_now = la date de fin de la période de transition pour la version précédente

- [ ] si la transition est "abrupte" à savoir qu'aucun dépot d'ancien dpe/audit n'est permis après la date de l'arrêté alors end_date=end_date_compare_now = date de l'arrêté. (c'est le cas le plus courant.)

- [ ] enfin mettre le bon XSD file en face de chaque version

- [ ] pour toute modification DPE et ajout de contrôles de cohérences il est primordial de gérer les intéractions avec l'audit. Tout ajout de contrôle bloquant commun DPE AUDIT (si la modification est d'ordre réglementaire à valider à chaque modification d'arrêté que cet arrêté s'applique à DPE ou DPE/AUDIT ) doit faire l'objet d'un saut de version pour les deux objets DPE et AUDIT. 

- [ ] pour qu'un contrôle de cohérence soit effectif, il faut l'ajouter dans la de run_controle_coherence() de l'Audit et/ou du DPE

- [ ] générer des cas tests valides pour la nouvelle version et supprimer les cas tests des versions qui ne sont plus en vigueur