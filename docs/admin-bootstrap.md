# Admin Bootstrap

Stage 2B uses Firestore as the trusted source for first-admin access.

## Production Or Fresh Firebase Project

Use this one-time manual seed in Firestore before the first admin signs in to the app:

1. Open Firebase Console for the target project.
2. Open `Firestore Database`.
3. Create the `adminUsers` collection if it does not exist.
4. Create a document whose ID is the normalized admin email.

Document ID example:

```text
admin@example.com
```

Document fields:

```json
{
  "uid": "replace-after-first-sign-in",
  "email": "admin@example.com",
  "normalizedEmail": "admin@example.com",
  "role": "admin",
  "createdAt": null
}
```

Rules for this seed step:

- Normalize the email by trimming whitespace and converting it to lowercase.
- Use the exact same normalized email for both the document ID and `normalizedEmail`.
- The bootstrap path does not use the normal access-request flow.
- This seed must be performed by a trusted operator in Firebase Console.

## After First Sign-In

After the admin signs in with Google for the first time, update the same `adminUsers/{normalizedEmail}` document and replace `uid` with the real Firebase Auth UID for that account.

This keeps the record aligned with the signed-in administrator identity for future auditing.

## Emulator Use

For local Firestore rules tests, admin records are seeded automatically inside the test suite with rules disabled. No manual emulator bootstrap is required for `npm run test:rules`.

If you want to inspect the local stack manually:

1. Set `VITE_USE_FIREBASE_EMULATORS=true` in `.env`.
2. Run `firebase emulators:start`.
3. Open the Emulator UI and inspect the `adminUsers`, `allowedEmails`, and `accessRequests` collections.

## Fresh-Clone Repeatability

Repeat these steps for every new Firebase project:

1. Configure Firebase Auth and Firestore.
2. Deploy the included Firestore rules.
3. Seed `adminUsers/{normalizedEmail}` in Firestore Console.
4. Sign in with that Google account.
5. Replace the placeholder `uid` with the real Auth UID.
