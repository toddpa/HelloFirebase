import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const LEGACY_ADMIN_ANNOUNCEMENTS_COLLECTION = "adminAnnouncements";
const LEGACY_DASHBOARD_NOTES_COLLECTION = "dashboardNotes";
const LEGACY_USER_NOTES_COLLECTION = "userNotes";
const NOTES_COLLECTION = "notes";

function readString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readTimestamp(value) {
  if (value instanceof Timestamp) {
    return value;
  }

  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    return value;
  }

  return null;
}

export function toAdminAnnouncementNoteId(id) {
  return `legacy-admin-announcement-${id}`;
}

export function toDashboardNoteId(id) {
  return `legacy-dashboard-note-${id}`;
}

export function toUserNoteId(ownerId, id) {
  return `legacy-user-note-${ownerId}-${id}`;
}

export function mapAdminAnnouncementToNote(sourceId, value, fallbackAuthorEmail) {
  const createdAt = readTimestamp(value.createdAt);
  const authorId = readString(value.createdBy) ?? "unknown-author";

  return {
    targetId: toAdminAnnouncementNoteId(sourceId),
    note: {
      title: readString(value.title) ?? sourceId,
      body: readString(value.description) ?? readString(value.details) ?? "No note body provided.",
      status: "published",
      visibility: "shared",
      authorId,
      authorEmail: readString(fallbackAuthorEmail) ?? "Unknown author",
      createdAt,
      updatedAt: null,
      publishedAt: createdAt,
    },
  };
}

export function mapDashboardNoteToNote(
  sourceId,
  value,
  fallbackAuthorId,
  fallbackAuthorEmail
) {
  const createdAt = readTimestamp(value.createdAt);
  const published = value.published === true;

  return {
    targetId: toDashboardNoteId(sourceId),
    note: {
      title: readString(value.title) ?? sourceId,
      body: readString(value.body) ?? "No note body provided.",
      status: published ? "published" : "draft",
      visibility: "shared",
      authorId: readString(value.createdByUid) ?? readString(fallbackAuthorId) ?? "legacy-dashboard-author",
      authorEmail:
        readString(value.createdByEmail) ?? readString(fallbackAuthorEmail) ?? "legacy-dashboard@example.com",
      createdAt,
      updatedAt: readTimestamp(value.updatedAt),
      publishedAt: published ? createdAt : null,
    },
  };
}

export function mapUserNoteToNote(ownerId, sourceId, value) {
  return {
    targetId: toUserNoteId(ownerId, sourceId),
    note: {
      title: readString(value.title) ?? sourceId,
      body: readString(value.body) ?? "No note body provided.",
      status: "draft",
      visibility: "private",
      authorId: readString(value.createdByUid) ?? ownerId,
      authorEmail: readString(value.createdByEmail) ?? "Unknown author",
      createdAt: readTimestamp(value.createdAt),
      updatedAt: readTimestamp(value.updatedAt),
      publishedAt: null,
    },
  };
}

export function buildMigrationPlan({
  adminAnnouncements,
  dashboardNotes,
  userNotes,
  fallbackDashboardAuthorId,
  fallbackDashboardAuthorEmail,
  fallbackAdminAuthorEmail,
}) {
  return [
    ...adminAnnouncements.map(({ id, data }) =>
      mapAdminAnnouncementToNote(id, data, fallbackAdminAuthorEmail)
    ),
    ...dashboardNotes.map(({ id, data }) =>
      mapDashboardNoteToNote(
        id,
        data,
        fallbackDashboardAuthorId,
        fallbackDashboardAuthorEmail
      )
    ),
    ...userNotes.map(({ ownerId, id, data }) =>
      mapUserNoteToNote(ownerId, id, data)
    ),
  ];
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function parseArgs(argv) {
  const options = {
    apply: false,
    fallbackDashboardAuthorId: "legacy-dashboard-author",
    fallbackDashboardAuthorEmail: "legacy-dashboard@example.com",
    fallbackAdminAuthorEmail: "admin@example.com",
    projectId: process.env.GCLOUD_PROJECT ?? "hellofirebase-a3363",
    serviceAccountPath: path.resolve(repoRoot, "service-account.json"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--fallback-dashboard-author-id") {
      options.fallbackDashboardAuthorId = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--fallback-dashboard-author-email") {
      options.fallbackDashboardAuthorEmail = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--fallback-admin-author-email") {
      options.fallbackAdminAuthorEmail = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--project-id") {
      options.projectId = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--service-account") {
      options.serviceAccountPath = path.resolve(process.cwd(), argv[index + 1]);
      index += 1;
    }
  }

  return options;
}

function initializeFirestore(options) {
  if (!getApps().length) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      initializeApp({ projectId: options.projectId });
    } else if (fs.existsSync(options.serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(options.serviceAccountPath, "utf8"));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: options.projectId,
      });
    } else {
      throw new Error(
        `No service account found at ${options.serviceAccountPath}. Pass --service-account or set FIRESTORE_EMULATOR_HOST.`
      );
    }
  }

  return getFirestore();
}

async function loadLegacyCollection(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    data: documentSnapshot.data(),
  }));
}

async function loadLegacyUserNotes(db) {
  const snapshot = await db.collectionGroup("notes").get();

  return snapshot.docs
    .map((documentSnapshot) => {
      const parent = documentSnapshot.ref.parent.parent;

      if (!parent || parent.parent?.id !== LEGACY_USER_NOTES_COLLECTION) {
        return null;
      }

      return {
        ownerId: parent.id,
        id: documentSnapshot.id,
        data: documentSnapshot.data(),
      };
    })
    .filter(Boolean);
}

async function applyMigrationPlan(db, plan) {
  let created = 0;
  let skipped = 0;

  for (const group of chunk(plan, 400)) {
    const batch = db.batch();

    for (const entry of group) {
      const targetRef = db.collection(NOTES_COLLECTION).doc(entry.targetId);
      const existing = await targetRef.get();

      if (existing.exists) {
        skipped += 1;
        continue;
      }

      batch.set(targetRef, entry.note);
      created += 1;
    }

    await batch.commit();
  }

  return { created, skipped };
}

function logPlan(plan, options) {
  console.log(`Mode: ${options.apply ? "apply" : "dry-run"}`);
  console.log(`Legacy ${LEGACY_ADMIN_ANNOUNCEMENTS_COLLECTION}: ${plan.filter((item) => item.targetId.startsWith("legacy-admin-announcement-")).length}`);
  console.log(`Legacy ${LEGACY_DASHBOARD_NOTES_COLLECTION}: ${plan.filter((item) => item.targetId.startsWith("legacy-dashboard-note-")).length}`);
  console.log(`Legacy ${LEGACY_USER_NOTES_COLLECTION}: ${plan.filter((item) => item.targetId.startsWith("legacy-user-note-")).length}`);
  console.log(`Planned writes to ${NOTES_COLLECTION}: ${plan.length}`);

  for (const entry of plan.slice(0, 10)) {
    console.log(
      `- ${entry.targetId}: ${entry.note.visibility}/${entry.note.status} by ${entry.note.authorEmail}`
    );
  }

  if (plan.length > 10) {
    console.log(`...and ${plan.length - 10} more`);
  }
}

export async function runMigration(rawArgs = process.argv.slice(2)) {
  const options = parseArgs(rawArgs);
  const db = initializeFirestore(options);
  const [adminAnnouncements, dashboardNotes, userNotes] = await Promise.all([
    loadLegacyCollection(db, LEGACY_ADMIN_ANNOUNCEMENTS_COLLECTION),
    loadLegacyCollection(db, LEGACY_DASHBOARD_NOTES_COLLECTION),
    loadLegacyUserNotes(db),
  ]);

  const plan = buildMigrationPlan({
    adminAnnouncements,
    dashboardNotes,
    userNotes,
    fallbackDashboardAuthorId: options.fallbackDashboardAuthorId,
    fallbackDashboardAuthorEmail: options.fallbackDashboardAuthorEmail,
    fallbackAdminAuthorEmail: options.fallbackAdminAuthorEmail,
  });

  logPlan(plan, options);

  if (!options.apply) {
    console.log("Dry run complete. Re-run with --apply to write migrated notes.");
    return { mode: "dry-run", planCount: plan.length };
  }

  const result = await applyMigrationPlan(db, plan);
  console.log(`Migration complete. Created ${result.created} notes, skipped ${result.skipped} existing notes.`);
  return { mode: "apply", ...result };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (invokedDirectly) {
  runMigration().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
