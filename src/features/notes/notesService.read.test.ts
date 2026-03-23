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
          createdAt: createTimestamp("2026-03-20T10:00:00.000Z"),
          createdByUid: "admin-1",
          createdByEmail: "admin@example.com",
          updatedAt: null,
          published: true,
        }),
        createDoc("note-a", {
          title: "Later",
          body: "Later body",
          createdAt: createTimestamp("2026-03-21T10:00:00.000Z"),
          createdByUid: "admin-1",
          createdByEmail: "admin@example.com",
          updatedAt: null,
          published: true,
        }),
      ],
    });

    const result = await listPublishedDashboardNotes();

    expect(whereMock).toHaveBeenCalledWith("published", "==", true);
    expect(queryMock).toHaveBeenCalledWith(
      { path: "dashboardNotes" },
      {
        field: "published",
        operator: "==",
        value: true,
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
          createdAt: null,
          createdByUid: "   ",
          createdByEmail: null,
          updatedAt: "not-a-timestamp",
          published: "not-a-boolean",
        }),
      ],
    });

    await expect(getDashboardNotes({ includeUnpublished: true })).resolves.toEqual([
      {
        id: "fallback-note",
        title: "fallback-note",
        body: "No note body provided.",
        createdAt: null,
        createdByUid: "unknown-author",
        createdByEmail: "Unknown author",
        updatedAt: null,
        published: false,
      },
    ]);

    expect(queryMock).not.toHaveBeenCalled();
  });

  it("delegates recent note loading to the unpublished-inclusive query", async () => {
    getDocsMock.mockResolvedValue({ docs: [] });

    await listRecentDashboardNotes();

    expect(getDocsMock).toHaveBeenCalledWith({ path: "dashboardNotes" });
  });

  it("returns readable dashboard note read errors", () => {
    expect(toDashboardNotesErrorMessage({ code: "permission-denied" })).toBe(
      "You do not have permission to access dashboard notes right now."
    );
    expect(toDashboardNotesErrorMessage(new Error("Notes exploded."))).toBe("Notes exploded.");
    expect(toDashboardNotesErrorMessage({})).toBe("Unable to load dashboard notes right now.");
  });
});
