import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createModuleAItem,
  listModuleAItems,
  toModuleAErrorMessage,
  toModuleAWriteErrorMessage,
} from "./service";

const {
  addDocMock,
  collectionMock,
  getDocsMock,
  queryMock,
  serverTimestampMock,
  whereMock,
} = vi.hoisted(() => ({
    addDocMock: vi.fn(),
    collectionMock: vi.fn((...segments: unknown[]) => ({
      path: segments.slice(1).join("/"),
    })),
    getDocsMock: vi.fn(),
    queryMock: vi.fn((target: unknown, ...constraints: unknown[]) => ({ target, constraints })),
    serverTimestampMock: vi.fn(() => "server-timestamp"),
    whereMock: vi.fn((field: string, operator: string, value: unknown) => ({
      field,
      operator,
      value,
    })),
  }));

vi.mock("firebase/firestore", () => ({
  addDoc: addDocMock,
  collection: collectionMock,
  getDocs: getDocsMock,
  query: queryMock,
  serverTimestamp: serverTimestampMock,
  where: whereMock,
}));

vi.mock("../firebase/config", () => ({
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

describe("moduleA service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads notes from the signed-in user's subcollection and sorts newest first", async () => {
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
          updatedAt: createTimestamp("2026-03-20T10:00:00.000Z"),
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
          updatedAt: createTimestamp("2026-03-21T10:00:00.000Z"),
          publishedAt: null,
        }),
      ],
    });

    const result = await listModuleAItems({
      uid: "member-1",
      email: "member@example.com",
    } as never);

    expect(collectionMock).toHaveBeenCalledWith({ name: "test-db" }, "notes");
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
    expect(result.map((item) => item.id)).toEqual(["note-a", "note-b"]);
  });

  it("falls back to safe defaults when note fields are missing", async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        createDoc("untitled-note", {
          title: "   ",
          body: null,
          status: "draft",
          visibility: "private",
          authorId: "member-1",
          authorEmail: null,
          createdAt: "not-a-timestamp",
          updatedAt: "also-not-a-timestamp",
        }),
      ],
    });

    await expect(
      listModuleAItems({
        uid: "member-1",
        email: "member@example.com",
      } as never)
    ).resolves.toEqual([
      {
        id: "untitled-note",
        title: "untitled-note",
        body: "No note body provided.",
        status: "draft",
        visibility: "private",
        authorId: "member-1",
        authorEmail: "Unknown author",
        createdAt: null,
        updatedAt: null,
        publishedAt: null,
      },
    ]);
  });

  it("requires a signed-in uid before loading notes", async () => {
    await expect(
      listModuleAItems({
        uid: "   ",
        email: "member@example.com",
      } as never)
    ).rejects.toThrow("A signed-in user uid is required before loading your notes.");
  });

  it("writes notes with normalized values and owner metadata", async () => {
    addDocMock.mockResolvedValue({ id: "note-123" });

    const documentId = await createModuleAItem(
      {
        uid: " member-1 ",
        email: " member@example.com ",
      } as never,
      {
        title: " Launch note ",
        body: " Remember the checklist. ",
      }
    );

    expect(documentId).toBe("note-123");
    expect(addDocMock).toHaveBeenCalledWith(
      { path: "notes" },
      {
        title: "Launch note",
        body: "Remember the checklist.",
        status: "draft",
        visibility: "private",
        authorId: "member-1",
        authorEmail: "member@example.com",
        createdAt: "server-timestamp",
        updatedAt: "server-timestamp",
        publishedAt: null,
      }
    );
  });

  it("maps permission-denied write failures into the user-facing save message", async () => {
    addDocMock.mockRejectedValue({ code: "permission-denied" });

    await expect(
      createModuleAItem(
        {
          uid: "member-1",
          email: "member@example.com",
        } as never,
        {
          title: "Launch note",
          body: "Remember the checklist.",
        }
      )
    ).rejects.toThrow("You do not have permission to save notes right now.");
  });

  it("translates read and write fallback errors", () => {
    expect(toModuleAErrorMessage({ code: "permission-denied" })).toBe(
      "You do not have permission to read your notes right now."
    );
    expect(toModuleAWriteErrorMessage({})).toBe("Unable to save your note right now.");
  });
});
