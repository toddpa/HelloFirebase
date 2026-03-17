import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../access/routes";
import AdminPage from "../pages/AdminPage";
import ProfilePage from "../pages/ProfilePage";

function navigateTo(pathname: string) {
  if (window.location.pathname === pathname) {
    return;
  }

  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new Event("popstate"));
}

function useCurrentPath() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    function handleLocationChange() {
      setPathname(window.location.pathname);
    }

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  return pathname;
}

export default function DashboardShell() {
  const { accessState, user, signOut, errorMessage } = useAuth();
  const pathname = useCurrentPath();

  const displayName = user?.displayName ?? "Welcome";
  const isAdmin = accessState === "admin";
  const isAdminToolsRoute = pathname === ROUTES.adminTools;
  const title = isAdmin ? "Admin application" : "Subscriber application";

  return (
    <main id="app-shell" className="page-shell">
      <section className="panel hero-panel">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">{isAdmin ? "Administrator" : "Subscriber"}</p>
            <h1 id="app-title">{title}</h1>
            <p className="user-greeting">Hello, {displayName}.</p>
            {user?.email ? <p className="user-email">{user.email}</p> : null}
          </div>
          <div className="button-row">
            {isAdmin ? <span className="status-pill">Admin access enabled</span> : null}
            <button id="sign-out" type="button" className="secondary-button" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>

        <div className="top-nav" aria-label="Top level navigation">
          <button
            id="primary-action"
            type="button"
            className={isAdminToolsRoute ? "secondary-button" : undefined}
            onClick={() => navigateTo(isAdmin ? ROUTES.adminHome : ROUTES.subscriberHome)}
          >
            {isAdmin ? "Admin home" : "Subscriber home"}
          </button>
          {isAdmin ? (
            <button
              type="button"
              className={isAdminToolsRoute ? undefined : "secondary-button"}
              onClick={() => navigateTo(ROUTES.adminTools)}
            >
              Admin
            </button>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>

      {isAdmin && isAdminToolsRoute ? (
        <AdminPage />
      ) : (
        <ProfilePage
          eyebrow={isAdmin ? "Main App" : "Subscriber"}
          title={isAdmin ? "Admin home" : "Subscriber landing page"}
          message={
            isAdmin
              ? "This is the protected admin landing area for Stage 2B."
              : "This is the approved subscriber placeholder for Stage 2B."
          }
        />
      )}
    </main>
  );
}
