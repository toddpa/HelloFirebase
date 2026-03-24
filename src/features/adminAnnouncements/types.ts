import type { Timestamp } from "firebase/firestore";

export const ADMIN_ANNOUNCEMENTS_COLLECTION = "adminAnnouncements";

/** @deprecated Legacy admin-announcement model retained for compatibility during notes consolidation. */
export type AdminAnnouncement = {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp | null;
};
