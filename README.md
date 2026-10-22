# Society Finance App v2 — Offline-first, 4-tier RBAC, GitHub + Firebase

This supersedes the earlier plain-HTML template. Same two core modules
(Deposit/Installment, Cost/Expense) plus Vouchers/Cheques, Notices, and a
Report-approval workflow — now with a proper 4-tier role system, username +
password login for everyone, offline-first behavior, and a Vite build so it
can be hosted on **Firebase Hosting** (not Netlify — see "Why GitHub + Firebase
only" below) with environment variables injected at build time via GitHub
Actions.

## Why GitHub + Firebase only (no Netlify)

An earlier pass of this project used Netlify for hosting. Netlify and
**Firebase Hosting** do the exact same job (serve the built static site) —
running both was never architecturally necessary, it just followed an
earlier spec that explicitly asked for Netlify. Since the person's other
projects already run on GitHub + Firebase alone, this version drops Netlify:
`firebase.json` now points Firebase Hosting at the Vite build output
(`dist/`), and `firebase init hosting:github` (run once from Cloud Shell —
see `SETUP-BANGLA.md`) sets up a GitHub Actions workflow that auto-builds
and auto-deploys on every push to `main`, the same way Netlify's GitHub
integration did. This isn't a security trade-off either way — if anything,
removing a third service from the trust chain (GitHub Actions runs entirely
within GitHub/Firebase, no third party involved) is a slightly smaller
attack surface than also trusting Netlify with repo access and deploy keys.

## Why these specific architecture choices

- **No Cloud Functions, no Blaze plan required.** Roles live as a field on a
  Firestore document (`users/{uid}.role`), not as Firebase Auth custom
  claims — `firestore.rules` reads that field with `get()` instead of
  `request.auth.token.role`. This is a standard, fully-supported RBAC
  pattern for client-only Firebase apps and keeps the whole project on the
  free Spark plan.
- **Offline-first = Firestore's own IndexedDB persistence**, not a
  hand-rolled sync engine. `src/firebase.js` turns on
  `persistentLocalCache` — every document a user's role is allowed to query
  gets cached locally automatically, writes queue while offline and flush
  when back online. Because `firestore.rules` already scopes every query by
  role, the local cache is naturally "selective" per person — a member's
  browser never even downloads other members' deposits, an admin without
  the `vouchers` module never downloads voucher data. No custom filtering
  code needed on top.
- **Service Worker (`public/sw.js`) caches the app shell** (HTML/CSS/JS)
  only — so the UI itself opens instantly with zero network. Data offline
  support is Firestore's job (above); the service worker's job is just
  "the app loads at all" when there's no signal.
- **A known, honest trade-off:** Firebase's client SDK can never create,
  delete, or force-reset another user's Auth account — this is by design
  (Admin SDK = server-side only). So:
  - creating accounts uses a **secondary Firebase App instance** trick
    (`src/firebase.js` → `secondaryAuth`) so the admin/director's own
    session isn't disturbed — this works fully client-side.
  - "removing access" = **deactivating** (`users/{uid}.active = false`),
    not deleting the Auth login. The person can never log in again (every
    page checks `active` on load), but the empty Auth account stays on
    Firebase's side.
  - password reset = **self-service email link** (`sendPasswordResetEmail`),
    not an admin typing a new password directly.
  - If you ever want true force-delete/force-reset, that needs one small
    Cloud Function + the Blaze plan — everything else here stays unchanged.

## Roles

| Role | Count | Notes |
|---|---|---|
| **Super Admin** | 1 | Hidden — lives at `config/superAdmin`, never appears in the Users list (a separate collection, not a flag on a visible one). Full control: app expiry date, create/deactivate anyone, all modules. |
| **Director** | 1–2 | Everything an Admin can do, plus: create/deactivate Admin & Member accounts, assign/remove an Admin's module access, approve/reject reports before members see them. |
| **Admin** | 2–5 | Scoped to whichever modules (`deposits`, `costs`, `vouchers`, `notices`, `reports`, `messages`) the Director assigned — both the sidebar menu and `firestore.rules` enforce this. |
| **Member** | 25–30 | Own email+password login. Read-only: their own deposit/due summary, published notices, approved reports. Can send messages. Cannot write any data. |

## Firestore schema

```
config/superAdmin      { uid, name, email }            // hidden, see above
config/org             { name, tagline, address, currency }
config/appMeta          { expiryDate }
config/costPerShare    { value }                        // published by staff so members can compute their own due

users/{uid}             // uid == the person's real Firebase Auth uid
  role: 'director' | 'admin' | 'member'
  name, email, mobile, active
  modules: ['deposits', 'costs', ...]      // admin only
  slno, idNo, totalShare                   // member only

deposits/{id}   { memberId(=uid), date, installmentStep, paymentMethod, amount, fine, remarks, enteredBy, createdAt }
costs/{id}      { date, item, beneficiary, paymentMethod, chequeNo, chalanNo, amount, remarks, enteredBy, createdAt }
vouchers/{id}   { voucherNo, date, description, amount, chequeNo, remarks, enteredBy, createdAt }
cheques/{id}    { chequeNo, date, amount, voucherNo, enteredBy, createdAt }
notices/{id}    { title, body, audience: 'all'|'members'|'admins', status: 'draft'|'published', createdBy, createdAt }
reports/{id}    { type, title, summary, status: 'pending-approval'|'approved'|'rejected', preparedBy, createdAt }
messages/{id}   { fromUid, fromName, text, status, replies: [...], createdAt }
```

## What's included

- `firestore.rules` — full 4-tier rules, module-scoped admin permissions,
  hidden super admin
- `src/firebase.js` / `src/auth.js` — offline persistence, secondary-app
  account creation, role resolution, password-reset email
- `src/ui-shell.js` — sidebar filtered by role AND module assignment, plus
  a live online/offline indicator
- Modules: dashboard, deposits, costs, vouchers, users (account
  management), notices, reports-approval, messages, backup, settings
- `src/print.js` — A4 PDF statements/reports/vouchers (jsPDF+autotable) and
  80mm thermal receipt printing (browser print dialog)
- `public/sw.js` + `public/manifest.json` — installable, offline-capable
  PWA shell (placeholder icons included — swap `public/icons/*.png` for
  your own logo whenever you like)
- `.env.example`, `.gitignore`, `netlify.toml` — see `SETUP-BANGLA.md` for
  the full deploy walkthrough

## v2.1 additions

- **Smooth SPA navigation** — the admin sidebar mounts once; clicking a nav
  item swaps only the content area (`history.pushState`/`popstate`), no
  more full-page reload/flicker on every click.
- **Bilingual UI (বাংলা/English)** — a language toggle in the sidebar and on
  the login/member pages (`src/i18n.js`). Fully toggle-driven on the shell,
  login page, and member page; other module pages show both languages
  together on their main labels rather than full toggle-switching.
- **Single source of truth for org info** (`src/org-store.js`) — Settings
  changes (name, address, currency, **logo**) now propagate to the sidebar,
  login page, member page, and every PDF/receipt generated afterward in the
  same session, instead of only updating Firestore silently.
- **Organization logo** — upload in Settings (auto-resized/compressed
  client-side, stored directly in `config/org` as a data URL — no Firebase
  Storage bucket needed for something this small). Shows in the sidebar,
  login page, member page, PDF letterheads, and thermal receipts.
- **Autocomplete on entry forms** (`fillDatalist()` in `src/utils.js`) —
  Deposits "Details"/remarks, Costs beneficiary/remarks, Vouchers
  description/remarks all suggest previously typed values as you type, with
  zero extra Firestore reads (built from data already loaded on the page).
  The Deposits "Details" field is now free text (not a fixed 1st/2nd/3rd
  dropdown) since the society's real usage includes partial/irregular
  installment labels.
- **Generated reports module** (`src/modules/statements.js`, nav: "রিপোর্ট
  জেনারেট"/"Generate Reports", gated by the `reports` module flag) — four
  report types matching the original spreadsheet app's printouts, each with
  an A4 PDF download:
  - **Deposit Summary** — per-shareholder totals (amount/fine/total) over a
    date range, with a grand-total row
  - **Individual Deposit Statement** — one member's full deposit history
    (Date/Slno/Details/Amount/Fine/Total/Remarks)
  - **Shareholders List** — slno/Name/ID/Mobile/Total Share/Total
    Deposit/Total Due, with totals row
  - **Item-wise Summary** — costs grouped by item over a date range, with
    grand total
  - `firestore.rules` was updated so an admin with only the `reports`
    module gets **read-only** access to `deposits`/`costs`/the member list
    (needed to generate these), without needing the `deposits`/`costs`
    modules themselves.

## What's NOT fully built yet (be aware before you rely on this in production)

- This was written and syntax-checked (`node --check` on every file, JSON
  validated, HTML tag-balance checked) but **never run against a live
  Firebase project** — this environment has no network access. Expect to
  fix a handful of small issues on first real deploy; none of the
  architecture choices above should need to change, but a typo or an
  off-by-one in a query is possible. Tell me what breaks and I'll fix it.
- True force-password-reset / force-delete-account (see trade-off above)
- Editing the deposit/cost-item/installment lists from the UI (still
  hardcoded in `src/modules/deposits.js` / `costs.js` — same as v1)
- Full per-string language-toggle coverage inside Deposits/Costs/Vouchers/
  Users/Notices/Reports/Backup/Messages — their headers, buttons, and field
  labels ARE translated (see v2.1 above), but a few deeper strings (some
  toasts, placeholders) still default to Bengali regardless of the toggle
- An audit/edit-history log
- Migrating your original Darul Barakah spreadsheet data into this schema
