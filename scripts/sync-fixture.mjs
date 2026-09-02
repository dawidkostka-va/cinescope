#!/usr/bin/env node
/**
 * Keeps every copy of `db.json` byte-identical to the one at the repository root.
 *
 * The suite asserts against occupied seats, prices and screening dates read from its own
 * copy; the application under test reads the copy in its working directory. If the two
 * drift apart, every run of the study is measured against the wrong fixture and nothing
 * reports an error. `--check` is for CI and for the pre-run checklist.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { argv, exit } from 'node:process';

const SOURCE = 'db.json';
const TARGETS = ['apps/e2e/src/db.json'];

const check = argv.includes('--check');
const source = readFileSync(SOURCE, 'utf8');
const drifted = [];

for (const target of TARGETS) {
  let current = null;
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    // treated as drift below
  }
  if (current === source) continue;
  drifted.push(target);
  if (!check) writeFileSync(target, source);
}

if (drifted.length === 0) {
  console.log(`Fixture in sync across ${String(TARGETS.length + 1)} copies.`);
  exit(0);
}

if (check) {
  console.error(`Fixture drift: ${drifted.join(', ')}`);
  console.error('Run `pnpm sync-fixture` to restore, and discard the run if it has already started.');
  exit(1);
}

console.log(`Synced from ${SOURCE}: ${drifted.join(', ')}`);
