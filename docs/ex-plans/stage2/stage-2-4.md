# Stage 2B Access Control Spec
## Codex Execution Plan, Chunk 4 of 4
### Lock down Firestore rules, add emulator coverage, and document the Stage 2B bootstrap path

This is a derived execution plan reconstructed from the current repository state.

## Context

The Stage 2B app flow now exists in the UI. This final chunk makes the security model real by enforcing it in Firestore rules and documenting how a fresh Firebase project reaches a usable first-admin state.

## Objectives

Implement only the following:

### 1. Add Firestore Security Rules for Stage 2B collections

Write rules for:

- `allowedEmails`
- `accessRequests`
- `adminUsers`

Enforce normalized-email document ownership where appropriate and keep write permissions tightly constrained.

### 2. Protect subscriber data behind access checks

Add or preserve a protected collection gate so only:

- approved users
- admins

can read subscriber content, while writes remain restricted to admins.

This access probe will also support the frontend access-state resolution logic.

### 3. Add Firestore rules tests using the emulator

Create emulator-based coverage for scenarios such as:

- admin access to allow-list data
- blocked subscriber writes to admin-only collections
- normal users creating only their own access request
- denied and pending users being blocked from protected subscriber data
- revocation behavior after allow-list removal

### 4. Document the bootstrap and test workflow

Add project docs that explain:

- required Firebase console setup
- `.env` setup
- first-admin bootstrap via `adminUsers/{normalizedEmail}`
- emulator workflow
- Stage 2B testing checklist
- sign-off expectations

### 5. Final Stage 2B tidy-up

Make pragmatic cleanup improvements across:

- naming consistency
- error copy
- test organization
- setup instructions

Keep this constrained to Stage 2B coherence.

## Constraints

- Do not weaken security rules to accommodate the UI
- Use the emulator for rules verification
- Keep the bootstrap path explicit and operator-driven

## Definition of Done

This chunk is complete when:

- Firestore rules enforce the Stage 2B authorization model
- the rules test suite passes locally
- the README and supporting docs explain setup and bootstrap clearly
- the app can be brought from a fresh Firebase project to a working Stage 2B baseline
- typecheck, tests, rules tests, and build all pass
