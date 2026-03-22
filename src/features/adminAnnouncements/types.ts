import type { Timestamp } from "firebase/firestore";

export const ADMIN_ANNOUNCEMENTS_COLLECTION = "adminAnnouncements";

export type AdminAnnouncement = {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp | null;
};
