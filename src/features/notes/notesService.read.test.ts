import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDashboardNotes,
  listPublishedDashboardNotes,
  listRecentDashboardNotes,
  toDashboardNotesErrorMessage,
} from "./notesService";

const { collectionMock, getDocsMock, queryMock, whereMock } = vi.hoisted(() => ({
  collectionMock: vi.fn((...segments: unknown[]) => ({
    path: segments.slice(1).join("/"),
  })),
  getDocsMock: vi.fn(),
  queryMock: vi.fn((target: unknown, ...constraints: unknown[]) => ({
    target,
    constraints,
  })),
  whereMock: vi.fn((field: string, operator: string, value: unknown) => ({
    field,
    operator,
    value,
  })),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: collectionMock,
  getDocs: getDocsMock,
  query: queryMock,
  serverTimestamp: vi.fn(),
  where: whereMock,
}));

vi.mock("../../firebase/config", () => ({
  db: { name: "test-db" },
}));

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

describe("notesService read paths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists published dashboard notes with the published filter", async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        createDoc("note-b", {
          title: "Earlier",
          body: "Earlier body",
          status: "published",
          visibility: "shared",
          createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
          authorId: "admin-1",
          authorEmail: "admin@example.com",
          updatedAt: null,
          publishedAt: createTimestamp("2026-03-20T10:00:00.000Z"),
        }),
        createDoc("note-a", {
          title: "Later",
          body: "Later body",
          status: "published",
          visibility: "shared",
          createdAt: createTimestamp("2026-03-21T10:00:00.000Z"),
          authorId: "admin-1",
          authorEmail: "admin@example.com",
          updatedAt: null,
          publishedAt: createTimestamp("2026-03-21T10:00:00.000Z"),
        }),
      ],
    });

    const result = await listPublishedDashboardNotes();

    expect(whereMock).toHaveBeenCalledWith("visibility", "==", "shared");
    expect(whereMock).toHaveBeenCalledWith("status", "==", "published");
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
    expect(result.map((note) => note.id)).toEqual(["note-a", "note-b"]);
  });

  it("includes unpublished notes when requested and uses safe defaults", async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        createDoc("fallback-note", {
          title: "   ",
          body: "   ",
          status: "unexpected",
          visibility: "surprise",
          createdAt: null,
          authorId: "   ",
          authorEmail: null,
          updatedAt: "not-a-timestamp",
          publishedAt: "not-a-timestamp",
        }),
      ],
    });

    await expect(getDashboardNotes({ includeUnpublished: true })).resolves.toEqual([
      {
        id: "fallback-note",
        title: "fallback-note",
        body: "No note body provided.",
        status: "draft",
        visibility: "private",
        createdAt: null,
        authorId: "unknown-author",
        authorEmail: "Unknown author",
        updatedAt: null,
        publishedAt: null,
      },
    ]);

    expect(queryMock).toHaveBeenCalledWith(
      { path: "notes" },
      {
        field: "visibility",
        operator: "==",
        value: "shared",
      }
    );
  });

  it("delegates recent note loading to the unpublished-inclusive query", async () => {
    getDocsMock.mockResolvedValue({ docs: [] });

    await listRecentDashboardNotes();

    expect(getDocsMock).toHaveBeenCalledWith({
      target: { path: "notes" },
      constraints: [
        {
          field: "visibility",
          operator: "==",
          value: "shared",
        },
      ],
    });
  });

  it("returns readable dashboard note read errors", () => {
    expect(toDashboardNotesErrorMessage({ code: "permission-denied" })).toBe(
      "You do not have permission to access dashboard notes right now."
    );
    expect(toDashboardNotesErrorMessage(new Error("Notes exploded."))).toBe("Notes exploded.");
    expect(toDashboardNotesErrorMessage({})).toBe("Unable to load dashboard notes right now.");
  });
});
