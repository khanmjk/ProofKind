# ProofKind Owner Experience And Profile Generation

Status: v1 UX direction
Date: 2026-06-18
Related: [Product Vision](./productVision.md), [Build Plan](./plans/buildPlan.md), [Technical Architecture](./technicalArchitecturePlan.md), [Canonical Data Model](./canonicalDataModel.md)

## Core Product Decision

ProofKind must be a **chat-first professional identity studio**.

The owner should not feel like they are filling in a CMS, profile form, or resume builder. The owner should feel like they are working with an expert AI product team that can:

- discover evidence
- ask for missing context
- generate profile narratives
- generate visual and interactive profile concepts
- let the owner inspect, challenge, refine, and approve
- publish only when the owner is satisfied

The target interaction pattern is closer to modern frontier AI workspaces such as ChatGPT, Claude, and Gemini: a conversation drives the work, while generated artifacts appear beside the conversation for review and iteration.

## UX North Star

```text
owner chat
  -> source connection and evidence review
  -> AI-generated private knowledge graph
  -> target/job-spec brief
  -> AI-generated profile strategy and public Q&A scope
  -> AI-generated interactive profile previews
  -> owner feedback and iteration
  -> claim/design approval
  -> public profile publication
```

The AI is not just writing text. It is helping design the public professional experience.

The AI is also building the private professional memory. The public page is a generated output of that memory, not the source of truth.

## Owner Workspace Layout

The owner workspace should use a two-pane artifact model:

```text
left:  persistent AI conversation
right: generated artifacts and review surfaces
```

### Left Pane: AI Conversation

The conversation is the primary control surface.

The owner should be able to say things like:

- "Connect my Drive folder and blog, then tell me what you found."
- "Classify the CVs, psychometric reports, blog posts, and work samples separately."
- "Show me the knowledge graph of companies, products, roles, projects, skills, and themes."
- "Research the companies and products you found from public sources, then ask me what needs correction."
- "Generate three profile directions: executive operator, AI product leader, and technical strategist."
- "Here is a job spec. Generate a public page aimed at this opportunity."
- "Make the public page feel more premium and less resume-like."
- "Show me a version aimed at recruiters."
- "Show me a version aimed at founders looking for an advisor."
- "Use my blog posts more heavily."
- "This claim is too broad. What evidence supports it?"
- "Do not publish anything from psychometrics directly."
- "What can a public visitor ask about me?"
- "Create an interactive page I can review."
- "Publish this version."

The AI should respond with both explanation and artifacts.

### Right Pane: Artifacts

Artifacts are generated work products that can be previewed, inspected, edited, approved, or rejected.

Artifact types:

- source inventory
- classification review
- evidence map
- knowledge graph
- dynamic tag review
- public web research queue for extracted companies/products
- target/job-spec brief
- target-to-evidence alignment
- generated claims
- missing-context interview
- profile strategy brief
- profile copy variants
- interactive public profile preview
- public profile assistant preview
- publication checklist

The artifact pane should support tabs such as:

- **Knowledge Base**
- **Target Profile**
- **Public Q&A**
- **Preview**
- **Claims**
- **Evidence**
- **Design**
- **Publish**

## Generated Public Profile Experience

The public profile should not be a fixed template with generated text dropped into it. ProofKind should generate a profile experience.

The generated profile can vary by:

- audience: recruiter, founder, hiring manager, client, board/advisory lead
- target: job spec, advert, opportunity brief, client problem, advisory mandate
- tone: executive, product-led, technical, strategic, candid, editorial
- structure: timeline, proof claims, case-study led, writing-led, strengths-led
- interaction: public profile assistant, fit advisor, evidence explorer, work-theme filters, selected artifact previews

The owner should be able to iterate conversationally:

```text
AI: I generated three profile concepts.

1. Evidence-Led Operator
2. AI Product Strategist
3. Writing And Thought Leadership

Owner: I like 2, but make it warmer and add more proof from my blog posts.

AI: Updated. I strengthened the writing section, reduced corporate language,
and added a proof explorer filtered by product, AI, and leadership themes.
```

## Generated UI Safety Model

ProofKind should support generated interactive HTML previews, but publication must be controlled.

### Preview Mode

In preview mode, the AI may generate an interactive HTML/CSS/JS artifact for the owner to inspect.

Preview constraints:

- Render inside a sandboxed iframe.
- No cookies or credentials.
- No access to private source data beyond the approved preview payload.
- No external network calls by default.
- No arbitrary script access to the parent app.
- Clear "preview only" status.

### Publish Mode

Publishing arbitrary model-generated code directly is not acceptable for v1.

The publish path should use one of these safer models:

1. **Structured Profile Renderer**
   - AI generates structured JSON: sections, layout intent, components, theme tokens, interactions.
   - ProofKind renders it through approved React components.
   - Best default for v1.

2. **Constrained Component DSL**
   - AI generates a limited page schema using approved blocks.
   - Blocks include hero, claim grid, timeline, writing highlights, evidence explorer, and public profile assistant.
   - More flexible than templates but safer than arbitrary code.

3. **Sandboxed Static Artifact**
   - AI-generated HTML is published as a sandboxed static artifact with strict CSP.
   - No private data, no cookies, no dynamic backend calls except the approved public profile assistant endpoint.
   - Later option, not the safest default.

Recommendation: use **Structured Profile Renderer** for v1 publication, while allowing **sandboxed HTML previews** during owner iteration.

## Profile Generation Objects

Profile generation should produce both content and design intent.

```text
generatedProfile
  displayName
  headline
  summary
  sections[]
  claims[]
  missingContextQuestions[]

generatedProfileExperience
  audience
  tone
  layoutVariant
  themeTokens
  pageBlocks[]
  interactions[]
  previewHtml
  previewStatus
  publishStatus
```

Example page blocks:

```text
hero
proof_claims
theme_explorer
career_timeline
writing_highlights
artifact_gallery
operating_style
fit_advisor
booking_cta
```

Every block must declare:

```text
dataSource: public_profile_only | approved_public_claims | approved_public_artifacts
```

No public block can point to private source paths, private chunks, raw psychometrics, journals, or confidential documents.

## Owner Review Workflow

The owner workflow should be:

1. **Build Knowledge Base**
   - AI classifies sources, extracts entities, generates dynamic tags, links relationships, and creates evidence-backed private claims.

2. **Target**
   - Owner supplies a job spec, advert, audience, or opportunity brief.
   - AI maps target requirements to evidence, gaps, and generated positioning.

3. **Generate**
   - AI creates profile content and one or more interactive profile previews.

4. **Inspect**
   - Owner can click claims, sections, relationship nodes, target mappings, public Q&A examples, and design blocks.
   - The app shows why the AI generated them and what evidence supports them.

5. **Refine**
   - Owner gives conversational feedback.
   - AI revises copy, structure, tone, layout, and interactions.

6. **Approve**
   - Owner approves claims and public-safe sections.
   - Owner approves public Q&A scope for recommendations, work samples, leadership style, timeline, and fit answers.
   - Owner approves a profile experience version.

7. **Publish**
   - App materializes only approved public profile data.
   - Public page uses the approved structured renderer output.

8. **Monitor**
   - Future source changes create suggested updates, not silent public changes.

## Public Page Design Principles

The public profile should feel:

- premium
- evidence-backed
- interactive
- candid
- personal but not overexposed
- more useful than a CV
- more trustworthy than a LinkedIn profile

It should avoid:

- generic resume layouts
- static "about me" pages
- overproduced marketing fluff
- claims without evidence
- exposing private source details
- making hiring decisions on behalf of a visitor

## Public Profile Surfaces

Recommended first generated surfaces:

- **Hero Positioning**
  - name
  - headline
  - generated summary
  - availability
  - booking CTA

- **Proof Themes**
  - 4-6 themes inferred from evidence
  - each theme links to claims

- **Evidence-Backed Claims**
  - public-safe claim text
  - evidence summary
  - confidence/evidence strength
  - source type, not private source path

- **Writing And Thinking**
  - generated from Blogger posts
  - theme clusters and representative posts

- **Work Pattern / Timeline**
  - generated from CVs, docs, and source evidence
  - does not need to expose every employer or date in v1

- **Operating Style**
  - can be privately informed by psychometrics and feedback
  - must be transformed into owner-approved public wording

- **Fit Advisor**
  - one mode of the broader public profile assistant
  - constrained to public profile data
  - cites public claims
  - refuses private/sensitive/employment-decision requests

- **Public Profile Assistant**
  - answers broad visitor questions such as "Who is Muhammad?", "Where has he worked?", "What is his leadership style?", "What does he know about AI?", "Is he well recommended?", and "Show me professional work"
  - shows approved recommendations and work samples only after explicit owner approval
  - states when a topic is not yet represented in public-approved data

## Build Implications

The current public profile route is a useful starting point, but it should evolve from a fixed layout into a generated experience renderer.

New implementation pieces required:

- owner chat workspace
- artifact pane
- private knowledge graph and dynamic tag review
- target/job-spec brief and target-to-evidence mapping
- generated profile experience schema
- interactive preview sandbox
- approved component renderer
- versioned profile drafts
- design/publish approval flow
- public profile assistant preview and answer policy review
- generated profile evals for private leakage and unsupported claims

Phase 1 can implement this incrementally:

```text
chat-first owner shell
  -> knowledge-base artifact
  -> target-profile artifact
  -> public Q&A artifact
  -> profile synthesis artifact
  -> generated design brief
  -> structured page blocks
  -> preview renderer
  -> publish approved version
```

The guiding rule: the AI can be creative in preview, but publication must be deterministic, safe, and owner-approved.
