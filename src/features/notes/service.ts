import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
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
  type ListNotesOptions,
  type NoteRecord,
  type UpdateNoteInput,
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

export function toNoteSnapshotRecord(documentSnapshot: QueryDocumentSnapshot<DocumentData>): NoteRecord {
  const data = documentSnapshot.data() as NoteDocument;

  return {
    id: documentSnapshot.id,
    title: readString(data.title) ?? documentSnapshot.id,
    body: readString(data.body) ?? "No note body provided.",
    status: readStatus(data.status),
    visibility: readVisibility(data.visibility),
    authorId: readString(data.authorId) ?? "unknown-author",
    authorEmail: readString(data.authorEmail) ?? "Unknown author",
    createdAt: readTimestamp(data.createdAt),
    updatedAt: readTimestamp(data.updatedAt),
    publishedAt: readTimestamp(data.publishedAt),
  };
}

export function compareNoteRecords(left: NoteRecord, right: NoteRecord) {
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

export async function updateNote(noteId: string, input: UpdateNoteInput) {
  const normalizedNoteId = normalizeUserValue(noteId);
  const title = normalizeFormValue(input.title);
  const body = normalizeFormValue(input.body);
  const publishedAt = toServerTimestampOrNull(
    input.visibility === NOTE_VISIBILITY.shared && input.status === NOTE_STATUS.published
  );

  if (!normalizedNoteId) {
    throw new Error("A note id is required before saving changes.");
  }

  if (!title) {
    throw new Error("Enter a note title before saving.");
  }

  if (!body) {
    throw new Error("Enter the note details before saving.");
  }

  await updateDoc(doc(db, NOTES_COLLECTION, normalizedNoteId), {
    title,
    body,
    status: input.status,
    visibility: input.visibility,
    updatedAt: serverTimestamp(),
    publishedAt,
  });
}

export async function deleteNote(noteId: string) {
  const normalizedNoteId = normalizeUserValue(noteId);

  if (!normalizedNoteId) {
    throw new Error("A note id is required before deleting.");
  }

  await deleteDoc(doc(db, NOTES_COLLECTION, normalizedNoteId));
}

export async function getNoteById(noteId: string) {
  const snapshot = await getDoc(doc(db, NOTES_COLLECTION, noteId));

  if (!snapshot.exists()) {
    return null;
  }

  return toNoteSnapshotRecord(snapshot as QueryDocumentSnapshot<DocumentData>);
}

export async function listNotes(options: ListNotesOptions): Promise<NoteRecord[]> {
  const snapshot = await getDocs(buildNotesQuery(options));
  return snapshot.docs.map(toNoteSnapshotRecord).sort(compareNoteRecords);
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

export async function listSharedPublishedNotes(): Promise<NoteRecord[]> {
  return listNotes({
    visibility: NOTE_VISIBILITY.shared,
    status: NOTE_STATUS.published,
  });
}
