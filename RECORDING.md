# Local recording gotchas

Hard-won rules encoded in `scripts/recorder-template.cjs`. Keep them.

## Workflow

1. **Plan the steps** from the user's description (pages, clicks, states to show).
2. **Scout first, record later.** Headless Playwright probe (no video): load the
   pages, find a stable selector for every click target, detect login walls, and
   check `getComputedStyle(document.body).zoom` per page.
3. **Fill in STEPS** in a copy of the template using its helpers.
4. **Record headless** — fully automatic. Go background + `waitForUser` only for
   a genuine human step (2FA / captcha).
5. **Verify the raw footage** before uploading (non-negotiable): extract frames
   with ffmpeg at the marks and check the cursor is ON each click target, no gray
   letterboxing, no secrets visible, expected UI states. If a segment is bad, fix
   and re-record.
6. **Upload** with `scripts/upload.mjs` — Pepperly handles captions and editing.

## Gotchas (each cost real debugging time)

- **Sites zoom `<body>`** (e.g. `body{zoom:0.8}`): overlays appended to body
  render at scaled coordinates. The template attaches the cursor to `<html>` and
  divides by html zoom — keep that.
- **Init scripts run before `documentElement` exists.** Never touch the DOM at
  the top level of `addInitScript` code: a throw after setting the guard flag
  silently kills the overlay for the whole page. Attach lazily inside the update
  function (the template does this).
- **The cursor must be driven explicitly** (`__setCur` from Node per move step),
  not via mousemove listeners — event delivery dies in some apps; the listener
  stays only so the user's own motions show during `waitForUser`.
- **Letterboxing** (gray band, shrunken page) means the viewport/scale changed
  mid-take; the template logs `visualViewport.scale` — check it.
- **Playwright videos have no OS cursor** — the overlay IS the cursor.
  Material-style hover ink blobs are not your cursor; verify the actual arrow.
- **Text matching**: CSS `text-transform: uppercase` lies about DOM text — match
  with case-insensitive regexes (`text=/close/i`).
- **Scrolling**: `mouse.wheel` ticks look choppy on the screencast — use the
  template's rAF `smoothScroll`.
- **Typing**: use the template's `typeInto` — a click can miss focus during
  entry animations and silently lose the whole string; `fill()` sets the value
  atomically, which masked/controlled inputs accept.
- Session cookies in `state.json` may not survive; origin cookies often still
  skip the password (landing on an account chooser). Probe before assuming.

## Credentials and secrets

- Credentials flow through the recorder at run time only — `process.env` or
  argv, **never hardcoded** in the step file (it may get committed).
- `fill()` keeps password fields masked on screen, but an eye-toggle reveal
  would expose them — never click reveal toggles, and keep API keys, tokens,
  and personal data off screen entirely. **The footage is uploaded unedited.**
- Raw takes stay on disk in `video/` — delete them after upload if sensitive.
- Remind the user to rotate any credential that passed through chat.
