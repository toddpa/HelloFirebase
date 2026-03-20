import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getDashboardNavItems, getRouteLabel } from "../access/routes";
import { useAuth } from "../auth/useAuth";

export default function DashboardLayout() {
  const { accessState, errorMessage, signOut, user } = useAuth();
  const location = useLocation();

  const displayName = user?.displayName ?? "Dashboard user";
  const roleLabel = accessState === "admin" ? "Administrator" : "Approved user";
  const navItems = getDashboardNavItems(accessState);
  const unauthorizedFrom =
    typeof location.state === "object" &&
    location.state !== null &&
    "unauthorizedFrom" in location.state &&
    typeof location.state.unauthorizedFrom === "string"
      ? location.state.unauthorizedFrom
      : null;
  const unauthorizedLabel = unauthorizedFrom ? getRouteLabel(unauthorizedFrom) : null;

  return (
    <div className="dashboard-layout-shell">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">Stage 3 Dashboard</p>
          <h1 className="dashboard-title">Operations workspace</h1>
        </div>
        <div className="dashboard-account">
          <div>
            <p className="dashboard-account-name">{displayName}</p>
            <p className="user-email">{user?.email ?? "No email available"}</p>
          </div>
          <span className="status-pill">{roleLabel}</span>
          <button id="sign-out" type="button" className="secondary-button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="dashboard-frame">
        <aside className="dashboard-sidebar panel" aria-label="Dashboard navigation">
          <nav className="dashboard-nav" aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "dashboard-nav-link active" : "dashboard-nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <p className="muted-copy">
            Available modules are shown based on your current dashboard access.
          </p>
        </aside>

        <main className="dashboard-main">
          {unauthorizedFrom ? (
            <p className="auth-error panel" role="alert">
              You do not have access to {unauthorizedLabel}. Showing the dashboard instead.
            </p>
          ) : null}
          {errorMessage ? (
            <p className="auth-error panel" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
