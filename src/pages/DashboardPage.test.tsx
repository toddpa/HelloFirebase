import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { listPublishedDashboardNotes } from "../features/notes";
import DashboardPage from "./DashboardPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/notes", () => ({
  listPublishedDashboardNotes: vi.fn(),
  toDashboardNotesErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Unable to load dashboard notes right now."
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders approved-user dashboard notes and role-aware module summaries", async () => {
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
    vi.mocked(listPublishedDashboardNotes).mockResolvedValue([
      {
        id: "note-1",
        title: "Subscriber update",
        body: "Published note body",
        createdAt: null,
        createdByUid: "admin-1",
        createdByEmail: "admin@example.com",
        updatedAt: null,
        published: true,
      },
    ]);

    render(<DashboardPage />);

    expect(await screen.findByText("Subscriber update")).toBeInTheDocument();
    expect(screen.getByText("Approved user")).toBeInTheDocument();
    expect(screen.getByText("/module-a")).toBeInTheDocument();
    expect(screen.queryByText("/module-b")).not.toBeInTheDocument();
  });

  it("renders an empty state when no published notes exist", async () => {
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
    vi.mocked(listPublishedDashboardNotes).mockResolvedValue([]);

    render(<DashboardPage />);

    expect(await screen.findByText("No dashboard notes yet.")).toBeInTheDocument();
  });

  it("refreshes the notes feed when requested", async () => {
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
    vi.mocked(listPublishedDashboardNotes)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "note-2",
          title: "Operations bulletin",
          body: "Refreshed note body",
          createdAt: null,
          createdByUid: "admin-1",
          createdByEmail: "admin@example.com",
          updatedAt: null,
          published: true,
        },
      ]);

    render(<DashboardPage />);

    expect(await screen.findByText("No dashboard notes yet.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(vi.mocked(listPublishedDashboardNotes)).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("Operations bulletin")).toBeInTheDocument();
  });
});
