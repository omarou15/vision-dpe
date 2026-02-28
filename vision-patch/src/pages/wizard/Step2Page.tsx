import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import type { Step2Data, MethodeApplicationDpeLog } from "@/types";
import { Input, Select, ChipGroup, Card, Button, Toggle } from "@/components/ui";

const MOTIF_OPTIONS = [
  { value: "vente", label: "Vente" },
  { value: "location", label: "Location" },
  { value: "information", label: "Information" },
  { value: "autre", label: "Autre" },
];

const QUALITE_OPTIONS = [
  { value: "proprietaire", label: "Propriétaire" },
  { value: "bailleur", label: "Bailleur" },
  { value: "syndic", label: "Syndic de copropriété" },
  { value: "locataire", label: "Locataire" },
  { value: "mandataire", label: "Mandataire" },
];

const METHODE_OPTIONS: { value: MethodeApplicationDpeLog; label: string }[] = [
  { value: "maison_individuelle", label: "Maison individuelle" },
  { value: "appartement_individuel", label: "Appartement individuel" },
  { value: "appartement_depuis_immeuble", label: "Appartement (depuis immeuble)" },
  { value: "immeuble_collectif", label: "Immeuble collectif" },
  { value: "lot_copropriete", label: "Lot de copropriété" },
];

export default function Step2Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep, updateActiveProjet } = useProjetStore();

  const [methode, setMethode] = useState<MethodeApplicationDpeLog>("maison_individuelle");
  const [motif, setMotif] = useState("vente");
  const [commanditaireNom, setCommanditaireNom] = useState("");
  const [commanditaireQualite, setCommanditaireQualite] = useState("proprietaire");
  const [consentement, setConsentement] = useState(false);
  const [surfaceLot, setSurfaceLot] = useState("");
  const [surfaceBatiment, setSurfaceBatiment] = useState("");
  const [nbLogements, setNbLogements] = useState("");
  const [nbNiveaux, setNbNiveaux] = useState("");
  const [numeroDpeRemplace, setNumeroDpeRemplace] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Charger le projet
  useEffect(() => {
    if (projetId && !activeProjet) loadProjet(projetId);
  }, [projetId, activeProjet, loadProjet]);

  // Charger données existantes
  useEffect(() => {
    if (activeProjet) {
      const data = syncService.getStepValues(activeProjet, "step_2");
      if (data.methode_application) setMethode(data.methode_application as MethodeApplicationDpeLog);
      if (data.motif_dpe) setMotif(data.motif_dpe as string);
      if (data.commanditaire_nom) setCommanditaireNom(data.commanditaire_nom as string);
      if (data.commanditaire_qualite) setCommanditaireQualite(data.commanditaire_qualite as string);
      if (data.consentement_proprietaire) setConsentement(data.consentement_proprietaire as boolean);
      if (data.surface_habitable_lot) setSurfaceLot(String(data.surface_habitable_lot));
      if (data.surface_habitable_batiment) setSurfaceBatiment(String(data.surface_habitable_batiment));
      if (data.nb_logements_immeuble) setNbLogements(String(data.nb_logements_immeuble));
      if (data.nb_niveaux_immeuble) setNbNiveaux(String(data.nb_niveaux_immeuble));
      if (data.numero_dpe_remplace) setNumeroDpeRemplace(data.numero_dpe_remplace as string);
    }
  }, [activeProjet]);

  const isImmeuble = methode === "immeuble_collectif" || methode === "lot_copropriete" || methode === "appartement_depuis_immeuble";

  async function handleSave() {
    if (!projetId) return;
    setIsSaving(true);

    await syncService.saveStepFields(projetId, "step_2", {
      version_dpe: "2.6",
      modele_dpe: "dpe_3cl",
      methode_application: methode,
      motif_dpe: motif,
      commanditaire_nom: commanditaireNom,
      commanditaire_qualite: commanditaireQualite,
      consentement_proprietaire: consentement,
      surface_habitable_lot: surfaceLot ? parseFloat(surfaceLot) : null,
      surface_habitable_batiment: isImmeuble && surfaceBatiment ? parseFloat(surfaceBatiment) : null,
      nb_logements_immeuble: isImmeuble && nbLogements ? parseInt(nbLogements) : null,
      nb_niveaux_immeuble: isImmeuble && nbNiveaux ? parseInt(nbNiveaux) : null,
      numero_dpe_remplace: numeroDpeRemplace || null,
    });

    // Mettre à jour le type logement du projet
    const logementType =
      methode === "maison_individuelle" ? "maison" :
      methode === "immeuble_collectif" ? "immeuble" : "appartement";

    await updateActiveProjet({ logement_type: logementType as "maison" | "appartement" | "immeuble" });

    setIsSaving(false);
  }

  async function handleComplete() {
    await handleSave();
    completeStep(2);
  }

  const canComplete = commanditaireNom && consentement && surfaceLot;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">
        {t("wizard.steps.dpe.2")}
      </h2>

      {/* ── Type de logement / méthode ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Type de logement</p>
          <Select
            label="Méthode d'application"
            value={methode}
            onChange={(e) => setMethode(e.target.value as MethodeApplicationDpeLog)}
            options={METHODE_OPTIONS}
            required
          />

          <Select
            label="Motif du DPE"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            options={MOTIF_OPTIONS}
            required
          />
        </div>
      </Card>

      {/* ── Surfaces ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Surfaces</p>
          <Input
            label="Surface habitable du lot (m²)"
            type="number"
            value={surfaceLot}
            onChange={(e) => setSurfaceLot(e.target.value)}
            placeholder="85"
            required
            hint="Surface de plancher clos et couvert, hauteur > 1,80 m"
          />

          {isImmeuble && (
            <>
              <Input
                label="Surface habitable bâtiment (m²)"
                type="number"
                value={surfaceBatiment}
                onChange={(e) => setSurfaceBatiment(e.target.value)}
                placeholder="1200"
                hint="Surface totale du bâtiment"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nb logements"
                  type="number"
                  value={nbLogements}
                  onChange={(e) => setNbLogements(e.target.value)}
                  placeholder="24"
                />
                <Input
                  label="Nb niveaux"
                  type="number"
                  value={nbNiveaux}
                  onChange={(e) => setNbNiveaux(e.target.value)}
                  placeholder="5"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ── Commanditaire ── */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Commanditaire</p>
          <Input
            label="Nom / Raison sociale"
            value={commanditaireNom}
            onChange={(e) => setCommanditaireNom(e.target.value)}
            placeholder="M. Dupont / SCI Horizon"
            required
          />
          <Select
            label="Qualité"
            value={commanditaireQualite}
            onChange={(e) => setCommanditaireQualite(e.target.value)}
            options={QUALITE_OPTIONS}
          />
        </div>
      </Card>

      {/* ── Consentement + DPE remplacé ── */}
      <Card>
        <div className="space-y-3 p-4">
          <Toggle
            checked={consentement}
            onChange={setConsentement}
            label="Consentement transmission ADEME"
            description="Le propriétaire autorise la transmission du DPE à l'observatoire ADEME"
          />
          <Input
            label="N° DPE remplacé (optionnel)"
            value={numeroDpeRemplace}
            onChange={(e) => setNumeroDpeRemplace(e.target.value)}
            placeholder="13 chiffres"
            hint="Si ce DPE remplace un DPE existant"
          />
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
          disabled={!canComplete}
          className="flex-1"
        >
          Valider l'étape
        </Button>
      </div>
    </div>
  );
}
