import type { Timestamp } from "firebase/firestore";

export const MODULE_A_COLLECTION = "subscriberContent";

export type ModuleAItem = {
  id: string;
  title: string;
  summary: string | null;
  status: string | null;
  updatedAt: Timestamp | null;
};
