import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import type { AuditStep17Data, AnalyseEconomiqueParcours, AideFinanciere, TrancheRevenu, ZoneAide } from "@/types/steps/audit";
import { determinerTrancheRevenu } from "@/types/steps/audit";
import { Input, Select, Card, Button, Alert } from "@/components/ui";

const TRANCHE_LABELS: Record<TrancheRevenu, { label: string; color: string }> = {
  tres_modeste: { label: "Très modeste", color: "bg-blue-100 text-blue-800" },
  modeste: { label: "Modeste", color: "bg-green-100 text-green-800" },
  intermediaire: { label: "Intermédiaire", color: "bg-yellow-100 text-yellow-800" },
  superieur: { label: "Supérieur", color: "bg-gray-100 text-gray-800" },
};

const ZONE_OPTIONS = [
  { value: "idf", label: "Île-de-France" },
  { value: "hors_idf", label: "Hors Île-de-France" },
];
const NB_PERSONNES_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} personne${n > 1 ? "s" : ""}` }));

function AideCard({ aide }: { aide: AideFinanciere }) {
  const TYPE_COLORS: Record<string, string> = {
    "maprimerénov": "bg-blue-500", cee: "bg-green-500", eco_ptz: "bg-purple-500",
    tva_reduite: "bg-orange-500", aide_locale: "bg-teal-500", autre: "bg-gray-500",
  };
  return (
    <div className="flex items-center justify-between rounded-lg bg-white border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${TYPE_COLORS[aide.type] || "bg-gray-500"}`} />
        <div>
          <p className="text-sm font-medium text-gray-800">{aide.libelle}</p>
          {aide.conditions && <p className="text-xs text-gray-500">{aide.conditions}</p>}
        </div>
      </div>
      <span className="text-sm font-bold text-green-700">{aide.montant_estime.toLocaleString("fr-FR")} €</span>
    </div>
  );
}

function AnalyseParcours({ analyse }: { analyse: AnalyseEconomiqueParcours }) {
  return (
    <Card>
      <div className="space-y-3 p-4">
        <p className="text-sm font-bold text-navy-700">Parcours {analyse.numero_parcours} {analyse.numero_parcours === 1 ? "(progressif)" : "(global)"}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-500">Coût total TTC</p>
            <p className="text-lg font-bold text-gray-800">{analyse.cout_total_ttc.toLocaleString("fr-FR")} €</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-600">Total aides</p>
            <p className="text-lg font-bold text-green-700">{analyse.total_aides.toLocaleString("fr-FR")} €</p>
          </div>
        </div>

        <div className="space-y-2">
          {analyse.aides.map((a, i) => <AideCard key={i} aide={a} />)}
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-blue-800">Reste à charge</span>
            <span className="text-lg font-bold text-blue-900">{analyse.reste_a_charge.toLocaleString("fr-FR")} €</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {analyse.economie_annuelle && (
            <div className="rounded-lg bg-green-50 p-2 text-center">
              <p className="text-xs text-green-600">Économie annuelle</p>
              <p className="text-sm font-bold text-green-700">{analyse.economie_annuelle.toLocaleString("fr-FR")} €/an</p>
            </div>
          )}
          {analyse.temps_retour && (
            <div className="rounded-lg bg-amber-50 p-2 text-center">
              <p className="text-xs text-amber-600">Temps de retour</p>
              <p className="text-sm font-bold text-amber-700">{analyse.temps_retour} ans</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function simulerAides(tranche: TrancheRevenu, cout: number, parcours: 1 | 2): AideFinanciere[] {
  const aides: AideFinanciere[] = [];
  const tauxMPR: Record<TrancheRevenu, number> = { tres_modeste: 0.65, modeste: 0.55, intermediaire: 0.40, superieur: 0.15 };
  const taux = tauxMPR[tranche];
  aides.push({ type: "maprimerénov", libelle: `MaPrimeRénov' ${parcours === 2 ? "Rénovation globale" : "par geste"}`, montant_estime: Math.round(cout * taux), conditions: `Tranche ${TRANCHE_LABELS[tranche].label}` });
  aides.push({ type: "cee", libelle: "Certificats d'Économies d'Énergie (CEE)", montant_estime: Math.round(cout * 0.10), conditions: "Via fournisseur d'énergie" });
  if (tranche === "tres_modeste" || tranche === "modeste") {
    aides.push({ type: "eco_ptz", libelle: "Éco-PTZ (prêt à taux zéro)", montant_estime: Math.min(50000, cout), conditions: "Jusqu'à 50 000€ sur 20 ans" });
  }
  aides.push({ type: "tva_reduite", libelle: "TVA réduite 5.5%", montant_estime: Math.round(cout * 0.145), conditions: "Logement > 2 ans" });
  return aides;
}

export default function AuditStep17Page() {
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [data, setData] = useState<AuditStep17Data>({
    tranche_revenu: "modeste", zone_aide: "hors_idf",
    revenu_fiscal: null, nb_personnes: 2, analyses: [],
  });
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "audit_step_17");
    if (d.analyse_eco) setData(d.analyse_eco as AuditStep17Data);
  }, [activeProjet]);

  // Auto-déterminer tranche
  useEffect(() => {
    if (data.revenu_fiscal && data.revenu_fiscal > 0) {
      const tranche = determinerTrancheRevenu(data.revenu_fiscal, data.nb_personnes, data.zone_aide);
      setData((d) => ({ ...d, tranche_revenu: tranche }));
    }
  }, [data.revenu_fiscal, data.nb_personnes, data.zone_aide]);

  async function handleCalculer() {
    setIsCalculating(true);
    await new Promise((r) => setTimeout(r, 1000));

    // Récupérer coûts des parcours
    const p1Cost = 35000; // En prod : depuis audit_step_13
    const p2Cost = 65000; // En prod : depuis audit_step_15

    const analyses: AnalyseEconomiqueParcours[] = [1, 2].map((num) => {
      const cout = num === 1 ? p1Cost : p2Cost;
      const aides = simulerAides(data.tranche_revenu, cout, num as 1 | 2);
      const totalAides = aides.filter((a) => a.type !== "eco_ptz").reduce((s, a) => s + a.montant_estime, 0);
      const economie = num === 1 ? 1200 : 2100;
      const reste = Math.max(0, cout - totalAides);
      return {
        numero_parcours: num as 1 | 2,
        cout_total_ttc: cout,
        aides,
        total_aides: totalAides,
        reste_a_charge: reste,
        economie_annuelle: economie,
        temps_retour: Math.round(reste / economie),
      };
    });

    const newData = { ...data, analyses };
    setData(newData);
    setIsCalculating(false);

    if (projetId) {
      await syncService.saveStepFields(projetId, "audit_step_17", { analyse_eco: newData });
    }
  }

  const trancheInfo = TRANCHE_LABELS[data.tranche_revenu];

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">Analyse économique</h2>

      <Alert variant="info">
        Les montants d'aides dépendent du revenu fiscal de référence et de la zone géographique du ménage. Les estimations sont indicatives.
      </Alert>

      {/* Situation du ménage */}
      <Card>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-gray-700">Situation du ménage</p>
          <Select label="Zone géographique" value={data.zone_aide} onChange={(e) => setData({ ...data, zone_aide: e.target.value as ZoneAide })} options={ZONE_OPTIONS} />
          <Select label="Nombre de personnes" value={String(data.nb_personnes)} onChange={(e) => setData({ ...data, nb_personnes: parseInt(e.target.value) })} options={NB_PERSONNES_OPTIONS} />
          <Input label="Revenu fiscal de référence (€)" type="number" value={data.revenu_fiscal || ""} onChange={(e) => setData({ ...data, revenu_fiscal: parseFloat(e.target.value) || null })} placeholder="Avis d'imposition N-1" />

          {data.revenu_fiscal && (
            <div className={`mt-2 rounded-lg px-3 py-2 text-center ${trancheInfo.color}`}>
              <p className="text-sm font-semibold">Tranche : {trancheInfo.label}</p>
            </div>
          )}
        </div>
      </Card>

      <Button onClick={handleCalculer} loading={isCalculating} fullWidth>
        Calculer les aides et le reste à charge
      </Button>

      {data.analyses.map((a) => (
        <AnalyseParcours key={a.numero_parcours} analyse={a} />
      ))}

      {data.analyses.length > 0 && (
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleCalculer} loading={isCalculating} className="flex-1">Recalculer</Button>
          <Button onClick={() => completeStep(17)} className="flex-1">Valider l'analyse</Button>
        </div>
      )}
    </div>
  );
}
