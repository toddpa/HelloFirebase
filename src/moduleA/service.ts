import {
  collection,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { MODULE_A_COLLECTION, type ModuleAItem } from "./types";

type ModuleAItemDocument = {
  title?: unknown;
  summary?: unknown;
  description?: unknown;
  status?: unknown;
  updatedAt?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readTimestamp(value: unknown): Timestamp | null {
  return typeof value === "object" && value !== null && "toDate" in value ? (value as Timestamp) : null;
}

function toModuleAItem(documentSnapshot: QueryDocumentSnapshot<DocumentData>): ModuleAItem {
  const data = documentSnapshot.data() as ModuleAItemDocument;
  const summary = readString(data.summary) ?? readString(data.description);

  return {
    id: documentSnapshot.id,
    title: readString(data.title) ?? documentSnapshot.id,
    summary,
    status: readString(data.status),
    updatedAt: readTimestamp(data.updatedAt),
  };
}

function compareModuleAItems(left: ModuleAItem, right: ModuleAItem) {
  if (left.updatedAt && right.updatedAt) {
    const updatedAtDifference = right.updatedAt.toMillis() - left.updatedAt.toMillis();

    if (updatedAtDifference !== 0) {
      return updatedAtDifference;
    }
  }

  if (left.updatedAt) {
    return -1;
  }

  if (right.updatedAt) {
    return 1;
  }

  return left.title.localeCompare(right.title);
}

export async function listModuleAItems(): Promise<ModuleAItem[]> {
  const snapshot = await getDocs(collection(db, MODULE_A_COLLECTION));

  return snapshot.docs.map(toModuleAItem).sort(compareModuleAItems);
}

export function toModuleAErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "You do not have permission to read Module A right now.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to load Module A items right now.";
}
