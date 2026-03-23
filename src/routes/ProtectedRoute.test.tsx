import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import ProtectedRoute from "./ProtectedRoute";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

function renderProtectedRoute(
  initialPath: string,
  allowedAccessStates?: Array<"unknown" | "pending" | "denied" | "approved" | "admin">,
  unauthorizedRedirectTo?: string
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Home page</div>} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route path="/pending" element={<div>Pending page</div>} />
        <Route path="/request-access" element={<div>Request access page</div>} />
        <Route
          element={
            <ProtectedRoute
              allowedAccessStates={allowedAccessStates}
              unauthorizedRedirectTo={unauthorizedRedirectTo}
            />
          }
        >
          <Route path="/protected" element={<div>Protected content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the signed-out loading copy while auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false,
      accessState: null,
      normalizedEmail: null,
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute("/protected", ["approved"]);

    expect(screen.getByRole("heading", { name: "Resolving dashboard access" })).toBeInTheDocument();
    expect(
      screen.getByText("Checking your sign-in and authorization state...")
    ).toBeInTheDocument();
  });

  it("shows the authenticated loading copy while role checks are in progress", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: true,
      isAuthenticated: true,
      accessState: null,
      normalizedEmail: "member@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute("/protected", ["approved"]);

    expect(
      screen.getByText("Checking your dashboard role and route permissions...")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated users back to home", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      accessState: null,
      normalizedEmail: null,
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute("/protected", ["approved"]);

    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("shows the resolving view when auth is complete but access state is still missing", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: null,
      normalizedEmail: "member@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute("/protected", ["approved"]);

    expect(screen.getByText("Resolving your dashboard access level...")).toBeInTheDocument();
  });

  it("redirects unauthorized users to their default route", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "pending",
      normalizedEmail: "member@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute("/protected", ["approved"]);

    expect(screen.getByText("Pending page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects unauthorized users to an explicit fallback when provided", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "member@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute("/protected", ["admin"], "/dashboard");

    expect(screen.getByText("Dashboard page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders the outlet when the access state is allowed", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "admin-1",
        email: "admin@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "admin@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderProtectedRoute("/protected", ["admin"]);

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
