import ast
import pandas as pd
from pathlib import Path

FILES = ["controle_coherence.py"]

class MsgExtractor(ast.NodeVisitor):
    def __init__(self):
        self.current_class = None
        self.current_method = None
        self.messages = []
        self.assignments = {}  # stocke les variables locales

    def extract_related_objects(self, value):
        if isinstance(value, ast.Name):
            return value.id
        if isinstance(value, ast.Constant):
            return str(value.value)
        if isinstance(value, ast.List):
            return [self.extract_related_objects(elt) for elt in value.elts]

        if isinstance(value, ast.Call) and isinstance(value.func, ast.Attribute):
            func_owner = self.extract_related_objects(value.func.value)
            func_name = value.func.attr
            args = [self.extract_related_objects(arg) for arg in value.args]

            # Cas spécial: xml_reg.find("xpath")
            if func_name == "find" and args and isinstance(value.args[0], ast.Constant):
                return f"{func_owner}.find('{value.args[0].value}')"

            # Autres appels: afficher fonction + args
            return f"{func_owner}.{func_name}({', '.join(args)})"

        return "DYNAMIQUE"


    def visit_ClassDef(self, node):
        prev_class = self.current_class
        self.current_class = node.name
        self.generic_visit(node)
        self.current_class = prev_class

    def visit_FunctionDef(self, node):
        prev_method = self.current_method
        self.current_method = node.name
        self.assignments = {}
        self.generic_visit(node)
        self.current_method = prev_method

    def extract_string(self, value):
        # --- Chaînes simples ---
        if isinstance(value, ast.Constant) and isinstance(value.value, str):
            return value.value
        if isinstance(value, ast.Str):  # compat Python <3.8
            return value.s

        # --- f-strings ---
        if isinstance(value, ast.JoinedStr):
            parts = []
            for el in value.values:
                if isinstance(el, ast.Constant) and isinstance(el.value, str):
                    parts.append(el.value)
                elif isinstance(el, ast.FormattedValue):
                    expr = el.value
                    if isinstance(expr, ast.Name):
                        parts.append("{" + expr.id + "}")
                    elif isinstance(expr, ast.Attribute):
                        parts.append("{" + expr.attr + "}")
                    elif isinstance(expr, ast.Call) and isinstance(expr.func, ast.Attribute):
                        # ex: self.get_enum_version(xml_reg)
                        owner = self.extract_related_objects(expr.func.value)
                        func = expr.func.attr
                        args = [self.extract_related_objects(a) for a in expr.args]
                        str_args = [str(a) if not isinstance(a, list) else "[" + ", ".join(map(str, a)) + "]" for a in args]
                        parts.append("{" + f"{owner}.{func}({', '.join(str_args)})" + "}")
                    else:
                        parts.append("{dyn}")
            return "".join(parts)

        # --- Concaténation de chaînes ---
        if isinstance(value, ast.BinOp) and isinstance(value.op, ast.Add):
            left = self.extract_string(value.left)
            right = self.extract_string(value.right)

            if (left is None or left == "DYNAMIQUE") and (right is None or right == "DYNAMIQUE"):
                return "DYNAMIQUE"

            left = left if left not in (None, "DYNAMIQUE") else "{dyn}"
            right = right if right not in (None, "DYNAMIQUE") else "{dyn}"
            return left + right

        # --- Appel de fonction pur ---
        if isinstance(value, ast.Call):
            if isinstance(value.func, ast.Attribute):
                func_owner = self.extract_related_objects(value.func.value)
                func_name = value.func.attr
                args = [self.extract_related_objects(a) for a in value.args]
                return f"GENERE_PAR: {func_owner}.{func_name}({', '.join(map(str, args))})"
            elif isinstance(value.func, ast.Name):
                func_name = value.func.id
                args = [self.extract_related_objects(a) for a in value.args]
                return f"GENERE_PAR: {func_name}({', '.join(map(str, args))})"

        return None

    def visit_Assign(self, node):
        # Stocke les affectations simples ex: msg_type = "..."
        for target in node.targets:
            if isinstance(target, ast.Name):
                var = target.id
                new_val = node.value
                if var in self.assignments:
                    # Déjà une valeur -> fusion
                    existing = self.assignments[var]
                    if not isinstance(existing, list):
                        existing = [existing]
                    existing.append(new_val)
                    self.assignments[var] = existing
                else:
                    self.assignments[var] = new_val
        self.generic_visit(node)

    def visit_AugAssign(self, node):
        # Gère les += ex: msg += "..."
        if isinstance(node.target, ast.Name):
            var = node.target.id
            prev_val = self.extract_string(self.assignments.get(var, ast.Constant(value="")))
            new_val = self.extract_string(node.value)

            if prev_val == "DYNAMIQUE" and new_val == "DYNAMIQUE":
                combined = "DYNAMIQUE"
            else:
                if prev_val is None: prev_val = "{dyn}"
                if new_val is None: new_val = "{dyn}"
                combined = prev_val + new_val

            self.assignments[var] = ast.Constant(value=combined)
        self.generic_visit(node)

    def resolve_var(self, varname):
        """Essaie de retrouver la valeur d'une variable connue"""
        if varname in self.assignments:
            vals = self.assignments[varname]

            # Si plusieurs valeurs possibles (liste)
            if isinstance(vals, list):
                extracted_vals = [self.extract_string(v) or "DYNAMIQUE" for v in vals]
                extracted_vals = list(set(extracted_vals))  # dédoublonner
                return " OU ".join(extracted_vals)

            # Cas simple : une seule valeur
            extracted = self.extract_string(vals)
            if extracted:
                return extracted
            else:
                return "DYNAMIQUE"

        return "DYNAMIQUE"

    def visit_Call(self, node):
        if isinstance(node.func, ast.Attribute) and node.func.attr == "generate_msg":
            args = {"msg": None, "msg_type": None, "msg_theme": None,
                    "msg_importance": None, "related_objects": None}

            # --- MSG (positional ou variable) ---
            if node.args:
                first_arg = node.args[0]
                if isinstance(first_arg, (ast.Str, ast.Constant, ast.JoinedStr, ast.BinOp)):
                    args["msg"] = self.extract_string(first_arg)
                elif isinstance(first_arg, ast.Name):
                    args["msg"] = self.resolve_var(first_arg.id)

            # --- Keywords ---
            for kw in node.keywords:
                if kw.arg in args:
                    if isinstance(kw.value, (ast.Str, ast.Constant, ast.JoinedStr, ast.BinOp)):
                        args[kw.arg] = self.extract_string(kw.value)
                    elif isinstance(kw.value, ast.Name):
                        # Chercher dans les affectations locales
                        args[kw.arg] = self.resolve_var(kw.value.id)
                    else:
                        args[kw.arg] = "DYNAMIQUE"

            # Déterminer le type de contrôle
            if self.current_class == "CoreEngine":
                controle_type = "Commun"
            elif "DPE" in (self.current_class or ""):
                controle_type = "DPE"
            elif "Audit" in (self.current_class or ""):
                controle_type = "Audit"
            else:
                controle_type = "Inconnu"

            related = None
            for kw in node.keywords:
                if kw.arg == "related_objects":
                    related = self.extract_related_objects(kw.value)

            self.messages.append({
                "msg": args["msg"],
                "msg_type": args["msg_type"],
                "msg_theme": args["msg_theme"],
                "msg_importance": args["msg_importance"],
                "related_objects": related,
                "controle_type": controle_type,
                "methode": self.current_method,
                "classe": self.current_class,
            })

        self.generic_visit(node)


def extract_from_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=file_path)
    extractor = MsgExtractor()
    extractor.visit(tree)
    return extractor.messages


def main():
    all_msgs = []
    for file in FILES:
        all_msgs.extend(extract_from_file(file))

    df_auto = pd.DataFrame(all_msgs)

    # 🔴 Méthodes à exclure de l'analyse auto
    exclude_methods = ["controle_coherence_reseau_chaleur", "controle_coherence_calcul_ue", "controle_coherence_declaration_numero_fiscal_local"]
    df_auto = df_auto[~df_auto["methode"].isin(exclude_methods)]

    # 🟢 Charger le fichier Excel statique
    static_file = Path("../excel_folder/static_base_inventory.xlsx")
    if static_file.exists():
        df_static = pd.read_excel(static_file)
    else:
        print("⚠️ Fichier static_base_inventory.xlsx non trouvé, uniquement export auto")
        df_static = pd.DataFrame(columns=df_auto.columns)

    # Fusionner les deux
    df_final = pd.concat([df_auto, df_static], ignore_index=True)

    # Exporter
    output_file = Path("../excel_folder/inventaire_messages.xlsx")
    df_final.to_excel(output_file, index=False)
    print(f"✅ Inventaire généré avec fusion statique : {output_file.absolute()}")



if __name__ == "__main__":
    main()
