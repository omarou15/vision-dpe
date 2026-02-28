import { useTranslation } from "react-i18next";

export default function ProjetsPage() {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900">{t("nav.projects")}</h1>
      <p className="mt-2 text-sm text-gray-500">Liste des projets DPE et Audit — à implémenter Phase 1.</p>
    </div>
  );
}
