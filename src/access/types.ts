import type { Timestamp } from "firebase/firestore";

export type AccessState = "admin" | "approved" | "pending" | "denied" | "unknown";

export type AccessRequestStatus = "pending" | "approved" | "denied";

export type AllowedEmailRecord = {
  email: string;
  normalizedEmail: string;
  createdAt?: Timestamp | null;
  createdBy: string;
};

export type AccessRequestRecord = {
  email: string;
  normalizedEmail: string;
  uid: string;
  status: AccessRequestStatus;
  requestedAt?: Timestamp | null;
  reviewedAt?: Timestamp | null;
  reviewedBy?: string | null;
};

export type AdminUserRecord = {
  uid: string;
  email: string;
  normalizedEmail: string;
  role: "admin";
  createdAt?: Timestamp | null;
};

export type ResolvedAccess = {
  state: AccessState;
  normalizedEmail: string | null;
};
