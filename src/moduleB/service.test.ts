import { beforeEach, describe, expect, it, vi } from "vitest";
import { createModuleBRecord, toModuleBWriteErrorMessage } from "./service";

const { addDocMock, collectionMock, serverTimestampMock } = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  collectionMock: vi.fn(() => ({ path: "adminAnnouncements" })),
  serverTimestampMock: vi.fn(() => "server-timestamp"),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: addDocMock,
  collection: collectionMock,
  serverTimestamp: serverTimestampMock,
}));

vi.mock("../firebase/config", () => ({
  db: { name: "test-db" },
}));

describe("moduleB service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addDocMock.mockResolvedValue({ id: "announcement-123" });
  });

  it("requires a signed-in admin uid before saving", async () => {
    await expect(
      createModuleBRecord(
        {
          uid: "   ",
          email: "admin@example.com",
        } as never,
        {
          title: "Weekly announcement",
          details: "Deployment starts at 5 PM UTC.",
        }
      )
    ).rejects.toThrow("A signed-in admin uid is required before saving.");

    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("writes admin announcements with the required metadata shape", async () => {
    const documentId = await createModuleBRecord(
      {
        uid: "admin-1",
        email: "admin@example.com",
      } as never,
      {
        title: " Weekly announcement ",
        details: " Deployment starts at 5 PM UTC. ",
      }
    );

    expect(documentId).toBe("announcement-123");
    expect(collectionMock).toHaveBeenCalledWith({ name: "test-db" }, "adminAnnouncements");
    expect(addDocMock).toHaveBeenCalledWith(
      { path: "adminAnnouncements" },
      {
        title: "Weekly announcement",
        description: "Deployment starts at 5 PM UTC.",
        createdBy: "admin-1",
        createdAt: "server-timestamp",
      }
    );
  });

  it("returns a generic save message for unknown write failures", () => {
    expect(toModuleBWriteErrorMessage({})).toBe("Unable to save the Module B update right now.");
  });
});
