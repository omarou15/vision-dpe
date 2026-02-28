import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Rôles autorisés (tous si non spécifié) */
  roles?: UserRole[];
}

/**
 * Protège une route : redirige vers /login si non authentifié,
 * vers /dashboard si rôle insuffisant.
 *
 * Usage:
 * ```tsx
 * <Route path="/admin" element={
 *   <ProtectedRoute roles={['admin', 'responsable']}>
 *     <AdminPage />
 *   </ProtectedRoute>
 * } />
 * ```
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  // Chargement en cours
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Non authentifié → login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification rôle
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Compte désactivé
  if (profile && !profile.is_active) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            Compte désactivé
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Contactez votre responsable pour réactiver votre accès.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
