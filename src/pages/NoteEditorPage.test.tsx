import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Timestamp } from "firebase/firestore";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../auth/useAuth";
import { createNote, deleteNote, getNoteById, updateNote } from "../features/notes";
import noteEditorStyles from "../components/notes/NoteEditor.module.css";
import NoteEditorPage from "./NoteEditorPage";

vi.mock("../auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/notes", async () => {
  const actual = await vi.importActual<typeof import("../features/notes")>("../features/notes");

  return {
    ...actual,
    createNote: vi.fn(),
    deleteNote: vi.fn(),
    getNoteById: vi.fn(),
    updateNote: vi.fn(),
  };
});

function createTimestamp(isoString: string) {
  const date = new Date(isoString);

  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  } as Timestamp;
}

describe("NoteEditorPage", () => {
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

  function renderPage(initialEntry: string | { pathname: string; state?: Record<string, unknown> }) {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/notes/new" element={<NoteEditorPage />} />
          <Route path="/notes/:noteId" element={<NoteEditorPage />} />
          <Route path="/notes/drafts" element={<div>Draft list route</div>} />
          <Route path="/notes/published" element={<div>Published list route</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("creates a draft note and redirects to drafts", async () => {
    vi.mocked(createNote).mockResolvedValue("draft-1");

    renderPage("/notes/new");

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Draft title" },
    });
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "Draft body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(vi.mocked(createNote)).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "member-1",
          email: "member@example.com",
        }),
        {
          title: "Draft title",
          body: "Draft body",
          status: "draft",
          visibility: "private",
        }
      );
    });

    expect(await screen.findByText("Draft list route")).toBeInTheDocument();
  });

  it("shows cancel on create and returns to the provided notes context", async () => {
    renderPage({
      pathname: "/notes/new",
      state: { returnTo: "/notes/published" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Published list route")).toBeInTheDocument();
  });

  it("returns create cancel to drafts when no prior notes context is available", async () => {
    renderPage("/notes/new");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Draft list route")).toBeInTheDocument();
  });

  it("disables create actions until the draft content is valid", () => {
    renderPage("/notes/new");

    const publishButton = screen.getByRole("button", { name: "Publish" });
    const saveDraftButton = screen.getByRole("button", { name: "Save Draft" });

    expect(publishButton).toBeDisabled();
    expect(saveDraftButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "   " },
    });

    expect(publishButton).toBeDisabled();
    expect(saveDraftButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Draft title" },
    });

    expect(publishButton).toBeDisabled();
    expect(saveDraftButton).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "Draft body" },
    });

    expect(publishButton).toBeEnabled();
    expect(saveDraftButton).toBeEnabled();
  });

  it("prevents empty create submissions from triggering save handlers", () => {
    renderPage("/notes/new");

    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Draft" })).toBeDisabled();
    expect(vi.mocked(createNote)).not.toHaveBeenCalled();
  });

  it("creates a published note and redirects to published", async () => {
    vi.mocked(createNote).mockResolvedValue("published-1");

    renderPage("/notes/new");

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Published title" },
    });
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "Published body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(vi.mocked(createNote)).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "member-1",
          email: "member@example.com",
        }),
        {
          title: "Published title",
          body: "Published body",
          status: "published",
          visibility: "private",
        }
      );
    });

    expect(await screen.findByText("Published list route")).toBeInTheDocument();
  });

  it("loads a draft note and saves it without changing status", async () => {
    vi.mocked(getNoteById).mockResolvedValue({
      id: "note-1",
      title: "Existing title",
      body: "Existing body",
      status: "draft",
      visibility: "private",
      authorId: "member-1",
      authorEmail: "member@example.com",
      createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
      updatedAt: createTimestamp("2026-03-21T10:00:00.000Z"),
      publishedAt: null,
    });
    vi.mocked(updateNote).mockResolvedValue();

    renderPage("/notes/note-1");

    expect(screen.getByText("Loading note...")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Existing title")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated title" },
    });
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "Updated body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(vi.mocked(updateNote)).toHaveBeenCalledWith("note-1", {
        title: "Updated title",
        body: "Updated body",
        status: "draft",
        visibility: "private",
      });
    });

    expect(await screen.findByText("Draft list route")).toBeInTheDocument();
  });

  it("keeps edit actions in a single shared action row", async () => {
    vi.mocked(getNoteById).mockResolvedValue({
      id: "note-1",
      title: "Existing title",
      body: "Existing body",
      status: "draft",
      visibility: "private",
      authorId: "member-1",
      authorEmail: "member@example.com",
      createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
      updatedAt: createTimestamp("2026-03-21T10:00:00.000Z"),
      publishedAt: null,
    });

    renderPage("/notes/note-1");

    const saveButton = await screen.findByRole("button", { name: "Save" });
    const publishButton = screen.getByRole("button", { name: "Publish" });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    const actionRow = saveButton.parentElement;

    expect(actionRow).toHaveClass(noteEditorStyles.actionRow);
    expect(publishButton.parentElement).toBe(actionRow);
    expect(cancelButton.parentElement).toBe(actionRow);
    expect(deleteButton.parentElement).toBe(actionRow);
  });

  it("applies create-equivalent validation rules in edit mode", async () => {
    vi.mocked(getNoteById).mockResolvedValue({
      id: "note-1",
      title: "Existing title",
      body: "Existing body",
      status: "draft",
      visibility: "private",
      authorId: "member-1",
      authorEmail: "member@example.com",
      createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
      updatedAt: createTimestamp("2026-03-21T10:00:00.000Z"),
      publishedAt: null,
    });

    renderPage("/notes/note-1");

    await screen.findByDisplayValue("Existing title");

    const saveButton = screen.getByRole("button", { name: "Save" });
    const publishButton = screen.getByRole("button", { name: "Publish" });

    expect(saveButton).toBeEnabled();
    expect(publishButton).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "   " },
    });

    expect(saveButton).toBeDisabled();
    expect(publishButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Draft title" },
    });

    expect(saveButton).toBeEnabled();
    expect(publishButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Body"), {
      target: { value: "Draft body" },
    });

    expect(saveButton).toBeEnabled();
    expect(publishButton).toBeEnabled();
  });

  it("publishes an existing draft note", async () => {
    vi.mocked(getNoteById).mockResolvedValue({
      id: "note-1",
      title: "Draft title",
      body: "Draft body",
      status: "draft",
      visibility: "private",
      authorId: "member-1",
      authorEmail: "member@example.com",
      createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
      updatedAt: createTimestamp("2026-03-21T10:00:00.000Z"),
      publishedAt: null,
    });
    vi.mocked(updateNote).mockResolvedValue();

    renderPage("/notes/note-1");

    expect(await screen.findByDisplayValue("Draft title")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(vi.mocked(updateNote)).toHaveBeenCalledWith("note-1", {
        title: "Draft title",
        body: "Draft body",
        status: "published",
        visibility: "private",
      });
    });

    expect(await screen.findByText("Published list route")).toBeInTheDocument();
  });

  it("moves a published note back to drafts", async () => {
    vi.mocked(getNoteById).mockResolvedValue({
      id: "note-1",
      title: "Published title",
      body: "Published body",
      status: "published",
      visibility: "private",
      authorId: "member-1",
      authorEmail: "member@example.com",
      createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
      updatedAt: createTimestamp("2026-03-21T10:00:00.000Z"),
      publishedAt: null,
    });
    vi.mocked(updateNote).mockResolvedValue();

    renderPage("/notes/note-1");

    expect(await screen.findByDisplayValue("Published title")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Move to Draft" }));

    await waitFor(() => {
      expect(vi.mocked(updateNote)).toHaveBeenCalledWith("note-1", {
        title: "Published title",
        body: "Published body",
        status: "draft",
        visibility: "private",
      });
    });

    expect(await screen.findByText("Draft list route")).toBeInTheDocument();
  });

  it("shows a confirmation step before deleting and redirects to the previous list", async () => {
    vi.mocked(getNoteById).mockResolvedValue({
      id: "note-1",
      title: "Published title",
      body: "Published body",
      status: "published",
      visibility: "private",
      authorId: "member-1",
      authorEmail: "member@example.com",
      createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
      updatedAt: createTimestamp("2026-03-21T10:00:00.000Z"),
      publishedAt: null,
    });
    vi.mocked(deleteNote).mockResolvedValue();

    renderPage("/notes/note-1");

    expect(await screen.findByRole("button", { name: "Delete" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Confirm Delete" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Delete" }));

    await waitFor(() => {
      expect(vi.mocked(deleteNote)).toHaveBeenCalledWith("note-1");
    });

    expect(await screen.findByText("Published list route")).toBeInTheDocument();
  });

  it("shows a readable error when a note is missing", async () => {
    vi.mocked(getNoteById).mockResolvedValue(null);

    renderPage("/notes/missing-note");

    expect(await screen.findByText("The requested note could not be found.")).toBeInTheDocument();
  });
});
