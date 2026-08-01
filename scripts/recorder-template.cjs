// Local walkthrough recorder. Copy next to your project, fill in STEPS below,
// then upload the resulting .webm with scripts/upload.mjs — Pepperly does the
// captioning/editing server-side, so this only needs to capture clean footage.
// Run: node recorder.cjs   ->  writes video/<hash>.webm
//
// Baked-in lessons (do not "simplify" these away):
// - Cursor overlay attaches to <html>, not <body>: sites set body{zoom:0.8} which
//   scales anything inside body. Coordinates are divided by html zoom.
// - The init script runs before documentElement exists; all DOM work is lazy and
//   throw-proof (a top-level throw after the guard flag poisons every reinstall).
// - The visual cursor is driven explicitly from Node (drawCur) each move step;
//   mousemove listeners remain only so the USER's own typing/motions show too.
// - NEVER show real secrets on screen: password inputs stay masked (fill() types
//   nothing visible), but avoid eye-toggle reveals and don't display API keys,
//   tokens, or personal data — this footage is uploaded as-is.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ==== CONFIG ================================================================
const VW = 1440, VH = 900;
const START_URL = 'https://example.com/';          // <- change
const OUT = path.join(__dirname, 'video');
const STATE = path.join(__dirname, 'state.json');  // saved session for retakes
// ============================================================================

const rnd = (a, b) => a + Math.random() * (b - a);
const sleep = (p, ms) => p.waitForTimeout(ms);
let cur = { x: VW / 2, y: VH * 0.4 };
let PAGE = null;

async function drawCur(x, y) {
  try { await PAGE.evaluate(([px, py]) => window.__setCur && window.__setCur(px, py), [x, y]); } catch {}
}

// ease-in-out glide with jitter; keeps the visual cursor glued to the real mouse
async function humanMove(page, x, y, { dur = 700 } = {}) {
  const steps = Math.max(18, Math.round(dur / 16));
  const sx = cur.x, sy = cur.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const nx = sx + (x - sx) * e + (Math.random() - 0.5) * 1.2;
    const ny = sy + (y - sy) * e + (Math.random() - 0.5) * 1.2;
    await page.mouse.move(nx, ny);
    await drawCur(nx, ny);
    await sleep(page, dur / steps);
  }
  await page.mouse.move(x, y);
  await drawCur(x, y);
  cur = { x, y };
}

async function moveToEl(page, elOrLocator, opts) {
  const box = await elOrLocator.boundingBox();
  if (!box) throw new Error('no bounding box');
  await humanMove(page, box.x + box.width / 2 + rnd(-3, 3), box.y + box.height / 2 + rnd(-2, 2), opts);
}

async function clickHere(page) {
  try { await page.evaluate(([px, py]) => window.__ripple && window.__ripple(px, py), [cur.x, cur.y]); } catch {}
  await page.mouse.down();
  await sleep(page, rnd(60, 110));
  await page.mouse.up();
}

// resync after the user drove the mouse themselves (e.g. a 2FA step)
async function syncCur(page) {
  const p = await page.evaluate('window.__curPos').catch(() => null);
  if (p && typeof p.x === 'number') cur = p;
}

// rAF-driven eased scroll — use this for any scroll the viewer watches.
// (mouse.wheel ticks jump ~60px per tick and look choppy on the screencast)
async function smoothScroll(page, delta, dur = 1500) {
  await page.evaluate(([d, ms]) => new Promise((res) => {
    const y0 = scrollY;
    const t0 = performance.now();
    const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      scrollTo(0, y0 + d * ease(t));
      if (t < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  }), [delta, dur]);
}

// Type into a field, moving the cursor there + click ripple first so it reads as
// "typing here". fill() is the RELIABLE primary: it sets the value + fires events
// atomically, which masked/controlled inputs accept — char-by-char typing loses
// the string when such a field reformats/steals focus. A plain-input fallback
// types real keystrokes if fill() is blocked. Password fields stay masked.
async function typeInto(page, locator, text) {
  await moveToEl(page, locator, { dur: 750 });
  await sleep(page, 300);
  await clickHere(page);
  await locator.focus().catch(() => {});
  let ok = false, got = '';
  try {
    await locator.fill(''); await locator.fill(text); await sleep(page, 150);
    got = (await locator.inputValue().catch(() => '')) || '';
    ok = got === text || got.length >= text.length || (/^\d+$/.test(text) && got.replace(/\D/g, '') === text);
  } catch {}
  if (!ok) { for (const ch of text) { await page.keyboard.type(ch); await sleep(page, rnd(35, 85)); } }
}

const overlayScript = `
(() => {
  if (window.__cur) return;
  window.__cur = true;
  const c = document.createElement('div');
  c.id = '__fakecursor';
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:22px;height:22px;margin-left:-2px;margin-top:-2px;will-change:transform;';
  c.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L2 17 L6.2 13 L9 19.5 L11.6 18.4 L8.9 12 L14.5 12 Z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  let x = ${VW / 2}, y = ${VH * 0.4};
  window.__curPos = { x, y };
  const zoom = (root) => parseFloat(getComputedStyle(root).zoom) || 1;
  const apply = () => {
    const root = document.documentElement;
    if (!root) return;
    if (!c.isConnected) { try { root.appendChild(c); } catch (e) {} }
    const z = zoom(root);
    c.style.transform = 'translate(' + (x / z) + 'px,' + (y / z) + 'px)';
  };
  window.__setCur = (nx, ny) => { x = nx; y = ny; window.__curPos = { x, y }; apply(); };
  window.__ripple = (rx, ry) => {
    const root = document.documentElement;
    if (!root) return;
    const z = zoom(root);
    const px = rx / z, py = ry / z;
    const r = document.createElement('div');
    r.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;left:'+(px-6)+'px;top:'+(py-6)+'px;width:12px;height:12px;border-radius:50%;border:2px solid #2563eb;opacity:.9;transition:all .5s ease-out;';
    try { root.appendChild(r); } catch (e) { return; }
    requestAnimationFrame(() => { r.style.width='46px';r.style.height='46px';r.style.left=(px-23)+'px';r.style.top=(py-23)+'px';r.style.opacity='0'; });
    setTimeout(() => r.remove(), 550);
  };
  document.addEventListener('DOMContentLoaded', apply);
  apply();
  window.addEventListener('mousemove', (e) => { window.__setCur(e.clientX, e.clientY); }, true);
  window.addEventListener('mousedown', (e) => { window.__ripple(e.clientX, e.clientY); }, true);
})();
`;

(async () => {
  // Headless: recordVideo captures the browser compositor and the cursor is a drawn SVG
  // overlay, so no display is needed. Flip to false only to watch a take while debugging.
  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'] });
  const ctxOpts = {
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: VW, height: VH } },
  };
  if (fs.existsSync(STATE)) ctxOpts.storageState = STATE;
  const context = await browser.newContext(ctxOpts);
  await context.addInitScript(overlayScript);
  const page = await context.newPage();
  PAGE = page;
  await page.bringToFront();

  const t0 = Date.now();
  const mark = (name) => console.log(`MARK ${name} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const reinstall = async () => { try { await page.evaluate(overlayScript); } catch {} };

  // Pause for a genuine HUMAN-only step (2FA code, captcha). Credentials are
  // typed automatically via typeInto — env/argv only, never hardcoded here.
  // Resumes when the URL matches; saves the session for future no-login retakes.
  const waitForUser = async (urlRegex, message) => {
    console.log('\n### ' + message + ' (waiting up to 5 minutes) ###\n');
    await page.waitForURL(urlRegex, { timeout: 300000 });
    await context.storageState({ path: STATE });
    await reinstall();
    await syncCur(page);
  };

  // sanity check: letterboxing in the video means these values changed mid-take
  const vpCheck = async (label) => {
    const vp = await page.evaluate(() => ({ iw: innerWidth, ih: innerHeight, vvs: visualViewport.scale })).catch(() => null);
    console.log('VIEWPORT ' + label + ' = ' + JSON.stringify(vp));
  };

  // ==== STEPS (edit everything below) =======================================
  await page.goto(START_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await reinstall();
  mark('home_ready');
  await sleep(page, 2200);

  // Example: click a link, humanized
  // const login = page.locator('a:has-text("Log in")').first();
  // await moveToEl(page, login, { dur: 900 }); await sleep(page, 500);
  // mark('login_click'); await clickHere(page);

  // Example: AUTOMATIC login — credentials from env/argv, never hardcoded
  // await typeInto(page, page.locator('input[name=email]').first(), process.env.DEMO_EMAIL);
  // await typeInto(page, page.locator('input[type=password]').first(), process.env.DEMO_PW);
  // const submit = page.locator('button:has-text("Continue")').first();
  // await moveToEl(page, submit, { dur: 700 }); mark('submit'); await clickHere(page);
  // await page.waitForURL(/dashboard/, { timeout: 60000 });
  // await context.storageState({ path: STATE }); await reinstall(); mark('login_done');

  // Example: genuine human-only step (2FA / captcha)
  // await waitForUser(/dashboard/, 'ENTER THE 2FA CODE in the window');

  // Example: menu pick — case-insensitive text (uppercase may be CSS-only)
  // const item = page.locator('text=/settings/i').first();
  // await item.waitFor({ state: 'visible' }); await sleep(page, 450);
  // await moveToEl(page, item, { dur: 650 }); await sleep(page, 300);
  // mark('pick_settings'); await clickHere(page); await sleep(page, 3000); await reinstall();

  await vpCheck('end');
  await humanMove(page, VW * 0.5, VH * 0.4, { dur: 700 });
  await sleep(page, 2200);
  mark('end');
  // ==========================================================================

  console.log('-> finalizing video');
  const vid = page.video();
  await context.close();
  await browser.close();
  const vpath = await vid.path();
  console.log('VIDEO_PATH=' + vpath);
  console.log('Next: node scripts/upload.mjs "' + vpath + '" --title "My walkthrough"');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
