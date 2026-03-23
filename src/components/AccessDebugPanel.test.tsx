import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runAccessDiagnostics } from "../access/service";
import { useAuth } from "../auth/useAuth";
import AccessDebugPanel from "./AccessDebugPanel";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../access/service", () => ({
  runAccessDiagnostics: vi.fn(),
}));

describe("AccessDebugPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("stays hidden when debug mode is not enabled", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "user-1",
        email: "user@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "unknown",
      normalizedEmail: "user@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<AccessDebugPanel />);

    expect(
      screen.queryByRole("heading", { name: "Authentication and access snapshot" })
    ).not.toBeInTheDocument();
    expect(runAccessDiagnostics).not.toHaveBeenCalled();
  });

  it("loads diagnostics when debugAuth=1 is present", async () => {
    window.history.replaceState({}, "", "/request-access?debugAuth=1");
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "user-1",
        email: "user@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "pending",
      normalizedEmail: "user@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(runAccessDiagnostics).mockResolvedValue({
      normalizedEmail: "user@example.com",
      adminMarker: "denied",
      accessRequest: "allowed:found",
      subscriberProbe: "denied",
      accessRequestStatus: "pending",
    });

    render(<AccessDebugPanel />);

    expect(screen.getByRole("heading", { name: "Authentication and access snapshot" })).toBeInTheDocument();

    await waitFor(() => {
      expect(runAccessDiagnostics).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "user-1",
          email: "user@example.com",
        })
      );
    });

    expect(screen.getAllByText("pending").length).toBeGreaterThan(0);
    expect(screen.getByText("allowed:found")).toBeInTheDocument();
  });

  it("clears diagnostics and errors when no user is available", async () => {
    window.history.replaceState({}, "", "/request-access?debugAuth=1");
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

    render(<AccessDebugPanel />);

    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(runAccessDiagnostics).not.toHaveBeenCalled();
    });
  });

  it("shows a readable diagnostics error and allows retry", async () => {
    window.history.replaceState({}, "", "/request-access?debugAuth=1");
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "user-1",
        email: "user@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "unknown",
      normalizedEmail: "user@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(runAccessDiagnostics)
      .mockRejectedValueOnce(new Error("Diagnostics failed."))
      .mockResolvedValueOnce({
        normalizedEmail: "user@example.com",
        adminMarker: "allowed:missing",
        accessRequest: "allowed:missing",
        subscriberProbe: "denied",
        accessRequestStatus: "missing",
      });

    render(<AccessDebugPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Diagnostics failed.");

    fireEvent.click(screen.getByRole("button", { name: "Refresh debug" }));

    await waitFor(() => {
      expect(runAccessDiagnostics).toHaveBeenCalledTimes(2);
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getAllByText("allowed:missing").length).toBeGreaterThan(0);
  });
});
