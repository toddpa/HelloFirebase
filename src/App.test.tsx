import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";
import { useAuth } from "./auth/useAuth";

vi.mock("./auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("./access/service", () => ({
  allowSubscriberEmail: vi.fn(),
  bootstrapAdminUser: vi.fn(),
  listAccessRequests: vi.fn().mockResolvedValue([]),
  listPendingAccessRequests: vi.fn().mockResolvedValue([]),
  listAllowedEmails: vi.fn().mockResolvedValue([]),
  removeSubscriberEmail: vi.fn(),
  resolveUserAccess: vi.fn(),
  reviewAccessRequest: vi.fn(),
  submitAccessRequest: vi.fn(),
}));

vi.mock("./features/notes", async () => {
  const actual = await vi.importActual<typeof import("./features/notes")>("./features/notes");

  return {
    ...actual,
    listNotes: vi.fn().mockResolvedValue([]),
    getNoteById: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
  };
});

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("renders the loading state", () => {
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

    render(<App />);

    expect(screen.getByRole("heading", { name: "Resolving dashboard access" })).toBeInTheDocument();
    expect(
      screen.getByText("Checking your sign-in and authorization state...")
    ).toBeInTheDocument();
  });

  it("renders the signed out state", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      accessState: null,
      normalizedEmail: null,
      errorMessage: "Authentication failed.",
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(
      screen.getByRole("button", { name: "Sign in with Google" })
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Authentication failed.");
  });

  it("renders the approved subscriber state", async () => {
    window.history.replaceState({}, "", "/dashboard");
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Signed-in summary" })).toBeInTheDocument();
    expect(screen.getByText("Taylor")).toBeInTheDocument();
    expect(screen.getAllByText("taylor@example.com").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Signed-in summary" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Dashboard navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard Notes" })).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Notes workspace" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Notes" })).toHaveAttribute("href", "/notes/drafts");
  });

  it("renders the request access state for unknown users", () => {
    window.history.replaceState({}, "", "/request-access");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "unknown",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Request dashboard access" })).toBeInTheDocument();
    expect(screen.getByText("Signed in email")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Admin announcements" })).not.toBeInTheDocument();
  });

  it("renders the pending state", () => {
    window.history.replaceState({}, "", "/pending");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "pending",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Your request is pending review" })).toBeInTheDocument();
    expect(
      screen.getByText("Access request received. Your request is pending review.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Admin announcements" })).not.toBeInTheDocument();
  });

  it("renders the denied state", () => {
    window.history.replaceState({}, "", "/denied");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "denied",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: "Access has not been granted" })).toBeInTheDocument();
    expect(screen.getByText("Access has not been granted for this account.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Admin announcements" })).not.toBeInTheDocument();
  });

  it("renders admin navigation for admin users", async () => {
    window.history.replaceState({}, "", "/dashboard");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Signed-in summary" })).toBeInTheDocument();
    expect(screen.getAllByText("Administrator").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Access Control" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard Notes" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Signed-in summary" })).toBeInTheDocument();
  });

  it("allows admin users to open the admin tools page", async () => {
    window.history.replaceState({}, "", "/admin");

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

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Access management" })).toBeInTheDocument();
  });

  it("redirects the legacy dashboard notes page into published notes", async () => {
    window.history.replaceState({}, "", "/admin-notes");

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

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/notes/published");
    });

    expect(await screen.findByRole("heading", { name: "Published notes" })).toBeInTheDocument();
  });

  it("redirects legacy module-b into published notes", async () => {
    window.history.replaceState({}, "", "/module-b");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/notes/published");
    });
    expect(await screen.findByRole("heading", { name: "Published notes" })).toBeInTheDocument();
  });

  it("redirects admins from module-b into published notes", async () => {
    window.history.replaceState({}, "", "/module-b");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/notes/published");
    });

    expect(await screen.findByRole("heading", { name: "Published notes" })).toBeInTheDocument();
  });

  it("replaces the URL with the allowed route for approved users", async () => {
    window.history.replaceState({}, "", "/pending");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });

  it("redirects legacy subscriber routes into the dashboard", async () => {
    window.history.replaceState({}, "", "/subscriber");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });

  it("redirects the legacy admin tools URL to the admin page", async () => {
    window.history.replaceState({}, "", "/app/admin");

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

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/admin");
    });
  });

  it("replaces the URL with the admin route for admin users", async () => {
    window.history.replaceState({}, "", "/request-access");

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "123",
        displayName: "Taylor",
        email: "taylor@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "taylor@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });
});
