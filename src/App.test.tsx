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

  it("renders the approved subscriber state", () => {
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

    expect(screen.getByText("Taylor")).toBeInTheDocument();
    expect(screen.getByText("taylor@example.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Dashboard navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Module A" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Module B" })).not.toBeInTheDocument();
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

  it("renders admin navigation for admin users", () => {
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

    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Module A" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Module B" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
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
      "You do not have access to /module-b. Showing the dashboard instead."
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
    expect(screen.getByRole("heading", { name: "Module B" })).toBeInTheDocument();
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
