import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Timestamp } from "firebase/firestore";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { listNotes } from "../features/notes";
import NotesListPage from "./NotesListPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/notes", async () => {
  const actual = await vi.importActual<typeof import("../features/notes")>("../features/notes");

  return {
    ...actual,
    listNotes: vi.fn(),
  };
});

function createTimestamp(isoString: string) {
  const date = new Date(isoString);

  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  } as Timestamp;
}

describe("NotesListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        uid: "member-1",
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
  });

  function renderPage(initialPathname: string) {
    return render(
      <MemoryRouter initialEntries={[initialPathname]}>
        <Routes>
          <Route path="/notes/drafts" element={<NotesListPage />} />
          <Route path="/notes/published" element={<NotesListPage />} />
          <Route path="/notes/:noteId" element={<div>Note details route</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("loads draft notes for the current user", async () => {
    vi.mocked(listNotes).mockResolvedValue([
      {
        id: "draft-1",
        title: "First draft",
        body: "A".repeat(200),
        status: "draft",
        visibility: "private",
        authorId: "member-1",
        authorEmail: "member@example.com",
        createdAt: null,
        updatedAt: createTimestamp("2026-03-23T10:00:00.000Z"),
        publishedAt: null,
      },
    ]);

    renderPage("/notes/drafts");

    expect(screen.getByText("Loading drafts...")).toBeInTheDocument();
    expect(await screen.findByText("First draft")).toBeInTheDocument();
    expect(vi.mocked(listNotes)).toHaveBeenCalledWith({
      visibility: "private",
      authorId: "member-1",
      status: "draft",
    });
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    expect(screen.getByText(`${"A".repeat(159)}...`)).toBeInTheDocument();
  });

  it("loads published notes for the current user", async () => {
    vi.mocked(listNotes).mockResolvedValue([]);

    renderPage("/notes/published");

    await waitFor(() => {
      expect(vi.mocked(listNotes)).toHaveBeenCalledWith({
        visibility: "private",
        authorId: "member-1",
        status: "published",
      });
    });

    expect(await screen.findByText("No published notes yet")).toBeInTheDocument();
  });

  it("navigates to the note details route when a note is clicked", async () => {
    vi.mocked(listNotes).mockResolvedValue([
      {
        id: "draft-1",
        title: "Clickable draft",
        body: "Open me",
        status: "draft",
        visibility: "private",
        authorId: "member-1",
        authorEmail: "member@example.com",
        createdAt: null,
        updatedAt: null,
        publishedAt: null,
      },
    ]);

    renderPage("/notes/drafts");

    fireEvent.click(await screen.findByRole("link", { name: /Clickable draft/i }));

    expect(await screen.findByText("Note details route")).toBeInTheDocument();
  });

  it("shows the draft empty state", async () => {
    vi.mocked(listNotes).mockResolvedValue([]);

    renderPage("/notes/drafts");

    expect(await screen.findByText("No drafts yet")).toBeInTheDocument();
  });
});
