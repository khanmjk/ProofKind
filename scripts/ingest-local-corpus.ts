import { extname, resolve } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { sha256, stableDocId } from "@/lib/common/hash";
import { chunkText } from "@/lib/ingestion/chunker";
import { classifySource } from "@/lib/ingestion/classifier";
import { parseDocument } from "@/lib/ingestion/documentParser";
import { discoverLocalFiles } from "@/lib/ingestion/localDiscovery";
import { CorpusRepository } from "@/lib/repositories/corpusRepository";
import type { SourceItem, SourceRoot, SourceVersion } from "@/lib/types";

type Args = {
  root: string;
  tenant: string;
  ownerUid: string;
  displayName: string;
  maxFiles: number;
  maxBytes: number;
};

function argValue(name: string, fallback?: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function parseArgs(): Args {
  const root = argValue("--root");

  if (!root) {
    throw new Error("Missing required --root /path/to/approved/source/folder");
  }

  return {
    root: resolve(root),
    tenant: argValue("--tenant", "founder-mjk") ?? "founder-mjk",
    ownerUid: argValue("--owner-uid", "owner-mjk") ?? "owner-mjk",
    displayName: argValue("--display-name", "Local professional corpus") ?? "Local professional corpus",
    maxFiles: Number(argValue("--max-files", "200")),
    maxBytes: Number(argValue("--max-bytes", `${30 * 1024 * 1024}`))
  };
}

async function main() {
  const args = parseArgs();
  const rootStats = await stat(args.root);

  if (!rootStats.isDirectory()) {
    throw new Error(`--root must be a directory: ${args.root}`);
  }

  const now = new Date().toISOString();
  const repository = new CorpusRepository();
  const rootId = stableDocId("source_root", `${args.tenant}:${args.root}`);
  const root: SourceRoot = {
    id: rootId,
    schemaVersion: 1,
    tenantId: args.tenant,
    connectorId: "local-folder",
    displayName: args.displayName,
    rootUri: args.root,
    status: "active",
    createdAt: now,
    updatedAt: now,
    createdBy: args.ownerUid,
    updatedBy: args.ownerUid
  };

  await repository.upsertSourceRoot(root);

  const files = await discoverLocalFiles(args.root, { maxFiles: args.maxFiles });
  let parsedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let chunkCount = 0;

  for (const file of files) {
    const itemId = stableDocId("source", `${rootId}:${file.relativePath}`);
    const fileHash = file.size <= args.maxBytes ? sha256(await readFile(file.absolutePath)) : "too_large";
    const versionId = stableDocId("version", `${itemId}:${fileHash}:${file.modifiedAt}`);
    const extension = extname(file.absolutePath).toLowerCase();
    const sourceType = [".gdoc", ".gsheet", ".gslides"].includes(extension)
      ? "google_workspace_pointer"
      : "file";
    const baseItem: SourceItem = {
      id: itemId,
      schemaVersion: 1,
      tenantId: args.tenant,
      connectorInstallId: rootId,
      connectorId: "local-folder",
      sourceType,
      externalId: stableDocId("local_file", file.relativePath),
      externalUrl: "",
      title: file.relativePath.split("/").at(-1) ?? file.relativePath,
      mimeType: "application/octet-stream",
      parents: file.relativePath.split("/").slice(0, -1),
      resolvedPath: file.relativePath,
      ownerAtSource: args.ownerUid,
      createdAtSource: null,
      modifiedAtSource: file.modifiedAt,
      firstSeenAt: now,
      lastSeenAt: now,
      lastFetchedAt: now,
      lastParsedAt: null,
      currentVersionId: null,
      refreshPolicy: "manual",
      processingStatus: "discovered",
      visibilityDefault: "private_supported",
      sensitivityDefault: "internal",
      rightsStatus: "owner_provided",
      deletedAtSource: null,
      createdAt: now,
      updatedAt: now,
      createdBy: args.ownerUid,
      updatedBy: args.ownerUid
    };

    try {
      if (file.size > args.maxBytes) {
        throw new Error(`File exceeds --max-bytes (${file.size} bytes)`);
      }

      const parsed = await parseDocument(file.absolutePath);
      const classification = classifySource(baseItem.title, file.relativePath, parsed.text);
      const chunks = chunkText({
        tenantId: args.tenant,
        sourceItemId: itemId,
        sourceVersionId: versionId,
        text: parsed.text,
        parser: parsed.parser,
        parserVersion: parsed.parserVersion,
        sensitivity: classification.sensitivity,
        visibility: classification.visibility,
        rightsStatus: classification.rightsStatus,
        createdAt: now,
        createdBy: args.ownerUid
      });

      const sourceItem: SourceItem = {
        ...baseItem,
        mimeType: parsed.mimeType,
        lastParsedAt: now,
        currentVersionId: versionId,
        processingStatus: chunks.length ? "parsed" : "skipped",
        visibilityDefault: classification.visibility,
        sensitivityDefault: classification.sensitivity,
        rightsStatus: classification.rightsStatus,
        updatedAt: now,
        updatedBy: args.ownerUid
      };

      const sourceVersion: SourceVersion = {
        id: versionId,
        schemaVersion: 1,
        tenantId: args.tenant,
        sourceItemId: itemId,
        connectorInstallId: rootId,
        versionKey: `${file.modifiedAt}:${fileHash.slice(0, 16)}`,
        contentHash: fileHash,
        sourceModifiedAt: file.modifiedAt,
        fetchedAt: now,
        originalStoragePath: `local://${file.absolutePath}`,
        exportedStoragePaths: [],
        parser: parsed.parser,
        parserVersion: parsed.parserVersion,
        parseStatus: chunks.length ? "parsed" : "skipped",
        classificationStatus: "classified",
        embeddingStatus: "not_started",
        extractionStatus: "not_started",
        supersededByVersionId: null,
        documentFamily: classification.documentFamily,
        sensitivity: classification.sensitivity,
        visibility: classification.visibility,
        wordCount: parsed.text.split(/\s+/).filter(Boolean).length,
        errorSummary: chunks.length ? null : "Parsed text was empty.",
        createdAt: now,
        updatedAt: now,
        createdBy: args.ownerUid,
        updatedBy: args.ownerUid
      };

      await repository.upsertParsedSource({ sourceItem, sourceVersion, chunks });
      parsedCount += chunks.length ? 1 : 0;
      skippedCount += chunks.length ? 0 : 1;
      chunkCount += chunks.length;
      console.log(`parsed ${file.relativePath} -> ${chunks.length} chunks`);
    } catch (caught) {
      const errorSummary = caught instanceof Error ? caught.message : "Unknown parse error";
      const sourceItem: SourceItem = {
        ...baseItem,
        processingStatus: "failed",
        updatedAt: now,
        updatedBy: args.ownerUid
      };
      const sourceVersion: SourceVersion = {
        id: versionId,
        schemaVersion: 1,
        tenantId: args.tenant,
        sourceItemId: itemId,
        connectorInstallId: rootId,
        versionKey: `${file.modifiedAt}:failed`,
        contentHash: fileHash,
        sourceModifiedAt: file.modifiedAt,
        fetchedAt: now,
        originalStoragePath: `local://${file.absolutePath}`,
        exportedStoragePaths: [],
        parser: "unparsed",
        parserVersion: "1",
        parseStatus: "failed",
        classificationStatus: "failed",
        embeddingStatus: "not_started",
        extractionStatus: "not_started",
        supersededByVersionId: null,
        documentFamily: "unknown",
        sensitivity: "internal",
        visibility: "private_supported",
        wordCount: 0,
        errorSummary,
        createdAt: now,
        updatedAt: now,
        createdBy: args.ownerUid,
        updatedBy: args.ownerUid
      };

      await repository.upsertParsedSource({ sourceItem, sourceVersion, chunks: [] });
      failedCount += 1;
      console.warn(`failed ${file.relativePath}: ${errorSummary}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        root: args.root,
        tenant: args.tenant,
        discovered: files.length,
        parsed: parsedCount,
        skipped: skippedCount,
        failed: failedCount,
        chunks: chunkCount
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
