#!/usr/bin/env node
// `npx pepperly` — install the Pepperly agent skill.
//
// With the Claude Code CLI on PATH this installs the auto-updating plugin
// (marketplace add + install, both idempotent). Otherwise it copies the skill
// files bundled in this npm package into ~/.claude/skills/pepperly — no git
// needed, works on Windows too. Safe to re-run: both paths update in place.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const WIN = process.platform === 'win32';

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: WIN });
  if (res.error || res.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(' ')}`);
    process.exit(res.status || 1);
  }
}

function hasClaude() {
  const res = spawnSync('claude', ['--version'], { stdio: 'ignore', shell: WIN });
  return !res.error && res.status === 0;
}

if (hasClaude()) {
  console.log('Claude Code CLI found — installing as a plugin (auto-updates).');
  run('claude', ['plugin', 'marketplace', 'add', 'yapepperly/pepperly-skill']);
  run('claude', ['plugin', 'install', 'pepperly@pepperly-skill', '--scope', 'user']);
  console.log('\nInstalled. New Claude Code sessions pick it up automatically');
  console.log('(in a running session: /plugin — or restart it).');
} else {
  const skillsDir = process.env.CLAUDE_SKILLS_DIR || path.join(os.homedir(), '.claude', 'skills');
  const dest = path.join(skillsDir, 'pepperly');
  console.log(`Claude Code CLI not found — copying the skill to ${dest}`);
  fs.mkdirSync(dest, { recursive: true });
  // Everything the skill needs ships inside this package (see package.json "files").
  for (const entry of ['SKILL.md', 'RECORDING.md', 'scripts']) {
    fs.cpSync(path.join(__dirname, entry), path.join(dest, entry), {
      recursive: true,
      force: true,
    });
  }
}

console.log('\nReady — no account needed to create videos.');
console.log('Ask your agent: "make a demo video of https://your-app.com"');
console.log('\nWant to publish to Pepperly (studio editing, share links, analytics)?');
console.log('  1. Create an API token: https://app.pepperly.dev -> Settings -> API tokens');
console.log('  2. export PEPPERLY_API_TOKEN=pk_...');
