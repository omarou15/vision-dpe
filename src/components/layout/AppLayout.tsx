import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, useSync, useOnlineStatus } from "@/hooks";

/** Icônes inline SVG */
const HomeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const FolderIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SyncIcon = ({ spinning }: { spinning: boolean }) => (
  <svg className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const navItems = [
  { to: "/dashboard", icon: HomeIcon, labelKey: "nav.dashboard" },
  { to: "/projets", icon: FolderIcon, labelKey: "nav.projects" },
  { to: "/profil", icon: UserIcon, labelKey: "nav.profile" },
] as const;

export default function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { isSyncing, pendingCount, syncNow } = useSync();
  const isOnline = useOnlineStatus();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-xs transition-colors ${
      isActive
        ? "text-blue-600 font-semibold"
        : "text-gray-500 hover:text-gray-700"
    }`;

  const sidebarLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-600 font-semibold"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-gray-200 md:bg-white">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-700">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-sm font-bold text-navy-700">{t("app.name")}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink key={to} to={to} className={sidebarLinkClasses}>
              <Icon />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sync status + user */}
        <div className="border-t border-gray-200 p-3">
          {/* Sync */}
          <button
            onClick={syncNow}
            disabled={!isOnline || isSyncing}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <SyncIcon spinning={isSyncing} />
            <span>
              {isSyncing
                ? "Sync..."
                : pendingCount > 0
                  ? `${pendingCount} en attente`
                  : "Synchronisé"}
            </span>
            {!isOnline && (
              <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" title="Hors ligne" />
            )}
          </button>

          {/* User */}
          <div className="mt-2 flex items-center gap-2 px-3 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-700">
              {profile?.first_name?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="truncate text-[10px] text-gray-400">{profile?.role}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500" title={t("auth.logout")}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pb-16 md:pb-0">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <span className="text-sm font-bold text-navy-700">{t("app.name")}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={syncNow}
              disabled={!isOnline || isSyncing}
              className="text-gray-400 disabled:opacity-50"
            >
              <SyncIcon spinning={isSyncing} />
            </button>
            {!isOnline && <span className="h-2 w-2 rounded-full bg-amber-400" />}
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <Outlet />
      </main>

      {/* ── Bottom nav mobile ── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-gray-200 bg-white safe-area-bottom md:hidden">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} className={linkClasses}>
            <Icon />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
