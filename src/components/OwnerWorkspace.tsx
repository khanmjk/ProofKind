"use client";

import {
  Bot,
  Check,
  ChevronRight,
  Code2,
  Eye,
  FileCheck2,
  LayoutTemplate,
  MessageSquareText,
  Palette,
  Send,
  ShieldCheck,
  Sparkles,
  SplitSquareHorizontal,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  evidenceSources,
  initialMessages,
  profileVariants,
  reviewClaims,
  workspaceMetrics,
  type ProfileVariant
} from "@/lib/ownerWorkspace/sampleExperience";
import styles from "@/components/OwnerWorkspace.module.css";

type TabId = "preview" | "claims" | "evidence" | "design" | "publish";

type Message = {
  id: string;
  role: "owner" | "assistant";
  text: string;
};

type StatusValue = "approved" | "needs_edit" | "draft" | "ready" | "waiting" | "review";

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "claims", label: "Claims", icon: FileCheck2 },
  { id: "evidence", label: "Evidence", icon: SplitSquareHorizontal },
  { id: "design", label: "Design", icon: Palette },
  { id: "publish", label: "Publish", icon: ShieldCheck }
];

function assistantReply(message: string, variant: ProfileVariant) {
  const lower = message.toLowerCase();

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
                Ask about fit
              </button>
              <button className={styles.button} type="button">
                <ChevronRight size={16} />
                Book conversation
              </button>
            </div>
          </div>
          <aside className={styles.mockPanel}>
            <h4>Public fit answer</h4>
            <p>
              Strong fit for AI product architecture and evidence-backed platform strategy.
              Cites 4 approved claims.
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
        <p>Hero, proof themes, claim explorer, writing highlights, operating style, fit advisor, booking CTA.</p>
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
    ["Claims reviewed", "Two approved, two still need review.", "review"],
    ["Preview approved", "AI Product Leader preview selected.", "ready"],
    ["Public boundary", "Fit advisor reads materialized public data only.", "ready"]
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
  if (tab === "claims") return <ClaimsArtifact />;
  if (tab === "evidence") return <EvidenceArtifact />;
  if (tab === "design") return <DesignArtifact variant={variant} />;
  if (tab === "publish") return <PublishArtifact />;
  return <PreviewArtifact variant={variant} />;
}

export function OwnerWorkspace() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("preview");
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
          <span className={styles.statusPill}>Drive waiting</span>
          <span className={styles.statusPill}>Blogger waiting</span>
          <span className={styles.statusPill}>Gemini fallback</span>
        </div>
      </header>

      <div className={styles.appGrid}>
        <section className={styles.chatPane} aria-label="Owner conversation">
          <div>
            <div className={styles.chatHeader}>
              <h1>Professional identity session</h1>
              <p>
                The current draft is using repo evidence and connector-ready placeholders
                until approved Drive and Blogger sources are connected.
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
                onClick={() => runQuickAction("Generate a warmer premium version with stronger blog evidence.")}
              >
                <Sparkles size={15} />
                Refine preview
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => {
                  setActiveTab("claims");
                  runQuickAction("Show me which claims need evidence before publishing.");
                }}
              >
                <FileCheck2 size={15} />
                Review claims
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask ProofKind to revise the profile, design, evidence, or public preview."
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
              <h2>Generated profile experience</h2>
              <p>{activeVariant.summary}</p>
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
