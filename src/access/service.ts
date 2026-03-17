import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { isValidEmail, normalizeEmail } from "./helpers";
import type {
  AccessRequestRecord,
  AccessRequestStatus,
  AdminUserRecord,
  AllowedEmailRecord,
  ResolvedAccess,
} from "./types";

const ALLOWED_EMAILS_COLLECTION = "allowedEmails";
const ACCESS_REQUESTS_COLLECTION = "accessRequests";
const ADMIN_USERS_COLLECTION = "adminUsers";
const SUBSCRIBER_CONTENT_COLLECTION = "subscriberContent";
const SUBSCRIBER_ACCESS_PROBE_DOCUMENT = "__access_probe__";

function allowedEmailRef(normalizedEmail: string) {
  return doc(db, ALLOWED_EMAILS_COLLECTION, normalizedEmail);
}

function accessRequestRef(normalizedEmail: string) {
  return doc(db, ACCESS_REQUESTS_COLLECTION, normalizedEmail);
}

function adminUserRef(normalizedEmail: string) {
  return doc(db, ADMIN_USERS_COLLECTION, normalizedEmail);
}

function subscriberAccessProbeRef() {
  return doc(db, SUBSCRIBER_CONTENT_COLLECTION, SUBSCRIBER_ACCESS_PROBE_DOCUMENT);
}

function isPermissionDeniedError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "permission-denied";
}

async function canReadAdminMarker(normalizedEmail: string) {
  try {
    const snapshot = await getDoc(adminUserRef(normalizedEmail));
    return snapshot.exists();
  } catch (error: unknown) {
    if (isPermissionDeniedError(error)) {
      return false;
    }

    throw error;
  }
}

async function canReadProtectedSubscriberContent() {
  try {
    await getDoc(subscriberAccessProbeRef());
    return true;
  } catch (error: unknown) {
    if (isPermissionDeniedError(error)) {
      return false;
    }

    throw error;
  }
}

export async function resolveUserAccess(user: User): Promise<ResolvedAccess> {
  const normalizedEmail = normalizeEmail(user.email);

  if (!normalizedEmail) {
    return { state: "unknown", normalizedEmail: null };
  }

  if (await canReadAdminMarker(normalizedEmail)) {
    return { state: "admin", normalizedEmail };
  }

  const [accessRequestSnapshot, hasProtectedSubscriberAccess] = await Promise.all([
    getDoc(accessRequestRef(normalizedEmail)),
    canReadProtectedSubscriberContent(),
  ]);

  if (hasProtectedSubscriberAccess) {
    return { state: "approved", normalizedEmail };
  }

  if (!accessRequestSnapshot.exists()) {
    return { state: "unknown", normalizedEmail };
  }

  const requestRecord = accessRequestSnapshot.data() as AccessRequestRecord;

  if (requestRecord.status === "denied") {
    return { state: "denied", normalizedEmail };
  }

  return { state: "pending", normalizedEmail };
}

export async function submitAccessRequest(user: User) {
  const normalizedEmail = normalizeEmail(user.email);

  if (!normalizedEmail || !user.email) {
    throw new Error("An email address is required before you can request access.");
  }

  const existingRequestSnapshot = await getDoc(accessRequestRef(normalizedEmail));

  if (existingRequestSnapshot.exists()) {
    const existingRequest = existingRequestSnapshot.data() as AccessRequestRecord;

    if (existingRequest.status === "pending") {
      throw new Error("An access request is already pending for this account.");
    }

    if (existingRequest.status === "denied") {
      throw new Error("This access request has been denied and cannot be resubmitted.");
    }

    if (existingRequest.status === "approved") {
      throw new Error("This account has already been approved.");
    }
  }

  await setDoc(
    accessRequestRef(normalizedEmail),
    {
      email: user.email,
      normalizedEmail,
      uid: user.uid,
      status: "pending",
      requestedAt: serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
    } satisfies Omit<AccessRequestRecord, "requestedAt"> & {
      requestedAt: ReturnType<typeof serverTimestamp>;
      reviewedAt: null;
    }
  );
}

export async function listAllowedEmails() {
  const allowedEmailsQuery = query(
    collection(db, ALLOWED_EMAILS_COLLECTION),
    orderBy("normalizedEmail", "asc")
  );
  const snapshot = await getDocs(allowedEmailsQuery);

  return snapshot.docs.map((documentSnapshot) => documentSnapshot.data() as AllowedEmailRecord);
}

export async function listAccessRequests() {
  const accessRequestsQuery = query(
    collection(db, ACCESS_REQUESTS_COLLECTION),
    orderBy("requestedAt", "desc")
  );
  const snapshot = await getDocs(accessRequestsQuery);

  return snapshot.docs.map((documentSnapshot) => documentSnapshot.data() as AccessRequestRecord);
}

export async function listPendingAccessRequests() {
  const accessRequests = await listAccessRequests();

  return accessRequests.filter((requestRecord) => requestRecord.status === "pending");
}

export async function allowSubscriberEmail(adminUser: User, email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  const existingRecord = await getDoc(allowedEmailRef(normalizedEmail));

  if (existingRecord.exists()) {
    throw new Error("That email is already on the allow list.");
  }

  await setDoc(
    allowedEmailRef(normalizedEmail),
    {
      email: normalizedEmail,
      normalizedEmail,
      createdAt: serverTimestamp(),
      createdBy: adminUser.uid,
    } satisfies Omit<AllowedEmailRecord, "createdAt"> & {
      createdAt: ReturnType<typeof serverTimestamp>;
    }
  );
}

export async function removeSubscriberEmail(normalizedEmail: string) {
  await deleteDoc(allowedEmailRef(normalizedEmail));
}

export async function reviewAccessRequest(
  adminUser: User,
  requestRecord: AccessRequestRecord,
  nextStatus: Exclude<AccessRequestStatus, "pending">
) {
  const batch = writeBatch(db);
  const normalizedEmail = requestRecord.normalizedEmail;

  batch.set(
    accessRequestRef(normalizedEmail),
    {
      ...requestRecord,
      status: nextStatus,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminUser.uid,
    },
    { merge: true }
  );

  if (nextStatus === "approved") {
    batch.set(
      allowedEmailRef(normalizedEmail),
      {
        email: requestRecord.email,
        normalizedEmail,
        createdAt: serverTimestamp(),
        createdBy: adminUser.uid,
      },
      { merge: true }
    );
  }

  await batch.commit();
}

export async function bootstrapAdminUser(adminRecord: AdminUserRecord) {
  await setDoc(adminUserRef(adminRecord.normalizedEmail), {
    ...adminRecord,
    createdAt: adminRecord.createdAt ?? null,
  });
}
