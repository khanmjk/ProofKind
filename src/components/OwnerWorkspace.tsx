"use client";

import {
  Bot,
  BookOpenText,
  Building2,
  Check,
  ChevronRight,
  Code2,
  Eye,
  FileCheck2,
  GitBranch,
  Globe2,
  LayoutTemplate,
  MessageCircleQuestion,
  MessageSquareText,
  Network,
  Palette,
  Send,
  ShieldCheck,
  Sparkles,
  SplitSquareHorizontal,
  Tags,
  Target,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  dynamicTags,
  evidenceSources,
  initialMessages,
  knowledgeEdges,
  knowledgeNodes,
  profileVariants,
  reviewClaims,
  targetProfileSignals,
  visitorQuestions,
  workspaceMetrics,
  type ProfileVariant
} from "@/lib/ownerWorkspace/sampleExperience";
import styles from "@/components/OwnerWorkspace.module.css";

type TabId = "knowledge" | "target" | "public-chat" | "preview" | "claims" | "evidence" | "design" | "publish";

type Message = {
  id: string;
  role: "owner" | "assistant";
  text: string;
};

type StatusValue = "approved" | "needs_edit" | "draft" | "ready" | "waiting" | "review";

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "knowledge", label: "Knowledge Base", icon: Network },
  { id: "target", label: "Target Profile", icon: Target },
  { id: "public-chat", label: "Public Q&A", icon: MessageCircleQuestion },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "claims", label: "Claims", icon: FileCheck2 },
  { id: "evidence", label: "Evidence", icon: SplitSquareHorizontal },
  { id: "design", label: "Design", icon: Palette },
  { id: "publish", label: "Publish", icon: ShieldCheck }
];

function assistantReply(message: string, variant: ProfileVariant) {
  const lower = message.toLowerCase();

  if (lower.includes("job") || lower.includes("spec") || lower.includes("advert") || lower.includes("target")) {
    return "I treated that as a target-profile request. The job spec becomes a private targeting brief, then I map requirements to approved claims, source-backed private evidence, gaps, and a generated public page direction.";
  }

  if (lower.includes("knowledge") || lower.includes("graph") || lower.includes("classif") || lower.includes("tag")) {
    return "I opened the knowledge-base view. The engine should classify each source, create dynamic tags from the content, connect entities and relationships, and queue public research for companies and products.";
  }

  if (lower.includes("who is") || lower.includes("public chat") || lower.includes("visitor") || lower.includes("leadership")) {
    return "I broadened the public assistant direction. Visitors should be able to ask general questions, but every answer must come from approved public profile data, public claims, or public-safe artifact summaries.";
  }

  if (lower.includes("blog") || lower.includes("writing")) {
    return "I shifted the preview toward public writing. Blogger evidence will strengthen the Writing And Thinking section once you approve the blog URL.";
  }

  if (lower.includes("premium") || lower.includes("design") || lower.includes("beautiful")) {
    return `I tightened the ${variant.label} concept: stronger editorial hierarchy, quieter chrome, and clearer proof blocks. The publish path stays renderer-controlled.`;
  }

  if (lower.includes("proof") || lower.includes("evidence") || lower.includes("claim")) {
    return "I moved the claim review forward. Two claims are ready, one needs Blogger evidence, and one needs owner wording before it should become public.";
  }

  return `I updated the working direction around ${variant.label}. The preview, claims, and publish checklist are ready for review.`;
}

function tabForMessage(message: string): TabId | null {
  const lower = message.toLowerCase();

  if (lower.includes("job") || lower.includes("spec") || lower.includes("advert") || lower.includes("target")) {
    return "target";
  }

  if (lower.includes("knowledge") || lower.includes("graph") || lower.includes("classif") || lower.includes("tag")) {
    return "knowledge";
  }

  if (lower.includes("who is") || lower.includes("public chat") || lower.includes("visitor") || lower.includes("leadership")) {
    return "public-chat";
  }

  if (lower.includes("claim") || lower.includes("proof") || lower.includes("evidence")) return "claims";
  if (lower.includes("design") || lower.includes("premium") || lower.includes("beautiful")) return "design";
  if (lower.includes("publish")) return "publish";

  return null;
}

function artifactDescription(tab: TabId, variant: ProfileVariant) {
  if (tab === "knowledge") {
    return "How ProofKind turns approved sources into classified evidence, dynamic tags, entities, relationships, and research queues.";
  }

  if (tab === "target") {
    return "How a pasted job spec becomes a private targeting brief and a generated public profile direction.";
  }

  if (tab === "public-chat") {
    return "How public visitors can ask broad questions while the assistant stays inside approved public data.";
  }

  if (tab === "preview") return variant.summary;
  if (tab === "claims") return "Review generated claims, evidence summaries, source types, and publish readiness.";
  if (tab === "evidence") return "Inspect source streams before anything becomes public.";
  if (tab === "design") return "Review the generated profile experience, renderer blocks, and publication safety model.";

  return "Final approval gate for source readiness, target profile approval, public Q&A scope, and publication.";
}

function StatusPill({ status }: { status: StatusValue }) {
  const label = status.replace("_", " ");
  const className =
    status === "ready" || status === "approved"
      ? styles.statusReady
      : status === "waiting" || status === "needs_edit"
        ? styles.statusWaiting
        : status === "review"
          ? styles.statusReview
          : styles.statusDraft;

  return <span className={`${styles.smallPill} ${className}`}>{label}</span>;
}

function PreviewArtifact({ variant }: { variant: ProfileVariant }) {
  return (
    <div className={styles.previewFrame}>
      <div className={styles.publicMock}>
        <section className={styles.mockHero}>
          <div>
            <span className={styles.smallPill} style={{ color: variant.accent }}>
              {variant.audience}
            </span>
            <h3>{variant.headline}</h3>
            <p>{variant.summary}</p>
            <div className={styles.quickActions}>
              <button className={`${styles.button} ${styles.buttonPrimary}`} type="button">
                <MessageSquareText size={16} />
                Ask this profile
              </button>
              <button className={styles.button} type="button">
                <ChevronRight size={16} />
                Book conversation
              </button>
            </div>
          </div>
          <aside className={styles.mockPanel}>
            <h4>Public profile answer</h4>
            <p>
              Answers questions about experience, AI, leadership style, recommendations,
              work samples, or role fit using approved public data only.
            </p>
            <StatusPill status="ready" />
          </aside>
        </section>
        <section className={styles.themeGrid}>
          {variant.themes.map((theme) => (
            <div className={styles.themeTile} key={theme.label}>
              <strong>{theme.label}</strong>
              <span>{theme.signal}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function KnowledgeArtifact() {
  return (
    <div className={styles.knowledgeLayout}>
      <section className={styles.knowledgePanel}>
        <div className={styles.panelHeading}>
          <h3>
            <GitBranch size={16} />
            Classified knowledge graph
          </h3>
          <p>Private tenant graph first; public profile materialization only after owner approval.</p>
        </div>
        <div className={styles.nodeStack}>
          {knowledgeNodes.map((node) => (
            <article className={styles.nodeCard} key={node.id}>
              <div>
                <h4>{node.label}</h4>
                <p>{node.description}</p>
              </div>
              <div className={styles.nodeMeta}>
                <span className={styles.smallPill}>{node.kind}</span>
                <StatusPill status={node.status} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className={styles.knowledgePanel}>
        <div className={styles.panelHeading}>
          <h3>
            <Tags size={16} />
            Dynamic tags
          </h3>
          <p>Tags should be inferred from content and revised as the corpus changes.</p>
        </div>
        <div className={styles.tagCloud}>
          {dynamicTags.map((tag) => (
            <span className={styles.tagPill} key={`${tag.group}-${tag.label}`}>
              <strong>{tag.label}</strong>
              <small>{tag.group} / {tag.confidence.replace("_", " ")}</small>
            </span>
          ))}
        </div>

        <div className={styles.panelHeading}>
          <h3>
            <Building2 size={16} />
            Relationships and research
          </h3>
          <p>Extracted employers, products, and public references become a reviewable research queue.</p>
        </div>
        <div className={styles.edgeList}>
          {knowledgeEdges.map((edge) => (
            <article className={styles.edgeItem} key={edge.id}>
              <strong>{edge.from} {"->"} {edge.to}</strong>
              <span>{edge.relationship}</span>
              <p>{edge.evidence}</p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

function TargetArtifact({ variant }: { variant: ProfileVariant }) {
  return (
    <div className={styles.targetLayout}>
      <section className={styles.jobSpecBox}>
        <div className={styles.panelHeading}>
          <h3>
            <Target size={16} />
            Targeting brief from job spec
          </h3>
          <p>Paste or upload a job spec. The AI should map requirements to evidence before generating a page.</p>
        </div>
        <div className={styles.mockTextarea}>
          Senior AI Product Leader needed to shape agentic customer experiences, govern data boundaries,
          work with engineering leaders, explain tradeoffs to executives, and turn ambiguous ideas into
          shipped platform capability.
        </div>
      </section>

      <section className={styles.knowledgePanel}>
        <div className={styles.panelHeading}>
          <h3>
            <BookOpenText size={16} />
            Generated target profile
          </h3>
          <p>{variant.label}: {variant.headline}</p>
        </div>
        <div className={styles.alignmentList}>
          {targetProfileSignals.map((signal) => (
            <article className={styles.alignmentItem} key={signal.label}>
              <div>
                <h4>{signal.label}</h4>
                <p>{signal.evidence}</p>
              </div>
              <StatusPill status={signal.status} />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionPlan}>
        <h3>Page plan for this target</h3>
        <div className={styles.themeGridCompact}>
          {variant.themes.map((theme) => (
            <article className={styles.themeTile} key={theme.label}>
              <strong>{theme.label}</strong>
              <span>{theme.signal}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PublicChatArtifact() {
  return (
    <div className={styles.questionList}>
      <section className={styles.knowledgePanel}>
        <div className={styles.panelHeading}>
          <h3>
            <Globe2 size={16} />
            Public visitor assistant
          </h3>
          <p>
            The public chat is not only a fit checker. It should answer broad profile questions,
            but only from approved public sections, claims, and artifact summaries.
          </p>
        </div>
      </section>

      {visitorQuestions.map((item) => (
        <article className={styles.questionRow} key={item.question}>
          <div>
            <h3>{item.question}</h3>
            <span className={styles.answerMode}>{item.answerMode}</span>
            <p>{item.sampleAnswer}</p>
          </div>
          <StatusPill status={item.status} />
        </article>
      ))}
    </div>
  );
}

function ClaimsArtifact() {
  return (
    <div className={styles.claimsList}>
      {reviewClaims.map((claim) => (
        <article className={styles.claimReview} key={claim.id}>
          <div>
            <h3>{claim.text}</h3>
            <p>{claim.evidence}</p>
            <div className={styles.quickActions}>
              {claim.sourceTypes.map((source) => (
                <span className={styles.smallPill} key={source}>
                  {source}
                </span>
              ))}
              <StatusPill status={claim.status} />
            </div>
          </div>
          <div className={styles.claimActions}>
            <button className={styles.iconButton} type="button" aria-label={`Approve ${claim.id}`}>
              <Check size={16} />
            </button>
            <button className={styles.iconButton} type="button" aria-label={`Revise ${claim.id}`}>
              <Sparkles size={16} />
            </button>
            <button className={`${styles.iconButton} ${styles.buttonDanger}`} type="button" aria-label={`Reject ${claim.id}`}>
              <X size={16} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function EvidenceArtifact() {
  return (
    <div className={styles.sourceList}>
      {evidenceSources.map((source) => (
        <article className={styles.sourceRow} key={source.id}>
          <div>
            <h3>{source.label}</h3>
            <p>
              {source.kind}: {source.signal}
            </p>
          </div>
          <StatusPill status={source.status} />
        </article>
      ))}
    </div>
  );
}

function DesignArtifact({ variant }: { variant: ProfileVariant }) {
  return (
    <div className={styles.designGrid}>
      <article className={styles.designBlock}>
        <h3>Audience</h3>
        <p>{variant.audience}</p>
      </article>
      <article className={styles.designBlock}>
        <h3>Tone</h3>
        <p>Direct, evidence-backed, candid, premium, and less resume-like.</p>
      </article>
      <article className={styles.designBlock}>
        <h3>Renderer Blocks</h3>
        <p>Hero, proof themes, claim explorer, target profile sections, writing highlights, operating style, public assistant, booking CTA.</p>
      </article>
      <article className={styles.designBlock}>
        <h3>Safety</h3>
        <p>Interactive preview can be sandboxed. Published output uses approved public data and renderer-controlled components.</p>
      </article>
    </div>
  );
}

function PublishArtifact() {
  const items: Array<[string, string, StatusValue]> = [
    ["Drive source approved", "Waiting for folder ID and OAuth.", "waiting"],
    ["Blogger source approved", "Waiting for blog URL.", "waiting"],
    ["Knowledge graph reviewed", "Classifications, tags, entities, and research queue require owner review.", "review"],
    ["Target profile approved", "A job-spec-specific page must be approved before publishing.", "review"],
    ["Public Q&A boundary", "Visitor chat reads approved public profile material only.", "ready"],
    ["Claims reviewed", "Two approved, two still need review.", "review"],
    ["Preview approved", "AI Product Leader preview selected.", "ready"],
    ["Public boundary", "Public assistant reads materialized public data only.", "ready"]
  ];

  return (
    <div className={styles.publishList}>
      {items.map(([title, body, status]) => (
        <article className={styles.publishItem} key={title}>
          <div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
          <StatusPill status={status} />
        </article>
      ))}
      <div className={styles.publishActions}>
        <button className={styles.button} type="button">
          <Code2 size={16} />
          Stage preview
        </button>
        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" disabled>
          <ShieldCheck size={16} />
          Publish
        </button>
      </div>
    </div>
  );
}

function ArtifactBody({ tab, variant }: { tab: TabId; variant: ProfileVariant }) {
  if (tab === "knowledge") return <KnowledgeArtifact />;
  if (tab === "target") return <TargetArtifact variant={variant} />;
  if (tab === "public-chat") return <PublicChatArtifact />;
  if (tab === "claims") return <ClaimsArtifact />;
  if (tab === "evidence") return <EvidenceArtifact />;
  if (tab === "design") return <DesignArtifact variant={variant} />;
  if (tab === "publish") return <PublishArtifact />;
  return <PreviewArtifact variant={variant} />;
}

export function OwnerWorkspace() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("knowledge");
  const [activeVariantId, setActiveVariantId] = useState(profileVariants[0].id);
  const activeVariant = useMemo(
    () => profileVariants.find((variant) => variant.id === activeVariantId) ?? profileVariants[0],
    [activeVariantId]
  );

  function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "owner", text: value },
      { id: crypto.randomUUID(), role: "assistant", text: assistantReply(value, activeVariant) }
    ]);
    setActiveTab(tabForMessage(value) ?? activeTab);
    setDraft("");
  }

  function runQuickAction(text: string) {
    setDraft(text);
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>PK</span>
          <span>ProofKind Studio</span>
        </div>
        <div className={styles.topbarMeta}>
          <span className={styles.statusPill}>Knowledge graph draft</span>
          <span className={styles.statusPill}>Drive waiting</span>
          <span className={styles.statusPill}>Blogger waiting</span>
          <span className={styles.statusPill}>Gemini fallback</span>
        </div>
      </header>

      <div className={styles.appGrid}>
        <section className={styles.chatPane} aria-label="Owner conversation">
          <div>
            <div className={styles.chatHeader}>
              <h1>Professional knowledge session</h1>
              <p>
                Build the private professional knowledge base first, then generate
                targeted public profiles and approved visitor answers from it.
              </p>
            </div>
            <div className={styles.metricGrid}>
              {workspaceMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div className={styles.metric} key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>
                      <Icon size={15} />
                      {metric.value}
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.messages}>
            {messages.map((message) => (
              <div
                className={`${styles.message} ${
                  message.role === "assistant" ? styles.assistantMessage : styles.ownerMessage
                }`}
                key={message.id}
              >
                {message.role === "assistant" ? <Bot size={16} /> : null}
                {message.text}
              </div>
            ))}
          </div>

          <form className={styles.composer} onSubmit={submitMessage}>
            <div className={styles.quickActions}>
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  setActiveTab("knowledge");
                  runQuickAction("Map the knowledge graph and show me the source classifications.");
                }}
              >
                <Network size={15} />
                Map knowledge
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  setActiveTab("target");
                  runQuickAction("Use this job spec to generate a targeted public profile.");
                }}
              >
                <Target size={15} />
                Target job spec
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  setActiveTab("public-chat");
                  runQuickAction("Show me what public visitors can ask about Muhammad.");
                }}
              >
                <MessageCircleQuestion size={15} />
                Public Q&A
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask ProofKind to classify sources, map relationships, target a job spec, or revise the public profile."
            />
            <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit">
              <Send size={16} />
              Send
            </button>
          </form>
        </section>

        <section className={styles.artifactPane} aria-label="Generated artifacts">
          <div className={styles.artifactHeader}>
            <div className={styles.artifactTitle}>
              <h2>Knowledge-to-profile workbench</h2>
              <p>{artifactDescription(activeTab, activeVariant)}</p>
            </div>
            <div className={styles.variantRail}>
              {profileVariants.map((variant) => (
                <button
                  className={`${styles.variantButton} ${variant.id === activeVariantId ? styles.activeVariant : ""}`}
                  key={variant.id}
                  type="button"
                  onClick={() => setActiveVariantId(variant.id)}
                >
                  <LayoutTemplate size={15} />
                  {variant.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Artifact tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  className={`${styles.tab} ${tab.id === activeTab ? styles.activeTab : ""}`}
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={tab.id === activeTab}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className={styles.artifactSurface}>
            <div className={styles.artifactToolbar}>
              <div className={styles.quickActions}>
                <span className={styles.smallPill}>
                  <Sparkles size={14} />
                  {activeVariant.label}
                </span>
                <span className={styles.smallPill}>tenant-scoped private graph</span>
                <span className={styles.smallPill}>public renderer draft</span>
              </div>
              <button className={styles.button} type="button" onClick={() => setActiveTab("publish")}>
                <ShieldCheck size={15} />
                Publish review
              </button>
            </div>
            <ArtifactBody tab={activeTab} variant={activeVariant} />
          </div>
        </section>
      </div>
    </main>
  );
}
