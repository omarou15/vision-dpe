import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import type { SyntheseAudit, BilanEtatInitial, DpeProjecte, AnalyseEconomiqueParcours } from "@/types/steps/audit";
import { calculerEtiquette } from "@/types/steps/audit";
import type { ClasseDpe } from "@/types/steps/step12-14";
import { Input, Card, Button, Alert } from "@/components/ui";

const ETIQUETTE_COLORS: Record<ClasseDpe, string> = {
  A: "bg-green-500 text-white", B: "bg-lime-500 text-white", C: "bg-yellow-400 text-gray-900",
  D: "bg-orange-400 text-white", E: "bg-orange-600 text-white", F: "bg-red-500 text-white", G: "bg-red-700 text-white",
};

function EtiquetteMini({ classe, label }: { classe: ClasseDpe; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded ${ETIQUETTE_COLORS[classe]}`}>
        <span className="text-sm font-bold">{classe}</span>
      </div>
    </div>
  );
}

function LigneComparaison({ label, initial, p1, p2, unite }: { label: string; initial: number; p1: number | null; p2: number | null; unite: string }) {
  return (
    <div className="grid grid-cols-4 gap-2 border-b border-gray-100 py-2 text-center text-sm">
      <span className="text-left text-gray-500">{label}</span>
      <span className="font-medium">{initial} {unite}</span>
      <span className="font-medium text-green-700">{p1 !== null ? `${p1} ${unite}` : "—"}</span>
      <span className="font-medium text-blue-700">{p2 !== null ? `${p2} ${unite}` : "—"}</span>
    </div>
  );
}

export default function AuditStep18Page() {
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [synthese, setSynthese] = useState<SyntheseAudit | null>(null);
  const [recommandation, setRecommandation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);

  useEffect(() => {
    if (!activeProjet) return;
    // Charger données depuis toutes les étapes audit
    const d18 = syncService.getStepValues(activeProjet, "audit_step_18");
    if (d18.synthese) {
      setSynthese(d18.synthese as SyntheseAudit);
      setRecommandation((d18.synthese as SyntheseAudit).recommandation_auditeur || "");
      return;
    }
    assemblerSynthese();
  }, [activeProjet]);

  function assemblerSynthese() {
    if (!activeProjet) return;
    setIsLoading(true);

    const d12 = syncService.getStepValues(activeProjet, "audit_step_12");
    const d14 = syncService.getStepValues(activeProjet, "audit_step_14");
    const d16 = syncService.getStepValues(activeProjet, "audit_step_16");
    const d17 = syncService.getStepValues(activeProjet, "audit_step_17");

    const bilan = (d12.bilan as BilanEtatInitial) || {
      etiquette_energie: "F", etiquette_climat: "E", cep: 380, eges: 65,
      consommations: { chauffage: 280, ecs: 55, refroidissement: 0, eclairage: 15, auxiliaires: 30, total: 380 },
      deperditions: { murs: 95, planchers_bas: 35, planchers_hauts: 55, baies: 45, portes: 10, ponts_thermiques: 25, renouvellement_air: 40, total: 305 },
      emissions: { chauffage: 48, ecs: 12, refroidissement: 0, total: 65 },
      estimation_facture: 2850,
    };

    const dpeP1 = d14.dpe_projete_p1 as DpeProjecte | null;
    const dpeP2 = d16.dpe_projete_p2 as DpeProjecte | null;
    const analyses = (d17.analyse_eco as any)?.analyses as AnalyseEconomiqueParcours[] | undefined;

    const s: SyntheseAudit = {
      bilan_initial: bilan,
      parcours1_classe_atteinte: dpeP1?.etiquette_energie || null,
      parcours2_classe_atteinte: dpeP2?.etiquette_energie || null,
      parcours1_cout_reste_charge: analyses?.find((a) => a.numero_parcours === 1)?.reste_a_charge || null,
      parcours2_cout_reste_charge: analyses?.find((a) => a.numero_parcours === 2)?.reste_a_charge || null,
      recommandation_auditeur: recommandation,
    };

    setSynthese(s);
    setIsLoading(false);
  }

  async function handleSave() {
    if (!projetId || !synthese) return;
    const updated = { ...synthese, recommandation_auditeur: recommandation };
    await syncService.saveStepFields(projetId, "audit_step_18", { synthese: updated });
    setSynthese(updated);
  }

  if (isLoading) return <div className="flex h-48 items-center justify-center"><p className="text-gray-400">Chargement de la synthèse…</p></div>;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">Synthèse de l'audit</h2>

      <Alert variant="info">
        Récapitulatif complet de l'audit énergétique : état initial, deux parcours de travaux, analyse financière.
      </Alert>

      {synthese && (
        <>
          {/* Tableau comparatif étiquettes */}
          <Card>
            <div className="p-4">
              <p className="mb-3 text-sm font-semibold text-gray-700">Évolution des étiquettes</p>
              <div className="flex items-center justify-around">
                <EtiquetteMini classe={synthese.bilan_initial.etiquette_energie} label="Initial" />
                <span className="text-gray-300">→</span>
                {synthese.parcours1_classe_atteinte && (
                  <>
                    <EtiquetteMini classe={synthese.parcours1_classe_atteinte} label="Parcours 1" />
                    <span className="text-gray-300">→</span>
                  </>
                )}
                {synthese.parcours2_classe_atteinte && (
                  <EtiquetteMini classe={synthese.parcours2_classe_atteinte} label="Parcours 2" />
                )}
              </div>
            </div>
          </Card>

          {/* Tableau comparatif détaillé */}
          <Card>
            <div className="p-4">
              <div className="grid grid-cols-4 gap-2 border-b border-gray-200 pb-2 text-center text-xs font-semibold text-gray-500">
                <span className="text-left">Indicateur</span>
                <span>Initial</span>
                <span className="text-green-600">P1</span>
                <span className="text-blue-600">P2</span>
              </div>
              <LigneComparaison label="Cep" initial={synthese.bilan_initial.cep} p1={165} p2={95} unite="kWhEP" />
              <LigneComparaison label="Eges" initial={synthese.bilan_initial.eges} p1={28} p2={9} unite="kgCO₂" />
              <LigneComparaison label="Reste à charge" initial={0} p1={synthese.parcours1_cout_reste_charge} p2={synthese.parcours2_cout_reste_charge} unite="€" />
            </div>
          </Card>

          {/* Recommandation auditeur */}
          <Card>
            <div className="space-y-3 p-4">
              <p className="text-sm font-semibold text-gray-700">Recommandation de l'auditeur</p>
              <textarea
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={5}
                value={recommandation}
                onChange={(e) => setRecommandation(e.target.value)}
                placeholder="Au vu de l'état du logement et de la situation financière du ménage, je recommande le parcours 2 (rénovation globale) qui permet d'atteindre la classe B avec un temps de retour sur investissement raisonnable de X années…"
              />
              <p className="text-xs text-gray-400">Ce texte apparaîtra dans le rapport d'audit final.</p>
            </div>
          </Card>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={assemblerSynthese} className="flex-1">Rafraîchir</Button>
            <Button onClick={() => { handleSave(); completeStep(18); }} className="flex-1">Valider la synthèse</Button>
          </div>
        </>
      )}
    </div>
  );
}
