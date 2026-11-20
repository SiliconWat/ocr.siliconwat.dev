#!/usr/bin/env node
// Refuse a production build that would serve an interim model (src/read/models.ts `interim`), a model file that is missing,
// or two readers whose license claim the files cannot back. A property of the build, not a reminder (A64): the CC0 reader
// must never quietly read with the Apache-2.0 starter on a public site. `--dev` reports and passes.
import { readFileSync, existsSync } from "node:fs";
const src = readFileSync("src/read/models.ts", "utf8");
const dev = process.argv.includes("--dev");
const problems = [];
for (const m of src.matchAll(/^\s*(\w+):\s*\{([^}]*)\}/gm)) {
  const [, id, body] = m;
  const files = [...body.matchAll(/(pali|khmer):\s*"([^"]+)"/g)].map((x) => x[2]);
  const interim = /interim:\s*"([^"]+)"/.exec(body);
  if (interim) problems.push(`${id}: interim — ${interim[1]}`);
  for (const f of files) if (!existsSync(`public/models/${f}.traineddata`)) problems.push(`${id}: public/models/${f}.traineddata is missing`);
}
if (!/accurate:/.test(src) || !/public:/.test(src)) problems.push("models.ts must define both readers");
for (const p of problems) console.log(`${dev ? "note" : "REFUSED"}: ${p}`);
if (problems.length && !dev) process.exit(1);
console.log(problems.length ? `check-models: ${problems.length} note(s) (dev)` : "check-models: ok");
