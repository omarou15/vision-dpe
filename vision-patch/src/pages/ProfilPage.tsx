import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks";

export default function ProfilPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900">{t("nav.profile")}</h1>
      {profile && (
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">Nom :</span> {profile.first_name} {profile.last_name}</p>
          <p><span className="font-medium">Rôle :</span> {profile.role}</p>
          {profile.certification_number && (
            <p><span className="font-medium">N° certification :</span> {profile.certification_number}</p>
          )}
        </div>
      )}
    </div>
  );
}
