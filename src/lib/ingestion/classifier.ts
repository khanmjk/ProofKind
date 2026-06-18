import type { SourceSensitivity, SourceVisibility } from "@/lib/types";

export type SourceClassification = {
  documentFamily: string;
  sensitivity: SourceSensitivity;
  visibility: SourceVisibility;
  rightsStatus: "owner_provided" | "unknown" | "restricted";
};

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function classifySource(title: string, relativePath: string, text: string): SourceClassification {
  const haystack = `${title}\n${relativePath}\n${text.slice(0, 12_000)}`.toLowerCase();

  if (includesAny(haystack, ["clifton", "gallup", "personametry", "psychometric", "strengthsfinder"])) {
    return {
      documentFamily: "psychometric_report",
      sensitivity: "sensitive",
      visibility: "private_supported",
      rightsStatus: "owner_provided"
    };
  }

  if (includesAny(haystack, ["performance review", "development plan", "feedback", "scorecard", "goals"])) {
    return {
      documentFamily: "performance_feedback",
      sensitivity: "sensitive",
      visibility: "private_supported",
      rightsStatus: "owner_provided"
    };
  }

  if (includesAny(haystack, ["journal", "reflection", "decision log", "personal notes"])) {
    return {
      documentFamily: "journal_or_reflection",
      sensitivity: "highly_sensitive",
      visibility: "private",
      rightsStatus: "owner_provided"
    };
  }

  if (/\b(cv|resume|résumé|curriculum vitae|professional profile|bio)\b/i.test(haystack)) {
    return {
      documentFamily: "cv_resume",
      sensitivity: "confidential",
      visibility: "public_candidate",
      rightsStatus: "owner_provided"
    };
  }

  if (includesAny(haystack, ["blog post", "posted by", "linkedin", "youtube", "github", "conference", "article"])) {
    return {
      documentFamily: "public_footprint",
      sensitivity: "internal",
      visibility: "public_candidate",
      rightsStatus: "unknown"
    };
  }

  if (includesAny(haystack, ["proposal", "statement of work", "client", "confidential", "nda"])) {
    return {
      documentFamily: "work_sample_or_client_document",
      sensitivity: "confidential",
      visibility: "private_supported",
      rightsStatus: "restricted"
    };
  }

  return {
    documentFamily: "general_document",
    sensitivity: "internal",
    visibility: "private_supported",
    rightsStatus: "owner_provided"
  };
}
