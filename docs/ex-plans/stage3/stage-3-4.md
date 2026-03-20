# Stage 3 Dashboard Spec v2
## Codex Execution Plan, Chunk 4 of 4
### Implement Module B with restricted admin-only Firestore writes and final polish

This is a derived execution plan reconstructed from the current repository state.

## Context

The project already has:

- Stage 2B auth and role/access foundation
- protected routing
- role-aware navigation
- Module A implemented with real Firestore reads

This chunk implements Module B as a restricted admin-only write feature and finishes the Stage 3 integration cleanly.

## Objectives

Implement only the following:

### 1. Build Module B as a restricted feature

Module B must be accessible only to authorized roles such as `admin`, based on the project’s existing Stage 2B role model.

It should demonstrate:

- restricted route access
- restricted navigation visibility
- restricted UI rendering where appropriate

### 2. Add a real Firestore write flow

Implement a simple admin-only write flow using a real Firebase SDK write operation.

This can be a small form or control that:

- creates a document, or
- updates a document

Keep it minimal. The goal is to validate authorization end to end.

### 3. Type the Module B data flow

Use TypeScript properly for:

- form state where practical
- Firestore document shape where practical
- component props
- service/helper functions

Avoid unnecessary `any`.

### 4. Handle success and failure states clearly

Provide readable UI feedback for:

- submitting
- success
- write failure
- permission denied

Do not rely on silent failure.

### 5. Final tidy-up across Stage 3

Make small coherence improvements across the implementation:

- imports
- naming consistency
- route definitions
- layout polish
- access-denied messaging
- any obviously duplicated logic introduced during the staged build

Keep this tidy-up limited and pragmatic.

## Definition of Done

This chunk is complete when:

- Module B works only for authorized roles
- a real Firestore write is exercised through the UI
- unauthorized users are denied appropriately
- Stage 3 works as a coherent role-aware modular dashboard
- the app builds cleanly
