import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { MODULE_A_COLLECTION, type ModuleAFormState, type ModuleAItem } from "./types";

const MODULE_A_NOTES_SUBCOLLECTION = "notes";

type ModuleANoteDocument = {
  title?: unknown;
  body?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdByUid?: unknown;
  createdByEmail?: unknown;
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

function toModuleAItem(documentSnapshot: QueryDocumentSnapshot<DocumentData>): ModuleAItem {
  const data = documentSnapshot.data() as ModuleANoteDocument;

  return {
    id: documentSnapshot.id,
    title: readString(data.title) ?? documentSnapshot.id,
    body: readString(data.body) ?? "",
    createdAt: readTimestamp(data.createdAt),
    updatedAt: readTimestamp(data.updatedAt),
  };
}

function compareModuleAItems(left: ModuleAItem, right: ModuleAItem) {
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

export async function listModuleAItems(user: User): Promise<ModuleAItem[]> {
  const userUid = normalizeUserValue(user.uid);

  if (!userUid) {
    throw new Error("A signed-in user uid is required before loading your notes.");
  }

  const notesQuery = query(collection(db, MODULE_A_COLLECTION, userUid, MODULE_A_NOTES_SUBCOLLECTION));
  const snapshot = await getDocs(notesQuery);

  return snapshot.docs.map(toModuleAItem).sort(compareModuleAItems);
}

export async function createModuleAItem(user: User, formState: ModuleAFormState) {
  const title = normalizeFormValue(formState.title);
  const body = normalizeFormValue(formState.body);
  const userUid = normalizeUserValue(user.uid);
  const userEmail = normalizeUserValue(user.email);

  if (!title) {
    throw new Error("Enter a note title before saving.");
  }

  if (!body) {
    throw new Error("Enter the note details before saving.");
  }

  if (!userUid) {
    throw new Error("A signed-in user uid is required before saving.");
  }

  if (!userEmail) {
    throw new Error("A signed-in user email is required before saving.");
  }

  try {
    const documentReference = await addDoc(
      collection(db, MODULE_A_COLLECTION, userUid, MODULE_A_NOTES_SUBCOLLECTION),
      {
        title,
        body,
        createdAt: serverTimestamp(),
        updatedAt: null,
        createdByUid: userUid,
        createdByEmail: userEmail,
      }
    );

    return documentReference.id;
  } catch (error: unknown) {
    throw new Error(toModuleAWriteErrorMessage(error));
  }
}

export function toModuleAErrorMessage(error: unknown) {
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

export function toModuleAWriteErrorMessage(error: unknown) {
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
