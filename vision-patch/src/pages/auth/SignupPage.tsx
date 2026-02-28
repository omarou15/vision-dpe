import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button, Input, Alert } from "@/components/ui";

export default function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, isLoading, error, clearError } = useAuth();

  // Pré-remplir depuis invitation
  const inviteEmail = searchParams.get("email") || "";
  const inviteOrgId = searchParams.get("org") || "";
  const inviteToken = searchParams.get("token") || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError("");

    if (password.length < 8) {
      setLocalError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!inviteOrgId) {
      setLocalError("Lien d'invitation manquant. Demandez une invitation à votre responsable.");
      return;
    }

    const ok = await signup({
      email,
      password,
      firstName,
      lastName,
      organisationId: inviteOrgId,
    });

    if (ok) {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Compte créé</h2>
          <p className="mt-2 text-sm text-gray-500">
            Vérifiez votre email pour confirmer votre inscription.
          </p>
          <Button className="mt-6" onClick={() => navigate("/login")}>
            {t("auth.loginButton")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy-700">{t("auth.signupButton")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("app.name")} — {t("app.description")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {(error || localError) && (
            <Alert variant="error" onClose={() => { clearError(); setLocalError(""); }}>
              {error || localError}
            </Alert>
          )}

          {inviteToken && (
            <Alert variant="info">
              Inscription via invitation. Votre organisation est pré-configurée.
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
              autoFocus
            />
            <Input
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>

          <Input
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="diagnostiqueur@bureau.fr"
            required
            autoComplete="email"
            disabled={!!inviteEmail}
          />

          <Input
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            required
            autoComplete="new-password"
            hint="Minimum 8 caractères"
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            error={
              confirmPassword && password !== confirmPassword
                ? "Les mots de passe ne correspondent pas"
                : undefined
            }
          />

          <Button type="submit" fullWidth loading={isLoading}>
            {t("auth.signupButton")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="font-medium text-blue-500 hover:underline">
            {t("auth.loginButton")}
          </Link>
        </p>
      </div>
    </div>
  );
}
