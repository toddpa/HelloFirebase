import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  AUTHENTICATED_DASHBOARD_ACCESS_STATES,
  getRouteConfig,
  isLegacyDashboardRoute,
  ROUTES,
} from "../access/routes";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardPage from "../pages/DashboardPage";
import DeniedPage from "../pages/DeniedPage";
import ModuleAPage from "../pages/ModuleAPage";
import ModuleBPage from "../pages/ModuleBPage";
import PendingPage from "../pages/PendingPage";
import RequestAccessPage from "../pages/RequestAccessPage";
import HomeRoute from "./HomeRoute";
import ProtectedRoute from "./ProtectedRoute";

function LegacyRouteRedirect() {
  if (typeof window !== "undefined" && isLegacyDashboardRoute(window.location.pathname)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Navigate to={ROUTES.home} replace />;
}

export default function AppRouter() {
  const dashboardRoute = getRouteConfig(ROUTES.dashboard);
  const moduleARoute = getRouteConfig(ROUTES.moduleA);
  const moduleBRoute = getRouteConfig(ROUTES.moduleB);

  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<HomeRoute />} />

        <Route element={<ProtectedRoute allowedAccessStates={["unknown"]} />}>
          <Route path={ROUTES.requestAccess} element={<RequestAccessPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedAccessStates={["pending"]} />}>
          <Route path={ROUTES.pending} element={<PendingPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedAccessStates={["denied"]} />}>
          <Route path={ROUTES.denied} element={<DeniedPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedAccessStates={[...AUTHENTICATED_DASHBOARD_ACCESS_STATES]} />}>
          <Route element={<DashboardLayout />}>
            <Route
              element={<ProtectedRoute allowedAccessStates={dashboardRoute?.allowedAccessStates ?? []} />}
            >
              <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedAccessStates={moduleARoute?.allowedAccessStates ?? []} />}
            >
              <Route path={ROUTES.moduleA} element={<ModuleAPage />} />
            </Route>
            <Route
              element={
                <ProtectedRoute
                  allowedAccessStates={moduleBRoute?.allowedAccessStates ?? []}
                  unauthorizedRedirectTo={ROUTES.dashboard}
                />
              }
            >
              <Route path={ROUTES.moduleB} element={<ModuleBPage />} />
            </Route>
          </Route>
        </Route>

        <Route path={ROUTES.legacyAdminHome} element={<LegacyRouteRedirect />} />
        <Route path={ROUTES.legacyAdminTools} element={<LegacyRouteRedirect />} />
        <Route path={ROUTES.legacySubscriberHome} element={<LegacyRouteRedirect />} />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
