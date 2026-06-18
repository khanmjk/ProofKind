import { BarChart3, BookOpenText, Brain, BriefcaseBusiness, Network, ShieldCheck } from "lucide-react";

export type ProfileVariantId = "operator" | "ai-product" | "writing";

export type ProfileVariant = {
  id: ProfileVariantId;
  label: string;
  audience: string;
  headline: string;
  summary: string;
  accent: string;
  themes: Array<{ label: string; signal: string }>;
};

export type ReviewClaim = {
  id: string;
  text: string;
  evidence: string;
  sourceTypes: string[];
  status: "approved" | "needs_edit" | "draft";
};

export type EvidenceSource = {
  id: string;
  label: string;
  kind: string;
  signal: string;
  status: "ready" | "waiting" | "review";
};

export const profileVariants: ProfileVariant[] = [
  {
    id: "ai-product",
    label: "AI Product Leader",
    audience: "Founders, product executives, and transformation leads",
    headline: "AI product strategist who turns ambiguous platform ideas into evidence-backed execution.",
    summary:
      "A public profile centered on AI product thinking, tenant-safe architecture, source-backed claims, and pragmatic delivery judgement.",
    accent: "#10605a",
    themes: [
      { label: "AI systems", signal: "agentic workflows, policy boundaries, grounded generation" },
      { label: "Product judgement", signal: "thin slices, validation loops, pragmatic sequencing" },
      { label: "Architecture", signal: "multi-tenant data spine, public/private separation" },
      { label: "Evidence craft", signal: "claims tied back to source material and review gates" }
    ]
  },
  {
    id: "operator",
    label: "Executive Operator",
    audience: "Recruiters, senior hiring managers, and operating executives",
    headline: "Operator who brings structure, commercial judgement, and technical clarity to complex delivery.",
    summary:
      "A concise executive profile that emphasizes leadership patterns, delivery discipline, stakeholder clarity, and public-safe proof.",
    accent: "#245d8f",
    themes: [
      { label: "Delivery spine", signal: "scope discipline, phased execution, operational controls" },
      { label: "Stakeholder clarity", signal: "translation between business and technical teams" },
      { label: "Commercial pragmatism", signal: "frugal stack choices, budget guardrails, useful tradeoffs" },
      { label: "Review discipline", signal: "adversarial review, quality gates, decision records" }
    ]
  },
  {
    id: "writing",
    label: "Writing-Led Profile",
    audience: "People evaluating thinking quality before a conversation",
    headline: "A systems thinker whose public writing reveals how he frames product, AI, and operating problems.",
    summary:
      "A thought-leadership profile that foregrounds Blogger themes, recurring ideas, and the evolution of professional judgement over time.",
    accent: "#9f3a32",
    themes: [
      { label: "Public thinking", signal: "blog themes, argument patterns, written synthesis" },
      { label: "Learning loops", signal: "reflection, iteration, critique, sharper positioning" },
      { label: "Technology strategy", signal: "AI, software tooling, platform choices" },
      { label: "Narrative proof", signal: "claims supported by writing and source-backed examples" }
    ]
  }
];

export const reviewClaims: ReviewClaim[] = [
  {
    id: "claim-architecture",
    text: "Designs AI products as tenant-safe systems with clear public/private retrieval boundaries.",
    evidence: "Supported by ProofKind architecture docs, connector design, and public profile boundary decisions.",
    sourceTypes: ["Drive docs", "Architecture notes"],
    status: "approved"
  },
  {
    id: "claim-product",
    text: "Uses thin implementation slices to prove technical capability before scaling platform breadth.",
    evidence: "Supported by build-plan pivots, Phase 1 implementation commits, and CLI-first connector decisions.",
    sourceTypes: ["Build plan", "GitHub"],
    status: "approved"
  },
  {
    id: "claim-writing",
    text: "Connects product strategy, AI tooling, and practical delivery through long-form public writing.",
    evidence: "Waiting for Blogger ingestion before this claim can be promoted from draft to approved.",
    sourceTypes: ["Blogger"],
    status: "needs_edit"
  },
  {
    id: "claim-style",
    text: "Combines structured thinking with candid review loops to harden architecture and product direction.",
    evidence: "Supported by Claude review processing and documented architecture revisions.",
    sourceTypes: ["Review notes", "Docs"],
    status: "draft"
  }
];

export const evidenceSources: EvidenceSource[] = [
  {
    id: "drive",
    label: "Google Drive",
    kind: "Primary corpus",
    signal: "Selected folder export connector ready; awaiting approved folder ID and OAuth.",
    status: "waiting"
  },
  {
    id: "blogger",
    label: "Blogger",
    kind: "Public writing",
    signal: "Feed connector ready; awaiting approved blog URL.",
    status: "waiting"
  },
  {
    id: "docs",
    label: "ProofKind Docs",
    kind: "Product evidence",
    signal: "Architecture, product vision, and build-plan documents available in repo.",
    status: "ready"
  },
  {
    id: "psychometrics",
    label: "Psychometric Reports",
    kind: "Private operating-style evidence",
    signal: "Classified private-supported; public wording requires owner approval.",
    status: "review"
  }
];

export const workspaceMetrics = [
  { label: "Source streams", value: "4", icon: Network },
  { label: "Draft claims", value: "18", icon: BookOpenText },
  { label: "Public-ready", value: "7", icon: ShieldCheck },
  { label: "Profile variants", value: "3", icon: BriefcaseBusiness },
  { label: "Evidence gaps", value: "5", icon: BarChart3 },
  { label: "Private signals", value: "2", icon: Brain }
];

export const initialMessages = [
  {
    id: "m1",
    role: "assistant" as const,
    text:
      "I prepared three profile directions from the current ProofKind evidence model. Drive and Blogger are ready to connect once you approve the exact sources."
  },
  {
    id: "m2",
    role: "assistant" as const,
    text:
      "The AI Product Leader version is strongest for the first generated preview. It keeps the public claims grounded and gives the fit advisor enough signal."
  }
];
