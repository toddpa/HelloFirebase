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

  it("renders approved-user identity and notes workspace shortcuts", () => {
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

    expect(screen.getByRole("heading", { name: "Signed-in summary" })).toBeInTheDocument();
    expect(screen.getByText("Approved user")).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notes workspace" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Notes" })).toHaveAttribute("href", "/notes/drafts");
    expect(screen.getByRole("link", { name: "View drafts" })).toHaveAttribute("href", "/notes/drafts");
    expect(screen.getByRole("link", { name: "View published" })).toHaveAttribute("href", "/notes/published");
    expect(screen.getByRole("link", { name: "Create note" })).toHaveAttribute("href", "/notes/new");
  });

  it("renders administrator identity with the same notes workspace entry point", () => {
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
    expect(screen.getByRole("link", { name: "Open Notes" })).toHaveAttribute("href", "/notes/drafts");
  });
});
