# Stage 2B Access Control Spec
## Codex Execution Plan, Chunk 1 of 4
### Establish the Firebase app foundation, authentication wiring, and base UI shell

This is a derived execution plan reconstructed from the current repository state.

## Context

Start from a minimal React + Vite + TypeScript app with Firebase Hosting as the intended deployment target.

This chunk lays the groundwork for Stage 2B by wiring Firebase into the frontend and creating a stable base for authentication-aware UI.

## Objectives

Implement only the following:

### 1. Configure Firebase client initialization

Add the frontend Firebase setup required for:

- Firebase app initialization
- Firebase Auth
- Firestore

Read configuration from environment variables and keep secrets out of source control.

### 2. Add a reusable authentication provider

Build a React auth context that exposes:

- current user
- loading state
- sign-in action
- sign-out action

Persist the Firebase auth session in the browser so refreshes do not immediately sign the user out.

### 3. Support Google sign-in

Use Google as the primary sign-in method.

Handle local development and preview-host reliability issues pragmatically, including popup-based sign-in where appropriate.

### 4. Add the unauthenticated landing view

Create a simple signed-out experience that:

- explains the app briefly
- offers a Google sign-in button
- displays readable auth errors when sign-in fails

### 5. Add basic app-level tests and type-safe plumbing

Verify the app renders a loading state and signed-out state cleanly, and keep the auth surface typed.

## Constraints

- Keep the UI intentionally simple
- Use real Firebase SDK integration
- Avoid introducing role logic in this chunk

## Definition of Done

This chunk is complete when:

- Firebase config is loaded from `.env`
- Google sign-in and sign-out are wired in the app
- auth state is available through a React provider
- the app has a working signed-out shell
- the project still typechecks and builds
