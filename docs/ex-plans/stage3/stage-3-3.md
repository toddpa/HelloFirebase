# Stage 3 Dashboard Spec v2
## Codex Execution Plan, Chunk 3 of 4
### Implement Module A with real Firestore reads for approved and admin dashboard users

This is a derived execution plan reconstructed from the current repository state.

## Context

The dashboard shell and role-aware routing are already in place. This chunk introduces the first real Stage 3 module and proves that approved dashboard users can read protected Firestore data through the UI.

## Objectives

Implement only the following:

### 1. Build Module A as a real dashboard module

Create the `/module-a` page as a subscriber-facing module that fits inside the Stage 3 dashboard shell.

It should be available to:

- `approved`
- `admin`

### 2. Add a real Firestore read flow

Use the Firebase SDK to read from an existing protected collection such as `subscriberContent`.

Keep the module simple:

- load a list of documents
- display a few meaningful fields
- provide a refresh control

### 3. Type the Module A data flow

Use TypeScript for:

- Firestore document shape
- parsed module item shape
- component props
- service/helper functions

Avoid `any`.

### 4. Handle read states clearly

Provide visible states for:

- loading
- empty collection
- read failure
- permission denied

Do not silently ignore Firestore failures.

### 5. Add targeted tests

Cover the Module A UI behavior with tests for:

- successful list render
- empty state
- readable error messaging
- refresh behavior

## Constraints

- Reuse the existing access and dashboard infrastructure
- Use real Firebase SDK calls, not mocked app logic in production code
- Keep the UI compact and pragmatic

## Definition of Done

This chunk is complete when:

- Module A reads real Firestore data
- approved and admin users can access it
- loading, empty, and error states are visible
- the module is typed cleanly
- tests cover the main read behavior
