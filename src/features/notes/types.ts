import type { Timestamp } from "firebase/firestore";

export const DASHBOARD_NOTES_COLLECTION = "dashboardNotes";

export type DashboardNote = {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp | null;
  createdByUid: string;
  createdByEmail: string;
  updatedAt: Timestamp | null;
  published: boolean;
};

export type DashboardNoteFormState = {
  title: string;
  body: string;
  published: boolean;
};

export type GetDashboardNotesOptions = {
  includeUnpublished?: boolean;
};
