import type { AccessState } from "./types";

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  admin: "/admin",
  adminNotes: "/admin-notes",
  moduleA: "/module-a",
  moduleB: "/module-b",
  pending: "/pending",
  denied: "/denied",
  requestAccess: "/request-access",
  legacyAdminHome: "/app",
  legacyAdminTools: "/app/admin",
  legacySubscriberHome: "/subscriber",
} as const;

export const AUTHENTICATED_DASHBOARD_ACCESS_STATES = ["approved", "admin"] as const satisfies readonly AccessState[];

export type DashboardRouteConfig = {
  to: string;
  label: string;
  allowedAccessStates: AccessState[];
  showInNavigation?: boolean;
};

export const DASHBOARD_ROUTE_CONFIG: DashboardRouteConfig[] = [
  {
    to: ROUTES.dashboard,
    label: "Dashboard",
    allowedAccessStates: [...AUTHENTICATED_DASHBOARD_ACCESS_STATES],
  },
  {
    to: ROUTES.admin,
    label: "Access Control",
    allowedAccessStates: ["admin"],
  },
  {
    to: ROUTES.adminNotes,
    label: "Dashboard Notes",
    allowedAccessStates: ["admin"],
  },
  {
    to: ROUTES.moduleA,
    label: "My Notes",
    allowedAccessStates: [...AUTHENTICATED_DASHBOARD_ACCESS_STATES],
  },
  {
    to: ROUTES.moduleB,
    label: "Module B",
    allowedAccessStates: ["admin"],
    showInNavigation: false,
  },
];

export function canAccessRoute(accessState: AccessState, allowedAccessStates: AccessState[]) {
  return allowedAccessStates.includes(accessState);
}

export function getDashboardNavItems(accessState: AccessState | null) {
  if (!accessState) {
    return [];
  }

  return DASHBOARD_ROUTE_CONFIG.filter(
    (item) => item.showInNavigation !== false && canAccessRoute(accessState, item.allowedAccessStates)
  );
}

export function getRouteConfig(pathname: string) {
  return DASHBOARD_ROUTE_CONFIG.find((route) => route.to === pathname);
}

export function getRouteLabel(pathname: string) {
  return getRouteConfig(pathname)?.label ?? pathname;
}

export function getRouteForAccessState(accessState: AccessState): string {
  switch (accessState) {
    case "admin":
      return ROUTES.dashboard;
    case "approved":
      return ROUTES.dashboard;
    case "pending":
      return ROUTES.pending;
    case "denied":
      return ROUTES.denied;
    case "unknown":
    default:
      return ROUTES.requestAccess;
  }
}

export function isLegacyDashboardRoute(pathname: string) {
  return (
    pathname === ROUTES.legacyAdminHome ||
    pathname === ROUTES.legacyAdminTools ||
    pathname === ROUTES.legacySubscriberHome
  );
}
