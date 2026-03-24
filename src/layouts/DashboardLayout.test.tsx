import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import styles from "./DashboardLayout.module.css";
import DashboardLayout from "./DashboardLayout";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderLayout(initialEntry: {
    pathname: string;
    state?: Record<string, unknown>;
  }) {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="*" element={<div>Nested content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  }

  it("shows the unauthorized route banner using the route label", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
        displayName: "Taylor",
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

    renderLayout({
      pathname: "/dashboard",
      state: { unauthorizedFrom: "/admin" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You do not have access to Access Control. Showing the dashboard instead."
    );
  });

  it("shows the auth error banner when one exists", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
        displayName: "Taylor",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "member@example.com",
      errorMessage: "Session refresh failed.",
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    renderLayout({
      pathname: "/dashboard",
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Session refresh failed.");
  });

  it("shows only approved-user navigation items for approved users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
        displayName: "Taylor",
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

    renderLayout({
      pathname: "/dashboard",
    });

    expect(screen.getByRole("button", { name: "Create New" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Drafts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Published" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Access Control" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard Notes" })).not.toBeInTheDocument();
  });

  it("lets admins see admin navigation items and sign out", () => {
    const signOut = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "admin-1",
        email: "admin@example.com",
        displayName: "Taylor",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "admin@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut,
    });

    renderLayout({
      pathname: "/dashboard",
    });

    expect(screen.getByRole("button", { name: "Create New" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Access Control" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Drafts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Published" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard Notes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Module B" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOut).toHaveBeenCalled();
  });

  it("marks Notes as the active parent and Published as the active child for published notes", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
        displayName: "Taylor",
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

    renderLayout({
      pathname: "/notes/published",
    });

    expect(screen.getByRole("button", { name: "Create New" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Notes" })).toHaveClass(styles.navLinkActive);
    expect(screen.getByRole("link", { name: "Published" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Drafts" })).not.toHaveAttribute("aria-current");
  });

  it("disables the sidebar create action while creating or editing a note", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
        email: "member@example.com",
        displayName: "Taylor",
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

    const { rerender } = render(
      <MemoryRouter initialEntries={[{ pathname: "/notes/new" }]}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="*" element={<div>Nested content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Create New" })).toBeDisabled();

    rerender(
      <MemoryRouter initialEntries={[{ pathname: "/notes/note-123" }]}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="*" element={<div>Nested content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Create New" })).toBeDisabled();
  });
});
