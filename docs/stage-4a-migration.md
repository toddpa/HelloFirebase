# Stage 4A Migration

## Approach

`npm run notes:migrate` runs a lightweight migration utility in `scripts/migrate-legacy-notes.mjs`.

- Default mode is a dry run.
- Pass `--apply` to write documents into `notes`.
- Legacy collections are preserved. The script only reads from:
  - `adminAnnouncements`
  - `dashboardNotes`

## Mapping

`adminAnnouncements -> notes`

- `visibility: "shared"`
- `status: "published"`
- target id: `legacy-admin-announcement-{legacyId}`

`dashboardNotes -> notes`

- `visibility: "private"`
- `status` is mapped from `published`
- target id: `legacy-dashboard-note-{legacyId}`
- author comes from legacy `createdByUid` / `createdByEmail` when present
- fallback author values can be passed with:
  - `--fallback-dashboard-author-id`
  - `--fallback-dashboard-author-email`

## Commands

Dry run:

```bash
npm run notes:migrate
```

Apply migration:

```bash
npm run notes:migrate -- --apply
```

Apply with fallback dashboard-note author values:

```bash
npm run notes:migrate -- --apply \
  --fallback-dashboard-author-id member-uid \
  --fallback-dashboard-author-email member@example.com
```

Use the Firestore emulator instead of a live project:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run notes:migrate -- --apply
```

## Verification

Recommended verification path for Stage 4A:

```bash
npm run test
npm run test:rules
npm run typecheck
npm run build
```

The migration script logs:

- legacy document counts per source collection
- planned write count to `notes`
- sample migrated records
- created vs skipped counts when `--apply` is used
