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
  where,
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
  notes?: Array<{ id: string; value: Record<string, unknown> }>;
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

    for (const record of data.notes ?? []) {
      await setDoc(doc(db, "notes", record.id), record.value);
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

  it("lets admins create shared notes, lets approved users read only published shared notes, and blocks non-admin shared-note writes", async () => {
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
      notes: [
        {
          id: "published-note",
          value: {
            title: "Published note",
            body: "Visible to approved users.",
            status: "published",
            visibility: "shared",
            authorId: "admin-uid",
            authorEmail: "admin@example.com",
            createdAt: new Date("2026-03-17T00:00:00.000Z"),
            updatedAt: new Date("2026-03-17T00:00:00.000Z"),
            publishedAt: new Date("2026-03-17T00:00:00.000Z"),
          },
        },
        {
          id: "draft-note",
          value: {
            title: "Draft note",
            body: "Admins only.",
            status: "draft",
            visibility: "shared",
            authorId: "admin-uid",
            authorEmail: "admin@example.com",
            createdAt: new Date("2026-03-17T00:05:00.000Z"),
            updatedAt: new Date("2026-03-17T00:05:00.000Z"),
            publishedAt: null,
          },
        },
      ],
    });

    const adminDb = authedContext("admin@example.com", "admin-uid").firestore();
    const memberDb = authedContext("member@example.com", "member-uid").firestore();

    await assertSucceeds(
      setDoc(doc(adminDb, "notes", "new-note"), {
        title: "New note",
        body: "Admin-created dashboard note.",
        status: "published",
        visibility: "shared",
        authorId: "admin-uid",
        authorEmail: "admin@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      })
    );

    await assertSucceeds(getDoc(doc(adminDb, "notes", "draft-note")));
    await assertSucceeds(getDoc(doc(memberDb, "notes", "published-note")));
    await assertFails(getDoc(doc(memberDb, "notes", "draft-note")));
    await assertSucceeds(
      getDocs(
        query(
          collection(memberDb, "notes"),
          where("visibility", "==", "shared"),
          where("status", "==", "published")
        )
      )
    );
    await assertFails(
      setDoc(doc(memberDb, "notes", "member-shared-note"), {
        title: "Member note",
        body: "This should fail.",
        status: "published",
        visibility: "shared",
        authorId: "member-uid",
        authorEmail: "member@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      })
    );
  });

  it("lets approved users create private notes and only read their own notes", async () => {
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
        {
          id: "other@example.com",
          value: {
            email: "other@example.com",
            normalizedEmail: "other@example.com",
            createdBy: "admin-uid",
          },
        },
      ],
      notes: [
        {
          id: "member-note",
          value: {
            title: "Member note",
            body: "Visible only to the owner.",
            status: "draft",
            visibility: "private",
            authorId: "member-uid",
            authorEmail: "member@example.com",
            createdAt: new Date("2026-03-17T01:00:00.000Z"),
            updatedAt: new Date("2026-03-17T01:00:00.000Z"),
            publishedAt: null,
          },
        },
      ],
    });

    const memberDb = authedContext("member@example.com", "member-uid").firestore();
    const otherDb = authedContext("other@example.com", "other-uid").firestore();

    await assertSucceeds(
      setDoc(doc(memberDb, "notes", "new-member-note"), {
        title: "New private note",
        body: "Only I should see this.",
        status: "draft",
        visibility: "private",
        authorId: "member-uid",
        authorEmail: "member@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
      })
    );

    await assertSucceeds(getDoc(doc(memberDb, "notes", "member-note")));
    await assertSucceeds(
      getDocs(
        query(
          collection(memberDb, "notes"),
          where("visibility", "==", "private"),
          where("authorId", "==", "member-uid")
        )
      )
    );

    await assertFails(getDoc(doc(otherDb, "notes", "member-note")));
    await assertFails(
      setDoc(doc(otherDb, "notes", "forged-note"), {
        title: "Forged note",
        body: "This should fail.",
        status: "draft",
        visibility: "private",
        authorId: "member-uid",
        authorEmail: "member@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
      })
    );
  });

  it("lets approved users update and delete their own private notes across draft and published states", async () => {
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
        {
          id: "other@example.com",
          value: {
            email: "other@example.com",
            normalizedEmail: "other@example.com",
            createdBy: "admin-uid",
          },
        },
      ],
      notes: [
        {
          id: "member-note",
          value: {
            title: "Member draft",
            body: "Visible only to the owner.",
            status: "draft",
            visibility: "private",
            authorId: "member-uid",
            authorEmail: "member@example.com",
            createdAt: new Date("2026-03-17T01:00:00.000Z"),
            updatedAt: new Date("2026-03-17T01:00:00.000Z"),
            publishedAt: null,
          },
        },
      ],
    });

    const memberDb = authedContext("member@example.com", "member-uid").firestore();
    const otherDb = authedContext("other@example.com", "other-uid").firestore();

    await assertSucceeds(
      updateDoc(doc(memberDb, "notes", "member-note"), {
        title: "Member published",
        body: "Now published privately.",
        status: "published",
        visibility: "private",
        authorId: "member-uid",
        authorEmail: "member@example.com",
        createdAt: new Date("2026-03-17T01:00:00.000Z"),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      })
    );

    await assertSucceeds(
      updateDoc(doc(memberDb, "notes", "member-note"), {
        title: "Member draft again",
        body: "Moved back to draft.",
        status: "draft",
        visibility: "private",
        authorId: "member-uid",
        authorEmail: "member@example.com",
        createdAt: new Date("2026-03-17T01:00:00.000Z"),
        updatedAt: serverTimestamp(),
        publishedAt: null,
      })
    );

    await assertFails(
      updateDoc(doc(otherDb, "notes", "member-note"), {
        title: "Hijacked note",
        body: "This should fail.",
        status: "published",
        visibility: "private",
        authorId: "other-uid",
        authorEmail: "other@example.com",
        createdAt: new Date("2026-03-17T01:00:00.000Z"),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      })
    );

    await assertSucceeds(deleteDoc(doc(memberDb, "notes", "member-note")));
    await assertFails(deleteDoc(doc(otherDb, "notes", "member-note")));
  });

  it("lets admins update and delete shared notes, while approved users still cannot modify them", async () => {
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
      notes: [
        {
          id: "published-note",
          value: {
            title: "Published note",
            body: "Visible to approved users.",
            status: "published",
            visibility: "shared",
            authorId: "admin-uid",
            authorEmail: "admin@example.com",
            createdAt: new Date("2026-03-17T00:00:00.000Z"),
            updatedAt: new Date("2026-03-17T00:00:00.000Z"),
            publishedAt: new Date("2026-03-17T00:00:00.000Z"),
          },
        },
      ],
    });

    const adminDb = authedContext("admin@example.com", "admin-uid").firestore();
    const memberDb = authedContext("member@example.com", "member-uid").firestore();

    await assertSucceeds(
      updateDoc(doc(adminDb, "notes", "published-note"), {
        body: "Updated body",
        updatedAt: serverTimestamp(),
      })
    );
    await assertSucceeds(deleteDoc(doc(adminDb, "notes", "published-note")));
    await assertFails(
      updateDoc(doc(memberDb, "notes", "published-note"), {
        body: "Member edit attempt",
      })
    );
    await assertFails(deleteDoc(doc(memberDb, "notes", "published-note")));
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

  it("treats mixed-case authenticated emails as approved when the allow-list entry is normalized", async () => {
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
      accessRequests: [
        {
          id: "member@example.com",
          value: {
            email: "Member@Example.com",
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

    const mixedCaseDb = authedContext("Member@Example.com", "member-uid").firestore();

    await assertSucceeds(getDoc(doc(mixedCaseDb, "subscriberContent", "welcome")));
    await assertSucceeds(getDoc(doc(mixedCaseDb, "accessRequests", "member@example.com")));
  });

  it("lets admins review pending access requests only when immutable fields stay unchanged", async () => {
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

    const adminDb = authedContext("admin@example.com", "admin-uid").firestore();

    await assertSucceeds(
      updateDoc(doc(adminDb, "accessRequests", "person@example.com"), {
        status: "approved",
        reviewedAt: serverTimestamp(),
        reviewedBy: "admin-uid",
      })
    );

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

    await assertFails(
      setDoc(doc(adminDb, "accessRequests", "person@example.com"), {
        email: "changed@example.com",
        normalizedEmail: "person@example.com",
        uid: "person-uid",
        status: "approved",
        requestedAt: new Date("2026-03-17T00:00:00.000Z"),
        reviewedAt: serverTimestamp(),
        reviewedBy: "admin-uid",
      })
    );
  });

  it("lets admins write subscriber content and blocks approved users from writing it", async () => {
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

    const adminDb = authedContext("admin@example.com", "admin-uid").firestore();
    const memberDb = authedContext("member@example.com", "member-uid").firestore();

    await assertSucceeds(
      setDoc(doc(adminDb, "subscriberContent", "welcome"), {
        title: "Subscriber welcome",
      })
    );

    await assertFails(
      setDoc(doc(memberDb, "subscriberContent", "welcome"), {
        title: "Forged subscriber content",
      })
    );
  });

  it("lets admin users read their own admin marker but blocks non-admin users from reading adminUsers", async () => {
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

    const adminDb = authedContext("admin@example.com", "admin-uid").firestore();
    const memberDb = authedContext("member@example.com", "member-uid").firestore();

    await assertSucceeds(getDoc(doc(adminDb, "adminUsers", "admin@example.com")));
    await assertFails(getDoc(doc(memberDb, "adminUsers", "admin@example.com")));
  });

  it("enforces payload validation for shared notes", async () => {
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
    });

    const adminDb = authedContext("admin@example.com", "admin-uid").firestore();

    await assertFails(
      setDoc(doc(adminDb, "notes", "bad-shared-note"), {
        title: "Ops note",
        body: "",
        status: "published",
        visibility: "shared",
        authorId: "admin-uid",
        authorEmail: "admin@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      })
    );

    await assertFails(
      setDoc(doc(adminDb, "notes", "bad-dashboard-note"), {
        title: "Bad dashboard note",
        body: "This payload has the wrong author email.",
        status: "published",
        visibility: "shared",
        authorId: "admin-uid",
        authorEmail: "other@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      })
    );
  });

  it("enforces payload validation for approved users creating private notes", async () => {
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

    const memberDb = authedContext("member@example.com", "member-uid").firestore();

    await assertFails(
      setDoc(doc(memberDb, "notes", "bad-note"), {
        title: "Bad private note",
        body: "The metadata is forged.",
        status: "draft",
        visibility: "private",
        authorId: "other-uid",
        authorEmail: "member@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: null,
      })
    );

    await assertFails(
      setDoc(doc(memberDb, "notes", "also-bad-note"), {
        title: "Another bad note",
        body: "private notes can publish now, but this create payload is still invalid.",
        status: "published",
        visibility: "private",
        authorId: "member-uid",
        authorEmail: "other@example.com",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      })
    );
  });

  it("enforces payload validation for approved users updating private notes", async () => {
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
      notes: [
        {
          id: "member-note",
          value: {
            title: "Member note",
            body: "Visible only to the owner.",
            status: "draft",
            visibility: "private",
            authorId: "member-uid",
            authorEmail: "member@example.com",
            createdAt: new Date("2026-03-17T01:00:00.000Z"),
            updatedAt: new Date("2026-03-17T01:00:00.000Z"),
            publishedAt: null,
          },
        },
      ],
    });

    const memberDb = authedContext("member@example.com", "member-uid").firestore();

    await assertFails(
      updateDoc(doc(memberDb, "notes", "member-note"), {
        title: "Forged note",
        body: "Changed ownership should fail.",
        status: "draft",
        visibility: "private",
        authorId: "other-uid",
        authorEmail: "member@example.com",
        createdAt: new Date("2026-03-17T01:00:00.000Z"),
        updatedAt: serverTimestamp(),
        publishedAt: null,
      })
    );

    await assertFails(
      updateDoc(doc(memberDb, "notes", "member-note"), {
        title: "Changed creation date",
        body: "Tampering with createdAt should fail.",
        status: "published",
        visibility: "private",
        authorId: "member-uid",
        authorEmail: "member@example.com",
        createdAt: new Date("2026-03-18T01:00:00.000Z"),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      })
    );
  });
});
