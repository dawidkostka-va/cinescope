#!/usr/bin/env node
/**
 * Turns a Playwright JSON report into the study's feature score.
 *
 * A run's score is `passed / 51`, where 51 is the number of acceptance criteria frozen in
 * the task specification. The script refuses to report a score if the suite does not carry
 * exactly those 51 identifiers — a missing criterion is a broken measurement, not a low one.
 */
import { readFileSync } from 'node:fs';
import { argv, exit } from 'node:process';

const EXPECTED_CRITERIA = 51;
const reportPath = argv[2] ?? 'apps/e2e/results.json';

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch {
  console.error(`Cannot read the Playwright report at ${reportPath}.`);
  console.error('Run `pnpm e2e` first, or pass the report path as an argument.');
  exit(2);
}

const results = new Map();

function walk(suite) {
  for (const spec of suite.specs ?? []) {
    const id = /^(AC-\d{2})\b/.exec(spec.title)?.[1];
    if (!id) continue;
    const statuses = (spec.tests ?? []).flatMap((test) =>
      (test.results ?? []).map((result) => result.status),
    );
    const status = statuses.length === 0 ? 'missing' : statuses.every((s) => s === 'passed') ? 'passed' : statuses.every((s) => s === 'skipped') ? 'pending' : 'failed';
    results.set(id, { status, title: spec.title });
  }
  for (const child of suite.suites ?? []) walk(child);
}

for (const suite of report.suites ?? []) walk(suite);

const expected = Array.from({ length: EXPECTED_CRITERIA }, (_, i) => `AC-${String(i + 1).padStart(2, '0')}`);
const missing = expected.filter((id) => !results.has(id));
const unknown = [...results.keys()].filter((id) => !expected.includes(id));

const passed = expected.filter((id) => results.get(id)?.status === 'passed');
const failed = expected.filter((id) => results.get(id)?.status === 'failed');
const pending = expected.filter((id) => results.get(id)?.status === 'pending');

console.log(`Feature score: ${passed.length} / ${EXPECTED_CRITERIA}`);
console.log(`Qualification threshold (80%): ${Math.ceil(EXPECTED_CRITERIA * 0.8)}`);
if (failed.length) console.log(`\nFailed (${failed.length}):\n  ${failed.join(', ')}`);
if (pending.length) console.log(`\nPending — not yet written (${pending.length}):\n  ${pending.join(', ')}`);

if (missing.length || unknown.length) {
  console.error('\nThe suite does not match the frozen criteria list.');
  if (missing.length) console.error(`  absent from the suite: ${missing.join(', ')}`);
  if (unknown.length) console.error(`  not in the specification: ${unknown.join(', ')}`);
  exit(1);
}
