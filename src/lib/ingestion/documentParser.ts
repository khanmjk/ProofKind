import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { XMLParser } from "fast-xml-parser";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";

export type ParsedDocument = {
  text: string;
  mimeType: string;
  parser: string;
  parserVersion: string;
};

const OFFICE_XML_PARSER = new XMLParser({
  ignoreAttributes: true,
  trimValues: true
});

const SUPPORTED_EXTENSIONS = new Set([
  ".csv",
  ".docx",
  ".gdoc",
  ".gsheet",
  ".gslides",
  ".htm",
  ".html",
  ".json",
  ".md",
  ".pdf",
  ".pptx",
  ".rtf",
  ".text",
  ".txt",
  ".xlsx",
  ".xml"
]);

export function isSupportedDocumentPath(filePath: string) {
  return SUPPORTED_EXTENSIONS.has(extname(filePath).toLowerCase());
}

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToText(value: string) {
  return normalizeText(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
  );
}

function collectPrimitiveText(value: unknown, output: string[] = []) {
  if (typeof value === "string") {
    const cleaned = value.trim();
    if (cleaned.length > 0) output.push(cleaned);
    return output;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    output.push(String(value));
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPrimitiveText(item, output));
    return output;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectPrimitiveText(item, output));
  }

  return output;
}

async function extractZipXml(data: Buffer, matcher: (name: string) => boolean) {
  const zip = await JSZip.loadAsync(data);
  const parts: string[] = [];

  for (const entry of Object.values(zip.files).filter((file) => !file.dir && matcher(file.name))) {
    const xml = await entry.async("text");
    const parsed = OFFICE_XML_PARSER.parse(xml) as unknown;
    parts.push(...collectPrimitiveText(parsed));
  }

  return normalizeText(parts.join("\n"));
}

async function parsePdf(data: Buffer) {
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  await parser.destroy();
  return normalizeText(result.text);
}

function parseGoogleWorkspacePointer(raw: string, filePath: string) {
  try {
    const pointer = JSON.parse(raw) as { url?: string; doc_id?: string; resource_id?: string };
    return normalizeText(
      [
        `${basename(filePath)} is a Google Workspace pointer file.`,
        pointer.url ? `URL: ${pointer.url}` : "",
        pointer.doc_id ? `Document ID: ${pointer.doc_id}` : "",
        pointer.resource_id ? `Resource ID: ${pointer.resource_id}` : "",
        "Full content requires the Google Drive API export connector."
      ]
        .filter(Boolean)
        .join("\n")
    );
  } catch {
    return normalizeText(raw);
  }
}

export async function parseDocumentBuffer(input: {
  fileName: string;
  data: Buffer;
  mimeType?: string;
}): Promise<ParsedDocument> {
  const extension = extname(input.fileName).toLowerCase();
  const raw = input.data;

  if ([".txt", ".text", ".md", ".csv", ".rtf", ".xml"].includes(extension)) {
    return {
      text: normalizeText(raw.toString("utf8")),
      mimeType: "text/plain",
      parser: "plain-text",
      parserVersion: "1"
    };
  }

  if ([".html", ".htm"].includes(extension)) {
    return {
      text: htmlToText(raw.toString("utf8")),
      mimeType: "text/html",
      parser: "html-stripper",
      parserVersion: "1"
    };
  }

  if (extension === ".json") {
    return {
      text: normalizeText(JSON.stringify(JSON.parse(raw.toString("utf8")), null, 2)),
      mimeType: "application/json",
      parser: "json-normalizer",
      parserVersion: "1"
    };
  }

  if ([".gdoc", ".gsheet", ".gslides"].includes(extension)) {
    return {
      text: parseGoogleWorkspacePointer(raw.toString("utf8"), input.fileName),
      mimeType: "application/vnd.google-apps.shortcut",
      parser: "google-workspace-pointer",
      parserVersion: "1"
    };
  }

  if (extension === ".pdf") {
    return {
      text: await parsePdf(raw),
      mimeType: "application/pdf",
      parser: "pdf-parse",
      parserVersion: "2"
    };
  }

  if (extension === ".docx") {
    return {
      text: await extractZipXml(raw, (name) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(name)),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      parser: "office-openxml",
      parserVersion: "1"
    };
  }

  if (extension === ".pptx") {
    return {
      text: await extractZipXml(raw, (name) => /^ppt\/(slides|notesSlides)\/.*\.xml$/.test(name)),
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      parser: "office-openxml",
      parserVersion: "1"
    };
  }

  if (extension === ".xlsx") {
    return {
      text: await extractZipXml(raw, (name) => /^xl\/(worksheets|sharedStrings).*\.xml$/.test(name)),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      parser: "office-openxml",
      parserVersion: "1"
    };
  }

  throw new Error(`Unsupported document type: ${extension}`);
}

export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  return parseDocumentBuffer({
    fileName: filePath,
    data: await readFile(filePath)
  });
}
