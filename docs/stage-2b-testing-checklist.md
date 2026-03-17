# Stage 2B Testing Checklist

## Real Accounts

Recommended minimum:

- one real Google admin account
- one real Google approved subscriber account
- one real Google unknown account

Optional:

- one real account with a pending request
- one real account with a denied request

## Local Emulator Workflow

Best use cases for the emulator stack:

- Firestore Security Rules verification
- safe review of seeded `allowedEmails`, `accessRequests`, and `adminUsers` data
- quick regression checks for access-state transitions without touching production data

Commands:

```bash
npm test
npm run test:rules
firebase emulators:start
```

Local notes:

- `npm test` covers the React UI and access-state rendering.
- `npm run test:rules` runs the Firestore rules suite against the Firestore emulator.
- The rules tests seed their own Firestore data, so they are the fastest local way to exercise approval, denial, and revocation behavior.
- Google sign-in still needs real-account smoke testing because emulator auth does not fully replace the production Google provider flow.

## Acceptance Checklist

- Admin login: the seeded admin account signs in and reaches `/app`.
- Approved subscriber login: an email in `allowedEmails` signs in and reaches `/subscriber`.
- Unknown request flow: an unknown signed-in account reaches `/request-access`, submits once, and sees `Access request received`.
- Pending status: the same account is redirected to `/pending` and sees `Your request is pending review`.
- Denied status: a denied account reaches `/denied` and sees `Access has not been granted`.
- Approval path: an admin approves a pending request and the user gains subscriber access on next refresh or sign-in.
- Denial path: an admin denies a pending request and the user lands on the denied screen.
- Revocation path: an admin removes an approved email and the user loses subscriber access on next refresh or sign-in.

## Manual Stage 2B Test Accounts

Suggested collection state:

- `adminUsers/admin@example.com`
- `allowedEmails/member@example.com`
- `accessRequests/pending@example.com`
- `accessRequests/denied@example.com`

Suggested request states:

- `pending@example.com` with `status: "pending"`
- `denied@example.com` with `status: "denied"`
