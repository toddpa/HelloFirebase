import type { Timestamp } from "firebase/firestore";

export const MODULE_B_COLLECTION = "adminAnnouncements";

export type ModuleBFormState = {
  title: string;
  details: string;
};

export type ModuleBRecord = {
  title: string;
  description: string;
  createdBy: string;
  createdAt: Timestamp | null;
};
