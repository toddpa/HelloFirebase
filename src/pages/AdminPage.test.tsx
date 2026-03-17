import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import AdminPage from "./AdminPage";
import { useAuth } from "../auth/useAuth";
import {
  allowSubscriberEmail,
  listAllowedEmails,
  listPendingAccessRequests,
  removeSubscriberEmail,
  reviewAccessRequest,
} from "../access/service";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../access/service", () => ({
  allowSubscriberEmail: vi.fn(),
  listAllowedEmails: vi.fn(),
  listPendingAccessRequests: vi.fn(),
  removeSubscriberEmail: vi.fn(),
  reviewAccessRequest: vi.fn(),
}));

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("shows an unauthorized state for non-admin users", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: true,
      accessState: "approved",
      normalizedEmail: "member@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    render(<AdminPage />);

    expect(
      screen.getByRole("heading", { name: "This page is restricted to administrators" })
    ).toBeInTheDocument();
    expect(vi.mocked(listAllowedEmails)).not.toHaveBeenCalled();
  });

  it("renders the empty state when no allowed emails exist", async () => {
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
    vi.mocked(listAllowedEmails).mockResolvedValue([]);
    vi.mocked(listPendingAccessRequests).mockResolvedValue([]);

    render(<AdminPage />);

    expect(await screen.findByText("No approved emails yet.")).toBeInTheDocument();
    expect(screen.getByText("No pending access requests.")).toBeInTheDocument();
  });

  it("validates email input before submitting", async () => {
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
    vi.mocked(listAllowedEmails).mockResolvedValue([]);
    vi.mocked(listPendingAccessRequests).mockResolvedValue([]);

    render(<AdminPage />);

    await screen.findByText("No approved emails yet.");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Add approved email" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address.");
    expect(vi.mocked(allowSubscriberEmail)).not.toHaveBeenCalled();
  });

  it("normalizes and submits a new approved email", async () => {
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
    vi.mocked(listAllowedEmails)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          email: "newperson@example.com",
          normalizedEmail: "newperson@example.com",
          createdBy: "admin-1",
        },
      ]);
    vi.mocked(listPendingAccessRequests).mockResolvedValue([]);
    vi.mocked(allowSubscriberEmail).mockResolvedValue(undefined);

    render(<AdminPage />);

    await screen.findByText("No approved emails yet.");

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  NewPerson@Example.com  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add approved email" }));

    await waitFor(() => {
      expect(vi.mocked(allowSubscriberEmail)).toHaveBeenCalledWith(
        expect.objectContaining({ uid: "admin-1" }),
        "newperson@example.com"
      );
    });

    expect(await screen.findByText("Approved email added.")).toBeInTheDocument();
    expect(screen.getByText("newperson@example.com")).toBeInTheDocument();
  });

  it("shows a duplicate error returned by the service", async () => {
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
    vi.mocked(listAllowedEmails).mockResolvedValue([]);
    vi.mocked(listPendingAccessRequests).mockResolvedValue([]);
    vi.mocked(allowSubscriberEmail).mockRejectedValue(
      new Error("That email is already on the allow list.")
    );

    render(<AdminPage />);

    await screen.findByText("No approved emails yet.");

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "duplicate@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add approved email" }));

    expect(
      await screen.findByText("That email is already on the allow list.")
    ).toBeInTheDocument();
  });

  it("removes an email after confirmation", async () => {
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
    vi.mocked(listAllowedEmails)
      .mockResolvedValueOnce([
        {
          email: "member@example.com",
          normalizedEmail: "member@example.com",
          createdBy: "admin-1",
        },
      ])
      .mockResolvedValueOnce([]);
    vi.mocked(listPendingAccessRequests).mockResolvedValue([]);
    vi.mocked(removeSubscriberEmail).mockResolvedValue(undefined);

    render(<AdminPage />);

    expect(await screen.findByText("member@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        "Remove member@example.com from the approved subscriber allow list?"
      );
      expect(vi.mocked(removeSubscriberEmail)).toHaveBeenCalledWith("member@example.com");
    });

    expect(await screen.findByText("Approved email removed.")).toBeInTheDocument();
  });

  it("renders pending requests and approves one", async () => {
    const adminUser = {
      uid: "admin-1",
      email: "admin@example.com",
    } as ReturnType<typeof useAuth>["user"];

    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "admin@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(listAllowedEmails).mockResolvedValue([]);
    vi.mocked(listPendingAccessRequests)
      .mockResolvedValueOnce([
        {
          email: "pending@example.com",
          normalizedEmail: "pending@example.com",
          uid: "user-123",
          status: "pending",
        },
      ])
      .mockResolvedValueOnce([]);
    vi.mocked(reviewAccessRequest).mockResolvedValue(undefined);

    render(<AdminPage />);

    expect(await screen.findByText("pending@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(vi.mocked(reviewAccessRequest)).toHaveBeenCalledWith(
        adminUser,
        expect.objectContaining({
          normalizedEmail: "pending@example.com",
          status: "pending",
        }),
        "approved"
      );
    });

    expect(await screen.findByText("Access request approved.")).toBeInTheDocument();
    expect(screen.getByText("No pending access requests.")).toBeInTheDocument();
  });

  it("denies a pending request", async () => {
    const adminUser = {
      uid: "admin-1",
      email: "admin@example.com",
    } as ReturnType<typeof useAuth>["user"];

    vi.mocked(useAuth).mockReturnValue({
      user: adminUser,
      loading: false,
      isAuthenticated: true,
      accessState: "admin",
      normalizedEmail: "admin@example.com",
      errorMessage: null,
      refreshAccessState: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(listAllowedEmails).mockResolvedValue([]);
    vi.mocked(listPendingAccessRequests)
      .mockResolvedValueOnce([
        {
          email: "blocked@example.com",
          normalizedEmail: "blocked@example.com",
          uid: "user-456",
          status: "pending",
        },
      ])
      .mockResolvedValueOnce([]);
    vi.mocked(reviewAccessRequest).mockResolvedValue(undefined);

    render(<AdminPage />);

    expect(await screen.findByText("blocked@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Deny" }));

    await waitFor(() => {
      expect(vi.mocked(reviewAccessRequest)).toHaveBeenCalledWith(
        adminUser,
        expect.objectContaining({
          normalizedEmail: "blocked@example.com",
          status: "pending",
        }),
        "denied"
      );
    });

    expect(await screen.findByText("Access request denied.")).toBeInTheDocument();
  });
});
