import os
import importlib
import types
import numpy as np
import copy
from lxml.etree import SubElement, Element
from controle_coherence.assets_dpe import versions_dpe_cfg
from controle_coherence.assets_audit import versions_audit_cfg

# Sauvegarde des versions avant modification
versions_dpe_cfg_backup = copy.deepcopy(versions_dpe_cfg)
versions_audit_cfg_backup = copy.deepcopy(versions_audit_cfg)

def reload_package(package):
    assert (hasattr(package, "__package__"))
    fn = package.__file__
    fn_dir = os.path.dirname(fn) + os.sep
    module_visit = {fn}
    del fn

    def reload_recursive_ex(module):
        importlib.reload(module)

        for module_child in vars(module).values():
            if isinstance(module_child, types.ModuleType):
                fn_child = getattr(module_child, "__file__", None)
                if (fn_child is not None) and fn_child.startswith(fn_dir):
                    if fn_child not in module_visit:
                        # print("reloading:", fn_child, "from", module)
                        module_visit.add(fn_child)
                        reload_recursive_ex(module_child)

    return reload_recursive_ex(package)


def get_duplicates(a_list):
    seen = set()
    dupes = []

    for x in a_list:
        if x in seen:
            dupes.append(x)
        else:
            seen.add(x)
    return dupes


def get_uniques(a_list):
    seen = set()
    uniq = []
    for x in a_list:
        if x not in seen:
            uniq.append(x)
            seen.add(x)
    return a_list


def convert_xml_text(text):
    """

    Parameters
    ----------
    text : str

    Returns
    -------
    resp : str,int,float
        converted text from xml in native python type.
    """

    if text is None:
        return text
    else:
        if (text.startswith(',') or text.startswith('.')) and text.endswith(tuple([str(el) for el in range(0, 10)])):
            text = '0' + text
        try:

            text_conv = int(text.replace(',', '.'))

        except ValueError:

            try:

                text_conv = float(text.replace(',', '.'))

            except ValueError:

                text_conv = text.replace('\n', '').replace('\t', '')

        return text_conv


def element_to_value_dict(el, convert=True):
    a_dict = dict()
    for sub_el in el.getchildren():
        if len(sub_el.getchildren()) == 0:
            if sub_el.text is not None:
                a_dict[sub_el.tag] = sub_el.text
                if convert is True:
                    a_dict[sub_el.tag] = convert_xml_text(a_dict[sub_el.tag])
    if 'Index' in a_dict:
        a_dict['Index'] = str(a_dict['Index'])
    return a_dict


def remove_null_elements(xml):
    namespaces = {'xsi': "http://www.w3.org/2001/XMLSchema-instance"}
    for null_el in xml.xpath('//*[@xsi:nil="true"]', namespaces=namespaces):
        null_el.getparent().remove(null_el)


def create_sub_el(element, varname, value):
    subel = element.find(varname)
    if subel is None:
        subel = SubElement(element, varname)
    subel.text = str(value)


def remove_sub_el(element, varname):
    subel = element.find(varname)
    if subel is not None:
        element.remove(subel)


def set_xml_values_from_dict(el, a_dict):
    for k, v in a_dict.items():

        subel = el.find(k)
        if subel is not None:
            if v is not None:
                subel.text = str(v)
        else:
            subel = SubElement(el, k)
            subel.text = str(v)


def _set_version_dpe_to_valid_dates():
    for k, v in versions_dpe_cfg.items():
        v['start_date'] = '2021-01-01'
        v['end_date'] = '2200-01-01'
        v['end_date_compare_now'] = '2200-01-01'

# Restaurer les valeurs originales
def _restore_version_dpe_cfg():
    versions_dpe_cfg.clear()
    versions_dpe_cfg.update(copy.deepcopy(versions_dpe_cfg_backup))

def _set_version_audit_to_valid_dates():
    for k, v in versions_audit_cfg.items():
        v['start_date'] = '2021-01-01'
        v['end_date'] = '2200-01-01'
        v['end_date_compare_now'] = '2200-01-01'

# Restaurer les valeurs originales
def _restore_version_audit_cfg():
    versions_audit_cfg.clear()
    versions_audit_cfg.update(copy.deepcopy(versions_audit_cfg_backup))

def traduction_xml_inplace(xml, engine):
    remove_null_elements(xml)

    for el in xml.iterfind('*//*'):

        if el.tag.startswith('enum_'):
            if el.text is not None:
                txt = el.text
                is_int = 0
                try:
                    int(el.text)
                    is_int = 1
                except Exception:
                    is_int = 0
                if is_int == 1:
                    el.text = str(engine.display_enum_traduction(el.tag, int(el.text))[int(el.text)]).lower().strip()
        if el.tag.startswith('qualite_isol_'):
            el.text = engine.enum_dict['enum_qualite_composant_id'][int(el.text)].lower().strip()

    return xml


def traduction_xml_new_element(xml, engine):
    remove_null_elements(xml)
    for el in xml.iterfind('*//*'):

        if el.tag.startswith('enum_'):
            if el.text is not None:
                txt = el.text
                is_int = 0
                try:
                    int(el.text)
                    is_int = 1
                except Exception:
                    is_int = 0
                if is_int == 1:
                    txt = str(engine.display_enum_traduction(el.tag, int(el.text))[int(el.text)]).lower().strip()
                name_wo_id = '_'.join(el.tag.split('_')[1:-1])
                new_el = Element(name_wo_id)
                new_el.text = txt
                el.addnext(new_el)
                el.getparent().remove(el)
        if el.tag.startswith('qualite_isol_'):
            el.text = engine.enum_dict['enum_qualite_composant_id'][int(el.text)].lower().strip()

    return xml


def calc_seuil_interpolate(surface_reference, seuil_table):

    surface_reference = np.maximum(surface_reference, 8)
    ceil_surface_reference = int(np.ceil(surface_reference))
    ceil_seuils = seuil_table.loc[ceil_surface_reference]
    # si en dessous de 8m² pas d'interpolation
    if surface_reference <= 8:
        seuils = ceil_seuils
    else:
        floor_seuils = seuil_table.loc[ceil_surface_reference - 1]

        diff_ceil = ceil_surface_reference - surface_reference

        seuils = floor_seuils * diff_ceil + ceil_seuils * (1 - diff_ceil)
    s = seuils.to_frame('max')
    # on ajoute G
    s.loc['G', :] = np.inf
    s['min'] = s['max'].shift(1).fillna(-np.inf)

    s = s[['min', 'max']]
    s = s.to_dict(orient='index')

    s = {k: list(v.values()) for k, v in s.items()}
    return s
