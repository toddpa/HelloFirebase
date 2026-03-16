# HelloFirebase

React + Vite + TypeScript app deployed to Firebase Hosting.

## Stage 2 Auth

Firebase Authentication is wired into the client app with:

- Google sign in
- persisted auth state
- sign out
- React auth context/provider
- loading, signed-out, and signed-in UI states

## Environment Setup

Create a local `.env` file in the project root using [.env.example](/workspaces/HelloFirebase/.env.example):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Get these values from Firebase Console:

`Project settings` -> `General` -> `Your apps` -> web app config

## Firebase Console Setup

Before sign-in works, enable:

- `Authentication` -> `Get started`
- `Authentication` -> `Sign-in method` -> `Google`
- `Authentication` -> `Settings` -> `Authorized domains`

For local development, make sure these hosts are authorized when needed:

- `localhost`
- `127.0.0.1`
- your Codespaces preview hostname such as `*.app.github.dev`

Use the hostname only in Firebase Auth authorized domains, not a full URL with `https://`.

## Auth Flow Notes

The app keeps the auth API isolated in the React provider so it is easy to change later.

- local dev on `localhost`, `127.0.0.1`, and `*.app.github.dev` uses Google popup sign-in for reliability
- other environments continue to use redirect sign-in
- auth state is persisted with Firebase browser local persistence

This local popup fallback was added because redirect-based auth can fail to restore session state in some browser and preview-domain setups.

## Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
```
