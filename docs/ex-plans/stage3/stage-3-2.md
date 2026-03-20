# Stage 3 Dashboard Spec v2
## Codex Execution Plan, Chunk 2 of 4
### Make the dashboard role-aware through centralized route config and navigation visibility

This is a derived execution plan reconstructed from the current repository state.

## Context

Chunk 1 created the dashboard shell and nested routing. This chunk makes the dashboard genuinely role-aware by centralizing route metadata and ensuring only the correct destinations appear for each access state.

## Objectives

Implement only the following:

### 1. Centralize dashboard route definitions

Create a route configuration layer that defines, for each dashboard destination:

- route path
- label
- allowed access states

Use it as the source of truth for navigation and route guarding.

### 2. Filter dashboard navigation by role

Update the dashboard sidebar so:

- approved users see only the routes they can access
- admins see all admin-capable routes
- unknown, pending, and denied users do not enter the dashboard shell

### 3. Apply route-specific authorization inside the dashboard

Use nested route guards so that:

- `/dashboard` is available to approved and admin users
- `/admin` is restricted to admins
- `/module-a` is available to approved and admin users
- `/module-b` is reserved for admins, even if it is only a placeholder for now

### 4. Improve unauthorized redirect behavior

When a signed-in user attempts a restricted dashboard route:

- redirect them to the appropriate safe page
- preserve enough route context to show a readable message

Keep this lightweight and consistent with the existing access flow.

### 5. Add tests for role-aware route behavior

Extend the app/router tests to cover:

- approved user dashboard nav
- admin dashboard nav
- direct URL access to restricted dashboard routes
- legacy route redirects

## Constraints

- Reuse the Stage 2B access-state model as-is
- Do not duplicate authorization logic in multiple places unnecessarily
- Keep labels and route naming consistent

## Definition of Done

This chunk is complete when:

- route definitions are centralized
- nav visibility matches role access
- admin-only routes are hidden from approved users
- unauthorized direct URL access redirects cleanly
- routing tests cover the new role-aware behavior
