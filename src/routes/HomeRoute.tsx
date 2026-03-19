import { Navigate } from "react-router-dom";
import { getRouteForAccessState, ROUTES } from "../access/routes";
import { useAuth } from "../auth/useAuth";
import SignInView from "../components/SignInView";
import AccessResolvingView from "./AccessResolvingView";

export default function HomeRoute() {
  const { accessState, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AccessResolvingView />;
  }

  if (!isAuthenticated) {
    return <SignInView />;
  }

  if (!accessState) {
    return <AccessResolvingView />;
  }

  return <Navigate to={getRouteForAccessState(accessState)} replace />;
}
