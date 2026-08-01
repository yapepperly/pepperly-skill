#!/usr/bin/env node
// Upload a screen recording (mp4 / mov / webm, ≤600 MB) to Pepperly as a new
// video. Pepperly turns it into an editable reel (AI captions on by default).
//
//   node scripts/upload.mjs <file> [--title "My demo"] [--no-ai-captions]
//
// Auth: PEPPERLY_API_TOKEN env var (studio → Settings → API tokens).
import { openAsBlob } from 'fs';
import { statSync } from 'fs';
import { basename } from 'path';
import { API_BASE, requireToken, pollJob, printResult, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2), ['title']);
const file = args._[0];
if (!file) {
  console.error('Usage: node scripts/upload.mjs <file> [--title "My demo"] [--no-ai-captions]');
  process.exit(2);
}
const token = requireToken();

const size = statSync(file).size;
if (size > 600 * 1024 * 1024) {
  console.error(`File is ${(size / 1024 / 1024).toFixed(0)} MB — the limit is 600 MB.`);
  process.exit(2);
}

const qs = new URLSearchParams();
if (args.title) qs.set('title', args.title);
if (args['no-ai-captions']) qs.set('aiCaptions', '0');

console.log(`Uploading ${basename(file)} (${(size / 1024 / 1024).toFixed(1)} MB)…`);
const fd = new FormData();
fd.append('video', await openAsBlob(file), basename(file));
const res = await fetch(`${API_BASE}/jobs/import${qs.size ? `?${qs}` : ''}`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}` },
  body: fd,
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Upload failed: ${body.error || res.statusText}${body.detail ? ` — ${JSON.stringify(body.detail)}` : ''}`);
  process.exit(1);
}

console.log(`Processing (job ${body.jobId})…`);
await pollJob(body.jobId);
printResult(body.jobId);
