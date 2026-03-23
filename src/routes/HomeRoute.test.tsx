import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import HomeRoute from "./HomeRoute";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("HomeRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderHomeRoute() {
    return render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/dashboard" element={<div>Dashboard landing</div>} />
          <Route path="/request-access" element={<div>Request access landing</div>} />
          <Route path="/pending" element={<div>Pending landing</div>} />
          <Route path="/denied" element={<div>Denied landing</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("shows the resolving view while auth is loading", () => {
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

    renderHomeRoute();

    expect(screen.getByRole("heading", { name: "Resolving dashboard access" })).toBeInTheDocument();
  });

  it("shows the sign-in view for signed-out users", () => {
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

    renderHomeRoute();

    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
  });

  it("keeps authenticated users on the resolving view until their access state is known", () => {
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

    renderHomeRoute();

    expect(screen.getByRole("heading", { name: "Resolving dashboard access" })).toBeInTheDocument();
  });

  it("redirects approved users to the dashboard", () => {
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

    renderHomeRoute();

    expect(screen.getByText("Dashboard landing")).toBeInTheDocument();
  });

  it("redirects unknown users to request access", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "unknown",
      normalizedEmail: "member@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderHomeRoute();

    expect(screen.getByText("Request access landing")).toBeInTheDocument();
  });
});
