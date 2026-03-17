import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AccessRequestView from "./AccessRequestView";
import { submitAccessRequest } from "../access/service";
import { useAuth } from "../auth/useAuth";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../access/service", () => ({
  submitAccessRequest: vi.fn(),
}));

describe("AccessRequestView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits an access request and refreshes auth state", async () => {
    const refreshAccessState = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "user-123",
        email: "newuser@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "unknown",
      normalizedEmail: "newuser@example.com",
      errorMessage: null,
      refreshAccessState,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(submitAccessRequest).mockResolvedValue(undefined);

    render(<AccessRequestView />);

    fireEvent.click(screen.getByRole("button", { name: "Request access" }));

    await waitFor(() => {
      expect(vi.mocked(submitAccessRequest)).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "user-123",
          email: "newuser@example.com",
        })
      );
      expect(refreshAccessState).toHaveBeenCalled();
    });

    expect(
      await screen.findByText("Access request received. Your request is pending review.")
    ).toBeInTheDocument();
  });

  it("shows duplicate pending request errors", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "user-123",
        email: "newuser@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "unknown",
      normalizedEmail: "newuser@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(submitAccessRequest).mockRejectedValue(
      new Error("An access request is already pending for this account.")
    );

    render(<AccessRequestView />);

    fireEvent.click(screen.getByRole("button", { name: "Request access" }));

    expect(
      await screen.findByText("An access request is already pending for this account.")
    ).toBeInTheDocument();
  });

  it("renders a cancel and sign out action", () => {
    const signOut = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "user-123",
        email: "newuser@example.com",
      } as ReturnType<typeof useAuth>["user"],
      loading: false,
      isAuthenticated: true,
      accessState: "unknown",
      normalizedEmail: "newuser@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut,
    });

    render(<AccessRequestView />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel and sign out" }));

    expect(signOut).toHaveBeenCalled();
  });
});
