import type { AccessState } from "./types";

export const ROUTES = {
  home: "/",
  adminHome: "/app",
  adminTools: "/app/admin",
  subscriberHome: "/subscriber",
  pending: "/pending",
  denied: "/denied",
  requestAccess: "/request-access",
} as const;

export function getRouteForAccessState(accessState: AccessState): string {
  switch (accessState) {
    case "admin":
      return ROUTES.adminHome;
    case "approved":
      return ROUTES.subscriberHome;
    case "pending":
      return ROUTES.pending;
    case "denied":
      return ROUTES.denied;
    case "unknown":
    default:
      return ROUTES.requestAccess;
  }
}

export function isAdminRoute(pathname: string) {
  return pathname === ROUTES.adminHome || pathname === ROUTES.adminTools;
}
