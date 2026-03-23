import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  subscribeToAdminAnnouncements,
  toAdminAnnouncementsErrorMessage,
} from "./adminAnnouncementsService";

const { collectionMock, onSnapshotMock } = vi.hoisted(() => ({
  collectionMock: vi.fn((...segments: unknown[]) => ({
    path: segments.slice(1).join("/"),
  })),
  onSnapshotMock: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: collectionMock,
  onSnapshot: onSnapshotMock,
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

describe("adminAnnouncementsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to admin announcements and normalizes the snapshot data", () => {
    const onAnnouncements = vi.fn();
    const onError = vi.fn();
    const unsubscribe = vi.fn();
    const fallbackCreatedAt = createTimestamp("2026-03-20T10:00:00.000Z");
    const recentCreatedAt = createTimestamp("2026-03-21T10:00:00.000Z");

    onSnapshotMock.mockImplementation(
      (
        _target: unknown,
        handleSnapshot: (snapshot: { docs: Array<{ id: string; data(): Record<string, unknown> }> }) => void
      ) => {
        handleSnapshot({
          docs: [
            createDoc("fallback-note", {
              title: "   ",
              description: "   ",
              details: "Uses details fallback",
              createdAt: fallbackCreatedAt,
            }),
            createDoc("recent-note", {
              title: "Recent note",
              description: "Most recent description",
              createdAt: recentCreatedAt,
            }),
          ],
        });

        return unsubscribe;
      }
    );

    const result = subscribeToAdminAnnouncements({
      onAnnouncements,
      onError,
    });

    expect(collectionMock).toHaveBeenCalledWith({ name: "test-db" }, "adminAnnouncements");
    expect(onAnnouncements).toHaveBeenCalledWith([
      {
        id: "recent-note",
        title: "Recent note",
        description: "Most recent description",
        createdAt: recentCreatedAt,
      },
      {
        id: "fallback-note",
        title: "fallback-note",
        description: "Uses details fallback",
        createdAt: fallbackCreatedAt,
      },
    ]);
    expect(result).toBe(unsubscribe);
  });

  it("passes the provided error handler through to Firestore", () => {
    const onAnnouncements = vi.fn();
    const onError = vi.fn();

    subscribeToAdminAnnouncements({
      onAnnouncements,
      onError,
    });

    expect(onSnapshotMock).toHaveBeenCalledWith(
      { path: "adminAnnouncements" },
      expect.any(Function),
      onError
    );
  });

  it("returns readable admin announcement error messages", () => {
    expect(toAdminAnnouncementsErrorMessage({ code: "permission-denied" })).toBe(
      "You do not have permission to access admin announcements right now."
    );
    expect(toAdminAnnouncementsErrorMessage({})).toBe(
      "Unable to load admin announcements right now."
    );
  });
});
