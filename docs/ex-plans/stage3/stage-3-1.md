# Stage 3 Dashboard Spec v2
## Codex Execution Plan, Chunk 1 of 4
### Establish the Stage 3 dashboard shell, nested routes, and legacy redirects

This is a derived execution plan reconstructed from the current repository state.

## Context

Stage 2B already provides:

- Firebase Auth integration
- access-state resolution
- protected route foundations
- request, pending, denied, and admin access flows

This chunk starts Stage 3 by introducing a dashboard-oriented application shell without changing the underlying role model.

## Objectives

Implement only the following:

### 1. Add the Stage 3 dashboard route structure

Create or wire the primary Stage 3 routes:

- `/dashboard`
- `/admin`
- `/module-a`
- `/module-b`

Use nested routing so authenticated dashboard users share a common layout.

### 2. Add a shared dashboard layout

Build a simple layout that includes:

- top bar
- account summary
- sign-out control
- left-side navigation
- main content outlet

Keep the UI intentionally simple and compatible with the existing app styling.

### 3. Preserve access-state routing outside the dashboard

Retain the existing access-state pages and route handling for:

- `/request-access`
- `/pending`
- `/denied`

Do not weaken the current authenticated flow.

### 4. Redirect legacy Stage 2B entry routes

Map the old role-specific entry points into the new dashboard structure:

- `/app`
- `/app/admin`
- `/subscriber`

Use redirects so older URLs continue to function during the Stage 3 transition.

### 5. Add a minimal dashboard landing page

Provide a basic dashboard page so the new layout and nested routing are functional before modules are implemented.

## Constraints

- Reuse the existing `ProtectedRoute` and auth context model
- Keep access control server-authoritative through current Firestore-backed resolution
- Do not add new role types
- Avoid large UI refactors

## Definition of Done

This chunk is complete when:

- authenticated approved and admin users can reach `/dashboard`
- legacy routes redirect into the new dashboard routes
- the dashboard layout renders consistently
- request, pending, and denied flows still work
- the app builds and routes cleanly
