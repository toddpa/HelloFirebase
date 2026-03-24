import type { Timestamp } from "firebase/firestore";

export const NOTES_COLLECTION = "notes";

export const NOTE_STATUS = {
  draft: "draft",
  published: "published",
} as const;

export const NOTE_VISIBILITY = {
  private: "private",
  shared: "shared",
} as const;

export const NOTE_STATUSES = [NOTE_STATUS.draft, NOTE_STATUS.published] as const;
export const NOTE_VISIBILITIES = [NOTE_VISIBILITY.private, NOTE_VISIBILITY.shared] as const;

export type NoteStatus = (typeof NOTE_STATUSES)[number];
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number];

export type NoteRecord = {
  id: string;
  title: string;
  body: string;
  status: NoteStatus;
  visibility: NoteVisibility;
  authorId: string;
  authorEmail: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  publishedAt?: Timestamp | null;
};

export type CreateNoteInput = {
  title: string;
  body: string;
  status: NoteStatus;
  visibility: NoteVisibility;
};

export type UpdateNoteInput = CreateNoteInput;

export type ListNotesOptions = {
  status?: NoteStatus;
  visibility: NoteVisibility;
  authorId?: string;
};

/** @deprecated Use NoteRecord. */
export type DashboardNote = NoteRecord;

export type DashboardNoteFormState = {
  title: string;
  body: string;
  published: boolean;
};

export type GetDashboardNotesOptions = {
  includeUnpublished?: boolean;
};

/** @deprecated Use NoteRecord. */
export type PrivateNote = NoteRecord;

export type PrivateNoteFormState = {
  title: string;
  body: string;
};

export type LegacyDashboardNoteDocument = {
  title?: unknown;
  body?: unknown;
  createdAt?: unknown;
  createdByUid?: unknown;
  createdByEmail?: unknown;
  updatedAt?: unknown;
  published?: unknown;
};

export type LegacyAdminAnnouncementDocument = {
  title?: unknown;
  description?: unknown;
  details?: unknown;
  createdAt?: unknown;
  createdBy?: unknown;
};

export type LegacyPrivateNoteDocument = {
  title?: unknown;
  body?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdByUid?: unknown;
  createdByEmail?: unknown;
};

export type MigratedNoteSeed = Omit<NoteRecord, "id">;
