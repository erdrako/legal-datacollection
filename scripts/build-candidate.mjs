import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input;
const outputPath = args.output;

if (!inputPath) {
  fail("Missing --input <path>");
}

if (!outputPath) {
  fail("Missing --output <path>");
}

const sourceDocument = readJson(inputPath);
validateSourceDocument(sourceDocument);

const candidateBundle = buildCandidateBundle(sourceDocument);

mkdirSync(dirname(resolve(outputPath)), { recursive: true });
writeFileSync(resolve(outputPath), `${JSON.stringify(candidateBundle, null, 2)}\n`, "utf8");

console.log(`Read source document: ${inputPath}`);
console.log(`Wrote candidate bundle: ${outputPath}`);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === "--input" || key === "--output") {
      if (!value || value.startsWith("--")) {
        fail(`Missing value for ${key}`);
      }

      parsed[key.slice(2)] = value;
      index += 1;
    }
  }

  return parsed;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), "utf8"));
  } catch (error) {
    fail(`Could not read JSON file ${path}: ${error.message}`);
  }
}

function validateSourceDocument(input) {
  assertObject(input, "input");
  assertObject(input.source, "source");
  assertNonEmptyString(input.source.id, "source.id");
  assertNonEmptyString(input.source.name, "source.name");
  assert(typeof input.source.official === "boolean", "source.official must be boolean");

  assertObject(input.document, "document");
  assertNonEmptyString(input.document.id, "document.id");
  assertNonEmptyString(input.document.type, "document.type");
  assertNonEmptyString(input.document.title, "document.title");
  assertNonEmptyString(input.document.status, "document.status");
  assertObject(input.document.jurisdiction, "document.jurisdiction");
  assert(input.document.jurisdiction.country === "AR", "document.jurisdiction.country must be AR");
  assertNonEmptyString(input.document.jurisdiction.level, "document.jurisdiction.level");
  assert(Array.isArray(input.document.articles), "document.articles must be an array");
  assert(input.document.articles.length > 0, "document.articles must include at least one article");

  for (const [index, article] of input.document.articles.entries()) {
    assertNonEmptyString(article.label, `document.articles.${index}.label`);
    assertNonEmptyString(article.text, `document.articles.${index}.text`);
  }
}

function buildCandidateBundle(input) {
  const generatedAt = new Date().toISOString();
  const legalItem = {
    id: input.document.id,
    type: input.document.type,
    title: input.document.title,
    status: input.document.status,
    jurisdiction: input.document.jurisdiction,
    source: input.source,
    summaryPlainLanguage: input.document.summaryPlainLanguage
  };

  const provisions = input.document.articles.map((article, index) => {
    const articleNumber = index + 1;

    return {
      id: `${input.document.id}-art-${articleNumber}`,
      legalItemId: input.document.id,
      type: "ARTICLE",
      label: article.label,
      order: articleNumber,
      textOriginal: article.text,
      status: input.document.status
    };
  });

  const citations = provisions.map((provision, index) => ({
    id: `citation-${provision.id}`,
    sourceLegalItemId: input.document.id,
    provisionId: provision.id,
    article: String(index + 1),
    originalText: provision.textOriginal,
    sourceUrl: input.source.sourceUrl,
    retrievedAt: input.source.retrievedAt ?? generatedAt
  }));

  return {
    schemaVersion: "0.1.0",
    generatedAt,
    source: input.source,
    legalItems: [legalItem],
    provisions,
    citations,
    relationships: [],
    rules: [],
    concepts: [],
    snapshots: []
  };
}

function assertObject(value, label) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
}

function assertNonEmptyString(value, label) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function fail(message) {
  console.error(`Candidate generation failed: ${message}`);
  process.exit(1);
}

