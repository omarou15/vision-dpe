*	E_altitude : classe_altitude (décalage d’1 de la numérotation)

*	E_eqpt_intermittence E_eqpt_intermittence_collectif : equipement_intermittence (décalage d’1 de la numérotation et regroupement des deux énums)

*	E_inclinaison_capteur : inclinaison_pv cela correspond mais les docs sont différentes TRIBU : 0-30-60-90 OBSERVATOIRE : ≤ 15° ,15° <   ≤ 45° ,45° <   ≤ 75°, > 75° comme dans la méthode

*	E_Inertie : classe_inertie : pas de correspondance car enum inversés et distinction lourde/très lourde dans l’observatoire

*	E_orientation_capteur : orientation_pv -> ok

*	E_type_exposition_facade : plusieurs_facade_exposee enum côté tribu/ booléen coté observatoire et la logique est inversée plusieurs_facades_exposees = 0 chez tribu et 1 dans l’observatoire

*	E_type_solaire : type_installation_solaire  Manque chauffage solaire seul coté TRIBU et la correspondance des enums en est donc décalé.

*	E_type_ventilation  : type_ventilation (décalage d’1 de la numérotation)

*	E_zone_climatique : zone_climatique -> ok

*	energie_generateur : type_energie Pas de correspondance car le périmètre de description est différent (détail des combustibles bois, Propane, Butane, GPL, Electricité d’origine renouvelable)

*	id_installation : cfg_installation_ch correspondance partielle mais enum 12 à 14 présents en plus dans les enums observatoire

*	id_installation_ECS : cfg_installation_ecs dans l’observatoire il y a un enum en plus pour identifier les installations avec du solaire.
