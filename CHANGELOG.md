# Changelog

## 1.0.0 — 2026-08-01

- First public release.
- Three paths into Pepperly: AI-generated walkthrough (`scripts/generate.mjs`),
  local Playwright recording (`scripts/recorder-template.cjs`), and direct
  upload of an existing recording (`scripts/upload.mjs`).
- Installable as a Claude Code plugin (`/plugin marketplace add
  yapepperly/pepperly-skill`) or by cloning into `~/.claude/skills/pepperly`.
- Default API base: `api.pepperly.dev` (override with `PEPPERLY_API_BASE`).
