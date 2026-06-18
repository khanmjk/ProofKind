import { stableDocId } from "@/lib/common/hash";
import type { SourceChunk, SourceSensitivity, SourceVisibility } from "@/lib/types";

type ChunkInput = {
  tenantId: string;
  sourceItemId: string;
  sourceVersionId: string;
  text: string;
  parser: string;
  parserVersion: string;
  sensitivity: SourceSensitivity;
  visibility: SourceVisibility;
  rightsStatus: "owner_provided" | "unknown" | "restricted";
  createdAt: string;
  createdBy: string;
};

const MAX_CHARS = 4_800;
const OVERLAP_CHARS = 450;

function cleanText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitAtBoundary(text: string, targetEnd: number) {
  const paragraph = text.lastIndexOf("\n\n", targetEnd);
  if (paragraph > targetEnd - 1_200) return paragraph + 2;

  const sentence = text.lastIndexOf(". ", targetEnd);
  if (sentence > targetEnd - 900) return sentence + 2;

  const whitespace = text.lastIndexOf(" ", targetEnd);
  if (whitespace > targetEnd - 300) return whitespace + 1;

  return targetEnd;
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function chunkText(input: ChunkInput): SourceChunk[] {
  const text = cleanText(input.text);
  const chunks: SourceChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const hardEnd = Math.min(start + MAX_CHARS, text.length);
    const end = hardEnd === text.length ? hardEnd : splitAtBoundary(text, hardEnd);
    const chunkTextValue = text.slice(start, end).trim();

    if (chunkTextValue.length > 0) {
      const contentHash = stableDocId("chunk", chunkTextValue);
      chunks.push({
        id: `${input.sourceVersionId}_${chunks.length.toString().padStart(4, "0")}`,
        schemaVersion: 1,
        tenantId: input.tenantId,
        sourceItemId: input.sourceItemId,
        sourceVersionId: input.sourceVersionId,
        chunkType: "text",
        text: chunkTextValue,
        contentHash,
        pageNumber: null,
        spanStart: start,
        spanEnd: end,
        parser: input.parser,
        parserVersion: input.parserVersion,
        sensitivity: input.sensitivity,
        visibility: input.visibility,
        rightsStatus: input.rightsStatus,
        tokenEstimate: estimateTokens(chunkTextValue),
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
        createdBy: input.createdBy,
        updatedBy: input.createdBy
      });
    }

    if (end === text.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }

  return chunks;
}
