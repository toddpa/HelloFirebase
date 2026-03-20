# HelloFirebase

React + Vite + TypeScript app deployed to Firebase Hosting.

## Stage 2B Access Control

The dashboard now uses Google Authentication plus a Firestore authorization layer.

Supported access states:

- `admin`
- `approved`
- `pending`
- `denied`
- `unknown`

Current Stage 2B features:

- Google sign in
- persisted auth state
- sign out
- Firestore-backed access-state resolution
- request access workflow for unapproved users
- admin allow-list management
- admin approval and denial workflow
- Firestore Security Rules for the access-control collections
- documented first-admin bootstrap path
- documented Stage 2B testing checklist
- documented Stage 2B sign-off summary

## Environment Setup

Create a local `.env` file in the project root using [.env.example](/workspaces/HelloFirebase/.env.example):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_USE_FIREBASE_EMULATORS=false
```

Get these values from Firebase Console:

`Project settings` -> `General` -> `Your apps` -> web app config

## Dev Container

This repo includes a dev container at [.devcontainer/devcontainer.json](/workspaces/HelloFirebase/.devcontainer/devcontainer.json) so it can act as a repeatable starter project.

The container provides:

- Node.js 22
- Java 21 for Firebase emulators that require Java
- pre-forwarded ports for Vite and Firebase emulators
- Firebase CLI installed during container setup
- a matching [.nvmrc](/workspaces/HelloFirebase/.nvmrc) for non-container local setups

After opening the project in the container:

1. Copy `.env.example` to `.env` and fill in your Firebase web app values.
2. Run `firebase login` if you need deploy or emulator commands tied to your account.
3. Start development with `npm run dev`.

The container does not include project secrets. Keep `.env`, `.firebaserc`, and any service-account credentials aligned with the Firebase project you want the template instance to use.

## Firebase Console Setup

Before sign-in works, enable:

- `Authentication` -> `Get started`
- `Authentication` -> `Sign-in method` -> `Google`
- `Authentication` -> `Settings` -> `Authorized domains`
- `Firestore Database` -> create a database in production mode or locked mode, then deploy the included rules

For local development, make sure these hosts are authorized when needed:

- `localhost`
- `127.0.0.1`
- your Codespaces preview hostname such as `*.app.github.dev`

Use the hostname only in Firebase Auth authorized domains, not a full URL with `https://`.

## Firestore Collections

This stage expects three collections with normalized email document IDs:

- `allowedEmails/{normalizedEmail}`
- `accessRequests/{normalizedEmail}`
- `adminUsers/{normalizedEmail}`

Email normalization:

- trim leading and trailing whitespace
- convert to lowercase

The admin record is the trusted bootstrap for administrator access. For Stage 2B, seed it manually in Firestore using the admin email as the document ID.

Example admin document:

```json
{
  "uid": "firebase-auth-uid",
  "email": "admin@example.com",
  "normalizedEmail": "admin@example.com",
  "role": "admin"
}
```

Repeatable bootstrap instructions live in [docs/admin-bootstrap.md](/workspaces/HelloFirebase/docs/admin-bootstrap.md).

## Access Flow Notes

The app keeps auth and authorization state isolated in the React provider.

- local dev on `localhost`, `127.0.0.1`, and `*.app.github.dev` uses Google popup sign-in for reliability
- other environments continue to use redirect sign-in
- auth state is persisted with Firebase browser local persistence
- protected subscriber UI does not render until Firestore access resolution completes
- approved access is granted by `allowedEmails`, not by the existence of a request record
- admin tools manage the allow list and review request records

This local popup fallback was added because redirect-based auth can fail to restore session state in some browser and preview-domain setups.

## Emulator Notes

To use the Firebase Emulator Suite for Firestore and Auth:

1. Set `VITE_USE_FIREBASE_EMULATORS=true` in `.env`.
2. Start the emulators with `firebase emulators:start`.
3. Use emulator accounts for Firestore/Auth behavior tests.
4. Run `npm run test:rules` for Firestore Security Rules coverage.

Google sign-in itself does not run through the Auth emulator the same way as production, so keep a small real-account smoke test set for final verification.

The practical Stage 2B test matrix lives in [docs/stage-2b-testing-checklist.md](/workspaces/HelloFirebase/docs/stage-2b-testing-checklist.md).

Stage closure notes live in [docs/stage-2b-signoff.md](/workspaces/HelloFirebase/docs/stage-2b-signoff.md).

## Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
firebase deploy --only firestore:rules
```
