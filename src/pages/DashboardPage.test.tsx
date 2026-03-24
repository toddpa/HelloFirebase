import { render, screen } from "@testing-library/react";
import type { Timestamp } from "firebase/firestore";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { listPublishedDashboardNotes } from "../features/notes/notesService";
import DashboardPage from "./DashboardPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/notes/notesService", async () => {
  const actual = await vi.importActual<typeof import("../features/notes/notesService")>(
    "../features/notes/notesService"
  );

  return {
    ...actual,
    listPublishedDashboardNotes: vi.fn(),
    toDashboardNotesErrorMessage: vi.fn((error: unknown) =>
      error instanceof Error ? error.message : "Unable to load dashboard notes right now."
    ),
  };
});

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
  });

  it("renders approved-user identity and dashboard notes without admin metadata", async () => {
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
        status: "published",
        visibility: "shared",
        createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
        authorId: "admin-1",
        authorEmail: "admin@example.com",
        updatedAt: null,
        publishedAt: createTimestamp("2026-03-20T10:00:00.000Z"),
      },
      {
        id: "note-1",
        title: "Earlier note",
        body: "Older note body",
        status: "published",
        visibility: "shared",
        createdAt: createTimestamp("2026-03-19T10:00:00.000Z"),
        authorId: "admin-1",
        authorEmail: "admin@example.com",
        updatedAt: null,
        publishedAt: createTimestamp("2026-03-19T10:00:00.000Z"),
      },
    ]);
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Signed-in summary" })).toBeInTheDocument();
    expect(screen.getByText("Approved user")).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    expect(await screen.findByText("Most recent note")).toBeInTheDocument();
    expect(screen.getByText("Newest note body")).toBeInTheDocument();
    expect(screen.queryByText("Posted by admin@example.com")).not.toBeInTheDocument();
  });

  it("renders admin note author metadata for administrators", async () => {
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
        status: "published",
        visibility: "shared",
        createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
        authorId: "admin-1",
        authorEmail: "admin@example.com",
        updatedAt: null,
        publishedAt: createTimestamp("2026-03-20T10:00:00.000Z"),
      },
    ]);
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Administrator")).toBeInTheDocument();
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

    expect(await screen.findByText("No notes available yet.")).toBeInTheDocument();
  });
});
