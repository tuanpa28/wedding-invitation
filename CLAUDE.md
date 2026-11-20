# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md — this is Next.js 16 with breaking changes; read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

## What this is

"Thiệp Hồng": an online wedding invitation for **one** wedding, Vietnamese-language throughout (UI text, code comments, README, `docs/PLAN.md`). Keep new UI strings and comments in Vietnamese. It runs entirely on Firebase's free Spark plan, which drives most of the architecture: **there is no server**. Next.js is built as a static export (`output: 'export'` → `out/`), served by Firebase Hosting; all reads/writes go from the browser straight to Firestore, and all authorization lives in `firestore.rules`. `docs/PLAN.md` holds the design rationale and per-phase implementation notes.

## Commands

Requires Node ≥ 22 and Java ≥ 11 (Firebase Emulator).

- `npm run emulators` — Firestore 8085, Auth 9099, Hosting 5005, UI 4000 (project `demo-thiephong`). Emulator data is lost on stop; re-run `npm run seed` after each start.
- `npm run seed` — writes sample wedding, guests (`nam2027`, `cohoa27`) and test admin `admin@thiephong.test` to the emulator. `npm run seed -- --prod` writes admins to the real project via service account.
- `npm run dev` — local dev; uses the emulator when `.env.development.local` contains `NEXT_PUBLIC_FIREBASE_EMULATOR=true` (`.env` holds the real project config used for build/deploy).
- `npm run preview` — static build pointed at the emulator, served on Hosting emulator :5005 (real `/m/**` rewrite). Stop `npm run emulators` first.
- `npm run check` — typecheck + lint + format:check + test + test:rules. Run before committing.
- `npm test` — Vitest unit tests in `tests/` (excludes `tests/rules/`). Single file: `npx vitest run tests/guests.test.ts`; single test: add `-t "name"`.
- `npm run test:rules` — `tests/rules/**` against the Firestore emulator (started/stopped automatically, uses `vitest.rules.config.mts`).
- `npm run test:e2e` — builds against the emulator, then runs Playwright in `e2e/` inside `firebase emulators:exec` (~4 min, desktop + mobile projects on installed Microsoft Edge, serial). Stop any running emulator first. Tests reset data themselves (`resetData()` in `e2e/helpers.ts` wipes the Firestore emulator and re-runs the seed script). To iterate on one spec: keep `npm run preview` running, then `npx playwright test e2e/guest.spec.ts --project=desktop`.
- `npm run deploy` — `npm run build` (clears `.next/cache/fetch-cache` first, otherwise Next reuses the Firestore response from a previous build and embeds stale content) + deploy Hosting and Firestore rules. Indexes are deployed separately with `npx firebase deploy --only firestore:indexes` (re-deploying an existing index makes the CLI fail with HTTP 409).

`.claude/launch.json` defines `thiephong-dev` (3000), `thiephong-emulators` (preview, 5005) and `thiephong-firebase-only` (4000).

## Architecture

**Routes** (`src/app/`):

- `/` — general link: shows only the "both sides" event; with none, the invitation renders without date/countdown/event card (`TemplateProps.featured` is optional, templates must guard it). Events are only ever "Lễ Thành Hôn" (`type: 'thanh_hon'`), at most one per side (groom / bride / both), so at most 3 — enforced in `eventsSchema` and `firestore.rules`.
- `/m/<code>` — personal guest link. The static page is `m.html`; Firebase Hosting rewrites `/m/**` → `/m.html` (`firebase.json`), and `next.config.ts` adds the equivalent rewrite only in dev. The page reads the code from the URL client-side. Guests see only their own side's event (not the shared one).
- `/admin` — Google sign-in; access is determined by attempting to read `site/admins` (only admins can, per rules).

**Firestore data model**: `site/wedding` (entire invitation content, one doc so a page view costs 1–2 reads), `site/admins` (`{emails}`), `guests/{code}` (guest can `get` own code only, may only bump `openCount`/open timestamps), `rsvps/{id}` (id = guest code for personal links; guests can create/update but not read), `wishes/{id}` (public read of non-hidden). Any data shape change must be mirrored in `firestore.rules` (which validates field shapes/limits) and covered in `tests/rules/`.

**Two Firebase client bundles, kept separate on purpose** (`src/lib/firebase/`):

- `public-data.ts` uses **Firestore Lite** (no realtime) for the guest page.
- `full-db.ts` / `wishes-live.ts` load full Firestore lazily only when the guest reaches the guestbook.
- `admin-client.ts` (Auth + full Firestore) must only be imported from admin code so the guest bundle stays small.
- `config.ts` handles emulator switching via `NEXT_PUBLIC_FIREBASE_EMULATOR`. In emulator mode `window.__thiephongTestSignIn(email)` signs in with a fake Google token (used by E2E).

**Build-time snapshot**: `snapshot.ts` reads `site/wedding` during `next build` and embeds it in the HTML (plus share/OG metadata) so the invitation paints immediately; the browser then re-reads Firestore. If unreachable at build, pages fall back to client fetch. `src/lib/prerender.ts` stamps what was baked in; the admin compares it to current data and prompts to redeploy when template, cover, names or date changed.

**Templates** (`src/templates/`): `song-hy`, `nga`, `hoa-co`. `index.ts` lazy-loads each template (code + fonts only for the active one); `catalog.ts` has metadata for the admin picker without loading template code. Templates receive `TemplateProps` from `buildTemplateProps` in `types.ts` (events already filtered/sorted by guest side, featured event, couple order). Adding a template means updating `TemplateId`, both maps, the catalog and the `templateId` check in `firestore.rules`. Shared invitation pieces (motion primitives in `components/invitation/motion.tsx`, RSVP/wishes/gift sections themed via `--fb-*` CSS vars) live in `src/components/invitation/`. The only query param is `?preview`: opening a guest link with it doesn't count as a guest open (admin links use it). Animations always run: the OS reduced-motion setting is deliberately ignored (`MotionConfig reducedMotion="never"`, no `motion-reduce:` classes).

**Admin** (`src/components/admin/`): tabs editing top-level fields of `site/wedding` via `updateDoc` (`null` → `deleteField()`, first save on a fresh project `setDoc`s the whole doc); unsaved-changes tracking in `dirty.tsx`/`save-bar.tsx`; realtime guests/RSVPs/wishes via `admin-data.tsx` context. Excel import/export runs in the browser. Pure logic for these features lives in `src/lib/` (`guests.ts`, `feedback.ts`, `gifts.ts`, `admin-overview.ts`, `invitation/*`, `validators/`) and is what `tests/` covers.

**Images/media**: Cloudinary unsigned upload preset from the browser; `src/lib/image-loader.ts` is the custom `next/image` loader (Cloudinary URL resizing, `public/` images as-is) since there is no image-optimization server.

## Conventions

- Prettier (`.prettierrc.json`) and ESLint (`eslint-config-next`); `@/` aliases `src/`. UI uses shadcn/ui (`src/components/ui/`, `components.json`) + Tailwind v4.
- Nothing may require a server at runtime: no API routes, server actions, middleware or dynamic rendering — everything must work under `output: 'export'`.
- Never commit `.env`, `.env.development.local` or `service-account.json`.
