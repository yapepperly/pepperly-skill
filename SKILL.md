---
name: pepperly
description: Create walkthrough/demo videos — record a flow locally with a scripted Playwright session (free, no account), and optionally publish to Pepperly to edit, caption, share, embed, and track viewers. Can also generate the video fully with Pepperly's AI from a URL plus a flow description. Use when the user wants a demo/walkthrough video made, mentions Pepperly, or asks to turn a URL + steps into a shareable product video.
---

# Pepperly

Create walkthrough videos. **Creating is free and needs no Pepperly account** —
the recorder runs locally. A `PEPPERLY_API_TOKEN` is needed only when the user
wants Pepperly's platform: studio editing, AI captions, share links, embeds,
viewer analytics — or the fully AI-generated path.

## Path A — record locally (default; no token, no account)

A scripted Playwright session with a humanized visible cursor. Works anywhere
the local browser can go: public sites, localhost, VPN, logged-in states with
the user's own credentials. Copy `scripts/recorder-template.cjs` into a working
dir, fill in the STEPS section with its helpers (`moveToEl`, `clickHere`,
`typeInto`, `smoothScroll`, `waitForUser`), then:

```
npm i playwright               # once per working dir
node recorder.cjs              # writes video/<hash>.webm
```

Before writing steps, scout headlessly (no video) for stable selectors — never
discover selectors during a take. Read [RECORDING.md](RECORDING.md) first: it
lists the gotchas the template already encodes (html-zoom cursor math, fill()
vs keystrokes, letterboxing) and the safety rules for credentials.

The `.webm` is the deliverable — the user can stop here, convert it, or publish
it (Path B) when they want editing and sharing.

## Path B — publish to Pepperly (token required)

Publishing unlocks the studio: trim, captions, zoom/highlight/blur, share
links, embeds, and viewer analytics. Works for Path A output or any existing
mp4 / mov / webm up to 600 MB. Pepperly adds AI captions (disable with
`--no-ai-captions`).

```
node scripts/upload.mjs video/<hash>.webm --title "My walkthrough"
```

**Footage is uploaded as-is** — password inputs stay masked, but never let a
real secret, API key, or personal data appear on screen.

## Path C — AI-generated walkthrough (token required, costs AI credits)

Pepperly's engine plans, records, captions, and edits the video server-side —
no local recording at all. Only for flows on a URL the server can reach (no
localhost/VPN), and it costs AI credits on the user's account, so confirm
before running it when Path A would do.

```
node scripts/generate.mjs https://example.com \
  --description "Sign up, create a project, invite a teammate" \
  [--cursor arrow|pointer|dot|ring] [--color light|dark] [--no-captions]
```

Polls until done, then prints the studio edit link. One AI generation runs per
account at a time (409 `generation_in_progress` = wait).

## Token setup (only for Paths B and C)

1. The user creates an API token in the studio
   ([app.pepperly.dev](https://app.pepperly.dev) → **Settings → API tokens →
   Create token**).
2. `export PEPPERLY_API_TOKEN=pk_...` (treat it like a password; never commit it).

Do NOT ask for a token to create a video — only when the user actually wants
to publish, or explicitly wants the AI-generated path. Optional env:
`PEPPERLY_API_BASE` / `PEPPERLY_APP_BASE` for a self-hosted stack. Node 20+.

## After publishing (B or C)

The script prints `app.pepperly.dev/edit/<id>` — the user trims, captions, and
creates the share link there. Common errors: `unauthorized` = bad/revoked
token; `insufficient_credits` (Path C) and `plan_required` (uploads) = billing;
both are fixed in the studio.
