import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-navy-700">404</p>
        <p className="mt-2 text-gray-500">Page introuvable</p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-block">
          {t("nav.dashboard")}
        </Link>
      </div>
    </div>
  );
}
