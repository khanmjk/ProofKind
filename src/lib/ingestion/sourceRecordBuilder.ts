import { sha256, stableDocId } from "@/lib/common/hash";
import { chunkText } from "@/lib/ingestion/chunker";
import { classifySource, type SourceClassification } from "@/lib/ingestion/classifier";
import type { ParsedDocument } from "@/lib/ingestion/documentParser";
import type { SourceChunk, SourceItem, SourceVersion } from "@/lib/types";

export type SourceRecordInput = {
  tenantId: string;
  ownerUid: string;
  connectorInstallId: string;
  connectorId: string;
  sourceType: SourceItem["sourceType"];
  sourceIdentity: string;
  title: string;
  resolvedPath: string;
  parents: string[];
  externalUrl: string;
  ownerAtSource: string;
  createdAtSource: string | null;
  modifiedAtSource: string | null;
  originalStoragePath: string;
  parsed: ParsedDocument;
  now: string;
  classification?: SourceClassification;
};

export type SourceRecordOutput = {
  sourceItem: SourceItem;
  sourceVersion: SourceVersion;
  chunks: SourceChunk[];
};

export function buildParsedSourceRecords(input: SourceRecordInput): SourceRecordOutput {
  const classification =
    input.classification ?? classifySource(input.title, input.resolvedPath, input.parsed.text);
  const sourceItemId = stableDocId("source", `${input.tenantId}:${input.connectorId}:${input.sourceIdentity}`);
  const contentHash = sha256(input.parsed.text);
  const sourceModifiedAt = input.modifiedAtSource ?? input.now;
  const sourceVersionId = stableDocId("version", `${sourceItemId}:${contentHash}:${sourceModifiedAt}`);
  const chunks = chunkText({
    tenantId: input.tenantId,
    sourceItemId,
    sourceVersionId,
    text: input.parsed.text,
    parser: input.parsed.parser,
    parserVersion: input.parsed.parserVersion,
    sensitivity: classification.sensitivity,
    visibility: classification.visibility,
    rightsStatus: classification.rightsStatus,
    createdAt: input.now,
    createdBy: input.ownerUid
  });

  const sourceItem: SourceItem = {
    id: sourceItemId,
    schemaVersion: 1,
    tenantId: input.tenantId,
    connectorInstallId: input.connectorInstallId,
    connectorId: input.connectorId,
    sourceType: input.sourceType,
    externalId: input.sourceIdentity,
    externalUrl: input.externalUrl,
    title: input.title,
    mimeType: input.parsed.mimeType,
    parents: input.parents,
    resolvedPath: input.resolvedPath,
    ownerAtSource: input.ownerAtSource,
    createdAtSource: input.createdAtSource,
    modifiedAtSource: input.modifiedAtSource,
    firstSeenAt: input.now,
    lastSeenAt: input.now,
    lastFetchedAt: input.now,
    lastParsedAt: input.now,
    currentVersionId: sourceVersionId,
    refreshPolicy: "manual",
    processingStatus: chunks.length ? "parsed" : "skipped",
    visibilityDefault: classification.visibility,
    sensitivityDefault: classification.sensitivity,
    rightsStatus: classification.rightsStatus,
    deletedAtSource: null,
    createdAt: input.now,
    updatedAt: input.now,
    createdBy: input.ownerUid,
    updatedBy: input.ownerUid
  };

  const sourceVersion: SourceVersion = {
    id: sourceVersionId,
    schemaVersion: 1,
    tenantId: input.tenantId,
    sourceItemId,
    connectorInstallId: input.connectorInstallId,
    versionKey: `${sourceModifiedAt}:${contentHash.slice(0, 16)}`,
    contentHash,
    sourceModifiedAt: input.modifiedAtSource,
    fetchedAt: input.now,
    originalStoragePath: input.originalStoragePath,
    exportedStoragePaths: [],
    parser: input.parsed.parser,
    parserVersion: input.parsed.parserVersion,
    parseStatus: chunks.length ? "parsed" : "skipped",
    classificationStatus: "classified",
    embeddingStatus: "not_started",
    extractionStatus: "not_started",
    supersededByVersionId: null,
    documentFamily: classification.documentFamily,
    sensitivity: classification.sensitivity,
    visibility: classification.visibility,
    wordCount: input.parsed.text.split(/\s+/).filter(Boolean).length,
    errorSummary: chunks.length ? null : "Parsed text was empty.",
    createdAt: input.now,
    updatedAt: input.now,
    createdBy: input.ownerUid,
    updatedBy: input.ownerUid
  };

  return { sourceItem, sourceVersion, chunks };
}
