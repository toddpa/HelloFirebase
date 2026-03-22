import type { Timestamp } from "firebase/firestore";

export const MODULE_A_COLLECTION = "userNotes";

export type ModuleAItem = {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type ModuleAFormState = {
  title: string;
  body: string;
};
