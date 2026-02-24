# 2021 04 21 2.0.0

* refacto des versions et changement de structure pour les contrôles de cohérences -> séparé en 3 objets , controle coherence audit, controle coherence DPE et svc controle coherence

# 2021 06 01 2.1.0 

* ajout d'un retour d'une propriete mode_test dans le json de retour DPE

* ajout d'une route traduction_xml_audit pour traduire les xml d'audit

# 47-faire-un-cas-test-traduit 

* la traduction a été implémentée dans utils pour être utilisé dans d'autres parties du code

# 2022-12-13 2.2.0

* ajout d'une route de traduction xml excel:  traduction_xml_to_excel_dpe (renvoi un excel à partir d'un xml dpe en entrée)

* ajout de routes de traduction xml avec suppression des enum_ : traduction_xml_audit_no_enum et traduction_xml_no_enum

# 2023-02-09 2.3.0

* conversion xml -> excel : correction d'un bug pour les éléments avec des données d'entrées mais sans données intermédiaires.

* ajout d'un convertisseur xml -> excel audit

* correction d'un bug qui faisait crasher l'export xml traduit , excel en cas de xsi:nil dans le xml source

# 2023-03-27 2.3.1

* fix sur la route /version pour la version du contrôle cohérence audit

# 2023-10-12 2.3.2

* fix Werkzeug==2.2.2 pour éviter des import error dans flask https://stackoverflow.com/questions/77213053/importerror-cannot-import-name-url-quote-from-werkzeug-urls

# 2024-05-20 3.0.0

* mise à jour de toutes les librairies 

```Flask==3.0.3
flask-swagger-ui==4.11.1
lxml==5.2.2
MarkupSafe==2.1.5
openpyxl==3.1.2
packaging==24.0
pandas==2.2.2
python-dateutil==2.9.0.post0
pytz==2024.1
PyYAML==6.0.1
requests==2.32.0
six==1.16.0
tzdata==2024.1
urllib3==2.2.1
waitress==3.0.0
Werkzeug==3.0.3
XlsxWriter==3.2.0
```

mise à jour de l'image docker de python 3.8.5 en python 3.12 alpine


# 2024-05-24 3.1.0

* ajout de deux routes de tests post 1er juillet pour tester le fonctionnement post 1er juillet

* /controle_coherence_test_1er_juillet
* /controle_coherence_audit_test_1er_juillet

# 2024-05-26 3.1.1

* ajout de deux routes de tests post contrôle bloquant reseau de chaleur

* /controle_coherence_test_1_janvier_2026
* /controle_coherence_audit_test_1_janvier_2026

# 2025-01-31 3.1.2

* Ajout dans la route : https://obs-dpe-controle-coherence.dimn-cstb.fr/version 
  * Nouvel attribut "global_version" dans le corps JSON de la réponse HTTP (correspond à la version globale DPE/Audit)


# 2025-03-17 3.2.0

* ajout de la sous structure information_consentement_proprietaire et information_formulaire_consentement dans les exports excel

# 2025-10-10 3.2.1

* ajout de deux routes de tests post 1er janvier 2026 pour tester le fonctionnement post 1er janvier

* /controle_coherence_test_1_janvier_2026
* /controle_coherence_audit_test_1_janvier_2026
