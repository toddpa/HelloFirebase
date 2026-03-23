import type { NoteDraft, NoteRecord } from "../components/notes";
import type { ModuleAFormState, ModuleAItem } from "./types";

export function toNoteRecord(item: ModuleAItem): NoteRecord {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function toModuleADraft(value: NoteDraft): ModuleAFormState {
  return {
    title: value.title,
    body: value.body,
  };
}

