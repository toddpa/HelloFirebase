import type { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { MODULE_B_COLLECTION, type ModuleBFormState, type ModuleBRecord } from "./types";

function normalizeFormValue(value: string) {
  return value.trim();
}

export function toModuleBWriteErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "You do not have permission to save Module B updates.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to save the Module B update right now.";
}

export async function createModuleBRecord(user: User, formState: ModuleBFormState) {
  const title = normalizeFormValue(formState.title);
  const details = normalizeFormValue(formState.details);

  if (!title) {
    throw new Error("Enter a short title before saving.");
  }

  if (!details) {
    throw new Error("Enter the update details before saving.");
  }

  if (!user.email) {
    throw new Error("A signed-in admin email is required before saving.");
  }

  const documentReference = await addDoc(collection(db, MODULE_B_COLLECTION), {
    title,
    details,
    createdBy: user.uid,
    createdByEmail: user.email,
    createdAt: serverTimestamp(),
  } satisfies Omit<ModuleBRecord, "createdAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
  });

  return documentReference.id;
}
