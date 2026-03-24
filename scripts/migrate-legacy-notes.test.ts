import { describe, expect, it } from "vitest";
import {
  buildMigrationPlan,
  mapAdminAnnouncementToNote,
  mapDashboardNoteToNote,
  mapUserNoteToNote,
  toAdminAnnouncementNoteId,
  toDashboardNoteId,
  toUserNoteId,
} from "./migrate-legacy-notes.mjs";

describe("migrate-legacy-notes script helpers", () => {
  it("maps admin announcements into published shared notes with stable ids", () => {
    const createdAt = new Date("2026-03-20T10:00:00.000Z");

    expect(
      mapAdminAnnouncementToNote("ops-note", {
        title: "Ops note",
        description: "Published admin content.",
        createdBy: "admin-1",
        createdAt,
      }, "admin@example.com")
    ).toEqual({
      targetId: toAdminAnnouncementNoteId("ops-note"),
      note: {
        title: "Ops note",
        body: "Published admin content.",
        status: "published",
        visibility: "shared",
        authorId: "admin-1",
        authorEmail: "admin@example.com",
        createdAt: expect.any(Object),
        updatedAt: null,
        publishedAt: expect.any(Object),
      },
    });
  });

  it("maps dashboard notes into shared notes and assigns fallback author data", () => {
    expect(
      mapDashboardNoteToNote(
        "dash-note",
        {
          title: "Legacy dashboard note",
          body: "Private after migration.",
          published: false,
        },
        "member-1",
        "member@example.com"
      )
    ).toEqual({
      targetId: toDashboardNoteId("dash-note"),
      note: {
        title: "Legacy dashboard note",
        body: "Private after migration.",
        status: "draft",
        visibility: "shared",
        authorId: "member-1",
        authorEmail: "member@example.com",
        createdAt: null,
        updatedAt: null,
        publishedAt: null,
      },
    });
  });

  it("maps legacy userNotes documents into private notes", () => {
    expect(
      mapUserNoteToNote("member-1", "private-note", {
        title: "Personal note",
        body: "Owner-only content.",
        createdByUid: "member-1",
        createdByEmail: "member@example.com",
      })
    ).toEqual({
      targetId: toUserNoteId("member-1", "private-note"),
      note: {
        title: "Personal note",
        body: "Owner-only content.",
        status: "draft",
        visibility: "private",
        authorId: "member-1",
        authorEmail: "member@example.com",
        createdAt: null,
        updatedAt: null,
        publishedAt: null,
      },
    });
  });

  it("builds a single migration plan across both legacy collections", () => {
    const plan = buildMigrationPlan({
      adminAnnouncements: [
        {
          id: "ops-note",
          data: {
            title: "Ops",
            description: "Shared",
            createdBy: "admin-1",
          },
        },
      ],
      dashboardNotes: [
        {
          id: "dash-note",
          data: {
            title: "Dash",
            body: "Private",
            createdByUid: "member-1",
            createdByEmail: "member@example.com",
            published: true,
          },
        },
      ],
      userNotes: [
        {
          ownerId: "member-1",
          id: "private-note",
          data: {
            title: "My note",
            body: "Private",
            createdByUid: "member-1",
            createdByEmail: "member@example.com",
          },
        },
      ],
      fallbackDashboardAuthorId: "fallback-id",
      fallbackDashboardAuthorEmail: "fallback@example.com",
      fallbackAdminAuthorEmail: "admin@example.com",
    });

    expect(plan.map((entry) => entry.targetId)).toEqual([
      "legacy-admin-announcement-ops-note",
      "legacy-dashboard-note-dash-note",
      "legacy-user-note-member-1-private-note",
    ]);
    expect(plan[1]?.note.visibility).toBe("shared");
    expect(plan[1]?.note.status).toBe("published");
    expect(plan[2]?.note.visibility).toBe("private");
  });
});
