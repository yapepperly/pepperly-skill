# Changelog

## 1.1.0 — 2026-08-02

- Creating a video no longer asks for a Pepperly API token: local Playwright
  recording is now the default path and needs no account — the `.webm` is the
  deliverable. `PEPPERLY_API_TOKEN` is required only to publish (studio
  editing, captions, share links, embeds, viewer analytics) or to use the
  AI-generated path (which also costs credits — agents should confirm first).
- SKILL.md, README, and plugin descriptions rewritten around that split.

## 1.0.0 — 2026-08-01

- First public release.
- Three paths into Pepperly: AI-generated walkthrough (`scripts/generate.mjs`),
  local Playwright recording (`scripts/recorder-template.cjs`), and direct
  upload of an existing recording (`scripts/upload.mjs`).
- Installable as a Claude Code plugin (`/plugin marketplace add
  yapepperly/pepperly-skill`) or by cloning into `~/.claude/skills/pepperly`.
- Default API base: `api.pepperly.dev` (override with `PEPPERLY_API_BASE`).
