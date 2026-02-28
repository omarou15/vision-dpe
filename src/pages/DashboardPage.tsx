import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="container-app py-6">
      <h1 className="text-xl font-bold text-navy-700">{t("nav.dashboard")}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {t("app.name")} — {t("app.description")}
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-400">Dashboard projets — T41</p>
      </div>
    </div>
  );
}
