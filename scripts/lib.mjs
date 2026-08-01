// Shared plumbing for the Pepperly skill scripts: config, authenticated fetch,
// job polling, and friendly error mapping. Node 20+ (built-in fetch/FormData).
export const API_BASE = (process.env.PEPPERLY_API_BASE || 'https://api-production-1cd60.up.railway.app').replace(/\/$/, '');
export const APP_BASE = (process.env.PEPPERLY_APP_BASE || 'https://app.pepperly.dev').replace(/\/$/, '');

export function requireToken() {
  const token = process.env.PEPPERLY_API_TOKEN;
  if (!token) {
    console.error(
      'PEPPERLY_API_TOKEN is not set.\n' +
        `Create one in the studio (${APP_BASE} → Settings → API tokens), then:\n` +
        '  export PEPPERLY_API_TOKEN=pk_...',
    );
    process.exit(2);
  }
  return token;
}

/** Human explanations for the API's machine error codes. */
const ERROR_HINTS = {
  unauthorized: 'The token was rejected — check PEPPERLY_API_TOKEN (it may have been revoked).',
  insufficient_credits: `Not enough AI credits. Top up or upgrade in the studio: ${APP_BASE}`,
  plan_required: `Uploading needs an active plan or trial: ${APP_BASE}`,
  generation_in_progress: 'Another AI generation is already running on this account — wait for it to finish.',
  walkthrough_quota_exceeded: 'Monthly walkthrough quota reached.',
  sample_used: 'The free sample was already used on this account.',
};

export async function apiFetch(path, opts = {}) {
  const token = requireToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = typeof body.error === 'string' ? body.error : res.statusText;
    const hint = ERROR_HINTS[code];
    throw new Error(hint ? `${code}: ${hint}` : `${code}${body.detail ? ` — ${JSON.stringify(body.detail)}` : ''}`);
  }
  return body;
}

/** Poll a job until it completes; prints stage transitions as they happen. */
export async function pollJob(jobId) {
  let lastStage = '';
  for (;;) {
    const j = await apiFetch(`/jobs/${jobId}`);
    const stage = j.stage || j.state;
    if (stage !== lastStage) {
      console.log(`  ${stage}`);
      lastStage = stage;
    }
    if (j.state === 'completed') return j;
    if (j.state === 'failed') throw new Error(j.error || 'job failed');
    await new Promise((r) => setTimeout(r, 3000));
  }
}

export function printResult(jobId) {
  console.log('\nDone.');
  console.log(`  Edit in studio:  ${APP_BASE}/edit/${encodeURIComponent(jobId)}`);
  console.log(`  Job id:          ${jobId}`);
  console.log('Open the studio to trim, caption, and create a share link.');
}

/** Tiny argv parser: positionals + --flag / --flag value. */
export function parseArgs(argv, flagsWithValue = []) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (flagsWithValue.includes(key)) args[key] = argv[++i];
      else args[key] = true;
    } else args._.push(a);
  }
  return args;
}
