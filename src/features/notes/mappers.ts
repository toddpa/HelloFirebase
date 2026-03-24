import type { NoteDraft, NoteRecord } from "../../components/notes";
import type { AppNote, DashboardNoteFormState, PrivateNoteFormState } from "./types";

function toUiUpdatedAtValue(note: AppNote) {
  if (!note.updatedAt || !note.createdAt) {
    return note.updatedAt;
  }

  return note.updatedAt.toMillis() === note.createdAt.toMillis() ? null : note.updatedAt;
}

export function toNoteRecord(note: AppNote): NoteRecord {
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
