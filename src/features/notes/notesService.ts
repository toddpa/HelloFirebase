import type { User } from "firebase/auth";
import {
  NOTE_STATUS,
  NOTE_VISIBILITY,
  type DashboardNote,
  type DashboardNoteFormState,
  type GetDashboardNotesOptions,
  type NoteRecord,
  type PrivateNoteFormState,
} from "./types";
import {
  createNote,
  listNotes,
  listPrivateNotes,
  listSharedPublishedNotes,
} from "./service";

export function toDashboardNotesErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "You do not have permission to access dashboard notes right now.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to load dashboard notes right now.";
}

export function toDashboardNoteWriteErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "You do not have permission to save dashboard notes.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to save the dashboard note right now.";
}

export function toPrivateNotesErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "You do not have permission to read your notes right now.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to load your notes right now.";
}

export function toPrivateNoteWriteErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "You do not have permission to save notes right now.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to save your note right now.";
}

export async function getDashboardNotes(
  options: GetDashboardNotesOptions = {}
): Promise<DashboardNote[]> {
  if (!options.includeUnpublished) {
    return listSharedPublishedNotes();
  }

  return listNotes({
    visibility: NOTE_VISIBILITY.shared,
  });
}

export async function listPublishedDashboardNotes(): Promise<DashboardNote[]> {
  return getDashboardNotes();
}

export async function listRecentDashboardNotes(): Promise<DashboardNote[]> {
  return getDashboardNotes({ includeUnpublished: true });
}

export async function createDashboardNote(user: User, formState: DashboardNoteFormState) {
  const status = formState.published ? NOTE_STATUS.published : NOTE_STATUS.draft;

  try {
    return await createNote(user, {
      title: formState.title,
      body: formState.body,
      visibility: NOTE_VISIBILITY.shared,
      status,
    });
  } catch (error: unknown) {
    throw new Error(toDashboardNoteWriteErrorMessage(error));
  }
}

export async function createPrivateNote(user: User, formState: PrivateNoteFormState) {
  try {
    return await createNote(user, {
      title: formState.title,
      body: formState.body,
      visibility: NOTE_VISIBILITY.private,
      status: NOTE_STATUS.draft,
    });
  } catch (error: unknown) {
    throw new Error(toPrivateNoteWriteErrorMessage(error));
  }
}

export async function listPrivateUserNotes(user: User): Promise<NoteRecord[]> {
  return listPrivateNotes(user);
}
