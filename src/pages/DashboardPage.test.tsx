import { render, screen } from "@testing-library/react";
import type { Timestamp } from "firebase/firestore";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { subscribeToAdminAnnouncements } from "../features/adminAnnouncements";
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

vi.mock("../features/adminAnnouncements", () => ({
  subscribeToAdminAnnouncements: vi.fn(),
  toAdminAnnouncementsErrorMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Unable to load admin announcements right now."
  ),
}));

function createTimestamp(isoString: string) {
  const date = new Date(isoString);

  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  } as Timestamp;
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPublishedDashboardNotes).mockResolvedValue([]);
    vi.mocked(subscribeToAdminAnnouncements).mockImplementation(({ onAnnouncements }) => {
      onAnnouncements([]);

      return vi.fn();
    });
  });

  it("renders approved-user identity, quick links, and dashboard notes without admin metadata", async () => {
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
        id: "note-2",
        title: "Most recent note",
        body: "Newest note body",
        createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
        createdByUid: "admin-1",
        createdByEmail: "admin@example.com",
        updatedAt: null,
        published: true,
      },
      {
        id: "note-1",
        title: "Earlier note",
        body: "Older note body",
        createdAt: createTimestamp("2026-03-19T10:00:00.000Z"),
        createdByUid: "admin-1",
        createdByEmail: "admin@example.com",
        updatedAt: null,
        published: true,
      },
    ]);
    vi.mocked(subscribeToAdminAnnouncements).mockImplementation(({ onAnnouncements }) => {
      onAnnouncements([
        {
          id: "announcement-1",
          title: "System maintenance",
          description: "A short shared announcement.",
          createdAt: createTimestamp("2026-03-21T10:00:00.000Z"),
        },
      ]);

      return vi.fn();
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Welcome back, Taylor")).toBeInTheDocument();
    expect(screen.getByText("Approved user")).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Module A" })).toHaveAttribute("href", "/module-a");
    expect(screen.queryByRole("link", { name: "Open Access Control" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open Dashboard Notes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open Module B" })).not.toBeInTheDocument();
    expect(await screen.findByText("System maintenance")).toBeInTheDocument();
    expect(screen.getByText("A short shared announcement.")).toBeInTheDocument();
    expect(await screen.findByText("Most recent note")).toBeInTheDocument();
    expect(screen.getByText("Newest note body")).toBeInTheDocument();
    expect(screen.queryByText("Posted by admin@example.com")).not.toBeInTheDocument();
  });

  it("renders admin-only quick links and note author metadata for administrators", async () => {
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
    vi.mocked(listPublishedDashboardNotes).mockResolvedValue([
      {
        id: "note-1",
        title: "Admin note",
        body: "Admin-visible body",
        createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
        createdByUid: "admin-1",
        createdByEmail: "admin@example.com",
        updatedAt: null,
        published: true,
      },
    ]);
    vi.mocked(subscribeToAdminAnnouncements).mockImplementation(({ onAnnouncements }) => {
      onAnnouncements([
        {
          id: "announcement-1",
          title: "Admin ops update",
          description: "Visible to admins and approved users.",
          createdAt: createTimestamp("2026-03-21T10:00:00.000Z"),
        },
      ]);

      return vi.fn();
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Module A" })).toHaveAttribute("href", "/module-a");
    expect(screen.getByRole("link", { name: "Open Access Control" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Open Dashboard Notes" })).toHaveAttribute("href", "/admin-notes");
    expect(screen.getByRole("link", { name: "Open Module B" })).toHaveAttribute("href", "/module-b");
    expect(await screen.findByText("Admin ops update")).toBeInTheDocument();
    expect(await screen.findByText("Admin note")).toBeInTheDocument();
    expect(screen.getByText("Posted by admin@example.com")).toBeInTheDocument();
  });

  it("renders the empty state when no dashboard notes are available", async () => {
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

    expect(await screen.findByText("No announcements yet.")).toBeInTheDocument();
    expect(await screen.findByText("No notes available yet.")).toBeInTheDocument();
  });

  it("renders a readable error without breaking the dashboard shell when announcements fail to load", async () => {
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
    vi.mocked(subscribeToAdminAnnouncements).mockImplementation(({ onError }) => {
      onError(new Error("You do not have permission to access admin announcements right now."));

      return vi.fn();
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to access admin announcements right now."
    );
    expect(screen.getByRole("heading", { name: "Welcome back, Taylor" })).toBeInTheDocument();
  });
});
