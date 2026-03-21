import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import DashboardPage from "./DashboardPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders approved-user identity and role-aware quick links", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        displayName: "Taylor",
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
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Welcome back, Taylor")).toBeInTheDocument();
    expect(screen.getByText("Approved user")).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Module A" })).toHaveAttribute("href", "/module-a");
    expect(screen.queryByRole("link", { name: "Open Admin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open Module B" })).not.toBeInTheDocument();
  });

  it("renders admin-only quick links for administrators", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "admin-1",
        displayName: "Taylor",
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
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Module A" })).toHaveAttribute("href", "/module-a");
    expect(screen.getByRole("link", { name: "Open Admin" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Open Module B" })).toHaveAttribute("href", "/module-b");
  });
});
