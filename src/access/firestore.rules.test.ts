// @vitest-environment node

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const projectId = process.env.GCLOUD_PROJECT ?? "hellofirebase-a3363";

let testEnv: RulesTestEnvironment;

function authedContext(email: string, uid = email) {
  return testEnv.authenticatedContext(uid, { email });
}

async function seedAsAdmin(data: {
  adminUsers?: Array<{ id: string; value: Record<string, unknown> }>;
  allowedEmails?: Array<{ id: string; value: Record<string, unknown> }>;
  accessRequests?: Array<{ id: string; value: Record<string, unknown> }>;
  subscriberContent?: Array<{ id: string; value: Record<string, unknown> }>;
}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    for (const record of data.adminUsers ?? []) {
      await setDoc(doc(db, "adminUsers", record.id), record.value);
    }

    for (const record of data.allowedEmails ?? []) {
      await setDoc(doc(db, "allowedEmails", record.id), record.value);
    }

    for (const record of data.accessRequests ?? []) {
      await setDoc(doc(db, "accessRequests", record.id), record.value);
    }

    for (const record of data.subscriberContent ?? []) {
      await setDoc(doc(db, "subscriberContent", record.id), record.value);
    }
  });
}

beforeAll(async () => {
  const rules = await readFile(path.resolve(process.cwd(), "firestore.rules"), "utf8");
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

  if (!emulatorHost) {
    throw new Error("FIRESTORE_EMULATOR_HOST is not set. Run this suite with `npm run test:rules`.");
  }

  const [host, portText] = emulatorHost.split(":");
  const port = Number(portText);

  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host,
      port,
      rules,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe("Firestore access control rules", () => {
  it("lets admins read and write allowedEmails", async () => {
    await seedAsAdmin({
      adminUsers: [
        {
          id: "admin@example.com",
          value: {
            uid: "admin-uid",
            email: "admin@example.com",
            normalizedEmail: "admin@example.com",
            role: "admin",
          },
        },
      ],
      allowedEmails: [
        {
          id: "member@example.com",
          value: {
            email: "member@example.com",
            normalizedEmail: "member@example.com",
            createdBy: "admin-uid",
          },
        },
      ],
    });

    const db = authedContext("admin@example.com", "admin-uid").firestore();

    await assertSucceeds(getDocs(query(collection(db, "allowedEmails"))));
    await assertSucceeds(
      setDoc(doc(db, "allowedEmails", "newmember@example.com"), {
        email: "newmember@example.com",
        normalizedEmail: "newmember@example.com",
        createdBy: "admin-uid",
      })
    );
  });

  it("blocks approved subscribers from writing allowedEmails", async () => {
    await seedAsAdmin({
      allowedEmails: [
        {
          id: "member@example.com",
          value: {
            email: "member@example.com",
            normalizedEmail: "member@example.com",
            createdBy: "admin-uid",
          },
        },
      ],
    });

    const db = authedContext("member@example.com", "member-uid").firestore();

    await assertFails(
      setDoc(doc(db, "allowedEmails", "friend@example.com"), {
        email: "friend@example.com",
        normalizedEmail: "friend@example.com",
        createdBy: "member-uid",
      })
    );
  });

  it("blocks unknown, pending, and denied users from reading protected subscriber data", async () => {
    await seedAsAdmin({
      accessRequests: [
        {
          id: "pending@example.com",
          value: {
            email: "pending@example.com",
            normalizedEmail: "pending@example.com",
            uid: "pending-uid",
            status: "pending",
            requestedAt: new Date("2026-03-17T00:00:00.000Z"),
            reviewedAt: null,
            reviewedBy: null,
          },
        },
        {
          id: "denied@example.com",
          value: {
            email: "denied@example.com",
            normalizedEmail: "denied@example.com",
            uid: "denied-uid",
            status: "denied",
            requestedAt: new Date("2026-03-17T00:00:00.000Z"),
            reviewedAt: new Date("2026-03-17T00:10:00.000Z"),
            reviewedBy: "admin-uid",
          },
        },
      ],
      subscriberContent: [
        {
          id: "welcome",
          value: {
            title: "Subscriber welcome",
          },
        },
      ],
    });

    await assertFails(getDoc(doc(authedContext("unknown@example.com", "unknown-uid").firestore(), "subscriberContent", "welcome")));
    await assertFails(getDoc(doc(authedContext("pending@example.com", "pending-uid").firestore(), "subscriberContent", "welcome")));
    await assertFails(getDoc(doc(authedContext("denied@example.com", "denied-uid").firestore(), "subscriberContent", "welcome")));
  });

  it("lets a normal user create only their own request path", async () => {
    const db = authedContext("person@example.com", "person-uid").firestore();

    await assertSucceeds(
      setDoc(doc(db, "accessRequests", "person@example.com"), {
        email: "person@example.com",
        normalizedEmail: "person@example.com",
        uid: "person-uid",
        status: "pending",
        requestedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
      })
    );

    await assertFails(
      setDoc(doc(db, "accessRequests", "other@example.com"), {
        email: "other@example.com",
        normalizedEmail: "other@example.com",
        uid: "person-uid",
        status: "pending",
        requestedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
      })
    );
  });

  it("prevents a normal user from marking their request approved", async () => {
    await seedAsAdmin({
      accessRequests: [
        {
          id: "person@example.com",
          value: {
            email: "person@example.com",
            normalizedEmail: "person@example.com",
            uid: "person-uid",
            status: "pending",
            requestedAt: new Date("2026-03-17T00:00:00.000Z"),
            reviewedAt: null,
            reviewedBy: null,
          },
        },
      ],
    });

    const db = authedContext("person@example.com", "person-uid").firestore();

    await assertFails(
      updateDoc(doc(db, "accessRequests", "person@example.com"), {
        status: "approved",
        reviewedAt: serverTimestamp(),
        reviewedBy: "person-uid",
      })
    );
  });

  it("revokes subscriber access after allowedEmails removal while keeping request history", async () => {
    await seedAsAdmin({
      adminUsers: [
        {
          id: "admin@example.com",
          value: {
            uid: "admin-uid",
            email: "admin@example.com",
            normalizedEmail: "admin@example.com",
            role: "admin",
          },
        },
      ],
      allowedEmails: [
        {
          id: "member@example.com",
          value: {
            email: "member@example.com",
            normalizedEmail: "member@example.com",
            createdBy: "admin-uid",
          },
        },
      ],
      accessRequests: [
        {
          id: "member@example.com",
          value: {
            email: "member@example.com",
            normalizedEmail: "member@example.com",
            uid: "member-uid",
            status: "approved",
            requestedAt: new Date("2026-03-17T00:00:00.000Z"),
            reviewedAt: new Date("2026-03-17T00:10:00.000Z"),
            reviewedBy: "admin-uid",
          },
        },
      ],
      subscriberContent: [
        {
          id: "welcome",
          value: {
            title: "Subscriber welcome",
          },
        },
      ],
    });

    const adminDb = authedContext("admin@example.com", "admin-uid").firestore();
    const memberDb = authedContext("member@example.com", "member-uid").firestore();

    await assertSucceeds(getDoc(doc(memberDb, "subscriberContent", "welcome")));
    await assertSucceeds(deleteDoc(doc(adminDb, "allowedEmails", "member@example.com")));
    await assertFails(getDoc(doc(memberDb, "subscriberContent", "welcome")));

    const requestSnapshot = await getDoc(doc(memberDb, "accessRequests", "member@example.com"));
    expect(requestSnapshot.exists()).toBe(true);
    expect(requestSnapshot.data()?.status).toBe("approved");
  });
});
