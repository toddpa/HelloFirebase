import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardNote, toDashboardNoteWriteErrorMessage } from "./notesService";

const { addDocMock, collectionMock, serverTimestampMock } = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  collectionMock: vi.fn(() => ({ path: "dashboardNotes" })),
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
    ).rejects.toThrow("A signed-in admin uid is required before saving.");

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
});
