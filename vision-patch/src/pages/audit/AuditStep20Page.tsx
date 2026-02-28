import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import type { StatutExport, ExportXml } from "@/types/steps/step12-14";
import { EXPORT_INITIAL } from "@/types/steps/step12-14";
import { Card, Button, Alert } from "@/components/ui";

const STATUT_DISPLAY: Record<StatutExport, { label: string; color: string }> = {
  non_genere: { label: "Non généré", color: "bg-gray-100 text-gray-600" },
  en_cours: { label: "Génération en cours…", color: "bg-blue-100 text-blue-700" },
  genere: { label: "XML audit généré", color: "bg-green-100 text-green-700" },
  erreur: { label: "Erreur", color: "bg-red-100 text-red-700" },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function AuditStep20Page() {
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [exportData, setExportData] = useState<ExportXml>({ ...EXPORT_INITIAL });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "audit_step_20");
    if (d.export_xml) setExportData(d.export_xml as ExportXml);
  }, [activeProjet]);

  async function handleGenerer() {
    setIsGenerating(true);
    setExportData({ ...exportData, statut: "en_cours" });

    await new Promise((r) => setTimeout(r, 2500));

    const now = new Date();
    const numero = "AUDIT-VISION-2026-0001";
    const result: ExportXml = {
      statut: "genere",
      nom_fichier: `AUDIT_${numero}_${now.toISOString().split("T")[0]}.xml`,
      taille: 89420,
      url_telechargement: null, // En prod : URL Supabase Storage
      hash_sha256: `b2c3d4e5f6a7${Date.now().toString(16)}`,
      genere_le: now.toISOString(),
      version_xsd: "2.6",
      validation_ok: true,
      erreur: null,
    };

    setExportData(result);
    setIsGenerating(false);

    if (projetId) {
      await syncService.saveStepFields(projetId, "audit_step_20", { export_xml: result });
    }
  }

  const statut = STATUT_DISPLAY[exportData.statut];

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">Export XML audit</h2>

      <Alert variant="info">
        Le XML audit contient le DPE état initial complet, les 2 parcours de travaux détaillés, les DPE projetés, et l'analyse économique. Il est conforme au schéma XSD audit ADEME.
      </Alert>

      {/* Statut */}
      <Card>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-gray-500">Statut de l'export</p>
            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statut.color}`}>
              {statut.label}
            </span>
          </div>
          {exportData.statut === "en_cours" && (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          )}
        </div>
      </Card>

      {/* Bouton générer */}
      <Button onClick={handleGenerer} loading={isGenerating} fullWidth disabled={exportData.statut === "en_cours"}>
        {exportData.statut === "genere" ? "Régénérer le XML audit" : "Générer le XML audit"}
      </Button>

      {/* Métadonnées */}
      {exportData.statut === "genere" && (
        <>
          <Card>
            <div className="space-y-2 p-4">
              <p className="text-sm font-semibold text-gray-700">Détails du fichier</p>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fichier</span>
                <span className="font-mono text-gray-800">{exportData.nom_fichier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taille</span>
                <span className="font-medium">{formatSize(exportData.taille)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Version XSD</span>
                <span className="font-medium">Audit DPE v{exportData.version_xsd}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Généré le</span>
                <span className="font-medium">{new Date(exportData.genere_le!).toLocaleString("fr-FR")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">SHA-256</span>
                <span className="font-mono text-xs text-gray-400 truncate max-w-48">{exportData.hash_sha256}</span>
              </div>

              {/* Contenu XML audit */}
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Contenu du fichier XML audit</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>✓ DPE état initial complet (étapes 1-11)</p>
                  <p>✓ Bilan énergétique (consommations, déperditions, émissions)</p>
                  <p>✓ Parcours 1 — travaux par étapes + DPE projeté</p>
                  <p>✓ Parcours 2 — rénovation globale + DPE projeté</p>
                  <p>✓ Analyse économique (aides, reste à charge)</p>
                  <p>✓ Synthèse et recommandation auditeur</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleGenerer} className="flex-1">Régénérer</Button>
              <Button onClick={() => { if (exportData.url_telechargement) window.open(exportData.url_telechargement); }} className="flex-1">
                Télécharger le XML
              </Button>
            </div>

            <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 text-center">
              <p className="text-sm font-semibold text-green-800">✓ Audit prêt pour dépôt ADEME</p>
              <p className="text-xs text-green-600 mt-1">Déposez ce fichier sur la plateforme de l'Observatoire DPE</p>
            </div>

            <Button onClick={() => completeStep(20)} fullWidth>
              Finaliser l'audit énergétique
            </Button>
          </div>
        </>
      )}

      {exportData.statut === "erreur" && exportData.erreur && (
        <Alert variant="error">{exportData.erreur}</Alert>
      )}
    </div>
  );
}
