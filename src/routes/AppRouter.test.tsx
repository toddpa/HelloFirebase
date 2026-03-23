import { render, screen } from "@testing-library/react";
import { Outlet } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppRouter from "./AppRouter";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      uid: "admin-1",
      email: "admin@example.com",
      displayName: "Admin User",
    },
    loading: false,
    isAuthenticated: true,
    accessState: "admin",
    normalizedEmail: "admin@example.com",
    errorMessage: null,
    refreshAccessState: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("../layouts/DashboardLayout", () => ({
  default: () => <Outlet />,
}));

vi.mock("../pages/AdminPage", () => ({
  default: () => <div>Admin page route</div>,
}));

vi.mock("../pages/AdminNotesPage", () => ({
  default: () => <div>Admin notes route</div>,
}));

vi.mock("../pages/DashboardPage", () => ({
  default: () => <div>Dashboard page route</div>,
}));

vi.mock("../pages/DeniedPage", () => ({
  default: () => <div>Denied page route</div>,
}));

vi.mock("../pages/ModuleAPage", () => ({
  default: () => <div>Module A route</div>,
}));

vi.mock("../pages/ModuleBPage", () => ({
  default: () => <div>Module B route</div>,
}));

vi.mock("../pages/PendingPage", () => ({
  default: () => <div>Pending page route</div>,
}));

vi.mock("../pages/RequestAccessPage", () => ({
  default: () => <div>Request access route</div>,
}));

describe("AppRouter", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  function renderRouterAt(pathname: string) {
    window.history.replaceState({}, "", pathname);
    return render(<AppRouter />);
  }

  it("redirects the legacy admin home route to the dashboard", () => {
    renderRouterAt("/app");

    expect(screen.getByText("Dashboard page route")).toBeInTheDocument();
  });

  it("redirects the legacy admin tools route to the admin page", () => {
    renderRouterAt("/app/admin");

    expect(screen.getByText("Admin page route")).toBeInTheDocument();
  });

  it("redirects the legacy subscriber route to the dashboard", () => {
    renderRouterAt("/subscriber");

    expect(screen.getByText("Dashboard page route")).toBeInTheDocument();
  });

  it("redirects unknown paths through home to the access-state destination", () => {
    renderRouterAt("/not-a-real-route");

    expect(screen.getByText("Dashboard page route")).toBeInTheDocument();
  });
});
