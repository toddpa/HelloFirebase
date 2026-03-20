# Stage 2B Access Control Spec
## Codex Execution Plan, Chunk 3 of 4
### Implement the request-access flow and the admin review/allow-list tools

This is a derived execution plan reconstructed from the current repository state at the time it was authored.

Treat the chunk as implementation scope, not proof that the repository still matches the starting snapshot exactly. If the repo already contains test helpers, routing, or Firebase setup, extend those patterns.

## Context

The app can now authenticate users and resolve their access state. This chunk adds the core workflows that make Stage 2B operational.

## Objectives

Implement only the following:

### 1. Add the user request-access write flow

Allow signed-in users in the `unknown` state to submit a request into Firestore.

The request record should include:

- email
- normalized email
- uid
- status
- request timestamp
- review metadata placeholders

Prevent duplicate or invalid submissions with clear feedback.

### 2. Build the admin allow-list management page

Create an admin-only UI that can:

- list approved emails
- add a normalized approved email
- remove an approved email

This should use real Firestore SDK calls and basic form validation.

### 3. Add admin request review tools

Let admins view pending requests and mark them:

- `approved`
- `denied`

When approving a request, update the request record and add the user to the allow list in the same workflow.

### 4. Handle admin and request workflow feedback

Surface readable UI states for:

- loading
- validation errors
- duplicate submissions
- success feedback
- Firestore failures

### 5. Add app and component tests

Cover:

- request access submission states
- admin allow-list add/remove behavior
- admin request approve/deny behavior
- unauthorized rendering for non-admin users

Use the established `vitest` + `@testing-library/react` path for these app and component tests.

## Constraints

- Reuse the auth and access-state foundation from prior chunks
- Keep the admin UI compact and practical
- Avoid building a large admin console
- Extend existing test helpers and patterns rather than introducing parallel ones

## Definition of Done

This chunk is complete when:

- unknown users can submit access requests
- admins can manage approved emails
- admins can approve or deny pending requests
- request and admin flows use real Firestore writes
- existing `npm test` and `npm run typecheck` remain green
- tests cover the main workflow branches
