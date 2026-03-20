# Stage 2B Access Control Spec
## Codex Execution Plan, Chunk 2 of 4
### Introduce Firestore-backed access-state resolution and protected routing

This is a derived execution plan reconstructed from the current repository state at the time it was authored.

Treat the chunk as implementation scope, not proof that the repository still matches the starting snapshot exactly. If supporting infrastructure already exists, build on it.

## Context

Chunk 1 established Firebase Auth and the base application shell. This chunk adds the authorization model that drives Stage 2B.

The app should distinguish among these access states:

- `admin`
- `approved`
- `pending`
- `denied`
- `unknown`

## Objectives

Implement only the following:

### 1. Define the Stage 2B access model

Create typed access-related records and helpers for:

- normalized emails
- access requests
- allowed subscriber emails
- admin user records
- resolved access state

### 2. Resolve authorization from Firestore

Add a service that determines a signed-in user’s effective access state by checking Firestore-backed sources of truth such as:

- `adminUsers`
- `allowedEmails`
- `accessRequests`

Approved access should come from the allow list, not from request history alone.

### 3. Build auth-aware routing

Create routing that sends users to the correct page based on authentication and access state.

At minimum support:

- home
- request access
- pending
- denied
- admin

### 4. Add a protected-route mechanism

Prevent protected screens from rendering until auth and authorization state are fully resolved.

Redirect users safely when they attempt routes that do not match their current state.

### 5. Add the status and request pages

Create simple pages and shared components for:

- access resolving
- pending
- denied
- request access entry

Keep messaging readable and explicit.

## Constraints

- Firestore remains the authoritative authorization source
- Do not rely on client-only role flags
- Keep the access logic centralized and typed
- Extend the existing `vitest` + Testing Library setup for UI behavior tests

## Definition of Done

This chunk is complete when:

- access state resolves from Firestore
- users are routed according to that state
- protected pages wait for resolution before rendering
- request, pending, and denied screens exist and are reachable
- existing `npm test` and `npm run typecheck` remain green
- the app tests still pass
