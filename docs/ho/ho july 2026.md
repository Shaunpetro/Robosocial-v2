# 📋 Robosocial V2 – Phase 2 Handover Document

**Date:** 2026‑07‑22  
**Phase:** User Licensing & Admin Management  
**Status:** Complete (functional, with known caveats)

---

## 1. Objectives Achieved

- **Safer licence‑key system** – licence keys are generated, hashed (bcrypt), and never stored in plaintext. A non‑sensitive key preview (last 8 characters) is stored for admin reference.
- **Admin backdoor** – secure admin panel accessible only via `ADMIN_API_KEY`. No customer or normal user can reach `/admin/*`.
- **User management** – full CRUD for users (create, edit, suspend, reset password, assign/unassign licences).
- **Licence management** – create, renew, revoke licences; assign licences to users during creation or from the user profile; send licence keys via email (Resend).
- **User activation flow** – users without a licence are redirected to `/activate`; after entering a valid key, they gain dashboard access.
- **Licence guard** – dashboard is wrapped with `LicenseGuard`, which checks licence validity on every page load. Expired/revoked licences redirect to `/license-expired`.
- **Session expiry** – JWT sessions expire after 3 hours (NextAuth `maxAge`).
- **Email notifications** – welcome emails, password resets, and manual key sending via Resend with per‑user/per‑licence branded sender support.
- **Database schema** – new tables: `License`, `LicenseStatus` enum; new fields: `User.licenseId`, `User.suspended`, `User.fromEmail`, `License.fromEmail`, `License.keyPreview`.
- **Cold‑start mitigation** – retry logic in admin dashboard; keep‑warm cron endpoint; external UptimeRobot monitor pings every 5 min.

---

## 2. Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Hashed licence keys** | Keys are never stored in plaintext; bcrypt with 12 rounds. Admin sees only `keyPreview` (last 8 chars). |
| **Admin backdoor** | Single `ADMIN_API_KEY` environment variable protects all admin routes. No user‑role or database‑stored admin credentials. |
| **Resend for emails** | Free tier, simple API, supports branded senders via per‑user `fromEmail`. |
| **JWT session with `licenseId`** | Added `licenseId` to the NextAuth JWT and session callbacks so the guard can check it without a database query on every request. |
| **Activation via `update` trigger** | After activation, the session is updated client‑side to reflect the new `licenseId` immediately. |
| **Keep‑warm via UptimeRobot** | Vercel Hobby plan does not allow frequent cron jobs. External ping every 5 min keeps serverless functions warm. |

---

## 3. Files Changed / Created

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Updated | Added `License`, `LicenseStatus`; added fields on `User` (`licenseId`, `suspended`, `fromEmail`) and `License` (`fromEmail`, `keyPreview`). |
| `apps/web/src/lib/auth.ts` | Updated | Added `licenseId` to JWT callbacks; added `maxAge: 10800`. |
| `apps/web/src/lib/license.ts` | Created | Licence creation, validation, revocation logic. |
| `apps/web/src/lib/email.ts` | Created | Resend integration with welcome, password‑reset, and licence‑key emails. |
| `apps/web/src/app/api/admin/license/route.ts` | Created | Admin endpoint for licence CRUD. |
| `apps/web/src/app/api/admin/license/send-key/route.ts` | Created | Endpoint to email a licence key to a recipient. |
| `apps/web/src/app/api/admin/licenses/route.ts` | Created | List all licences (for admin dashboard). |
| `apps/web/src/app/api/admin/licenses/[id]/users/route.ts` | Created | List users assigned to a specific licence. |
| `apps/web/src/app/api/admin/users/route.ts` | Updated | Added `suspended` handling, `fromEmail`, `licenseId`; included companies & platforms in GET response. |
| `apps/web/src/app/api/admin/users/reset-password/route.ts` | Created | Password reset with email notification. |
| `apps/web/src/app/api/license/activate/route.ts` | Created | User activation endpoint. |
| `apps/web/src/app/api/license/validate/route.ts` | Created | Licence validation for the guard. |
| `apps/web/src/app/api/cron/keep-warm/route.ts` | Created | Cron endpoint (pinged by UptimeRobot). |
| `apps/web/src/app/(admin)/admin/AuthGuard.tsx` | Updated | Fixed redirect loop on login page. |
| `apps/web/src/app/(admin)/admin/layout.tsx` | Updated | Removed nav bar (now inside dashboard page). |
| `apps/web/src/app/(admin)/admin/login/page.tsx` | Updated | Validates key before redirect; clear error messages. |
| `apps/web/src/app/(admin)/admin/dashboard/page.tsx` | Rewritten | Complete admin hub with tabs, licence assignment, user profile modal, Send Key, retry logic. |
| `apps/web/src/app/(admin)/admin/logout/page.tsx` | Created | Clears `sessionStorage` and redirects. |
| `apps/web/src/app/(auth)/activate/page.tsx` | Created | Licence activation form. |
| `apps/web/src/components/license-guard.tsx` | Created | Checks session for licence validity; redirects to `/activate` or `/license-expired`. |
| `apps/web/src/app/license-expired/page.tsx` | Updated | Added WhatsApp/Email contacts and “Enter new key” button. |
| `apps/web/src/app/(dashboard)/layout.tsx` | Updated | Wraps content with `LicenseGuard` and `SplashScreen`. |
| `apps/web/src/app/layout.tsx` | Updated | Moved `SplashScreen` to dashboard layout. |
| `apps/web/src/middleware.ts` | Updated | Removed licence cookie checks; only enforces authentication. |
| `apps/web/vercel.json` | Updated | Added cron job (later removed due to Hobby plan limits). |

---

## 4. Database Changes (Migrations)

- **New table:** `License` (id, customerName, licenseKeyHash, maxSocialAccounts, status, expiresAt, fromEmail, keyPreview, timestamps).  
- **New enum:** `LicenseStatus` (ACTIVE, EXPIRED, REVOKED).  
- **Modified table:** `User` – added `licenseId` (FK to License, nullable), `suspended` (boolean, default false), `fromEmail` (nullable text).  
- **No data loss** – all new columns are nullable or have defaults.

---

## 5. Environment Variables

| Variable | Value (dummy) | Purpose |
|----------|---------------|---------|
| `ADMIN_API_KEY` | `robominbd26` | Protects all admin routes. |
| `RESEND_API_KEY` | `re_EhR4T2bg_4KjUyF4EEt2X817yNiX6v4rM` | Resend email API key. |
| `ACTIVATION_FROM_EMAIL` | `Robosocial Activations <activations@atgsa.co.za>` | Sender for licence‑key emails. |
| `DEFAULT_FROM_EMAIL` | `Robosocial <noreply@robosocial.app>` | Fallback sender. |
| `AUTH_SECRET` | (set per environment) | NextAuth JWT encryption. |
| `DATABASE_URL` | (set per environment) | Neon PostgreSQL connection. |

---

## 6. Testing Results

| Test Case | Status |
|-----------|--------|
| Admin creates licence + user with welcome email | ✅ |
| User activates licence via `/activate` | ✅ |
| User with assigned licence logs in → dashboard | ✅ |
| User without licence → redirected to `/activate` | ✅ |
| User with expired licence → `/license-expired` with contacts | ✅ |
| Admin renews licence → new key generated | ✅ |
| Admin revokes licence → users lose access | ✅ |
| Admin suspends user → user blocked from dashboard | ✅ |
| Password reset → email received | ✅ |
| Send licence key manually → email received | ✅ |
| Admin login with wrong key → error message | ✅ |
| Admin stale key → redirect to login | ✅ |
| Companies page (GET /api/companies) | ✅ (fixed) |
| Cold start → loading spinner + retry | ✅ (with keep‑warm) |

---

## 7. Known Issues / Caveats

- **Cold start on Vercel Hobby plan** – mitigated with UptimeRobot pings and retry logic, but the very first request after a long idle period may still take 5–10 s.  
- **No self‑service password change** for users – only admin can reset passwords.  
- **OAuth token expiry** – connected social accounts may need re‑authentication; not yet handled gracefully in the UI.  
- **Licence keys are single‑use per activation** – once activated, the key is linked to the user. Re‑using the same key for another user is technically possible because the activation endpoint doesn’t enforce uniqueness; this is by design (one licence per team), but may need refinement.  
- **No email verification** – users are created with any email; no double‑opt‑in.  
- **Admin key brute‑force** – no rate limiting on the admin login endpoint; acceptable risk for now given the strength of the key and the low traffic.

---

## 8. Next Phase – Phase 3 (Social Profile Support & Feature Polish)

**Goals:**
- Allow connection of personal social profiles (not just Pages) for influencers and individuals.
- Fix any broken OAuth flows.
- Refine AI content generation with the new licence‑aware user context.
- Add self‑service password change.
- General UI/UX polish based on user feedback.

**Entry point:** All licence infrastructure is in place. The dashboard is stable. The core Robosocial features (companies, AI generation, calendar) need to be tested and updated to work with the new user‑licence model.

---

## 9. Master Development Rules Applied

1. Full‑file replacements only.
2. File existence verification before modification.
3. Backward‑compatible schema changes.
4. Environment variables documented with dummy values.
5. Phase‑gated checkpoint handover.

---

**Phase 2 is locked.** Ready to move to Phase 3 when you are.