import {
  collection,
  onSnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  ADMIN_ANNOUNCEMENTS_COLLECTION,
  type AdminAnnouncement,
} from "./types";

type AdminAnnouncementDocument = {
  title?: unknown;
  description?: unknown;
  details?: unknown;
  createdAt?: unknown;
};

type AnnouncementSubscriptionHandlers = {
  onAnnouncements: (announcements: AdminAnnouncement[]) => void;
  onError: (error: unknown) => void;
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readTimestamp(value: unknown): Timestamp | null {
  return typeof value === "object" && value !== null && "toDate" in value ? (value as Timestamp) : null;
}

function toAdminAnnouncement(
  documentSnapshot: QueryDocumentSnapshot<DocumentData>
): AdminAnnouncement {
  const data = documentSnapshot.data() as AdminAnnouncementDocument;

  return {
    id: documentSnapshot.id,
    title: readString(data.title) ?? documentSnapshot.id,
    description:
      readString(data.description) ??
      readString(data.details) ??
      "No description provided.",
    createdAt: readTimestamp(data.createdAt),
  };
}

function compareAnnouncements(left: AdminAnnouncement, right: AdminAnnouncement) {
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

export function toAdminAnnouncementsErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  ) {
    return "You do not have permission to access admin announcements right now.";
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to load admin announcements right now.";
}

export function subscribeToAdminAnnouncements({
  onAnnouncements,
  onError,
}: AnnouncementSubscriptionHandlers) {
  return onSnapshot(
    collection(db, ADMIN_ANNOUNCEMENTS_COLLECTION),
    (snapshot) => {
      const announcements = snapshot.docs.map(toAdminAnnouncement).sort(compareAnnouncements);
      onAnnouncements(announcements);
    },
    onError
  );
}
