import type { Timestamp } from "firebase/firestore";

export type NoteRecord = {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
  createdByEmail?: string | null;
  published?: boolean | null;
};

export type NoteDraft = {
  title: string;
  body: string;
  published?: boolean;
};

export type NoteEditorMode = "create" | "edit";

export type NoteEditorLabels = {
  titleLabel?: string;
  bodyLabel?: string;
  publishedLabel?: string;
  createSubmitLabel?: string;
  unpublishedSubmitLabel?: string;
  editSubmitLabel?: string;
  secondarySubmitLabel?: string;
  savingLabel?: string;
  cancelLabel?: string;
};

export type NoteEditorPlaceholders = {
  title?: string;
  body?: string;
};

export type NoteDisplayOptions = {
  showCreatedAt?: boolean;
  showAuthorEmail?: boolean;
  showPublicationStatus?: boolean;
  showUpdatedAt?: boolean;
};
