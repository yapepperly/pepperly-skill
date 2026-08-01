# Pepperly skill

An [agent skill](https://code.claude.com/docs/en/skills) that lets Claude Code
(and compatible agents) create walkthrough videos and publish them to your
[Pepperly](https://app.pepperly.dev) workspace:

- **Generate with AI** — give Pepperly a URL and a description of the flow; the
  engine plans, records, captions, and edits the video server-side.
- **Record locally** — a scripted Playwright session with a humanized visible
  cursor, for flows on localhost / behind VPN / needing your own credentials.
- **Upload an existing recording** — any mp4 / mov / webm up to 600 MB.

## Install

```sh
git clone https://github.com/yapepperly/pepperly-skill ~/.claude/skills/pepperly
```

Then in Pepperly: **Settings → API tokens → Create token**, and:

```sh
export PEPPERLY_API_TOKEN=pk_...
```

Ask your agent things like *"make a demo video of https://myapp.com — sign up,
create a project, invite a teammate"* or *"upload demo.mp4 to Pepperly"*.

## Requirements

- Node 20+
- `PEPPERLY_API_TOKEN` (see above)
- For local recording only: `npm i playwright`

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
