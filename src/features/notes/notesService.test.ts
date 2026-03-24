import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardNote, toDashboardNoteWriteErrorMessage } from "./notesService";

const { addDocMock, collectionMock, serverTimestampMock } = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  collectionMock: vi.fn(() => ({ path: "notes" })),
  serverTimestampMock: vi.fn(() => "server-timestamp"),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: addDocMock,
  collection: collectionMock,
  getDocs: vi.fn(),
  query: vi.fn(),
  serverTimestamp: serverTimestampMock,
  where: vi.fn(),
}));

vi.mock("../../firebase/config", () => ({
  db: { name: "test-db" },
}));

describe("notesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a signed-in admin uid before saving", async () => {
    await expect(
      createDashboardNote(
        {
          uid: "   ",
          email: "admin@example.com",
        } as never,
        {
          title: "Weekly dashboard briefing",
          body: "Share the update approved users should see on the dashboard.",
          published: true,
        }
      )
    ).rejects.toThrow("A signed-in user uid is required before saving.");

    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("normalizes permission-denied writes into a readable admin error", async () => {
    addDocMock.mockRejectedValue({ code: "permission-denied" });

    await expect(
      createDashboardNote(
        {
          uid: "admin-1",
          email: "admin@example.com",
        } as never,
        {
          title: "Weekly dashboard briefing",
          body: "Share the update approved users should see on the dashboard.",
          published: true,
        }
      )
    ).rejects.toThrow("You do not have permission to save dashboard notes.");
  });

  it("returns a generic save message for unknown write failures", () => {
    expect(toDashboardNoteWriteErrorMessage({})).toBe(
      "Unable to save the dashboard note right now."
    );
  });

  it("writes shared notes into the unified notes collection", async () => {
    addDocMock.mockResolvedValue({ id: "note-123" });

    const documentId = await createDashboardNote(
      {
        uid: " admin-1 ",
        email: " admin@example.com ",
      } as never,
      {
        title: " Weekly dashboard briefing ",
        body: " Share the update approved users should see on the dashboard. ",
        published: true,
      }
    );

    expect(documentId).toBe("note-123");
    expect(addDocMock).toHaveBeenCalledWith(
      { path: "notes" },
      {
        title: "Weekly dashboard briefing",
        body: "Share the update approved users should see on the dashboard.",
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
});
