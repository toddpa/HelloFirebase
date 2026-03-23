import type { NoteDraft, NoteRecord } from "../../components/notes";
import type { DashboardNote, DashboardNoteFormState } from "./types";

export function toNoteRecord(note: DashboardNote): NoteRecord {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    createdByEmail: note.createdByEmail,
    published: note.published,
  };
}

export function toDashboardNoteDraft(value: NoteDraft): DashboardNoteFormState {
  return {
    title: value.title,
    body: value.body,
    published: value.published ?? true,
  };
}

