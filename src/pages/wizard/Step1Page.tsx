import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAddressSearch, useAuth } from "@/hooks";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { isGeocodageValide } from "@/types";
import type { Step1Data, GeocodageBAN } from "@/types";
import { Input, Button, Alert, Card } from "@/components/ui";

export default function Step1Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { profile } = useAuth();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();

  const {
    suggestions,
    selected,
    zoneClimatique,
    isLoading: isBanLoading,
    error: banError,
    search,
    select,
    geolocate,
    clear: clearBan,
  } = useAddressSearch();

  const [adresseSaisie, setAdresseSaisie] = useState("");
  const [complement, setComplement] = useState("");
  const [dateVisite, setDateVisite] = useState("");
  const [dateEtablissement, setDateEtablissement] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Charger le projet
  useEffect(() => {
    if (projetId && !activeProjet) {
      loadProjet(projetId);
    }
  }, [projetId, activeProjet, loadProjet]);

  // Charger les données existantes de l'étape
  useEffect(() => {
    if (activeProjet) {
      const data = syncService.getStepValues(activeProjet, "step_1");
      if (data.adresse_saisie) setAdresseSaisie(data.adresse_saisie as string);
      if (data.complement_adresse) setComplement(data.complement_adresse as string);
      if (data.date_visite) setDateVisite(data.date_visite as string);
      if (data.date_etablissement) setDateEtablissement(data.date_etablissement as string);
      if (data.geocodage) select(data.geocodage as GeocodageBAN);
    }
  }, [activeProjet]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sauvegarder auto quand l'adresse BAN est sélectionnée
  useEffect(() => {
    if (selected && projetId) {
      syncService.saveStepFields(projetId, "step_1", {
        geocodage: selected,
        geocodage_valide: isGeocodageValide(selected.score),
        code_postal: selected.postcode,
        ville: selected.city,
      });
      // Mettre à jour les métadonnées projet
      syncService.updateProjetMeta(projetId, {
        address: selected.label,
        postal_code: selected.postcode,
        city: selected.city,
      });
    }
  }, [selected, projetId]);

  async function handleSave() {
    if (!projetId) return;
    setIsSaving(true);

    await syncService.saveStepFields(projetId, "step_1", {
      adresse_saisie: adresseSaisie,
      complement_adresse: complement || null,
      date_visite: dateVisite,
      date_etablissement: dateEtablissement,
      diagnostiqueur: {
        nom: profile?.last_name || "",
        prenom: profile?.first_name || "",
        numero_certification: profile?.certification_number || "",
        organisme_certification: profile?.certification_org || "",
        date_expiration_certification: profile?.certification_expiry || "",
        siret: null,
        raison_sociale: null,
        telephone: profile?.phone || null,
        email: null,
      },
    });

    setIsSaving(false);
  }

  async function handleComplete() {
    await handleSave();
    completeStep(1);
  }

  const geocodageScore = selected?.score ?? 0;
  const isGeoOk = selected && isGeocodageValide(geocodageScore);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">
        {t("wizard.steps.dpe.1")}
      </h2>

      {/* ── Adresse + géocodage BAN ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Adresse du bien</p>

          <div className="relative">
            <Input
              label="Adresse"
              value={selected ? selected.label : adresseSaisie}
              onChange={(e) => {
                setAdresseSaisie(e.target.value);
                search(e.target.value);
              }}
              placeholder="15 rue de la Paix, Paris"
              required
            />

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={s.ban_id}
                    onClick={() => {
                      select(s);
                      setAdresseSaisie(s.label);
                    }}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
                  >
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <span className="text-gray-900">{s.label}</span>
                      <span className="ml-2 text-xs text-gray-400">({Math.round(s.score * 100)}%)</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton GPS */}
          <Button
            variant="ghost"
            size="sm"
            onClick={geolocate}
            loading={isBanLoading}
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Utiliser ma position GPS
          </Button>

          {banError && <Alert variant="error">{banError}</Alert>}

          {/* Résultat géocodage */}
          {selected && (
            <div className={`rounded-lg border p-3 text-sm ${isGeoOk ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
              <div className="flex items-center gap-2">
                {isGeoOk ? (
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className={isGeoOk ? "font-medium text-green-700" : "font-medium text-red-700"}>
                  Géocodage {isGeoOk ? "valide" : "insuffisant"} — Score : {Math.round(geocodageScore * 100)}%
                </span>
              </div>
              <p className="mt-1 text-gray-600">{selected.label}</p>
              <p className="text-xs text-gray-400">
                GPS : {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)} — 
                Code INSEE : {selected.citycode}
                {zoneClimatique && ` — Zone : ${zoneClimatique}`}
              </p>
              {!isGeoOk && (
                <p className="mt-1 text-xs text-red-600">
                  Score inférieur à 50% : le DPE sera rejeté par l'ADEME. Vérifiez l'adresse.
                </p>
              )}
            </div>
          )}

          <Input
            label="Complément d'adresse"
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
            placeholder="Bâtiment B, escalier 2, 3ème étage"
            hint="Optionnel"
          />
        </div>
      </Card>

      {/* ── Diagnostiqueur (pré-rempli) ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Diagnostiqueur</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" value={profile?.first_name || ""} disabled />
            <Input label="Nom" value={profile?.last_name || ""} disabled />
          </div>
          <Input
            label="N° certification"
            value={profile?.certification_number || ""}
            disabled
            hint="Depuis votre profil"
          />
        </div>
      </Card>

      {/* ── Dates ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Dates</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date de visite"
              type="date"
              value={dateVisite}
              onChange={(e) => setDateVisite(e.target.value)}
              required
            />
            <Input
              label="Date d'établissement"
              type="date"
              value={dateEtablissement}
              onChange={(e) => setDateEtablissement(e.target.value)}
              required
            />
          </div>
        </div>
      </Card>

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={handleSave} loading={isSaving} className="flex-1">
          Enregistrer
        </Button>
        <Button
          onClick={handleComplete}
          loading={isSaving}
          disabled={!isGeoOk || !dateVisite}
          className="flex-1"
        >
          Valider l'étape
        </Button>
      </div>
    </div>
  );
}
