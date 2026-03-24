import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getDashboardNavItems, getRouteLabel, ROUTES } from "../access/routes";
import { useAuth } from "../auth/useAuth";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout() {
  const { accessState, errorMessage, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = user?.displayName ?? "Dashboard user";
  const roleLabel = accessState === "admin" ? "Administrator" : "Approved user";
  const navItems = getDashboardNavItems(accessState);
  const notesNavItem = navItems.find((item) => item.matchPrefixes?.includes(ROUTES.notes));
  const isInNotesEditorMode =
    location.pathname === ROUTES.notesNew ||
    (location.pathname.startsWith(`${ROUTES.notes}/`) &&
      location.pathname !== ROUTES.notesDrafts &&
      location.pathname !== ROUTES.notesPublished);
  const createReturnTo =
    location.pathname === ROUTES.notesDrafts || location.pathname === ROUTES.notesPublished
      ? location.pathname
      : ROUTES.notesDrafts;
  const unauthorizedFrom =
    typeof location.state === "object" &&
    location.state !== null &&
    "unauthorizedFrom" in location.state &&
    typeof location.state.unauthorizedFrom === "string"
      ? location.state.unauthorizedFrom
      : null;
  const unauthorizedLabel = unauthorizedFrom ? getRouteLabel(unauthorizedFrom) : null;

  function isNavItemActive(item: (typeof navItems)[number]) {
    if (location.pathname === item.to) {
      return true;
    }

    return item.matchPrefixes?.some((prefix) => location.pathname.startsWith(prefix)) ?? false;
  }

  return (
    <div className="dashboard-layout-shell">
      <header className={styles.topbar}>
        <div>
          <p className="eyebrow">Stage 3 Dashboard</p>
          <h1 className={styles.title}>Operations workspace</h1>
        </div>
        <div className={styles.account}>
          <div className={styles.accountCard}>
            <p className="eyebrow">Signed In</p>
            <p className={styles.accountName}>{displayName}</p>
            <p className="user-email">{user?.email ?? "No email available"}</p>
            <span className="status-pill">{roleLabel}</span>
          </div>
          <button id="sign-out" type="button" className="secondary-button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="dashboard-frame">
        <aside className={`${styles.sidebar} panel`} aria-label="Dashboard navigation">
          {notesNavItem ? (
            <div className={styles.sidebarCreate}>
              <button
                type="button"
                className="primary-button"
                disabled={isInNotesEditorMode}
                onClick={() =>
                  navigate(ROUTES.notesNew, {
                    state: { returnTo: createReturnTo },
                  })
                }
              >
                Create New
              </button>
            </div>
          ) : null}
          <nav className={styles.nav} aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <div key={item.to} className={styles.navGroup}>
                <NavLink
                  to={item.to}
                  aria-current={isNavItemActive(item) ? "page" : undefined}
                  className={isNavItemActive(item) ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
                >
                  {item.label}
                </NavLink>
                {item.children?.length ? (
                  <div className={styles.subnav} aria-label={`${item.label} navigation`}>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          isActive ? `${styles.subnavLink} ${styles.subnavLinkActive}` : styles.subnavLink
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>
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
