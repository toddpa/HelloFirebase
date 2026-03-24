import type { Timestamp } from "firebase/firestore";
import type {
  LegacyAdminAnnouncementDocument,
  LegacyDashboardNoteDocument,
  LegacyPrivateNoteDocument,
  MigratedNoteSeed,
} from "./types";
import { NOTE_STATUS, NOTE_VISIBILITY } from "./types";

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readTimestamp(value: unknown): Timestamp | null {
  return typeof value === "object" && value !== null && "toDate" in value ? (value as Timestamp) : null;
}

export function migrateLegacyDashboardNote(
  value: LegacyDashboardNoteDocument,
  fallbackId: string,
  fallbackAuthorId: string,
  fallbackAuthorEmail: string
): MigratedNoteSeed {
  const createdAt = readTimestamp(value.createdAt);
  const published = value.published === true;

  return {
    title: readString(value.title) ?? fallbackId,
    body: readString(value.body) ?? "No note body provided.",
    status: published ? NOTE_STATUS.published : NOTE_STATUS.draft,
    visibility: NOTE_VISIBILITY.shared,
    authorId: readString(value.createdByUid) ?? fallbackAuthorId,
    authorEmail: readString(value.createdByEmail) ?? fallbackAuthorEmail,
    createdAt,
    updatedAt: readTimestamp(value.updatedAt),
    publishedAt: published ? createdAt : null,
  };
}

export function migrateLegacyAdminAnnouncement(
  value: LegacyAdminAnnouncementDocument,
  fallbackId: string,
  fallbackAuthorEmail: string
): MigratedNoteSeed {
  const createdAt = readTimestamp(value.createdAt);
  const authorId = readString(value.createdBy) ?? "unknown-author";

  return {
    title: readString(value.title) ?? fallbackId,
    body: readString(value.description) ?? readString(value.details) ?? "No note body provided.",
    status: NOTE_STATUS.published,
    visibility: NOTE_VISIBILITY.shared,
    authorId,
    authorEmail: fallbackAuthorEmail,
    createdAt,
    updatedAt: null,
    publishedAt: createdAt,
  };
}

export function migrateLegacyPrivateNote(
  value: LegacyPrivateNoteDocument,
  fallbackId: string,
  fallbackOwnerId: string
): MigratedNoteSeed {
  return {
    title: readString(value.title) ?? fallbackId,
    body: readString(value.body) ?? "",
    status: NOTE_STATUS.draft,
    visibility: NOTE_VISIBILITY.private,
    authorId: readString(value.createdByUid) ?? fallbackOwnerId,
    authorEmail: readString(value.createdByEmail) ?? "Unknown author",
    createdAt: readTimestamp(value.createdAt),
    updatedAt: readTimestamp(value.updatedAt),
    publishedAt: null,
  };
}
