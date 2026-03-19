import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessRoute, getRouteForAccessState, ROUTES } from "../access/routes";
import type { AccessState } from "../access/types";
import { useAuth } from "../auth/useAuth";
import AccessResolvingView from "./AccessResolvingView";

type ProtectedRouteProps = {
  allowedAccessStates?: AccessState[];
  unauthorizedRedirectTo?: string;
};

export default function ProtectedRoute({
  allowedAccessStates,
  unauthorizedRedirectTo,
}: ProtectedRouteProps) {
  const { accessState, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <AccessResolvingView
        message={
          isAuthenticated
            ? "Checking your dashboard role and route permissions..."
            : "Checking your sign-in and authorization state..."
        }
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.home} replace state={{ from: location }} />;
  }

  if (!accessState) {
    return <AccessResolvingView message="Resolving your dashboard access level..." />;
  }

  if (allowedAccessStates && !canAccessRoute(accessState, allowedAccessStates)) {
    return (
      <Navigate
        to={unauthorizedRedirectTo ?? getRouteForAccessState(accessState)}
        replace
        state={{ unauthorizedFrom: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
