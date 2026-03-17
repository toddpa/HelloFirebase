import { useEffect, useState } from "react";
import { getRouteForAccessState, isAdminRoute, ROUTES } from "../access/routes";
import { useAuth } from "../auth/useAuth";
import DeniedPage from "../pages/DeniedPage";
import PendingPage from "../pages/PendingPage";
import RequestAccessPage from "../pages/RequestAccessPage";
import DashboardShell from "./DashboardShell";
import SignInView from "./SignInView";

function replaceRoute(pathname: string) {
  if (window.location.pathname === pathname) {
    return;
  }

  window.history.replaceState({}, "", pathname);
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

type LoadingViewProps = {
  title?: string;
  message?: string;
};

function LoadingView({
  title = "Resolving dashboard access",
  message = "Checking your sign-in and authorization state...",
}: LoadingViewProps) {
  return (
    <main id="app-shell" className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Stage 2B Access Control</p>
        <h1 id="app-title">{title}</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}

export default function AuthGate() {
  const { accessState, loading, isAuthenticated } = useAuth();
  const pathname = useCurrentPath();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated) {
      replaceRoute(ROUTES.home);
      return;
    }

    if (!accessState) {
      return;
    }

    if (accessState === "admin") {
      if (!isAdminRoute(pathname)) {
        replaceRoute(ROUTES.adminHome);
      }
      return;
    }

    const targetRoute = getRouteForAccessState(accessState);

    if (pathname !== targetRoute) {
      replaceRoute(targetRoute);
    }
  }, [accessState, isAuthenticated, loading, pathname]);

  if (loading) {
    return <LoadingView />;
  }

  if (!isAuthenticated) {
    return <SignInView />;
  }

  if (!accessState) {
    return <LoadingView />;
  }

  if (accessState === "admin" && !isAdminRoute(pathname)) {
    return (
      <LoadingView
        title="Redirecting to the admin area"
        message="This page is restricted to administrators. Redirecting to the admin dashboard now."
      />
    );
  }

  if (accessState !== "admin" && pathname !== getRouteForAccessState(accessState)) {
    return (
      <LoadingView
        title="Redirecting to the correct page"
        message={
          pathname === ROUTES.adminHome || pathname === ROUTES.adminTools
            ? "This page is restricted to administrators. Redirecting to the page for your access level."
            : "This route is not available for your access level. Redirecting now."
        }
      />
    );
  }

  if (accessState === "admin" || accessState === "approved") {
    return <DashboardShell />;
  }

  if (accessState === "pending") {
    return <PendingPage />;
  }

  if (accessState === "denied") {
    return <DeniedPage />;
  }

  return <RequestAccessPage />;
}
