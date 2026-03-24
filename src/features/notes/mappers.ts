import type { NoteDraft, NoteRecord as UINoteRecord } from "../../components/notes";
import type { DashboardNoteFormState, NoteRecord, PrivateNoteFormState } from "./types";

function toUiUpdatedAtValue(note: NoteRecord) {
  if (!note.updatedAt || !note.createdAt) {
    return note.updatedAt;
  }

  return note.updatedAt.toMillis() === note.createdAt.toMillis() ? null : note.updatedAt;
}

export function toNoteRecord(note: NoteRecord): UINoteRecord {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    createdAt: note.createdAt,
    updatedAt: toUiUpdatedAtValue(note),
    createdByEmail: note.authorEmail,
    published: note.status === "published",
  };
}

export function toDashboardNoteDraft(value: NoteDraft): DashboardNoteFormState {
  return {
    title: value.title,
    body: value.body,
    published: value.published ?? true,
  };
}

export function toPrivateNoteDraft(value: NoteDraft): PrivateNoteFormState {
  return {
    title: value.title,
    body: value.body,
  };
}
