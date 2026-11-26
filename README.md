# LeadGen — Lead Generation Intelligence Dashboard (VS Code version, v6 A+ rebuild)

A complete, static version of the Lead Generation Intelligence Dashboard for a UI/UX designer. Full sidebar navigation, every view, premium Light and AMOLED themes — no backend, no build step. Data is saved in your browser (localStorage). **$0 budget: no paid service, no paid API, no card, no paid trial anywhere in this file.**

## How to run (SETUP)

1. Unzip the folder.
2. Double-click `index.html` — it opens in your browser and works. No server needed.
3. Or open the folder in VS Code and use Live Server, or run `python -m http.server 8000` in the folder and open `http://localhost:8000`.
4. Internet is needed for Google Fonts only. Everything else works offline. No data leaves your computer — there is no `fetch`/`XMLHttpRequest` in the code.

## Views (sidebar)

- **Overview** — stat cards (total leads shown, high-intent, drafts ready, leads with email, leads with a website, Facebook businesses), per-source progress against the honest daily target, pipeline funnel (all 8 statuses), leads-per-source and intent-mix bar charts.
- **All Leads** — per-source tab bar (All leads, LinkedIn, Facebook, Upwork, Reddit, X, Indie Hackers, Clutch, Web Search, Google Maps, Drafts to copy — each with live counts), search, status and intent filters, **sort** (newest / name A–Z / match / intent), Export CSV.
- **Companies** — leads grouped by company name. Leads with no company name are grouped under "Unnamed lead (no company)" instead of a blank row.
- **Audits** — website checks you run from any lead with a website (score, problems, fixes, method printed on every check), plus the no-website list and what a check covers.
- **Collection Log** — a real, persisted log. Every import, lead added, business added, website check and export is appended here with its real result.
- **Review Queue** — drafts waiting for you to copy and send, with counts for drafts waiting on an email.
- **Pitch Studio** — the two senior pitch templates (no-website and has-website) **filled in** with a real lead so what you copy never contains literal `{{name}}` placeholders, plus a filled follow-up template with its own copy button, and every draft ready to copy.
- **Job Hub** — Gmail work snapshot as of 25 Nov 2026: 6 follow-up drafts, top 10 unanswered applications, recent job matches, one application reply, repeated alert noise. Read-only; client-outreach reply tracking is OFF. Stat numbers are computed from the snapshot data, not hardcoded.
- **Google Maps — No Website** — businesses verified to have no website in 8 countries (USA, UK, Canada, Australia, Germany, France, Luxembourg, Singapore), with country tabs and an Add Business form.
- **Facebook Businesses** — businesses found on Facebook in the same 8 countries, one tab per country. Each entry shows name, category, city, phone if known, and its real Facebook Page link. Facebook is login-walled, so new businesses are added by you (Add Business form) or CSV import — the static file cannot search Facebook by itself.
- **Guide** — how the dashboard works, step by step, and the rules it follows.
- **Settings** — LinkedIn/Facebook groups, keywords, honest daily target, run time, **Demo mode toggle**, appearance (Light/AMOLED), CSV import, and **editable Pitch Studio settings** (sender name, offer, tone, signature) that are actually used in generated drafts.

## Lead cards — what each one shows

- **Contact** — email with a Copy button, or "Email not found", plus phone.
- **Business & website** — company and industry, plus the real website link when one exists, or "No website — pitch target".
- **Links** — real, working links that open in a new tab: the business website (when it exists), a Google Maps search link, and the source platform link (LinkedIn search, Facebook search, Upwork jobs, Reddit subreddit, X search, and so on). Stored profile links (LinkedIn profile, Facebook, Upwork, Reddit post, X, Behance, Dribbble) appear when a real lead has them — and only when they are on the right platform (a "LinkedIn profile" must be a linkedin.com URL). Where a link is genuinely not known, the lead detail shows "Not available" in plain text — never a fake link.
- **Their problem** — what they want and the problems they face.
- **Email draft** — with Copy draft and Copy follow-up buttons. LinkedIn/Facebook leads show a "Say first" platform message instead of an email draft.
- **Website check** — expand a card to see the score, problems found, and how you can fix them, with a **Run website check** button on leads that have a website. No website means the check honestly says so, with the first-website fix instead.
- **Status pipeline** — New | Contacted | Replied | Qualified | Proposal Sent | Won | Lost | Not Interested, changeable from the card.
- Click a card for the **lead detail modal**: what they want, what they are looking for, problems, urgency & budget, contact, the full Links list, website check, outreach draft, follow-up draft, and notes — all copyable. Press **Escape** or click the backdrop to close.

Copy uses `navigator.clipboard` with a textarea fallback and shows "Copied ✓". **Nothing is sent automatically anywhere** — you copy a draft and send it yourself.

## Links — why they work

- There are **no placeholder URLs anywhere** in these files (verified by grep — zero placeholder example-domain URLs).
- A lead with no website shows "No website" and links to a real Google Maps search URL, which always loads.
- A lead with a website only links it when it is a real `https://` URL with a real hostname. Add Lead and CSV import reject anything else and leave the website blank instead of linking a dead URL.
- Profile links must be on the right platform (linkedin.com for LinkedIn, facebook.com for Facebook, and so on) — a random `https://evil.com` is never rendered as a profile link.
- Facebook Businesses sample pages link to well-known public Facebook pages; a sample business with no real page of its own links to its Facebook search page instead.
- Every link opens in a new tab (`target="_blank"`, `rel="noopener"`).
- If you already opened an older version, your browser's saved copy is cleaned automatically on load: any old placeholder link is dropped. **Honest note:** platform links are search pages (LinkedIn search, Facebook search, Upwork jobs), not the lead's personal profile — unless a real profile URL was stored for that lead. They load as search pages by construction.

## Sample data and Demo mode — read this first

This folder ships with **26 clearly-labelled SAMPLE leads** (10 LinkedIn, 10 Facebook, 3 Upwork, 3 Reddit) so you can test the layout, tabs, and copy buttons, plus **8 SAMPLE Google Maps businesses** (one per country) and **16 SAMPLE Facebook businesses** (two per country).

- They are **fictional demo data, not real people**. Names and companies are made up, and their emails are blank on purpose — the brief forbids guessing emails.
- **Demo mode** (ON by default): sample data is shown, clearly labelled SAMPLE, and **counted separately** from your real leads in every view, count, funnel, and the Review Queue. Turn Demo mode **OFF** (banner button or Settings) to see real data only — sample leads, sample Maps businesses, and sample Facebook businesses are all hidden from every count.
- Click **"Clear sample data"** in the banner to remove **all** sample data — the 26 sample leads, the 8 sample Maps businesses, and the 16 sample Facebook businesses — and the banner hides itself. Real leads you added always stay.
- Sample data is never mixed into production analytics while Demo mode is off. The hosted dashboard version is the one that runs live collection. This static version cannot log into LinkedIn/Facebook.

## ARCHITECTURE

Single static app, no build step, no backend, no framework:

```
index.html                  — layout, sidebar, topbar, banner, modals, Add Lead form
assets/css/style.css        — design system: Light + AMOLED (#000) themes, CSS variables,
                              16px card radius, 8px button radius, responsive breakpoints
                              (900px sidebar slide-in, 480px, 360px)
assets/js/main.js           — everything else, one IIFE:
  · data: SAMPLE leads, MAPS_SAMPLE, FB_SAMPLE, JOB_HUB snapshot, pitch templates
  · storage: localStorage keys leadgen_leads, leadgen_maps, leadgen_fb,
    leadgen_audits, leadgen_log, leadgen_settings, leadgen_theme
  · security: esc() escapes & < > " ' ` at every render site; sanitize() coerces
    every loaded/imported lead into a safe shape; isRealUrl() + isProfileUrl()
    gate every rendered link; parseCSV() is a real quoted-field parser
  · features: visibleLeads()/realLeads() (Demo-mode separation), counts(),
    filteredLeads() + sortLeads(), generateOutreach() (fill() templates),
    runAudit() (local pre-check, stored in leadgen_audits), logEvent()
    (persisted collection log), importCsv()/exportCsv() (full 18-column CSV),
    render() + 12 view functions, copyText() (clipboard + fallback)
README.md                   — this file
```

Data flow: user adds/imports a lead → sanitize() → generateOutreach() writes a complete draft → lead appears in All Leads, Drafts to copy, and Review Queue → status/notes saved per lead → Export CSV backs everything up. Nothing is sent anywhere; there is no network code at all.

## FREE SERVICES (what is free, what is not, and the limits)

Zero budget is a hard rule for this project. Every service below was checked in the Phase 2 free-technology audit (Nov 2026); re-check the vendor page before relying on any number.

| Service | What it does here | Free? | Limits | Card? |
|---|---|---|---|---|
| This static file (double-click / Live Server) | The whole dashboard | Yes, $0 | Browser-only, ~5–10 MB localStorage, one device, no background scheduler | No |
| Cloudflare Pages | Host the static site | Yes, $0 | 500 builds/mo, 20,000 files/site, unlimited static bandwidth | No |
| GitHub Pages | Host the static site | Yes, $0 | Public repo only, 1 GB site, 100 GB/mo bandwidth (soft) | No |
| Gmail API (own mailbox, via Muse connector) | Create drafts | Yes, $0 | 500 sends/day personal Gmail; drafts are a handful a day | No |
| PageSpeed Insights API | Full website audits | Yes, $0, free key | ~25,000 queries/day; public URLs only; each call 15–40 sec | No |
| Lighthouse (local) | Full website audits on your machine | Yes, $0, open source | Needs Node + Chrome; lab data only | No |
| RocketReach (already connected) | Verified work emails for named people | Free account, dwindling | 11 standard lookups left, 3 company exports, 10 verifications; person_lookup 5/month; phone_lookup 0. Free is ~5 lookups total, not monthly | No |
| Apollo / Hunter / Snov.io / Lusha (free tiers) | Email finding top-ups | Yes, $0 | ~215 verified emails/month combined (Apollo ~75, Hunter 50, Snov.io 50, Lusha 40) | No |

**Cannot work for free — do not promise it:** 100 qualified leads per source per day (free email finders cap at ~215 emails/month total); automated Facebook Group monitoring (Groups API removed 22 Apr 2024, all versions); automated LinkedIn group/post monitoring (official API does not offer it at any price); automated Reddit collection (new public API access closed 31 Oct 2026; public API closes Mar 2027); automated X collection (no free tier for new developers; pay-per-use + card); automated Upwork feed (RSS dead Aug 2024; API partner-gated — only the free MCP server, interactive); Indie Hackers / Wellfound / Clutch / GoodFirms feeds (no public API — manual browsing only); Google Maps at scale with no card (free cap exists but a billing card is mandatory and over-cap auto-bills — OpenStreetMap is card-free but has no reliable phone/website data). **Honest free target: about 10–20 researched leads a day in total, mostly manual for Facebook/LinkedIn.**

## Live collection — honest limits

- **LinkedIn & Facebook: Needs connection.** Groups are login-walled and there is no official group-monitoring API. Do not scrape with a personal login — it risks an account block. Use manual entry or CSV import.
- **Public sources (Upwork, Reddit, X, Product Hunt):** searchable via public pages / official APIs. The hosted dashboard runs collection for real; this static file is for viewing and copying drafts.
- **100 leads per source per day is NOT the target here.** The honest target is about 10–20 researched leads a day, shown separately from the real count — never padded with filler leads.
- **Only public business info.** Never guess an email. No auto-messaging — the dashboard drafts outreach, you approve and send it.

## TEST REPORT (v6 A+ rebuild, 27 Nov 2026)

All tests were run with `node --check` and a jsdom test suite (`/tmp/leadgen-test/v6test.js`, kept outside this folder) that loads the real `index.html` + `main.js`, lets jsdom fire `DOMContentLoaded` naturally, and drives the app end to end. Final result: **62 passed, 0 failed** (27 Nov 2026). Two failures during testing turned out to be test-harness artefacts, not app bugs, and were fixed in the harness: dispatching `DOMContentLoaded` by hand double-bound every handler (the theme toggle then toggled twice and looked broken — in a real browser it fires once), and jsdom serialises `'` in text nodes as a literal `'`, so the escaped-quote check reads the text content instead. The app itself needed no fix for either. Results:

**Passed:**
- `node --check assets/js/main.js` — OK (also on the extracted zip copy).
- All 12 views render without throwing: Overview, All Leads, Companies, Audits, Collection Log, Review Queue, Pitch Studio, Job Hub, Google Maps, Facebook Businesses, Guide, Settings.
- Navigation: every sidebar item, per-source tab, Maps/Facebook country tab, search, status/intent filters, and sort (newest / name / match / intent) work; search from a non-Leads view resets to the All Leads tab.
- CSV import: a standard quoted CSV (`"Doe, Jane",CEO,"Acme, Inc",https://acme.com,jane@acme.com,…`) now imports cleanly as one correct lead (previously it produced garbage: `name:"\"Doe"`, `source:"https://acme.com"`). Header validation rejects a file with no `name` column with a real error message. Duplicates by email — and by name + company when there is no email — are skipped and counted. Imported leads get a complete outreach draft and appear in the Review Queue and Drafts to copy.
- CSV export: all 18 columns (name, role, company, website, email, phone, source, intent, industry, location, want, problems, match, status, notes, audit score, LinkedIn URL, Facebook URL), properly quoted.
- XSS check: a lead imported with `<script>alert(1)</script>` and a `'` in its intent/name renders as plain text in the card, the badge, the modal, and the draft list — no script runs, no markup breaks out, no `<img onerror>` element is created. `esc()` now escapes `'` as well as `& < > " `` ` ``. Defence in depth: `sanitize()` also allowlists intent to High/Medium/Low, so the malicious intent value is stored as "Medium".
- Sample separation: with Demo mode OFF, Overview/funnel/Review Queue/counts show 0 sample leads; with Demo mode ON, samples are shown and counted separately ("26 sample" labelled). "Clear sample data" removes all 26 sample leads, all 8 sample Maps businesses, and all 16 sample Facebook businesses, and hides the banner; real added leads stay.
- Pitch Studio: template copy buttons now copy the template **filled in** (no literal `{{name}}` anywhere in copied text); the follow-up template has its own copy button and also copies filled in.
- Audits view: starts empty and honest; pressing "Run website check" on a lead with a website creates a real stored audit (score, problems, fixes, method printed) and it appears in the Audits view and on the lead card. No-website leads never get a fake audit.
- Collection Log: starts with the hosted dashboard's history and appends a real row for every import, lead added, business added, website check, and export; entries persist after reload.
- Create/update/delete: Add Lead writes a complete draft (with closing question), persists, and goes to Leads; status changes persist; notes save with "Saved ✓"; delete is via Clear Sample for samples (with confirmation) — individual lead delete is not in this version, see Known limitations.
- Persistence: status, notes, settings, Pitch Studio settings, Demo mode, added leads/businesses, audits, and log all survive a reload (localStorage).
- Theme: Light/AMOLED toggle in sidebar, header, and Settings; follows the system setting on first visit; saved; the button label no longer flashes the wrong mode (theme is set before first paint).
- Keyboard: Escape closes modals and the mobile sidebar; Add Lead modal also closes on backdrop click.
- Links: zero placeholder example-domain URLs in any file (grep); every link is a real `https://` URL opening in a new tab; no `localhost` dependency; served over local HTTP, index.html / main.js / style.css all return 200.
- Unique IDs: records no longer use bare `Date.now()` — two rapid saves get distinct IDs and act on the correct lead.

**Known limitations (not hidden):**
- Website checks here are **local pre-checks** scored from facts in the lead record — not Lighthouse/PageSpeed audits. For a full free audit, use PageSpeed Insights (see Free Services above).
- "Charts" are CSS bar charts, not a chart library — no 14-day flow chart in the static file.
- The static file has **no background scheduler** — localStorage / an open tab cannot run jobs at 09:00. Daily runs live in the hosted dashboard; here, collection is manual (Add Lead / CSV import).
- Facebook/LinkedIn group monitoring is unavailable (see Free Services). X/Reddit/Upwork automated collection is unavailable for free in 2026 — manual browsing + CSV import is the honest route.
- No per-lead delete button yet (use Clear Sample for samples; real leads are removed by exporting, clearing browser data, or editing localStorage). No multi-device sync in the static file — use Export/Import CSV to move data.
- Facebook Business Page links point to well-known public pages; their load status was not live-verified in a browser (Facebook is login-walled for much content).

## v6 — A+ rebuild (2026-11-27)

Fixed, per the Phase 1 audit:
1. **Security:** `esc()` now escapes `'` (and `` ` ``); intent/name and every other user field is escaped at all three render sites that were raw; a real quoted-field CSV parser replaces the naive `split(",")`; profile links must be on the right platform.
2. **Sample separation:** Demo mode toggle; all analytics/counts use visible (real or demo) data and label sample counts separately; "Clear sample data" removes all 26 sample leads + 8 sample Maps + 16 sample Facebook businesses and hides the banner.
3. **Pitch Studio:** templates are filled in before copying (no more literal `{{name}}`); follow-up template has a copy button; Pitch Studio settings (name, offer, tone, signature) are editable and actually used in drafts.
4. **Audits & Collection Log:** Audits view gains real entries via "Run website check" (stored, scored, method printed); Collection Log is persisted and appends a row for every real event instead of a frozen constant.
5. **Also fixed:** unique IDs (no more `Date.now()` collisions); Drafts tab now respects search/status/intent filters; search from another view resets to All Leads; Add Lead writes a complete draft; funnel includes Lost / Not Interested; sort control added; Copy full email alerts on an empty draft instead of copying a near-empty message; Job Hub stats computed from data; Companies groups unnamed leads honestly; theme label no longer flashes; Escape closes modals; Add Lead modal closes on backdrop click; CSV export covers all 18 columns; topbar background has a fallback for browsers without `color-mix()`; 360px breakpoint added; honest daily target is 10–20 researched leads/day (Settings default 20, was 100).

## v5 — Full functionality restored, Facebook Businesses added (2026-11-27)

- Restored the full sidebar with every view (Overview, Companies, Audits, Collection Log, Review Queue, Job Hub, Google Maps, Pitch Studio, Guide, Settings) after the simplified build removed them. Premium design system throughout, desktop and phone widths.
- New **Facebook Businesses** view: one tab per country across the same 8 countries as Google Maps, full business details, real Facebook Page links, Add Business form.
