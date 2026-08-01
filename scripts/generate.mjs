#!/usr/bin/env node
// Generate a walkthrough video with Pepperly's AI: give it a URL and a prose
// description of the flow; the engine plans, records, and edits the video
// server-side. Costs AI credits on the account.
//
//   node scripts/generate.mjs <url> --description "Sign up, create a project, invite a teammate" \
//     [--cursor arrow|pointer|dot|ring] [--color light|dark] [--no-captions]
//
// Auth: PEPPERLY_API_TOKEN env var (studio → Settings → API tokens).
import { apiFetch, pollJob, printResult, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2), ['description', 'cursor', 'color']);
const url = args._[0];
if (!url) {
  console.error('Usage: node scripts/generate.mjs <url> --description "what to show" [--cursor …] [--color …] [--no-captions]');
  process.exit(2);
}

const payload = { url, description: args.description || '' };
if (args.cursor) payload.cursorStyle = args.cursor;
if (args.color) payload.colorScheme = args.color;
if (args['no-captions']) payload.captions = false;

console.log(`Requesting AI walkthrough of ${url}…`);
const { jobId } = await apiFetch('/jobs', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});
console.log(`Generating (job ${jobId}) — this typically takes a few minutes…`);
await pollJob(jobId);
printResult(jobId);
