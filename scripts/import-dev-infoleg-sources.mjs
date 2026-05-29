import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (!args.sources) {
  fail("Missing --sources <path>");
}

if (!args["output-root"]) {
  fail("Missing --output-root <path>");
}

const sources = JSON.parse(readFileSync(resolve(args.sources), "utf8"));

if (!Array.isArray(sources) || sources.length === 0) {
  fail("Sources file must contain a non-empty array");
}

const results = [];

for (const source of sources) {
  validateSource(source);

  const slug = source.id.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const commandArgs = [
    "scripts/import-infoleg.mjs",
    "--url",
    source.url,
    "--id",
    source.id,
    "--title",
    source.title,
    "--raw-output",
    `${args["output-root"]}/raw/${slug}.raw.html`,
    "--report-output",
    `${args["output-root"]}/parsed/${slug}.report.json`,
    "--output",
    `${args["output-root"]}/candidate/${slug}.candidate.json`
  ];

  const result = spawnSync(process.execPath, commandArgs, {
    env: process.env,
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    fail(`Import failed for ${source.id}`);
  }

  results.push({
    id: source.id,
    title: source.title,
    candidate: `${args["output-root"]}/candidate/${slug}.candidate.json`,
    report: `${args["output-root"]}/parsed/${slug}.report.json`,
    raw: `${args["output-root"]}/raw/${slug}.raw.html`
  });
}

console.log(JSON.stringify({ imported: results }, null, 2));

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key.startsWith("--")) {
      if (!value || value.startsWith("--")) {
        fail(`Missing value for ${key}`);
      }

      parsed[key.slice(2)] = value;
      index += 1;
    }
  }

  return parsed;
}

function validateSource(source) {
  assert(typeof source.id === "string" && source.id.length > 0, "source.id is required");
  assert(typeof source.title === "string" && source.title.length > 0, "source.title is required");
  assert(typeof source.url === "string" && source.url.startsWith("https://"), "source.url must be https");
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function fail(message) {
  console.error(`Dev InfoLEG import failed: ${message}`);
  process.exit(1);
}

