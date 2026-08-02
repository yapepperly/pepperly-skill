# Pepperly skill

An [agent skill](https://code.claude.com/docs/en/skills) that lets Claude Code
(and compatible agents) create walkthrough videos — **free, locally, no
account needed** — and optionally publish them to your
[Pepperly](https://app.pepperly.dev) workspace:

- **Record locally** (default, no account) — a scripted Playwright session with
  a humanized visible cursor. Works on any site, localhost, behind VPN, or
  logged in with your own credentials. The video file is yours; done.
- **Publish to Pepperly** (API token) — when you want the studio: trim,
  captions, zoom/highlight/blur, share links, embeds, viewer analytics.
  Uploads any mp4 / mov / webm up to 600 MB.
- **Generate with AI** (API token + credits) — give Pepperly a URL and a flow
  description; the engine plans, records, captions, and edits server-side.

## Install

One line — installs the auto-updating Claude Code plugin, or copies the skill
into `~/.claude/skills/pepperly` when the CLI is absent; safe to re-run:

```sh
npx pepperly
```

No Node? Same behavior via the shell installer:

```sh
curl -fsSL https://pepperly.dev/install.sh | sh
```

Or inside Claude Code:

```
/plugin marketplace add yapepperly/pepperly-skill
/plugin install pepperly@pepperly-skill
```

Or manually, for any agent that reads `SKILL.md` skills:

```sh
git clone https://github.com/yapepperly/pepperly-skill ~/.claude/skills/pepperly
```

That's it — recording locally needs no account. Ask your agent things like
*"make a demo video of https://myapp.com — sign up, create a project, invite a
teammate"*.

To publish (or use the AI path), create a token in Pepperly — **Settings →
API tokens → Create token** — and:

```sh
export PEPPERLY_API_TOKEN=pk_...
```

## Requirements

- Node 20+
- For local recording: `npm i playwright`
- `PEPPERLY_API_TOKEN` — only for publishing / AI generation (see above)

## Self-hosted

Point the scripts at your own stack:

```sh
export PEPPERLY_API_BASE=https://api.your-host.example
export PEPPERLY_APP_BASE=https://app.your-host.example
```

## Direct script use (no agent)

```sh
node scripts/generate.mjs https://example.com --description "Sign up and create a project"
node scripts/upload.mjs demo.mp4 --title "Q3 release demo"
```

## License

MIT
