import { renderHook, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  compareNoteRecords,
  createNote,
  deleteNote,
  getNoteById,
  listPrivateNotes,
  listSharedPublishedNotes,
  toNoteSnapshotRecord,
  updateNote,
} from "./service";
import { createDashboardNote, listPublishedDashboardNotes } from "./notesService";
import { useDashboardNotes } from "./useDashboardNotes";

const {
  addDocMock,
  collectionMock,
  deleteDocMock,
  docMock,
  getDocMock,
  getDocsMock,
  queryMock,
  serverTimestampMock,
  updateDocMock,
  whereMock,
} = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  collectionMock: vi.fn((...segments: unknown[]) => ({
    path: segments.slice(1).join("/"),
  })),
  deleteDocMock: vi.fn(),
  docMock: vi.fn((...segments: unknown[]) => ({
    path: segments.slice(1).join("/"),
  })),
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  queryMock: vi.fn((target: unknown, ...constraints: unknown[]) => ({
    target,
    constraints,
  })),
  serverTimestampMock: vi.fn(() => "server-timestamp"),
  updateDocMock: vi.fn(),
  whereMock: vi.fn((field: string, operator: string, value: unknown) => ({
    field,
    operator,
    value,
  })),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: addDocMock,
  collection: collectionMock,
  deleteDoc: deleteDocMock,
  doc: docMock,
  getDoc: getDocMock,
  getDocs: getDocsMock,
  query: queryMock,
  serverTimestamp: serverTimestampMock,
  updateDoc: updateDocMock,
  where: whereMock,
}));

vi.mock("../../firebase/config", () => ({
  db: { name: "test-db" },
}));

vi.mock("./notesService", async () => {
  const actual = await vi.importActual<typeof import("./notesService")>("./notesService");

  return {
    ...actual,
    createDashboardNote: vi.fn(),
    listPublishedDashboardNotes: vi.fn(),
    listRecentDashboardNotes: vi.fn(),
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
  };
}

function createDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  };
}

describe("notes service data layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes the full shared published note schema", async () => {
    addDocMock.mockResolvedValue({ id: "note-123" });

    await expect(
      createNote(
        {
          uid: " admin-1 ",
          email: " admin@example.com ",
        } as never,
        {
          title: " Shared title ",
          body: " Shared body ",
          status: "published",
          visibility: "shared",
        }
      )
    ).resolves.toBe("note-123");

    expect(addDocMock).toHaveBeenCalledWith(
      { path: "notes" },
      {
        title: "Shared title",
        body: "Shared body",
        status: "published",
        visibility: "shared",
        authorId: "admin-1",
        authorEmail: "admin@example.com",
        createdAt: "server-timestamp",
        updatedAt: "server-timestamp",
        publishedAt: "server-timestamp",
      }
    );
  });

  it("writes private draft notes without a publishedAt timestamp", async () => {
    addDocMock.mockResolvedValue({ id: "private-123" });

    await createNote(
      {
        uid: "member-1",
        email: "member@example.com",
      } as never,
      {
        title: "My note",
        body: "Owner only.",
        status: "draft",
        visibility: "private",
      }
    );

    expect(addDocMock).toHaveBeenCalledWith(
      { path: "notes" },
      expect.objectContaining({
        status: "draft",
        visibility: "private",
        publishedAt: null,
      })
    );
  });

  it("updates the note fields and status", async () => {
    await updateNote(" note-123 ", {
      title: " Updated title ",
      body: " Updated body ",
      status: "published",
      visibility: "private",
    });

    expect(updateDocMock).toHaveBeenCalledWith(
      { path: "notes/note-123" },
      {
        title: "Updated title",
        body: "Updated body",
        status: "published",
        visibility: "private",
        updatedAt: "server-timestamp",
        publishedAt: null,
      }
    );
  });

  it("requires a note id before updating", async () => {
    await expect(
      updateNote("   ", {
        title: "Updated title",
        body: "Updated body",
        status: "draft",
        visibility: "private",
      })
    ).rejects.toThrow("A note id is required before saving changes.");
  });

  it("deletes a note by id", async () => {
    await deleteNote(" note-123 ");

    expect(deleteDocMock).toHaveBeenCalledWith({ path: "notes/note-123" });
  });

  it("requires a note id before deleting", async () => {
    await expect(deleteNote("   ")).rejects.toThrow("A note id is required before deleting.");
  });

  it("returns null when a note document does not exist", async () => {
    getDocMock.mockResolvedValue({
      exists: () => false,
    });

    await expect(getNoteById("missing-note")).resolves.toBeNull();
    expect(docMock).toHaveBeenCalledWith({ name: "test-db" }, "notes", "missing-note");
  });

  it("loads a note by id and normalizes missing fields", async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      id: "note-1",
      data: () => ({
        title: "  ",
        body: null,
        status: "published",
        visibility: "shared",
        authorId: "  ",
        authorEmail: null,
        createdAt: null,
        updatedAt: "nope",
        publishedAt: "still-nope",
      }),
    });

    await expect(getNoteById("note-1")).resolves.toEqual({
      id: "note-1",
      title: "note-1",
      body: "No note body provided.",
      status: "published",
      visibility: "shared",
      authorId: "unknown-author",
      authorEmail: "Unknown author",
      createdAt: null,
      updatedAt: null,
      publishedAt: null,
    });
  });

  it("lists private notes with owner-scoped query constraints and descending sort", async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        createDoc("note-b", {
          title: "Earlier note",
          body: "Earlier body",
          status: "draft",
          visibility: "private",
          authorId: "member-1",
          authorEmail: "member@example.com",
          createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
          updatedAt: null,
          publishedAt: null,
        }),
        createDoc("note-a", {
          title: "Later note",
          body: "Later body",
          status: "draft",
          visibility: "private",
          authorId: "member-1",
          authorEmail: "member@example.com",
          createdAt: createTimestamp("2026-03-21T10:00:00.000Z"),
          updatedAt: null,
          publishedAt: null,
        }),
      ],
    });

    const result = await listPrivateNotes({
      uid: "member-1",
      email: "member@example.com",
    } as never);

    expect(queryMock).toHaveBeenCalledWith(
      { path: "notes" },
      {
        field: "visibility",
        operator: "==",
        value: "private",
      },
      {
        field: "authorId",
        operator: "==",
        value: "member-1",
      }
    );
    expect(result.map((note) => note.id)).toEqual(["note-a", "note-b"]);
  });

  it("lists shared published notes with the expected constraints", async () => {
    getDocsMock.mockResolvedValue({ docs: [] });

    await listSharedPublishedNotes();

    expect(queryMock).toHaveBeenCalledWith(
      { path: "notes" },
      {
        field: "visibility",
        operator: "==",
        value: "shared",
      },
      {
        field: "status",
        operator: "==",
        value: "published",
      }
    );
  });

  it("requires a signed-in uid before loading private notes", async () => {
    await expect(
      listPrivateNotes({
        uid: "  ",
        email: "member@example.com",
      } as never)
    ).rejects.toThrow("A signed-in user uid is required before loading your notes.");
  });

  it("compares note records by newest createdAt then title", () => {
    const recent = {
      id: "b",
      title: "Recent",
      body: "",
      status: "draft",
      visibility: "private",
      authorId: "member-1",
      authorEmail: "member@example.com",
      createdAt: createTimestamp("2026-03-21T10:00:00.000Z"),
      updatedAt: null,
      publishedAt: null,
    } as const as import("./types").NoteRecord;
    const older = {
      ...recent,
      id: "a",
      title: "Older",
      createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
    } as import("./types").NoteRecord;

    expect(compareNoteRecords(recent, older)).toBeLessThan(0);
    expect(
      compareNoteRecords(
        { ...recent, createdAt: null, title: "Alpha" },
        { ...recent, createdAt: null, title: "Zulu" }
      )
    ).toBeLessThan(0);
  });

  it("normalizes snapshot values into a NoteRecord", () => {
    const createdAt = createTimestamp("2026-03-20T10:00:00.000Z");
    const updatedAt = createTimestamp("2026-03-21T10:00:00.000Z");

    expect(
      toNoteSnapshotRecord(
        createDoc("note-1", {
          title: " Note ",
          body: " Body ",
          status: "published",
          visibility: "shared",
          authorId: " author-1 ",
          authorEmail: " author@example.com ",
          createdAt,
          updatedAt,
          publishedAt: createdAt,
        }) as never
      )
    ).toEqual({
      id: "note-1",
      title: "Note",
      body: "Body",
      status: "published",
      visibility: "shared",
      authorId: "author-1",
      authorEmail: "author@example.com",
      createdAt,
      updatedAt,
      publishedAt: createdAt,
    });
  });
});

describe("useDashboardNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears stale notes when a refresh fails", async () => {
    vi.mocked(listPublishedDashboardNotes)
      .mockResolvedValueOnce([
        {
          id: "note-1",
          title: "Shared note",
          body: "Visible note.",
          status: "published",
          visibility: "shared",
          authorId: "admin-1",
          authorEmail: "admin@example.com",
          createdAt: null,
          updatedAt: null,
          publishedAt: null,
        },
      ])
      .mockRejectedValueOnce(new Error("Permission issue."));

    const { result } = renderHook(() => useDashboardNotes());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.notes).toHaveLength(1);

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.notes).toEqual([]);
      expect(result.current.errorMessage).toBe("Permission issue.");
      expect(result.current.loading).toBe(false);
    });
  });

  it("preserves the create error as UI state and resets submitting", async () => {
    vi.mocked(createDashboardNote).mockRejectedValue(new Error("Save failed."));

    const { result } = renderHook(() => useDashboardNotes());

    await act(async () => {
      try {
        await result.current.createNote(
          {
            uid: "admin-1",
            email: "admin@example.com",
          } as never,
          {
            title: "Draft",
            body: "Body",
            published: false,
          }
        );
      } catch (error) {
        expect(error).toEqual(new Error("Save failed."));
      }
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.errorMessage).toBe("Save failed.");
      expect(result.current.successMessage).toBeNull();
    });
  });
});
