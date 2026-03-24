import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  AUTHENTICATED_DASHBOARD_ACCESS_STATES,
  getRouteConfig,
  isLegacyDashboardRoute,
  ROUTES,
} from "../access/routes";
import DashboardLayout from "../layouts/DashboardLayout";
import NotesLayout from "../layouts/NotesLayout";
import AdminPage from "../pages/AdminPage";
import DashboardPage from "../pages/DashboardPage";
import DeniedPage from "../pages/DeniedPage";
import NoteEditorPage from "../pages/NoteEditorPage";
import NotesListPage from "../pages/NotesListPage";
import PendingPage from "../pages/PendingPage";
import RequestAccessPage from "../pages/RequestAccessPage";
import HomeRoute from "./HomeRoute";
import ProtectedRoute from "./ProtectedRoute";

function LegacyRouteRedirect() {
  if (typeof window !== "undefined" && window.location.pathname === ROUTES.legacyAdminTools) {
    return <Navigate to={ROUTES.admin} replace />;
  }

  if (typeof window !== "undefined" && isLegacyDashboardRoute(window.location.pathname)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Navigate to={ROUTES.home} replace />;
}

export default function AppRouter() {
  const dashboardRoute = getRouteConfig(ROUTES.dashboard);
  const notesRoute = getRouteConfig(ROUTES.notesDrafts);
  const adminRoute = getRouteConfig(ROUTES.admin);

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
            <Route element={<ProtectedRoute allowedAccessStates={notesRoute?.allowedAccessStates ?? []} />}>
              <Route path={ROUTES.notes} element={<NotesLayout />}>
                <Route index element={<Navigate to={ROUTES.notesDrafts} replace />} />
                <Route path="drafts" element={<NotesListPage />} />
                <Route path="published" element={<NotesListPage />} />
                <Route path="new" element={<NoteEditorPage />} />
                <Route path=":noteId" element={<NoteEditorPage />} />
              </Route>
            </Route>
            <Route
              element={
                <ProtectedRoute
                  allowedAccessStates={adminRoute?.allowedAccessStates ?? []}
                  unauthorizedRedirectTo={ROUTES.dashboard}
                />
              }
            >
              <Route path={ROUTES.admin} element={<AdminPage />} />
            </Route>
            <Route path={ROUTES.adminNotes} element={<Navigate to={ROUTES.notesPublished} replace />} />
            <Route path={ROUTES.moduleA} element={<Navigate to={ROUTES.notesDrafts} replace />} />
            <Route path={ROUTES.moduleB} element={<Navigate to={ROUTES.notesPublished} replace />} />
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
