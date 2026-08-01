---
name: pepperly
description: Create walkthrough/demo videos and publish them to a Pepperly account — generate a video with Pepperly's AI from a URL plus a flow description, record a flow locally with a scripted Playwright session, or upload an existing screen recording. Use when the user wants a demo/walkthrough video made or uploaded to Pepperly, mentions Pepperly, or asks to turn a URL + steps into a shareable product video.
---

# Pepperly

Create walkthrough videos and publish them to the user's Pepperly workspace
([app.pepperly.dev](https://app.pepperly.dev)). Three paths, cheapest-effort first.

## Setup (once)

1. The user creates an API token in the studio: **Settings → API tokens → Create token**.
2. `export PEPPERLY_API_TOKEN=pk_...` (treat it like a password; never commit it).
3. Node 20+. Path B additionally needs `npm i playwright` in a working dir.

Optional env: `PEPPERLY_API_BASE` / `PEPPERLY_APP_BASE` for a self-hosted stack.

## Path A — AI-generated walkthrough (default)

Pepperly's engine plans, records, captions, and edits the video server-side.
Use this whenever the flow is on a reachable URL and needs no local credentials.
Costs AI credits on the user's account.

```
node scripts/generate.mjs https://example.com \
  --description "Sign up, create a project, invite a teammate" \
  [--cursor arrow|pointer|dot|ring] [--color light|dark] [--no-captions]
```

Polls until done, then prints the studio edit link. One AI generation runs per
account at a time (409 `generation_in_progress` = wait).

## Path B — record locally, then upload

For flows the server can't reach (localhost, VPN, logged-in states with the
user's own credentials). Copy `scripts/recorder-template.cjs` into a working
dir, fill in the STEPS section with its helpers (`moveToEl`, `clickHere`,
`typeInto`, `smoothScroll`, `waitForUser`), then:

```
node recorder.cjs                       # writes video/<hash>.webm
node scripts/upload.mjs video/<hash>.webm --title "My walkthrough"
```

Before writing steps, scout headlessly (no video) for stable selectors — never
discover selectors during a take. Read [RECORDING.md](RECORDING.md) first: it
lists the gotchas the template already encodes (html-zoom cursor math, fill()
vs keystrokes, letterboxing) and the safety rules for credentials.

**Footage is uploaded as-is** — password inputs stay masked, but never let a
real secret, API key, or personal data appear on screen.

## Path C — upload an existing recording

Any mp4 / mov / webm up to 600 MB. Pepperly adds AI captions (disable with
`--no-ai-captions`) and makes it editable in the studio.

```
node scripts/upload.mjs demo.mp4 --title "Q3 release demo"
```

## After any path

The script prints `app.pepperly.dev/edit/<id>` — the user trims, captions, and
creates the share link there. Common errors: `unauthorized` = bad/revoked
token; `insufficient_credits` (Path A) and `plan_required` (uploads) = billing;
both are fixed in the studio.
