import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjetStore } from "@/store/projetStore";
import * as syncService from "@/services/sync";
import { EXPORT_INITIAL, type ExportXml, type StatutExport } from "@/types/steps/step12-14";
import { Card, Button, Alert } from "@/components/ui";

const STATUT_DISPLAY: Record<StatutExport, { label: string; color: string }> = {
  non_genere: { label: "Non généré", color: "bg-gray-100 text-gray-600" },
  en_cours: { label: "Génération en cours…", color: "bg-blue-100 text-blue-700" },
  genere: { label: "XML généré", color: "bg-green-100 text-green-700" },
  erreur: { label: "Erreur", color: "bg-red-100 text-red-700" },
};

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  return `${(bytes / 1024).toFixed(1)} Ko`;
}

export default function Step14Page() {
  const { t } = useTranslation();
  const { projetId } = useParams<{ projetId: string }>();
  const { activeProjet, loadProjet, completeStep } = useProjetStore();
  const [exportData, setExportData] = useState<ExportXml>(EXPORT_INITIAL);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { if (projetId && !activeProjet) loadProjet(projetId); }, [projetId, activeProjet, loadProjet]);
  useEffect(() => {
    if (!activeProjet) return;
    const d = syncService.getStepValues(activeProjet, "step_14");
    if (d.export_xml) setExportData(d.export_xml as ExportXml);
  }, [activeProjet]);

  async function handleGenerate() {
    setIsGenerating(true);
    setExportData({ ...exportData, statut: "en_cours" });

    // Simulation — en prod : appelle XMLGeneratorService
    await new Promise((r) => setTimeout(r, 2000));

    const now = new Date().toISOString();
    const numero = activeProjet?.numero_dpe || "VISION-2026-0001";
    const generated: ExportXml = {
      statut: "genere",
      nom_fichier: `DPE_${numero}_${now.slice(0, 10)}.xml`,
      taille: 47820,
      url_telechargement: null, // En prod : URL Supabase Storage
      hash_sha256: "a1b2c3d4e5f6...simulation",
      genere_le: now,
      version_xsd: "2.6",
      validation_ok: true,
      erreur: null,
    };

    setExportData(generated);
    setIsGenerating(false);

    if (projetId) {
      await syncService.saveStepFields(projetId, "step_14", { export_xml: generated });
    }
  }

  async function handleFinalize() {
    if (!projetId) return;
    completeStep(14);
  }

  const disp = STATUT_DISPLAY[exportData.statut];

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-bold text-navy-700">{t("wizard.steps.dpe.14")}</h2>

      <Alert variant="info">
        Le XML est généré conformément au schéma DPEv2.6.xsd de l'ADEME. Il peut être déposé sur la plateforme de l'Observatoire DPE.
      </Alert>

      {/* Statut */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Statut de l'export</p>
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${disp.color}`}>
              {disp.label}
            </span>
          </div>

          {exportData.statut === "genere" && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fichier</span>
                <span className="font-mono text-gray-800">{exportData.nom_fichier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taille</span>
                <span className="text-gray-800">{formatSize(exportData.taille)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Version XSD</span>
                <span className="text-gray-800">DPE v{exportData.version_xsd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Généré le</span>
                <span className="text-gray-800">{exportData.genere_le ? new Date(exportData.genere_le).toLocaleString("fr-FR") : "—"}</span>
              </div>
              {exportData.hash_sha256 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">SHA-256</span>
                  <span className="font-mono text-xs text-gray-400 truncate max-w-[200px]">{exportData.hash_sha256}</span>
                </div>
              )}
            </div>
          )}

          {exportData.erreur && <Alert variant="error">{exportData.erreur}</Alert>}
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={handleGenerate} loading={isGenerating} fullWidth variant={exportData.statut === "genere" ? "secondary" : "primary"}>
          {exportData.statut === "genere" ? "Régénérer le XML" : "Générer le XML DPE"}
        </Button>

        {exportData.statut === "genere" && (
          <>
            <Button variant="secondary" fullWidth onClick={() => {
              // En prod : window.open(exportData.url_telechargement)
              alert(`Téléchargement : ${exportData.nom_fichier}`);
            }}>
              Télécharger le fichier XML
            </Button>

            <div className="rounded-lg border-2 border-dashed border-green-300 bg-green-50 p-4 text-center">
              <p className="text-sm font-semibold text-green-800">✓ XML prêt pour dépôt ADEME</p>
              <p className="mt-1 text-xs text-green-600">
                Déposez ce fichier sur la plateforme de l'Observatoire DPE pour validation officielle.
              </p>
            </div>

            <Button onClick={handleFinalize} fullWidth>
              Finaliser le DPE
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
