from flask import Flask, current_app
from flask import request, jsonify, send_file
from flask_swagger_ui import get_swaggerui_blueprint
from controle_coherence.validation import procedure_validation, procedure_validation_audit
from controle_coherence.controle_coherence import EngineDPE, EngineAudit
from controle_coherence import __version_dpe__, __xsdversion__, __xsdversion_audit__, __version_audit__, __svc_version__,__version_global__
from controle_coherence.utils import _set_version_audit_to_valid_dates,_set_version_dpe_to_valid_dates, traduction_xml_inplace as traduction_xml_func, traduction_xml_new_element
from controle_coherence.utils_convert_excel import traduction_xml_excel, cleanup_excel_folder
from pathlib import Path
import json
import lxml
from lxml import etree
from waitress import serve
import traceback as tb
import logging
import time
import os
import sys
import io
import distro

# Get the docker linux name
os_name = distro.name()

# Get the docker linux version
os_version = distro.version()


app = Flask(__name__)
logger = logging.getLogger('waitress')
log_level = os.environ.get("LOG_LEVEL", "DEBUG")
log_level_dict = {k: getattr(logging, k) for k in ["DEBUG", 'INFO', 'WARNING', 'ERROR', 'CRITICAL']}
FORMAT = "%(asctime)s %(levelname)-8s %(message)s"
logging.basicConfig(format=FORMAT, level=log_level_dict.get(log_level, 'INFO'), datefmt='%Y-%m-%d %H:%M:%S')

if len(sys.argv) > 1:
    DISABLE_DATE_RESTRICTION = int(sys.argv[1])
else:
    DISABLE_DATE_RESTRICTION = int(os.environ.get("DISABLE_DATE_RESTRICTION", 0))

if DISABLE_DATE_RESTRICTION == 1:
    _set_version_dpe_to_valid_dates()
    _set_version_audit_to_valid_dates()

    logger.warning('WARNING : DATES DE VALIDITE DES VERSIONS DESACTIVEES')

if len(sys.argv) > 2:
    delat_t_delete = int(sys.argv[2])
else:
    delat_t_delete = int(os.environ.get("delat_t_delete", 3600))  # une heure par défaut

excel_folder = Path('excel_folder')
excel_folder.mkdir(exist_ok=True, parents=True)


def load_xml_object(request,recover_parse=False):


    error = None
    xml_tree = None
    if request.data:

        try:
            if recover_parse is False:
                xml_tree = etree.ElementTree(etree.fromstring(request.data))
            else:
                parser = lxml.etree.XMLParser(recover=True)
                xml_tree = etree.ElementTree(etree.fromstring(request.data,parser=parser))
        except Exception:
            error = f"""
impossible de lire le fichier xml envoyé de taille : {len(request.data)}.' 
Extrait du fichier :
{request.data[0:100]}
"""
    else:
        error = 'no data provided'
    return xml_tree, error


def run_procedure_validation(request, debug=False,datetime_now=None):
    try:
        # charger xml
        logger.debug('requête reçue par le service controle_coherence : traitement du xml en cours')
        tstart = time.time()
        xml_tree, error = load_xml_object(request)
        if error is not None:
            logger.warning(error)
            return error, 400

        try:  # procedure de validation
            resp = procedure_validation(xml_tree, debug=debug,datetime_now=datetime_now)
            resp.update({"xsd_version": __xsdversion__,
                         'moteur_coherence_version': __version_dpe__})
        except Exception as e:
            msg = f"""ERREUR INTERNE DU MOTEUR DE CONTROLE DE COHERENCE
    {tb.format_exc()}
            """
            logger.error(msg)
            return msg, 500

        nb_errors = len(resp['erreur_logiciel']) + len(resp['erreur_saisie'])
        if nb_errors > 0:
            logger.debug(f"le fichier xml comporte {nb_errors} erreurs relevées par les controles de cohérences et n'est pas valide")
        if resp['validation_xsd']['valid'] is False:
            logger.debug(f"le fichier xml comporte des erreurs de validation xsd")
        if resp['validation_xsd']['valid'] is True and nb_errors == 0:
            logger.debug(f"le fichier xml a passé tous les contrôles avec succès et est valide pour dépot.")
        logger.debug(f'traitement du xml terminé en {(time.time() - tstart) * 1000} ms')
    except Exception as e:
        msg = f"""ERREUR INTERNE DU MOTEUR DE CONTROLE DE COHERENCE
        {tb.format_exc()}
                """
        logger.error(msg)
        return msg, 500

    return jsonify(resp), 200


def run_procedure_validation_audit(request, debug=False,datetime_now=None):
    try:
        # charger xml
        logger.debug('requête reçue par le service controle_coherence : traitement du xml en cours')
        tstart = time.time()
        xml_tree, error = load_xml_object(request)
        if error is not None:
            logger.warning(error)
            return error, 400

        try:  # procedure de validation
            resp = procedure_validation_audit(xml_tree, debug=debug,datetime_now=datetime_now)
            resp.update({"xsd_version_audit": __xsdversion_audit__,
                         'controle_coherence_audit_version': __version_audit__})
        except Exception as e:
            msg = f"""ERREUR INTERNE DU MOTEUR DE CONTROLE DE COHERENCE
    {tb.format_exc()}
            """
            logger.error(msg)
            return msg, 500

        nb_errors = len(resp['erreur_logiciel']) + len(resp['erreur_saisie'])
        if nb_errors > 0:
            logger.debug(f"le fichier xml comporte {nb_errors} erreurs relevées par les controles de cohérences et n'est pas valide")
        if resp['validation_xsd']['valid'] is False:
            logger.debug(f"le fichier xml comporte des erreurs de validation xsd")
        if resp['validation_xsd']['valid'] is True and nb_errors == 0:
            logger.debug(f"le fichier xml a passé tous les contrôles avec succès et est valide pour dépot.")
        logger.debug(f'traitement du xml terminé en {(time.time() - tstart) * 1000} ms')
    except Exception as e:
        msg = f"""ERREUR INTERNE DU MOTEUR DE CONTROLE DE COHERENCE
        {tb.format_exc()}
                """
        logger.error(msg)
        return msg, 500

    return jsonify(resp), 200


SWAGGER_URL = '/ui'
API_URL = '/static/openapi.yaml'
SWAGGERUI_BLUEPRINT = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "controle_coherence"
    }
)
app.register_blueprint(SWAGGERUI_BLUEPRINT, url_prefix=SWAGGER_URL)


@app.route('/')
def homepage():
    return 'bienvenue sur le webservice controle de cohérence DPE'


@app.route("/traduction_xml", methods=['POST'])
def traduction_xml():
    dpe, error = load_xml_object(request)
    engine = EngineDPE()
    dpe = traduction_xml_func(dpe, engine)
    return etree.tostring(dpe, pretty_print=True, encoding='utf-8').decode(), 200


@app.route("/traduction_xml_audit", methods=['POST'])
def traduction_xml_audit():
    audit, error = load_xml_object(request)
    engine = EngineAudit()
    audit = traduction_xml_func(audit, engine)
    return etree.tostring(audit, pretty_print=True, encoding='utf-8').decode(), 200


@app.route("/traduction_xml_audit_no_enum", methods=['POST'])
def traduction_xml_audit_no_enum():
    audit, error = load_xml_object(request)
    engine = EngineAudit()
    audit = traduction_xml_new_element(audit, engine)
    return etree.tostring(audit, pretty_print=True, encoding='utf-8').decode(), 200


@app.route("/traduction_xml_no_enum", methods=['POST'])
def traduction_xml_no_enum():
    dpe, error = load_xml_object(request)
    engine = EngineDPE()
    dpe = traduction_xml_new_element(dpe, engine)
    return etree.tostring(dpe, pretty_print=True, encoding='utf-8').decode(), 200


@app.route("/traduction_xml_to_excel_audit", methods=['POST'])
@app.route("/traduction_xml_to_excel_dpe", methods=['POST'])
def traduction_xml_to_excel_dpe():
    try:
        xml, error = load_xml_object(request,recover_parse=True)
        numero_xml = xml.find('numero_dpe')
        if numero_xml is None:
            numero_xml = xml.find('numero_audit')

        if numero_xml is None:
            error = "le xml fourni n'a pas de numéro de DPE ou de numéro d'audit. Ceci n'est pas un xml valide pour le traducteur xml"
            logger.warning(error)
            return error, 400
        else:
            numero_xml=numero_xml.text
        file_path = traduction_xml_excel(xml, excel_folder)
        return_data = io.BytesIO()
        with open(file_path, 'rb') as fo:
            return_data.write(fo.read())
        # (after writing, cursor will be at last byte, so move it to start)
        return_data.seek(0)
        os.remove(file_path)

        return send_file(return_data, mimetype='application/vnd.ms-excel',
                         download_name=f'{numero_xml}.xlsx', as_attachment=True)
    except Exception as e:
        msg = f"""ERREUR INTERNE DU MOTEUR DE CONTROLE DE COHERENCE
        {tb.format_exc()}
                """
        logger.error(msg)
        return msg, 500
    finally:
        cleanup_excel_folder(excel_folder, delat_t_delete=delat_t_delete)


@app.route("/controle_coherence", methods=['POST'])
def controle_coherence():
    return run_procedure_validation(request)



@app.route("/controle_coherence_test_1_janvier_2026", methods=['POST'])
def controle_coherence_test_1_janvier_2026():
    return run_procedure_validation(request,datetime_now='2026-01-01')

@app.route("/controle_coherence_audit", methods=['POST'])
def controle_coherence_audit():
    return run_procedure_validation_audit(request)

@app.route("/controle_coherence_audit_test_1_janvier_2026", methods=['POST'])
def controle_coherence_audit_test_1_janvier_2026():
    return run_procedure_validation_audit(request,datetime_now='2026-01-01')

@app.route("/controle_coherence_debug", methods=['POST'])
def controle_coherence_debug():
    return run_procedure_validation(request, debug=True)


@app.route("/health", methods=['get'])
def health():
    return jsonify(msg={"status": "up"})


@app.route("/clean_house", methods=['get'])
def clean_house():
    count = 0
    for a_file in Path('.').iterdir():
        if a_file.name.endswith('.xlsx'):
            a_file.unlink()
            count += 1
    return f"house cleaned {count} file removed", 200


@app.route("/version", methods=['get'])
def version():
    return jsonify(msg={"os_version": f"OS: {os_name} {os_version}",
                        "xsd_dpe_version": __xsdversion__,
                        "xsd_version_audit": __xsdversion_audit__,
                        "svc_controle_coherence": __svc_version__,
                        "controle_coherence_audit_version": __version_audit__,
                        'controle_coherence_dpe_version': __version_dpe__,
                        'global_version': __version_global__})

def before_serve(app):


    logger.info(f"OS: {os_name} {os_version}")
    logger.info(f'version globale du dépôt observatoire dpe : {__version_global__}')
    logger.info(f'webservice contrôle de cohérence : {__svc_version__}')
    logger.info(f'contrôle de cohérence DPE : {__version_dpe__}')
    logger.info(f'contrôle de cohérence audit : {__version_audit__}')
    logger.info(f'version du xsd DPE : {__xsdversion__}')
    logger.info(f'version du xsd audit : {__xsdversion_audit__}')

    return app


if __name__ == "__main__":
    from waitress import serve

    serve(before_serve(app), host="0.0.0.0", port=5000)
