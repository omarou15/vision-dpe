# Document guide de l'audit

## Structure du XML 

### Vue globale

![img.png](png/Vue_globale.png)

Comme pour le XML DPE, nous retrouvons l'élément "administratif" contenant des informations générales sur le bâtiment et l'auditeur avec quelques ajustements par rapport au DPE.
L'élément "fiche_technique_collection", est quand à lui identique à celui présent dans le XML DPE.

L'élément "logement_collection" contient un ensemble de "logement" DPE. Chaque logement correspondant à une étape d'un scénario de rénovation (ou une simulation DPE). Les éléments "logement" sont très proches de ceux du DPE, seulement certaines balises ont été ajoutées ainsi qu'une nouvelle rubrique "etape_travaux".

Les éléments "vue_ensemble_logement" et "expertise_auditeur" ont quant à eux été ajouté pour correspondre à la Trame de l'audit.

### ADMINISTRATIF

Comme pour le XML DPE, nous retrouvons l'élément "administratif" contenant des informations générales sur le bâtiment et l'auditeur.
Voici les principaux changements : 
* dans l'élément "auditeur", il y a dans le XSD un choice entre "diagnostiqueur"/"bet_entreprise" et "architecte", avec des balises spécifique pour chaque

![img.png](png/choice_administratif.png)

* des enumérateurs pour préciser si le bâtiment est sujet à la dérogation technique ou économique. Ces dérogations permettent de justifier la non atteinte de l'étiquette B en étape finale.

![img_1.png](png/derogation_administratif.png)
  
### LOGEMENT COLLECTION

Logement collection contient un ensemble de "logement", chaque logement correspondant a une étape d'un scénario de rénovation, soit une simulation DPE. 

![img_2.png](png/logement_collection.png)

L'élément "logement" est proche de celui issu du XML DPE, mais un certain nombre de balises ont été ajoutés.

#### AJOUTS MINEURS 
##### Scenario et Etape

Dans  "caracteristiques_generale", "enum_scenario_id" et "enum_etape_id" permettent respectivement de définir à quel scénario et quelle étape le logement correspond. 

![img_4.png](png/caracteristiques_generale.png)

![img_5.png](png/enum_scenario_id.png)

![img_6.png](png/enum_etape_id.png)


Dans cet exemple, le logement correspond à la première étape du scénario multi-étapes.
Remarque 1 : il est possible de spécifier le nom du scénario avec "nom_scenario".


Pour les scénarios et étapes la logique est la suivante pour fournir l'ensemble des objets logements :

**Etat initial**

* calcul/objet logement Etat initial (enum_scenario_id=0 et enum_etape_id=0)

**Pour le scénario multi étape « principal » enum_scenario_id=1**

* Faire autant de calculs/objet logement que d’étapes nécessaires à l’obtention de l’étiquette finale (de 2 à 5)
  * (enum_scenario_id=1 et enum_etape_id=1) etape première
  * (enum_scenario_id=1 et enum_etape_id=3)  etape intermediaire 1(prend en compte les travaux de l’étape première et de l’étape intermédiaire cumulés)
  * ...
  * (enum_scenario_id=1 et enum_etape_id=2) etape finale (prend en compte les travaux de l’étape première  des étapes intermédiaires et de l’étape finale cumulés)

**Pour le scénario en une seule étape « principal »**

* Faire un unique calcul/objet logement
  * enum_scenario_id = 2, enum_etape_id = 2 (c’est directement l’étape finale)

**Pour les scénarios complémentaires/alternatifs**

* utiliser les enum_scenario_id de 3 à 5 si multi étapes faire comme pour le scénario multi étape , si mono étape faire comme pour le scénario principal en une seule étape

ATTENTION : l'id de l'étape finale est toujours 2, les étapes complémentaires sont de 3 à 5

##### Etat Composant

Afin de mieux pouvoir identifier quel composant a été rénové par rapport à l'état existant, l'enum : "enum_etat_composant_id" a été ajouté dans toutes les "donnee_entree"

![img_1.png](png/etat_composant.png)

Il peut prendre la valeur : 1 ou 2 

![img_2.png](png/etat_composant_detailed.png)

##### Références obligatoires

Dans le XML de l'audit, cette balise doit être obligatoirement renseignée comme pour le DPE et l'unicité de chaque référence doit être garantie (il ne doit pas y avoir dans un même logement, deux objets avec la même référence).
Ces références sont en effet indispensables pour faire le lien avec l'objet "travaux_collection" qui est décrit un peu plus bas.

![img_4.png](png/ref.png)

#### AJOUTS MAJEURS

Dans l'objet "logement" de l'audit, une section "etape_travaux" a été ajoutée et contient toutes les informations exigées par l'audit règlementaire au niveau d'une étape.

![img_5.png](png/logement.png)

Remarque : Seul le "logement" correspondant à l'étape initiale (c'est-à-dire, le DPE qui a été réalisé) ne dispose pas de cette section "etape_travaux". En effet, elle ne bénéficie d'aucun travaux.

##### Etape Travaux

Comme stipulé dans l'arrêté relatif à l'audit énergétique règlementaire, la section "etape_travaux" contient les informations suivantes : 

Exprimé à la fois en : valeur absolue, en gain (par rapport à l'étape précédente) absolue et relatif (%), gain cumulé (par rapport à l'étape initiale) absolue et relatif (%)
* les consommations en EP et EF, par usage, avec et sans auto_consommation, par m² SHAB
* les emissions de GES, 5 usages, par m² SHAB
  
Ainsi que : 
* la classe d'émission GES et la classe bilan DPE
* le coût total des travaux de l'étape, ainsi que les coûts cumulés depuis l'étape initiale (en €TTC)
* le gain sur la facture d'énergie par rapport à l'étape précédente, ainsi qu'en cumulé (par rapport à l'étape initiale) 
* la mention des aides financières locales et nationales
![img_20.png](png/etape_travaux.png)
  
La section "etape_travaux" contient plusieurs collections de travaux 

![img_6.png](png/collections_de_travaux.png)



##### Travaux Collection

Dans "travaux_collection" sont indiqués les travaux principaux de l'étape.

![img_8.png](png/travaux_Collection.png)


Pour chaque travaux il faut spécifier le lot concerné (murs, planchers bas, toiture...) avec "enum_lot_travaux_audit_id", ainsi que le type de travaux réalisé (isolation en ITI, ITE ...) avec "enum_type_travaux_id".


Attention : le lot travaux "energie renouvelable" ne concerne que les systèmes de production d'éléctricité d'origine renouvellable (ex : Panneaux solaires photovoltaïques, éolienne). Les systèmes comme "Eau chaude sanitaire solaire" doivent être associé au lot : "système d'ecs".


Dans "reference_collection" il faut entrer toutes les références des objets de la modélisation DPE qui sont impactés par le travaux. 

![img_9.png](png/ref_col.png)

Remarque : si le travaux a un impact sur des ponts thermiques, il faut inclure la référence de ces ponts thermiques 

Il faut aussi renseigner dans la balise "cout" le coût total (en €TTC) du travaux appliqué sur l'ensemble des objets dans "reference_collection"

L'élément "description_collection" quant à lui, permet d'ajouter des descriptions sur les travaux en question.

![img_10.png](png/description travaux.png)

La description peut être accompagnée d'un pictogram grace à l'enum : "enum_picto_travaux_id"

![img_11.png](png/enum_picto_travaux_id.png)

##### Travaux Induits Collection

Dans la section "travaux_induits_collection" il est possible de renseigner les travaux secondaires, avec une description et un coût, induits par les travaux de performance énergétique renseignés dans "travaux_collection".

![img_12.png](png/travaux_induits_col.png)

##### Travaux Resume Collection

La section "travaux_resume_collection" a été ajoutée pour répondre à la demande de la DHUP de fournir une liste à cocher par l'auditeur, pour synthétiser les travaux de chaque étape, sur la page 8 de la trame "Scénarios de Travaux en un clin d'œil".

![img_13.png](png/travaux_resum_col.png)

La scetion est composée d'un ensemble de "travaux_resume" dans lequel on fixe la valeur de l'enum "enum_travaux_resume_collection_id":

![img_14.png](png/travaux_resum_enum.png)

### VUE ENSEMBLE LOGEMENT

Cette section a été ajouté à l'xml pour correspondre à la Trame de l'audit. 
![img.png](png/vue_ensemble_logement.png)

Elle a été sctucturé de même façon que la trame en page 4-5 

#### Description du bien collection
![img_1.png](png/img_1.png)
La sous-section "desciption_du_bien_collection" contient un ensemble d'objets "description_du_bien" permettant de sélectionner une rubrique "enum_rubrique_description_id" et d'y associer une description. 
![img_2.png](png/img_2.png)

#### Descriptif enveloppe collection
![img_3.png](png/img_3.png)

De même, cette sous-section est composée d'une collection d'objets "descriptif_enveloppe"
![img_4.png](png/img_4.png)
Pour chaque, il convient d'attribuer une catégorie grace à l'enum "enum_categorie_descriptif_enveloppe_id" (dans notre exemple, "0" pour "murs")

![img_5.png](png/img_5.png)

d'ajouter un nom, une description ainsi qu'un niveau de qualité d'isolation (moyen sur les composants associés) "qualite_isol" basé sur les règles de calcul dans la méthode DPE.

![img_6.png](png/img_6.png)

##### Cas particulier des menuiseries


![img_7.png](png/img_7.png)

Suite à la réunion DHUP-EDL-CSTB du 12/10/2022, il a été décidé que :
Pour cette rubrique "menuiseries", seul trois noms sont permis :
* "fenêtres"
* "porte-fenêtres"
* "porte"

Vous ne pouvez définir qu'un seul élément 'descriptif_enveloppe' pour chaque nom. C'est-à-dire un seul élément 'descriptif_enveloppe' dont la balise "nom" contient "fenêtres", un seul élément 'descriptif_enveloppe' dont la balise "nom" contient "porte-fenêtre" et un seul pour "porte".

Le niveau de qualité d'isolation "qualite_isol", est une moyenne pour l'ensemble des fenêtres du logement, de même pour les porte-fenêtre et les portes. Elle ne dépend pas de ce qui est renseigné dans la partie "description".

Dans la description, vous pouvez ajouter plusieurs lignes (avec "back slash" "n") pour préciser les principaux type de fenêtres/porte-fenêtre. Attention cependant, la somme du nombre de types de vitrage et du type de porte-fenêtre ne doit pas dépasser 4. 
S'il y a plus de 4 types de fenêtres/porte-fenêtres, il faut décrire les quatre types de parois vitrées principaux.

![img_1.png](png/xml_menuiserie)

![img_3.png](png/display_menuiserie.png)

Ex : Si dans l'objet avec le nom "fenêtres" vous avez déclaré dans "description" uniquement les fenêtres en "simple vitrage bois" alors qu'il en existe d'autres dans le logement. La "qualite_isol" devra quand même être une moyenne sur l'ensemble des fenêtres du logement.

#### Descriptif equipements collection

![img_8.png](png/img_8.png)

Cette sous-section est structurée de la même façon que pour "description_du_bien_collection". On retrouve un ensemble d'objets "descriptif_equipements" avec une catégorie et une description.

![img_9.png](png/img_9.png)

### EXPERTISE AUDITEUR

La section "expertise_auditeur" contient l'ensemble des éléments où l'auditeur peut se prononcer, souvent via du champ texte.
Tous ces éléments apparaissent dans la trame de l'audit.
![img_10.png](png/img_10.png)

#### Pathologie caractéristique collection

Correcpond à la partie en p6 de la trame.
![img_11.png](png/img_11.png)

pour chaque élément "pathologie_caracteristique" il convient de préciser: 
![img_13.png](png/img_13.png)

un uri d'une image (ATTENTION : la balise est limitée à 255 charactères). 
Sélectionnez le type d'observation avec l'enum "enum_type_observation_id":

![img_14.png](png/img_14.png)

Une description (obligatoire) et un conseil (facultatif).

#### Recommandation auditeur collection

Il s'agit des recommandations accociées à chaque scénario dans la trame :
![img_16.png](png/img_16.png)

La section est composée d'un ensemble d'objets "recommandation_scenario" avec : un champ texte pour la recommandation et d'un identifiant de scénario "enum_scenario_id".
![img_15.png](png/img_15.png)

#### explications_personnalisees et observations_auditeur

ces balises sont destinées à accueillir les textes qui apparaissent sur la trame en pages 6-7.  
![img_17.png](png/img_17.png)

![img_18.png](png/img_18.png)

![img_19.png](png/img_19.png)
### FICHE TECHNIQUE COLLECTION

Voir la documentation DPE

## FAQ

### nom du scénario

Il existe une balise dans caracteristique_generale nom_scenario optionnelle qui permet de préciser le nom du scénario tel qu'affiché dans le rapport audit

### Pourquoi les enum_lot_travaux_id (DPE) et enum_lot_travaux_audit_id sont différent

La liste des lots de travaux dans le DPE est potentiellement moins détaillée que l'audit il a été décidé de séparer en deux objets distincts pour que les deux dispositifs puissent évoluer de manière différencié. 
La seule différence existante pour le moment est de laisser un auditeur proposer des travaux qui ne seraient pas dans les 9 lots identifiés dans le DPE pour ne pas le bloquer d'où la catégorie "autre" ajoutée.

### Il y a des différences entre enum_lot_travaux_audit_id (lot de travaux), enum_travaux_resume_id (catégories des résumés de travaux)

La liste arrêté par la DHUP sur les résumés de travaux est en effet différente de la segmentation par lot des travaux

### Est-ce qu'il y a un nombre maximum d'étapes dans un scénario ? 

Oui, le nombre d'étapes a été fixé à 5 (état initial exclu). Il n'est pas possible d'en mettre plus car l'identifiant pour les étapes "enum_etape_id" est défini ainsi : 
![img_6.png](png/enum_etape_id.png)

### Dans quel lot de travaux considérer l'ECS solaire ? "energie renouvelable" ou  "système d'ecs" ?

Attention : le lot travaux "energie renouvelable" ne concerne que les systèmes de production d'éléctricité d'origine renouvellable (ex : Panneaux solaires photovoltaïques, éolienne). Les systèmes comme "Eau chaude sanitaire solaire" doivent être associé au lot : "système d'ecs".
