# Pahincho Admin

Internal admin dashboard: signups, items posted, and open claims (disputed/escalated
penalties & requests). Reads Firestore in the **pahincho-1a4d6** project (the same
backend the React Native app uses) via the Firebase Admin SDK — it does not touch the
RN app's code or its Firestore security rules.

`www.pahincho.com` resolves to `pahincho-web.web.app` — it's a Firebase Hosting site
in the **pahincho-web** GCP/Firebase project (a different project from
`pahincho-1a4d6`, used only for a `feedback` form). This app is served at
`https://www.pahincho.com/admin` via a Firebase Hosting rewrite in
`pahincho-web/firebase.json` that forwards `/admin/**` to this app running as a
**Cloud Run** service in the `pahincho-web` project — while still reading data from
`pahincho-1a4d6` via the Admin SDK. Deploys and releases independently of both the
marketing site and the RN app.

## 1. Local setup

1. Firebase Console → `pahincho-1a4d6` → Project settings → Service accounts →
   **Generate new private key**. Don't reuse `Pahincho1/serviceAccount.json` — this app
   gets its own key so it can be rotated/revoked independently.
2. Firebase Console → Authentication → Sign-in method → enable **Google**.
3. Firebase Console → Authentication → Settings → Authorized domains → add
   `localhost` (already there by default) and, after deploying, `www.pahincho.com`
   and the Cloud Run `*.run.app` URL.
4. Copy `.env.example` to `.env.local` and fill in:
   - `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` from the downloaded service
     account JSON.
   - `ADMIN_EMAILS`: comma-separated allowlist of Google accounts allowed to sign in.
5. `npm install && npm run dev`, then visit `http://localhost:3000/admin` (the app is
   configured with `basePath: "/admin"` so it matches production routing exactly).

## 2. How auth works

- Client signs in with Google via the Firebase client SDK (`/login`).
- The ID token is exchanged server-side for an httpOnly session cookie
  (`/api/auth/session`), after checking the email against `ADMIN_EMAILS`.
- Every dashboard route calls `requireAdmin()` (`src/lib/auth.ts`) which verifies the
  session cookie and redirects to `/login` if missing/invalid/not allowlisted.
- All Firestore reads happen server-side with the Admin SDK (`src/lib/firebaseAdmin.ts`),
  bypassing Firestore rules/App Check by design — access control is entirely the
  `ADMIN_EMAILS` allowlist, so keep it tight and rotate the service account key if it
  ever leaks.

## 3. Deploy to Cloud Run (in the pahincho-web GCP project)

Firebase Hosting rewrites to Cloud Run require the service to live in the *same*
Firebase/GCP project as the Hosting site — that's `pahincho-web`, not `pahincho-1a4d6`.
The app still reads/writes `pahincho-1a4d6`'s Firestore via the Admin SDK regardless of
which project it's deployed in — that's just a service-account credential, not a
deploy-location constraint.

Requires `gcloud` CLI authenticated against the `pahincho-web` GCP project
(`gcloud config set project pahincho-web`). From this repo:

```bash
gcloud run deploy pahincho-admin \
  --source . \
  --project pahincho-web \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=pahincho-1a4d6,ADMIN_EMAILS="you@pahincho.com" \
  --set-secrets FIREBASE_CLIENT_EMAIL=pahincho-admin-client-email:latest,FIREBASE_PRIVATE_KEY=pahincho-admin-private-key:latest
```

(`--allow-unauthenticated` is required so the Hosting rewrite can reach it — this is
safe because every route is still gated by `requireAdmin()`/the `ADMIN_EMAILS`
allowlist at the application layer. Store `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`
in Secret Manager first — `gcloud secrets create pahincho-admin-private-key
--data-file=-` — rather than passing the private key as a plain `--set-env-vars` value.)

This builds the `Dockerfile` in this repo via Cloud Build and deploys it. Re-run the
same command to ship new versions.

## 4. Wire up www.pahincho.com/admin

In the **pahincho-web** repo, add a rewrite to `firebase.json` that forwards `/admin/**`
to the Cloud Run service — before the existing catch-all SPA rewrite (Firebase Hosting
matches rewrites in order, so the more specific one must come first):

```json
{
  "hosting": {
    "public": "build",
    "rewrites": [
      { "source": "/admin/**", "run": { "serviceId": "pahincho-admin", "region": "us-central1" } },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

Then from `pahincho-web`: `firebase deploy --only hosting --project pahincho-web`.
That's the only change needed there — no edits to its React code.

## 5. Extending

Query helpers live in `src/lib/queries.ts` (KPIs, user/item search, claims feed).
Add new collections/fields there rather than querying Firestore directly from pages,
so the admin-only Firestore access stays in one reviewable place.
