/**
 * EntonnorSelect — Sélection progressive 3 niveaux
 *
 * Principe UX (CDC v3 section 9) :
 * Niveau 1 — Catégorie (chips grands boutons) : "Chaudière", "PAC", "Poêle", etc.
 * Niveau 2 — Sous-catégorie (chips filtre) : "PAC air/eau", "PAC air/air", etc.
 * Niveau 3 — Type précis (select ou radio) : "PAC air/eau >= 2015", etc.
 * Résultat : enum_id envoyé au service
 *
 * Le diagnostiqueur ne voit jamais 171 options d'un coup.
 */

import { useState, useEffect, useMemo } from "react";

// ════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════

export interface EntonnorItem {
  /** enum_id ADEME (valeur envoyée au XML) */
  id: string;
  /** Libellé affiché à l'utilisateur */
  label: string;
  /** Catégorie niveau 1 */
  categorie: string;
  /** Sous-catégorie niveau 2 */
  sous_categorie: string;
  /** Description courte optionnelle */
  description?: string;
}

export interface EntonnorSelectProps {
  /** Liste complète des items (171 pour chauffage, 134 pour ECS) */
  items: EntonnorItem[];
  /** Valeur sélectionnée (enum_id) */
  value: string | null;
  /** Callback de sélection */
  onChange: (enumId: string | null) => void;
  /** Label du champ */
  label?: string;
  /** Placeholder quand rien n'est sélectionné */
  placeholder?: string;
  /** Désactivé */
  disabled?: boolean;
}

// ════════════════════════════════════════════════════════════
// Composant
// ════════════════════════════════════════════════════════════

export function EntonnorSelect({
  items,
  value,
  onChange,
  label,
  placeholder = "Sélectionner un type…",
  disabled = false,
}: EntonnorSelectProps) {
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null);
  const [selectedSousCategorie, setSelectedSousCategorie] = useState<string | null>(null);

  // Extraire les catégories uniques (niveau 1)
  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    for (const item of items) {
      cats.set(item.categorie, (cats.get(item.categorie) || 0) + 1);
    }
    return Array.from(cats.entries()).map(([name, count]) => ({ name, count }));
  }, [items]);

  // Sous-catégories filtrées par catégorie sélectionnée (niveau 2)
  const sousCategories = useMemo(() => {
    if (!selectedCategorie) return [];
    const subs = new Map<string, number>();
    for (const item of items) {
      if (item.categorie === selectedCategorie) {
        subs.set(item.sous_categorie, (subs.get(item.sous_categorie) || 0) + 1);
      }
    }
    return Array.from(subs.entries()).map(([name, count]) => ({ name, count }));
  }, [items, selectedCategorie]);

  // Items filtrés par catégorie + sous-catégorie (niveau 3)
  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.categorie === selectedCategorie &&
        item.sous_categorie === selectedSousCategorie
    );
  }, [items, selectedCategorie, selectedSousCategorie]);

  // Initialiser la sélection depuis la valeur existante
  useEffect(() => {
    if (value) {
      const item = items.find((i) => i.id === value);
      if (item) {
        setSelectedCategorie(item.categorie);
        setSelectedSousCategorie(item.sous_categorie);
      }
    }
  }, [value, items]);

  // Trouver le libellé de la valeur sélectionnée
  const selectedItem = value ? items.find((i) => i.id === value) : null;

  function handleCategorieClick(cat: string) {
    if (selectedCategorie === cat) {
      // Déselectionner
      setSelectedCategorie(null);
      setSelectedSousCategorie(null);
      onChange(null);
    } else {
      setSelectedCategorie(cat);
      setSelectedSousCategorie(null);
      onChange(null);
    }
  }

  function handleSousCategorieClick(sub: string) {
    if (selectedSousCategorie === sub) {
      setSelectedSousCategorie(null);
      onChange(null);
    } else {
      setSelectedSousCategorie(sub);
      onChange(null);
    }
  }

  function handleItemSelect(enumId: string) {
    onChange(enumId);
  }

  function handleReset() {
    setSelectedCategorie(null);
    setSelectedSousCategorie(null);
    onChange(null);
  }

  if (disabled) {
    return (
      <div className="space-y-1">
        {label && <p className="text-sm font-medium text-gray-500">{label}</p>}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-400">
          {selectedItem ? selectedItem.label : placeholder}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Label + valeur sélectionnée */}
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}

      {selectedItem && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-green-800">{selectedItem.label}</p>
            <p className="text-xs text-green-600">
              {selectedItem.categorie} › {selectedItem.sous_categorie}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-green-600 hover:text-green-800 hover:underline"
          >
            Modifier
          </button>
        </div>
      )}

      {/* Niveau 1 — Catégories (chips grands boutons) */}
      {!selectedItem && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Type d'équipement
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleCategorieClick(cat.name)}
                className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedCategorie === cat.name
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {cat.name}
                <span className="ml-1 text-xs text-gray-400">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Niveau 2 — Sous-catégories (chips filtre) */}
      {selectedCategorie && !selectedItem && sousCategories.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Préciser le type
          </p>
          <div className="flex flex-wrap gap-2">
            {sousCategories.map((sub) => (
              <button
                key={sub.name}
                onClick={() => handleSousCategorieClick(sub.name)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                  selectedSousCategorie === sub.name
                    ? "border-blue-500 bg-blue-100 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {sub.name}
                <span className="ml-1 text-xs text-gray-400">({sub.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Niveau 3 — Type précis (liste) */}
      {selectedSousCategorie && !selectedItem && filteredItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Modèle exact
          </p>
          <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-1">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-all hover:bg-blue-50 ${
                  value === item.id ? "bg-blue-100 font-medium text-blue-700" : "text-gray-700"
                }`}
              >
                {item.label}
                {item.description && (
                  <span className="ml-2 text-xs text-gray-400">{item.description}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Breadcrumb navigation */}
      {(selectedCategorie || selectedSousCategorie) && !selectedItem && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <button onClick={handleReset} className="hover:text-blue-600 hover:underline">
            Tous
          </button>
          {selectedCategorie && (
            <>
              <span>›</span>
              <button
                onClick={() => {
                  setSelectedSousCategorie(null);
                  onChange(null);
                }}
                className="hover:text-blue-600 hover:underline"
              >
                {selectedCategorie}
              </button>
            </>
          )}
          {selectedSousCategorie && (
            <>
              <span>›</span>
              <span className="font-medium text-gray-600">{selectedSousCategorie}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default EntonnorSelect;
