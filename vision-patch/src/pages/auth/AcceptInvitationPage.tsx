import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "@/services";
import { Button, Alert } from "@/components/ui";

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<{
    email: string;
    organisation_id: string;
  } | null>(null);

  useEffect(() => {
    async function accept() {
      if (!token) {
        setError("Token d'invitation manquant");
        setIsLoading(false);
        return;
      }

      const result = await authService.acceptInvitation(token);
      setIsLoading(false);

      if (result.error || !result.data) {
        setError(result.error || "Invitation invalide");
        return;
      }

      setInvitation({
        email: result.data.email,
        organisation_id: result.data.organisation_id,
      });
    }

    accept();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Vérification de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <Alert variant="error">{error}</Alert>
          <Button className="mt-6" onClick={() => navigate("/login")}>
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  if (invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Invitation acceptée</h2>
          <p className="mt-2 text-sm text-gray-500">
            Créez votre compte pour rejoindre l'équipe.
          </p>
          <Button
            className="mt-6"
            onClick={() =>
              navigate(
                `/signup?email=${encodeURIComponent(invitation.email)}&org=${invitation.organisation_id}&token=${token}`
              )
            }
          >
            Créer mon compte
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
