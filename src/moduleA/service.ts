import type { User } from "firebase/auth";
import {
  createPrivateNote,
  listPrivateUserNotes,
  toPrivateNotesErrorMessage,
  toPrivateNoteWriteErrorMessage,
  type PrivateNoteFormState,
} from "../features/notes";
import type { ModuleAFormState, ModuleAItem } from "./types";

function toModuleAItem(note: ModuleAItem): ModuleAItem {
  return note;
}

function toPrivateNoteFormState(formState: ModuleAFormState): PrivateNoteFormState {
  return {
    title: formState.title,
    body: formState.body,
  };
}

export async function listModuleAItems(user: User): Promise<ModuleAItem[]> {
  const notes = await listPrivateUserNotes(user);
  return notes.map(toModuleAItem);
}

export async function createModuleAItem(user: User, formState: ModuleAFormState) {
  return createPrivateNote(user, toPrivateNoteFormState(formState));
}

export function toModuleAErrorMessage(error: unknown) {
  return toPrivateNotesErrorMessage(error);
}

export function toModuleAWriteErrorMessage(error: unknown) {
  return toPrivateNoteWriteErrorMessage(error);
}
