import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

if (process.env.LEXMAPA_ALLOW_INSECURE_TLS === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const args = parseArgs(process.argv.slice(2));

for (const requiredArg of ["url", "id", "title", "output"]) {
  if (!args[requiredArg]) {
    fail(`Missing --${requiredArg} <value>`);
  }
}

const retrievedAt = new Date().toISOString();
const response = await fetch(args.url);

if (!response.ok) {
  fail(`InfoLEG returned HTTP ${response.status}`);
}

const htmlBuffer = Buffer.from(await response.arrayBuffer());
const contentType = response.headers.get("content-type");
const html = decodeHtmlResponse(htmlBuffer, contentType);
const plainText = htmlToText(html);
const articles = extractArticles(plainText);

if (articles.length === 0) {
  fail("No articles were detected in InfoLEG document");
}

const candidateBundle = buildCandidateBundle({
  id: args.id,
  title: args.title,
  url: args.url,
  retrievedAt,
  articles
});
const parsingReport = buildParsingReport({
  id: args.id,
  title: args.title,
  url: args.url,
  retrievedAt,
  contentType,
  htmlBuffer,
  plainText,
  articles
});

if (args["raw-output"]) {
  writeTextFile(args["raw-output"], html);
}

if (args["report-output"]) {
  writeTextFile(args["report-output"], `${JSON.stringify(parsingReport, null, 2)}\n`);
}

writeTextFile(args.output, `${JSON.stringify(candidateBundle, null, 2)}\n`);

console.log(`Fetched InfoLEG source: ${args.url}`);
console.log(`Detected articles: ${articles.length}`);
if (args["raw-output"]) console.log(`Wrote raw HTML: ${args["raw-output"]}`);
if (args["report-output"]) console.log(`Wrote parsing report: ${args["report-output"]}`);
console.log(`Wrote candidate bundle: ${args.output}`);

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

function decodeHtmlResponse(buffer, contentType) {
  const charset = contentType?.match(/charset=([^;]+)/i)?.[1]?.trim().toLowerCase();

  if (charset) {
    return new TextDecoder(charset).decode(buffer);
  }

  const utf8 = new TextDecoder("utf-8").decode(buffer);
  const windows1252 = new TextDecoder("windows-1252").decode(buffer);

  return mojibakeScore(utf8) <= mojibakeScore(windows1252) ? utf8 : windows1252;
}

function mojibakeScore(value) {
  return (value.match(/\u00c3|\u00c2|\ufffd/g) ?? []).length;
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|h\d)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t\r\f]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function decodeEntities(value) {
  const namedEntities = {
    amp: "&",
    quot: "\"",
    nbsp: " ",
    ordm: "\u00ba",
    deg: "\u00b0",
    aacute: "\u00e1",
    eacute: "\u00e9",
    iacute: "\u00ed",
    oacute: "\u00f3",
    uacute: "\u00fa",
    Aacute: "\u00c1",
    Eacute: "\u00c9",
    Iacute: "\u00cd",
    Oacute: "\u00d3",
    Uacute: "\u00da",
    ntilde: "\u00f1",
    Ntilde: "\u00d1"
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }

    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }

    return namedEntities[entity] ?? match;
  });
}

function extractArticles(text) {
  const articlePattern = /(?:^|\n)(ARTICULO\s+([0-9]+)(?:\s*[A-Z]*)?(?:[\u00ba\u00b0])?(?:\s*bis)?[^\n]*)([\s\S]*?)(?=\nARTICULO\s+[0-9]+|\nANEXO\b|$)/gi;
  const articles = [];
  let match;

  while ((match = articlePattern.exec(text)) !== null) {
    const heading = normalizeText(match[1]);
    const body = normalizeText(match[3]);
    const articleNumber = match[2];
    const suffix = articleSuffixFromHeading(heading);
    const articleKey = suffix ? `${articleNumber}-${suffix}` : articleNumber;
    const textOriginal = normalizeText(`${heading}\n${body}`);

    if (textOriginal.length < heading.length + 5) {
      continue;
    }

    articles.push({
      article: articleNumber,
      articleKey,
      label: suffix ? `Articulo ${articleNumber} ${suffix}` : `Articulo ${articleNumber}`,
      heading,
      textOriginal
    });
  }

  return dedupeArticles(articles);
}

function articleSuffixFromHeading(heading) {
  const suffixMatch = heading.match(/\b(bis|ter|quater|qu\u00e1ter)\b/i);

  if (!suffixMatch) {
    return undefined;
  }

  return suffixMatch[1].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function dedupeArticles(articles) {
  const seen = new Set();
  const result = [];

  for (const article of articles) {
    const key = `${article.articleKey}:${article.textOriginal.slice(0, 120)}`;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(article);
    }
  }

  return result;
}

function buildCandidateBundle({ id, title, url, retrievedAt, articles }) {
  const source = {
    id: "infoleg",
    name: "InfoLEG",
    sourceUrl: url,
    retrievedAt,
    official: true
  };

  const legalItem = {
    id,
    type: "LAW",
    title,
    status: "DESCONOCIDO",
    jurisdiction: {
      country: "AR",
      level: "NATIONAL"
    },
    source,
    summaryPlainLanguage: "Texto actualizado importado desde InfoLEG. Requiere validacion antes de publicarse como dato aprobado."
  };

  const provisions = articles.map((article, index) => ({
    id: `${id}-art-${article.articleKey}-${index + 1}`,
    legalItemId: id,
    type: "ARTICLE",
    label: article.label,
    order: index + 1,
    textOriginal: article.textOriginal,
    status: "DESCONOCIDO"
  }));

  const citations = provisions.map((provision, index) => ({
    id: `citation-${provision.id}`,
    sourceLegalItemId: id,
    provisionId: provision.id,
    article: articles[index].article,
    originalText: provision.textOriginal,
    sourceUrl: url,
    retrievedAt
  }));

  return {
    schemaVersion: "0.1.0",
    generatedAt: retrievedAt,
    source,
    legalItems: [legalItem],
    provisions,
    citations,
    relationships: [],
    rules: [],
    concepts: [],
    snapshots: []
  };
}

function buildParsingReport({ id, title, url, retrievedAt, contentType, htmlBuffer, plainText, articles }) {
  const countsByArticleKey = countBy(articles.map((article) => article.articleKey));
  const duplicateArticleKeys = Object.entries(countsByArticleKey)
    .filter(([, count]) => count > 1)
    .map(([articleKey, count]) => ({ articleKey, count }));
  const shortArticles = articles
    .filter((article) => article.textOriginal.length < 120)
    .map((article) => ({
      articleKey: article.articleKey,
      label: article.label,
      textLength: article.textOriginal.length
    }));
  const articlesWithInfolegNotes = articles
    .filter((article) => /\(articulo|\(nota infoleg|\(texto/i.test(article.textOriginal))
    .map((article) => ({
      articleKey: article.articleKey,
      label: article.label
    }));

  return {
    schemaVersion: "0.1.0",
    generatedAt: retrievedAt,
    source: {
      id: "infoleg",
      name: "InfoLEG",
      sourceUrl: url,
      retrievedAt,
      official: true
    },
    legalItem: {
      id,
      title
    },
    html: {
      contentType,
      bytes: htmlBuffer.length,
      sha256: createHash("sha256").update(htmlBuffer).digest("hex")
    },
    plainText: {
      characters: plainText.length
    },
    parsing: {
      articleCount: articles.length,
      duplicateArticleKeys,
      shortArticles,
      articlesWithInfolegNotes,
      warnings: buildWarnings({ duplicateArticleKeys, shortArticles })
    },
    articles: articles.map((article, index) => ({
      order: index + 1,
      article: article.article,
      articleKey: article.articleKey,
      label: article.label,
      heading: article.heading,
      textLength: article.textOriginal.length,
      preview: article.textOriginal.slice(0, 180)
    }))
  };
}

function buildWarnings({ duplicateArticleKeys, shortArticles }) {
  const warnings = [];

  if (duplicateArticleKeys.length > 0) {
    warnings.push({
      code: "DUPLICATE_ARTICLE_KEYS",
      message: "Se detectaron claves de articulo repetidas; requieren revision manual."
    });
  }

  if (shortArticles.length > 0) {
    warnings.push({
      code: "SHORT_ARTICLES",
      message: "Se detectaron articulos con texto muy corto; pueden ser encabezados o parsing incompleto."
    });
  }

  return warnings;
}

function countBy(values) {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function writeTextFile(path, text) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(resolve(path), text, "utf8");
}

function normalizeText(value) {
  return value
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fail(message) {
  console.error(`InfoLEG import failed: ${message}`);
  process.exit(1);
}
