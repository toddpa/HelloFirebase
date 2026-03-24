import { describe, expect, it } from "vitest";
import {
  migrateLegacyAdminAnnouncement,
  migrateLegacyDashboardNote,
  migrateLegacyPrivateNote,
} from "./migration";

function createTimestamp(isoString: string) {
  const date = new Date(isoString);

  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  };
}

describe("note migration helpers", () => {
  it("maps legacy dashboard notes into shared notes", () => {
    const createdAt = createTimestamp("2026-03-20T10:00:00.000Z");

    expect(
      migrateLegacyDashboardNote(
        {
          title: "Weekly update",
          body: "Shared with approved users.",
          createdAt,
          createdByUid: "admin-1",
          createdByEmail: "admin@example.com",
          updatedAt: createdAt,
          published: true,
        },
        "dashboard-note-1"
      )
    ).toEqual({
      title: "Weekly update",
      body: "Shared with approved users.",
      status: "published",
      visibility: "shared",
      authorId: "admin-1",
      authorEmail: "admin@example.com",
      createdAt,
      updatedAt: createdAt,
      publishedAt: createdAt,
    });
  });

  it("maps legacy admin announcements into published shared notes", () => {
    const createdAt = createTimestamp("2026-03-19T10:00:00.000Z");

    expect(
      migrateLegacyAdminAnnouncement(
        {
          title: "Ops note",
          description: "Legacy announcement body.",
          createdAt,
          createdBy: "admin-1",
        },
        "ops-note",
        "admin@example.com"
      )
    ).toEqual({
      title: "Ops note",
      body: "Legacy announcement body.",
      status: "published",
      visibility: "shared",
      authorId: "admin-1",
      authorEmail: "admin@example.com",
      createdAt,
      updatedAt: null,
      publishedAt: createdAt,
    });
  });

  it("maps legacy private notes into owner-only draft notes", () => {
    const createdAt = createTimestamp("2026-03-18T10:00:00.000Z");

    expect(
      migrateLegacyPrivateNote(
        {
          title: "Personal note",
          body: "Owner-only content.",
          createdAt,
          updatedAt: null,
          createdByUid: "member-1",
          createdByEmail: "member@example.com",
        },
        "private-note-1",
        "member-1"
      )
    ).toEqual({
      title: "Personal note",
      body: "Owner-only content.",
      status: "draft",
      visibility: "private",
      authorId: "member-1",
      authorEmail: "member@example.com",
      createdAt,
      updatedAt: null,
      publishedAt: null,
    });
  });
});
