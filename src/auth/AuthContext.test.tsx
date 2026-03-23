import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext, AuthProvider } from "./AuthContext";

const {
  browserLocalPersistenceMock,
  firebaseSignOutMock,
  getRedirectResultMock,
  onAuthStateChangedMock,
  setPersistenceMock,
  signInWithPopupMock,
  signInWithRedirectMock,
} = vi.hoisted(() => ({
  browserLocalPersistenceMock: { kind: "local" },
  firebaseSignOutMock: vi.fn(),
  getRedirectResultMock: vi.fn(),
  onAuthStateChangedMock: vi.fn(),
  setPersistenceMock: vi.fn(),
  signInWithPopupMock: vi.fn(),
  signInWithRedirectMock: vi.fn(),
}));

const { resolveUserAccessMock } = vi.hoisted(() => ({
  resolveUserAccessMock: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  browserLocalPersistence: browserLocalPersistenceMock,
  getRedirectResult: getRedirectResultMock,
  onAuthStateChanged: onAuthStateChangedMock,
  setPersistence: setPersistenceMock,
  signInWithPopup: signInWithPopupMock,
  signInWithRedirect: signInWithRedirectMock,
  signOut: firebaseSignOutMock,
}));

vi.mock("../access/service", () => ({
  resolveUserAccess: resolveUserAccessMock,
}));

vi.mock("../firebase/config", () => ({
  auth: { name: "auth-instance" },
  googleProvider: { providerId: "google" },
}));

function AuthProbe() {
  const auth = useContext(AuthContext);

  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="access-state">{auth.accessState ?? "none"}</div>
      <div data-testid="normalized-email">{auth.normalizedEmail ?? "none"}</div>
      <div data-testid="error-message">{auth.errorMessage ?? "none"}</div>
      <button type="button" onClick={() => void auth.signIn().catch(() => {})}>
        trigger sign in
      </button>
      <button type="button" onClick={() => void auth.signOut().catch(() => {})}>
        trigger sign out
      </button>
      <button type="button" onClick={() => void auth.refreshAccessState().catch(() => {})}>
        refresh access
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  const originalLocation = window.location;
  let authStateObserver:
    | ((user: { uid: string; email: string | null } | null) => void)
    | null;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateObserver = null;

    getRedirectResultMock.mockResolvedValue(null);
    setPersistenceMock.mockResolvedValue(undefined);
    signInWithPopupMock.mockResolvedValue(undefined);
    signInWithRedirectMock.mockResolvedValue(undefined);
    firebaseSignOutMock.mockResolvedValue(undefined);
    resolveUserAccessMock.mockResolvedValue({
      state: "approved",
      normalizedEmail: "member@example.com",
    });

    onAuthStateChangedMock.mockImplementation(
      (
        _auth: unknown,
        onNext: (user: { uid: string; email: string | null } | null) => void
      ) => {
        authStateObserver = onNext;
        return vi.fn();
      }
    );

    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("loads the signed-in user and resolves access state", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    act(() => {
      authStateObserver?.({
        uid: "member-1",
        email: "Member@Example.com",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(resolveUserAccessMock).toHaveBeenCalledWith({
      uid: "member-1",
      email: "Member@Example.com",
    });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("access-state")).toHaveTextContent("approved");
    expect(screen.getByTestId("normalized-email")).toHaveTextContent("member@example.com");
    expect(screen.getByTestId("error-message")).toHaveTextContent("none");
  });

  it("maps access resolution failures into an unknown state and readable error", async () => {
    resolveUserAccessMock.mockRejectedValueOnce(new Error("Access check failed."));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    act(() => {
      authStateObserver?.({
        uid: "member-1",
        email: "member@example.com",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("access-state")).toHaveTextContent("unknown");
    expect(screen.getByTestId("error-message")).toHaveTextContent("Access check failed.");
  });

  it("uses the popup sign-in flow on localhost", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    act(() => {
      authStateObserver?.(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "trigger sign in" }));

    await waitFor(() => {
      expect(setPersistenceMock).toHaveBeenCalledWith(
        { name: "auth-instance" },
        browserLocalPersistenceMock
      );
      expect(signInWithPopupMock).toHaveBeenCalledWith(
        { name: "auth-instance" },
        { providerId: "google" }
      );
    });
    expect(signInWithRedirectMock).not.toHaveBeenCalled();
  });

  it("uses redirect sign-in outside popup-supported hosts", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: Object.create(window.location, {
        hostname: {
          value: "example.com",
        },
      }),
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    act(() => {
      authStateObserver?.(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "trigger sign in" }));

    await waitFor(() => {
      expect(signInWithRedirectMock).toHaveBeenCalledWith(
        { name: "auth-instance" },
        { providerId: "google" }
      );
    });
    expect(signInWithPopupMock).not.toHaveBeenCalled();
  });

  it("refreshes access state for the current user", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    act(() => {
      authStateObserver?.({
        uid: "member-1",
        email: "member@example.com",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    resolveUserAccessMock.mockResolvedValueOnce({
      state: "admin",
      normalizedEmail: "member@example.com",
    });

    fireEvent.click(screen.getByRole("button", { name: "refresh access" }));

    await waitFor(() => {
      expect(screen.getByTestId("access-state")).toHaveTextContent("admin");
    });
  });

  it("surfaces sign-out failures as auth errors", async () => {
    firebaseSignOutMock.mockRejectedValueOnce(new Error("Sign-out failed."));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    act(() => {
      authStateObserver?.({
        uid: "member-1",
        email: "member@example.com",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    fireEvent.click(screen.getByRole("button", { name: "trigger sign out" }));

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent("Sign-out failed.");
    });
  });
});
