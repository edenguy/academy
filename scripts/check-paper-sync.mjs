#!/usr/bin/env node
// Fails when an app's copy of the Paper layer engine differs from the canonical file.
// Spec: BACKGROUND_LLD.md §4. Node built-ins only.
//
//   node scripts/check-paper-sync.mjs           check: exit 1 if any copy differs
//   node scripts/check-paper-sync.mjs --write   copy the canonical file over every copy
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const canonical = join(root, 'docs/hub/paper-engine.js');
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const write = process.argv.includes('--write');

if (!existsSync(canonical)) {
  console.error('missing canonical file: docs/hub/paper-engine.js');
  process.exit(1);
}

const copies = readdirSync(join(root, 'apps'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => join(root, 'apps', d.name, 'src/paper/engine.js'))
  .filter((f) => existsSync(f));

const want = hash(canonical);
let differs = 0;
console.log(`${relative(root, canonical)}  ${want.slice(0, 12)}  canonical`);
for (const f of copies) {
  const same = hash(f) === want;
  if (!same && write) copyFileSync(canonical, f);
  if (!same && !write) differs++;
  console.log(`${relative(root, f)}  ${hash(f).slice(0, 12)}  ${same ? 'same' : write ? 'rewritten' : 'DIFFERS'}`);
}
if (differs) {
  console.error(`\n${differs} copy(ies) differ. Edit the canonical file, then run: node scripts/check-paper-sync.mjs --write`);
  process.exit(1);
}
