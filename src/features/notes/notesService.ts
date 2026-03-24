import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  NOTE_STATUS,
  NOTE_VISIBILITY,
  NOTES_COLLECTION,
  type CreateNoteInput,
  type DashboardNote,
  type DashboardNoteFormState,
  type GetDashboardNotesOptions,
  type ListNotesOptions,
  type NoteRecord,
  type PrivateNoteFormState,
} from "./types";

type NoteDocument = {
  title?: unknown;
  body?: unknown;
  status?: unknown;
  visibility?: unknown;
  authorId?: unknown;
  authorEmail?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  publishedAt?: unknown;
};

function normalizeFormValue(value: string) {
  return value.trim();
}

function normalizeUserValue(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readTimestamp(value: unknown): Timestamp | null {
  return typeof value === "object" && value !== null && "toDate" in value ? (value as Timestamp) : null;
}

function readStatus(value: unknown) {
  return value === NOTE_STATUS.published ? NOTE_STATUS.published : NOTE_STATUS.draft;
}

function readVisibility(value: unknown) {
  return value === NOTE_VISIBILITY.shared ? NOTE_VISIBILITY.shared : NOTE_VISIBILITY.private;
}

function toNoteRecord(documentSnapshot: QueryDocumentSnapshot<DocumentData>): NoteRecord {
  const data = documentSnapshot.data() as NoteDocument;
  const createdAt = readTimestamp(data.createdAt);
  const updatedAt = readTimestamp(data.updatedAt);

  return {
    id: documentSnapshot.id,
    title: readString(data.title) ?? documentSnapshot.id,
    body: readString(data.body) ?? "No note body provided.",
    status: readStatus(data.status),
    visibility: readVisibility(data.visibility),
    authorId: readString(data.authorId) ?? "unknown-author",
    authorEmail: readString(data.authorEmail) ?? "Unknown author",
    createdAt,
    updatedAt,
    publishedAt: readTimestamp(data.publishedAt),
  };
}

function compareNotes(left: NoteRecord, right: NoteRecord) {
  if (left.createdAt && right.createdAt) {
    const createdAtDifference = right.createdAt.toMillis() - left.createdAt.toMillis();

    if (createdAtDifference !== 0) {
      return createdAtDifference;
    }
  }

  if (left.createdAt) {
    return -1;
  }

  if (right.createdAt) {
    return 1;
  }

  return left.title.localeCompare(right.title);
}

function buildNotesQuery(options: ListNotesOptions) {
  const constraints: QueryConstraint[] = [where("visibility", "==", options.visibility)];

  if (options.status) {
    constraints.push(where("status", "==", options.status));
  }

  if (options.authorId) {
    constraints.push(where("authorId", "==", options.authorId));
  }

  return query(collection(db, NOTES_COLLECTION), ...constraints);
}

function toServerTimestampOrNull(shouldInclude: boolean) {
  return shouldInclude ? serverTimestamp() : null;
}

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

export async function listNotes(options: ListNotesOptions): Promise<NoteRecord[]> {
  const snapshot = await getDocs(buildNotesQuery(options));
  return snapshot.docs.map(toNoteRecord).sort(compareNotes);
}

export async function createNote(user: User, input: CreateNoteInput) {
  const title = normalizeFormValue(input.title);
  const body = normalizeFormValue(input.body);
  const authorId = normalizeUserValue(user.uid);
  const authorEmail = normalizeUserValue(user.email);
  const publishedAt = toServerTimestampOrNull(
    input.visibility === NOTE_VISIBILITY.shared && input.status === NOTE_STATUS.published
  );

  if (!title) {
    throw new Error("Enter a note title before saving.");
  }

  if (!body) {
    throw new Error("Enter the note details before saving.");
  }

  if (!authorId) {
    throw new Error("A signed-in user uid is required before saving.");
  }

  if (!authorEmail) {
    throw new Error("A signed-in user email is required before saving.");
  }

  const documentReference = await addDoc(collection(db, NOTES_COLLECTION), {
    title,
    body,
    status: input.status,
    visibility: input.visibility,
    authorId,
    authorEmail,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    publishedAt,
  });

  return documentReference.id;
}

export async function getDashboardNotes(
  options: GetDashboardNotesOptions = {}
): Promise<DashboardNote[]> {
  return listNotes({
    visibility: NOTE_VISIBILITY.shared,
    status: options.includeUnpublished ? undefined : NOTE_STATUS.published,
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

export async function listPrivateNotes(user: User): Promise<NoteRecord[]> {
  const authorId = normalizeUserValue(user.uid);

  if (!authorId) {
    throw new Error("A signed-in user uid is required before loading your notes.");
  }

  return listNotes({
    visibility: NOTE_VISIBILITY.private,
    authorId,
  });
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
