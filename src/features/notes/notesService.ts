import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  DASHBOARD_NOTES_COLLECTION,
  type DashboardNote,
  type DashboardNoteFormState,
} from "./types";

type DashboardNoteDocument = {
  title?: unknown;
  body?: unknown;
  createdAt?: unknown;
  createdByUid?: unknown;
  createdByEmail?: unknown;
  updatedAt?: unknown;
  published?: unknown;
};

function normalizeFormValue(value: string) {
  return value.trim();
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readTimestamp(value: unknown): Timestamp | null {
  return typeof value === "object" && value !== null && "toDate" in value ? (value as Timestamp) : null;
}

function toDashboardNote(documentSnapshot: QueryDocumentSnapshot<DocumentData>): DashboardNote {
  const data = documentSnapshot.data() as DashboardNoteDocument;

  return {
    id: documentSnapshot.id,
    title: readString(data.title) ?? documentSnapshot.id,
    body: readString(data.body) ?? "No note body provided.",
    createdAt: readTimestamp(data.createdAt),
    createdByUid: readString(data.createdByUid) ?? "unknown-author",
    createdByEmail: readString(data.createdByEmail) ?? "Unknown author",
    updatedAt: readTimestamp(data.updatedAt),
    published: typeof data.published === "boolean" ? data.published : false,
  };
}

function compareDashboardNotes(left: DashboardNote, right: DashboardNote) {
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

export async function listPublishedDashboardNotes(): Promise<DashboardNote[]> {
  const notesQuery = query(
    collection(db, DASHBOARD_NOTES_COLLECTION),
    where("published", "==", true)
  );
  const snapshot = await getDocs(notesQuery);

  return snapshot.docs.map(toDashboardNote).sort(compareDashboardNotes);
}

export async function listRecentDashboardNotes(): Promise<DashboardNote[]> {
  const snapshot = await getDocs(collection(db, DASHBOARD_NOTES_COLLECTION));

  return snapshot.docs.map(toDashboardNote).sort(compareDashboardNotes);
}

export async function createDashboardNote(user: User, formState: DashboardNoteFormState) {
  const title = normalizeFormValue(formState.title);
  const body = normalizeFormValue(formState.body);

  if (!title) {
    throw new Error("Enter a note title before saving.");
  }

  if (!body) {
    throw new Error("Enter the note details before saving.");
  }

  if (!user.email) {
    throw new Error("A signed-in admin email is required before saving.");
  }

  const documentReference = await addDoc(collection(db, DASHBOARD_NOTES_COLLECTION), {
    title,
    body,
    createdAt: serverTimestamp(),
    createdByUid: user.uid,
    createdByEmail: user.email,
    updatedAt: null,
    published: formState.published,
  } satisfies Omit<DashboardNote, "id" | "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: null;
  });

  return documentReference.id;
}
