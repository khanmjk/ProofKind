import {
  BookOpenText,
  Brain,
  BriefcaseBusiness,
  GitBranch,
  MessageSquareText,
  Network,
  ShieldCheck,
  Tags
} from "lucide-react";

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

export type KnowledgeNode = {
  id: string;
  label: string;
  kind: string;
  description: string;
  status: "ready" | "waiting" | "review";
};

export type KnowledgeEdge = {
  id: string;
  from: string;
  to: string;
  relationship: string;
  evidence: string;
};

export type DynamicTag = {
  label: string;
  group: string;
  source: string;
  confidence: "high" | "medium" | "needs_review";
};

export type TargetProfileSignal = {
  label: string;
  evidence: string;
  status: "ready" | "waiting" | "review";
};

export type VisitorQuestion = {
  question: string;
  answerMode: string;
  sampleAnswer: string;
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

export const knowledgeNodes: KnowledgeNode[] = [
  {
    id: "cv-history",
    label: "CV and resume history",
    kind: "Career timeline evidence",
    description:
      "Detected as targeted career documents. Useful for role chronology, repeated strengths, market positioning, and claims that need corroboration.",
    status: "waiting"
  },
  {
    id: "blogger",
    label: "Blogger archive",
    kind: "Public writing corpus",
    description:
      "Posts are mined for themes, argument patterns, vocabulary, intellectual interests, and representative public-thinking samples.",
    status: "waiting"
  },
  {
    id: "psychometrics",
    label: "Psychometric reports",
    kind: "Private operating-style evidence",
    description:
      "Classified as sensitive by default. Can inform owner-approved leadership and working-style statements without exposing raw reports.",
    status: "review"
  },
  {
    id: "company-history",
    label: "Company and product history",
    kind: "Entity network",
    description:
      "Companies, products, roles, domains, and public web references should be connected into a relationship graph for synthesis.",
    status: "review"
  },
  {
    id: "work-samples",
    label: "Work outputs and artifacts",
    kind: "Proof assets",
    description:
      "Documents, spreadsheets, presentations, and other outputs become private evidence first, then public-safe summaries only when approved.",
    status: "waiting"
  }
];

export const knowledgeEdges: KnowledgeEdge[] = [
  {
    id: "edge-cv-company",
    from: "CV and resume history",
    to: "Company and product history",
    relationship: "extracts employers, roles, products, and target markets",
    evidence: "CVs are timeline anchors but can overfit to specific job adverts, so claims need corroboration."
  },
  {
    id: "edge-blog-tags",
    from: "Blogger archive",
    to: "Dynamic topic tags",
    relationship: "infers themes from content, not a fixed taxonomy",
    evidence: "Blog labels are helpful, but model-generated topic clusters should be created from post content."
  },
  {
    id: "edge-psy-style",
    from: "Psychometric reports",
    to: "Leadership and operating style",
    relationship: "synthesizes private evidence into public-safe wording",
    evidence: "Raw scores stay private; owner-approved generalized style claims can become public."
  },
  {
    id: "edge-web-research",
    from: "Company and product history",
    to: "Public context research",
    relationship: "enriches extracted entities with public company/product background",
    evidence: "The agent should research public company websites and articles after the owner confirms extracted entities."
  }
];

export const dynamicTags: DynamicTag[] = [
  { label: "AI product architecture", group: "Capability", source: "Docs + profile claims", confidence: "high" },
  { label: "tenant-safe systems", group: "Architecture", source: "ProofKind build notes", confidence: "high" },
  { label: "public/private boundary", group: "Governance", source: "Architecture docs", confidence: "high" },
  { label: "leadership style", group: "Operating style", source: "Psychometrics pending", confidence: "needs_review" },
  { label: "product strategy", group: "Capability", source: "Blog + work history pending", confidence: "medium" },
  { label: "delivery pragmatism", group: "Pattern", source: "Build plan decisions", confidence: "high" },
  { label: "public writing", group: "Footprint", source: "Blogger pending", confidence: "medium" },
  { label: "company/product context", group: "Research queue", source: "CV extraction pending", confidence: "needs_review" }
];

export const targetProfileSignals: TargetProfileSignal[] = [
  {
    label: "Role intent",
    evidence: "Job spec pasted by owner becomes a target brief, not a public claim.",
    status: "ready"
  },
  {
    label: "Evidence alignment",
    evidence: "The agent maps requirements to approved claims, source-backed private claims, and visible gaps.",
    status: "review"
  },
  {
    label: "Profile generation",
    evidence: "The page can be regenerated for AI product leadership, executive operator, advisory, or founder-facing audiences.",
    status: "ready"
  },
  {
    label: "Gap interview",
    evidence: "When evidence is missing, the AI asks the owner for lived context before inventing positioning.",
    status: "ready"
  }
];

export const visitorQuestions: VisitorQuestion[] = [
  {
    question: "Who is Muhammad?",
    answerMode: "Profile overview",
    sampleAnswer:
      "Use the approved headline, summary, public sections, and strongest public claims to explain the profile in plain language.",
    status: "ready"
  },
  {
    question: "Where has he worked?",
    answerMode: "Timeline and entity graph",
    sampleAnswer:
      "Answer only from approved public timeline or public claims. If employment history is not public yet, say what is missing.",
    status: "review"
  },
  {
    question: "What is his leadership style?",
    answerMode: "Operating-style synthesis",
    sampleAnswer:
      "Use owner-approved public wording that may be privately informed by psychometrics without exposing raw reports.",
    status: "review"
  },
  {
    question: "What does he know about AI?",
    answerMode: "Capability evidence",
    sampleAnswer:
      "Cite approved AI/product/architecture claims and public writing themes once Blogger is ingested.",
    status: "ready"
  },
  {
    question: "Show me recommendations or work samples.",
    answerMode: "Artifact and recommendation gate",
    sampleAnswer:
      "Show only approved public artifact summaries, recommendations, or say that no public-approved item exists yet.",
    status: "waiting"
  }
];

export const workspaceMetrics = [
  { label: "Source streams", value: "4", icon: Network },
  { label: "Knowledge nodes", value: "5", icon: GitBranch },
  { label: "Dynamic tags", value: "8", icon: Tags },
  { label: "Draft claims", value: "18", icon: BookOpenText },
  { label: "Target variants", value: "3", icon: BriefcaseBusiness },
  { label: "Public Q&A", value: "5", icon: MessageSquareText },
  { label: "Public-ready", value: "7", icon: ShieldCheck },
  { label: "Private signals", value: "2", icon: Brain }
];

export const initialMessages = [
  {
    id: "m1",
    role: "assistant" as const,
    text:
      "I am treating the personal knowledge base as the core product. The current workspace shows how sources become classified evidence, dynamic tags, relationships, target profiles, and public-safe answers."
  },
  {
    id: "m2",
    role: "assistant" as const,
    text:
      "Drive and Blogger are ready to connect once you approve the exact sources. Until then, the graph and generated profile are a realistic preview of the workflow, not a real ingestion run."
  }
];
