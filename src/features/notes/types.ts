import type { Timestamp } from "firebase/firestore";

export const NOTES_COLLECTION = "notes";

export const NOTE_STATUSES = ["draft", "published"] as const;
export const NOTE_VISIBILITIES = ["private", "shared"] as const;

export type NoteStatus = (typeof NOTE_STATUSES)[number];
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number];

export type AppNote = {
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

export type ListNotesOptions = {
  status?: NoteStatus;
  visibility: NoteVisibility;
  authorId?: string;
};

export type DashboardNote = AppNote;

export type DashboardNoteFormState = {
  title: string;
  body: string;
  published: boolean;
};

export type GetDashboardNotesOptions = {
  includeUnpublished?: boolean;
};

export type PrivateNote = AppNote;

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

export type MigratedNoteSeed = Omit<AppNote, "id">;
