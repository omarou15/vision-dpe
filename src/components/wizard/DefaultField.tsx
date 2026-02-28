/**
 * DefaultField — Champ avec valeur par défaut suggérée
 *
 * CDC v3 section 10 :
 * - Affiche la valeur suggerée en gris clair
 * - Icône "info" avec source (période de construction + règle)
 * - Le diagnostiqueur peut modifier librement
 * - Si modifié : la valeur passe en noir, icône "reset" disponible
 */

import { useState, useEffect } from "react";

export interface DefaultFieldProps {
  /** Label du champ */
  label: string;
  /** Valeur actuelle saisie par le diagnostiqueur */
  value: string;
  /** Valeur par défaut suggérée par le DefaultValuesEngine */
  defaultValue: string;
  /** Source de la suggestion (ex: "Période 1975-1981 → ITI possible") */
  source: string;
  /** Callback de changement */
  onChange: (value: string) => void;
  /** Type d'input */
  type?: "text" | "number" | "select";
  /** Options si type=select */
  options?: { value: string; label: string }[];
  /** Placeholder */
  placeholder?: string;
  /** Unité (ex: "m².K/W", "W/m².K") */
  unite?: string;
  /** Désactivé */
  disabled?: boolean;
}

export function DefaultField({
  label,
  value,
  defaultValue,
  source,
  onChange,
  type = "text",
  options,
  placeholder,
  unite,
  disabled = false,
}: DefaultFieldProps) {
  const [showInfo, setShowInfo] = useState(false);
  const isModified = value !== "" && value !== defaultValue;
  const isUsingDefault = value === "" || value === defaultValue;

  // Appliquer la valeur par défaut si champ vide
  useEffect(() => {
    if (value === "" && defaultValue) {
      onChange(defaultValue);
    }
  }, [defaultValue]);

  function handleReset() {
    onChange(defaultValue);
  }

  const displayValue = value || defaultValue;

  return (
    <div className="space-y-1">
      {/* Label + icône info */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-1.5">
          {/* Indicateur valeur par défaut */}
          {isUsingDefault && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">
              par défaut
            </span>
          )}

          {/* Bouton reset */}
          {isModified && (
            <button
              onClick={handleReset}
              className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Réinitialiser à la valeur par défaut"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Bouton info */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="rounded-full p-0.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
            title="Source de la valeur suggérée"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info bulle source */}
      {showInfo && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
          <p className="font-medium">Valeur suggérée : {defaultValue}{unite ? ` ${unite}` : ""}</p>
          <p className="mt-0.5 text-blue-600">{source}</p>
        </div>
      )}

      {/* Input */}
      <div className="relative">
        {type === "select" && options ? (
          <select
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors ${
              isModified
                ? "border-gray-300 text-gray-900"
                : "border-gray-200 text-gray-400"
            } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50`}
          >
            <option value="">{placeholder || "Sélectionner…"}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {opt.value === defaultValue ? " (défaut)" : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type={type}
              value={displayValue}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isModified
                  ? "border-gray-300 text-gray-900"
                  : "border-gray-200 text-gray-400"
              } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50`}
            />
            {unite && (
              <span className="text-xs text-gray-400">{unite}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DefaultField;
