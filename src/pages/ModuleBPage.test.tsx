import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../access/routes";
import ModuleBPage from "./ModuleBPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("ModuleBPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an unauthorized state for non-admin users", () => {
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

    render(
      <MemoryRouter initialEntries={[ROUTES.moduleB]}>
        <Routes>
          <Route path={ROUTES.moduleB} element={<ModuleBPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Admin access required" })).toBeInTheDocument();
  });

  it("redirects admins to dashboard notes", () => {
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

    render(
      <MemoryRouter initialEntries={[ROUTES.moduleB]}>
        <Routes>
          <Route path={ROUTES.moduleB} element={<ModuleBPage />} />
          <Route path={ROUTES.adminNotes} element={<h1>Dashboard notes</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Dashboard notes" })).toBeInTheDocument();
  });
});
