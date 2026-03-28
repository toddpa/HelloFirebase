# Stage 3 Operations Workspace — Functional Specification

## 1. Purpose and Scope

The Stage 3 dashboard is a Firebase-backed operations workspace where authenticated users can:

- sign in with Google,
- be routed by access state (`admin`, `approved`, `pending`, `denied`, `unknown`),
- create and manage private notes (draft and published),
- and, for administrators, manage subscriber access via an allow-list and request review workflow.

This specification is derived from the implemented React/Firebase code and validated against the supplied UI screenshots.

---

## 2. User Roles and Access States

The application resolves one of five access states:

- `admin`
- `approved`
- `pending`
- `denied`
- `unknown`

### 2.1 Access-state meaning

- **admin**: full dashboard access, including Access Control tools.
- **approved**: dashboard and notes access, no Access Control tools.
- **pending**: restricted to pending-status page.
- **denied**: restricted to denied-status page.
- **unknown**: prompted to submit an access request.

### 2.2 Access resolution rules

After authentication, the app resolves access by normalized email:

1. If admin marker is readable in `adminUsers/{normalizedEmail}` → `admin`.
2. Else if protected subscriber probe is readable (`subscriberContent/access-probe`) → `approved`.
3. Else if access request exists and status is `denied` → `denied`.
4. Else if access request exists with non-denied status → `pending`.
5. Else → `unknown`.

---

## 3. Authentication and Session Behavior

### 3.1 Sign-in and persistence

- Auth provider initializes by resolving redirect result, auth state, and then access state.
- Firebase auth persistence is set to browser local persistence.
- Sign-in method is environment-aware:
  - popup on localhost/127.0.0.1/Codespaces/Firebase Hosting-style domains,
  - redirect elsewhere.

### 3.2 Sign-out

- Sign-out is available in the dashboard header and status/request pages.
- Sign-out clears active session and returns users through the default route flow.

### 3.3 Error handling

- Firebase auth/configuration and unauthorized-domain errors are surfaced with user-friendly messaging.
- Access and write permission failures are translated into context-specific messages in each feature area.

---

## 4. Routing and Navigation Specification

## 4.1 Public and state-routed entry

- `/`:
  - unauthenticated → Sign-in view,
  - authenticated + resolved state → redirect to state-specific route,
  - unresolved state → resolving view.

## 4.2 Protected state routes

- `unknown` only: `/request-access`
- `pending` only: `/pending`
- `denied` only: `/denied`
- `approved` or `admin`:
  - `/dashboard`
  - `/notes/drafts`
  - `/notes/published`
  - `/notes/new`
  - `/notes/:noteId`
- `admin` only:
  - `/admin`

Unauthorized admin attempts route back to `/dashboard` and display an “unauthorized” context message.

## 4.3 Legacy route redirects

Legacy paths (`/app`, `/app/admin`, `/subscriber`) redirect into modern equivalents.

## 4.4 Navigation model in dashboard layout

Left sidebar is role-aware and consists of:

- Main navigation links (Dashboard, Access Control when eligible),
- Notes group:
  - Notes parent link,
  - **Create New** action,
  - Drafts and Published child links.

Active route highlighting supports exact matches and configured path-prefix matching.

---

## 5. Functional Areas

## 5.1 Dashboard summary page (`/dashboard`)

Displays:

- signed-in summary card with Role and Email,
- Notes workspace section with CTA links:
  - Open Notes,
  - View drafts,
  - View published,
  - Create note.

## 5.2 Notes workspace

### 5.2.1 Draft and published list views

- Path-driven mode:
  - `/notes/drafts` → Draft notes
  - `/notes/published` → Published notes
- Data source: current user’s private notes (`visibility=private`) filtered by status.
- Notes are rendered as cards with title, updated timestamp, and truncated body preview.
- Empty states and loading text are status-specific.

### 5.2.2 Note editor (create/edit)

Supports:

- create mode (`/notes/new`),
- edit mode (`/notes/:noteId`).

Editor capabilities:

- fields: Title, Body,
- primary and secondary actions to save/publish or move between draft/published states,
- cancel navigation back to list context,
- deletion flow in edit mode with explicit two-step confirmation.

Validation behavior:

- “complete” validation requires title + body,
- “partial” validation requires either title or body.

Operational constraints:

- edit mode requires note ownership and private visibility; otherwise an access/not-found error is shown,
- create/edit operations always write private notes in this workspace.

## 5.3 Access control admin page (`/admin`)

Admin-only capabilities:

- refresh access data,
- add approved subscriber email (normalized + validated),
- remove approved email entries,
- review pending access requests with Approve/Deny actions,
- view feedback and error states.

Data sections:

1. **Approved subscriber emails** table
   - columns: Email, Role, Created At, Actions.
2. **Pending access requests** table
   - columns: Email, Status, Requested At, Actions.

Action controls are select-based menus per row.

## 5.4 Request/pending/denied flows

- **Request access** (`/request-access`): shows signed-in email, submit request action, and cancel/sign-out.
- **Pending** (`/pending`): informational state page with sign-out.
- **Denied** (`/denied`): informational denial page (optionally includes attempted route context) with sign-out.

---

## 6. Data and Domain Rules

### 6.1 Access-control collections

Firestore collections used:

- `allowedEmails/{normalizedEmail}`
- `accessRequests/{normalizedEmail}`
- `adminUsers/{normalizedEmail}`

### 6.2 Access request rules

- A request cannot be re-submitted when an existing record is:
  - pending,
  - denied,
  - or already approved.

### 6.3 Admin review side effects

- Reviewing a request updates request status + review metadata.
- Approving also upserts into the allowed-email collection.

---

## 7. Non-Functional and UX Behavior

- Resilient async handling with loading and inline feedback states.
- Guarded routing ensures users only see routes allowed for current access state.
- Clear user-facing error translation for common permission and auth failures.
- Consistent panel-based visual structure across dashboard pages.

---

## Appendix A — Look and Feel (UI Controls and Interaction Style)

Based on the supplied screenshots and CSS/component structure, the app uses a soft enterprise dashboard aesthetic with high readability:

### A.1 Layout and visual system

- Large rounded rectangular panels for major regions (header, sidebar, content blocks).
- Ample whitespace and low-contrast neutral backgrounds.
- Muted green/teal accent palette with dark navy emphasis for active states.
- Strong typographic hierarchy:
  - small uppercase eyebrow labels,
  - bold page/section headings,
  - subdued metadata text.

### A.2 Navigation controls

- Left vertical sidebar with grouped navigation.
- Pill-like nav items with:
  - default light background,
  - dark highlighted active state.
- Nested sub-navigation for Notes (`Drafts`, `Published`).

### A.3 Action controls

- Primary CTAs are rounded, filled buttons (e.g., “Create New”).
- Secondary CTAs are outlined/neutral rounded buttons (e.g., “Sign out”, “Refresh”, link-styled secondary actions).
- Contextual destructive flow uses explicit “Delete” then “Confirm Delete / Cancel Delete”.

### A.4 Data-entry controls

- Standard text/email inputs with large rounded corners.
- Multiline textarea for note body.
- Select dropdowns for row actions in admin tables.

### A.5 Data-display controls

- Card-style note records with title, timestamp, and preview body.
- Tabular management views for access administration.
- Status-pill chips for role/status emphasis (e.g., “Administrator”).
- Empty-state components for no-data scenarios.

### A.6 Feedback and state indicators

- Inline success text for completed actions.
- Inline error messaging (alert semantics in several views).
- Loading text in place of lists/tables while data resolves.
- Unauthorized fallback messaging when redirected from restricted routes.

