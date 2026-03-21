import { render, screen, waitFor } from "@testing-library/react";
import type { Timestamp } from "firebase/firestore";
import { vi } from "vitest";
import App from "./App";
import { useAuth } from "./auth/useAuth";
import { listPublishedDashboardNotes } from "./features/notes";

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

vi.mock("./features/notes", () => ({
  listPublishedDashboardNotes: vi.fn().mockResolvedValue([]),
  listRecentDashboardNotes: vi.fn().mockResolvedValue([]),
  createDashboardNote: vi.fn(),
  toDashboardNotesErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Unable to load dashboard notes right now."
  ),
}));

function createTimestamp(isoString: string) {
  const date = new Date(isoString);

  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  } as Timestamp;
}

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    vi.mocked(listPublishedDashboardNotes).mockResolvedValue([]);
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
    vi.mocked(listPublishedDashboardNotes).mockResolvedValue([
      {
        id: "dashboard-note-1",
        title: "Shared dashboard update",
        body: "Visible to approved users.",
        createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
        createdByUid: "admin-1",
        createdByEmail: "admin@example.com",
        updatedAt: null,
        published: true,
      },
    ]);

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

    expect(await screen.findByRole("heading", { name: "What you can access" })).toBeInTheDocument();
    expect(screen.getByText("Taylor")).toBeInTheDocument();
    expect(screen.getAllByText("taylor@example.com").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Welcome back, Taylor" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Dashboard navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Module A" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Module B" })).not.toBeInTheDocument();
    expect(await screen.findByText("Shared dashboard update")).toBeInTheDocument();
    expect(screen.queryByText("Posted by admin@example.com")).not.toBeInTheDocument();
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

    expect(await screen.findByRole("heading", { name: "What you can access" })).toBeInTheDocument();
    expect(screen.getAllByText("Administrator").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Module A" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Module B" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome back, Taylor" })).toBeInTheDocument();
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

    expect(await screen.findByRole("heading", { name: "Approved subscriber allow list" })).toBeInTheDocument();
  });

  it("redirects approved users away from module-b with a readable message", async () => {
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
      expect(window.location.pathname).toBe("/dashboard");
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You do not have access to Module B. Showing the dashboard instead."
    );
    expect(screen.queryByRole("link", { name: "Module B" })).not.toBeInTheDocument();
  });

  it("allows admin users to open module-b directly", () => {
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

    expect(window.location.pathname).toBe("/module-b");
    expect(screen.getByRole("heading", { name: "Admin-only Firestore write" })).toBeInTheDocument();
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
