# ProofKind Agentic Professional Identity MVP

## Summary

Build **ProofKind** as an AI-led professional identity experience, not a static profile builder. The owner starts a conversation, gives seeded identity anchors, and the AI discovers sources, builds an evidence model, interviews for missing lived context, generates a public profile, and asks for claim-level approval before anything is published.

The v1 goal is your own profile: help recruiters, hiring managers, clients, founders, and curious visitors decide whether you are worth a conversation. The longer-term direction is a private professional memory and AI coach that helps the owner make better career, performance, development, and opportunity decisions. The recruiter marketplace is explicitly out of scope until the personal profile proves demand.

## Product Position

- Do not try to replace LinkedIn directly in v1; use LinkedIn as one source and make ProofKind the richer link people share.
- Differentiate from resume builders, portfolio sites, and second-brain tools by combining private career corpus, public proof, AI synthesis, visitor Q&A, and fit assessment.
- Long-term positioning: ProofKind is a private professional memory and AI coach, turning real work history into clearer decisions, stronger growth, and public proof the owner controls.
- Market references: LinkedIn scale and revenue make direct replacement unrealistic early ([LinkedIn](https://news.linkedin.com/about-us)); Peerlist/Contra prove demand for proof-of-work profiles ([Peerlist](https://peerlist.io/), [Contra](https://contra.com/)); Teal proves AI resume tailoring is already crowded ([Teal](https://www.tealhq.com/tools/resume-builder)); Obsidian/Mem validate the personal knowledge-base pattern ([Obsidian](https://obsidian.md/), [Mem](https://get.mem.ai/)).

## Core Experience

- **Owner agent:** runs the setup conversationally from start to finish: source discovery, source map confirmation, ingestion progress, synthesis, gap interview, profile generation, approval, and publishing.
- **Chat-first identity studio:** the owner experience is a conversation-led workspace with generated artifacts beside the chat. The AI and owner co-create the profile, including copy, structure, visual direction, and interactive page previews.
- **Professional knowledge base first:** ProofKind's core asset is not the public page. The core asset is a finely tuned, private, tenant-scoped knowledge base of the person. Sources are classified, tagged, chunked, connected into entities and relationships, and continuously refreshed before they are used to generate public profile material.
- **AI-led discovery:** user provides access and starting points such as Drive folders, LinkedIn export, GitHub, YouTube, Blogger, and work samples; the AI inventories sources, extracts companies/products/projects from the corpus, researches public context, and asks for confirmation.
- **Evidence and relationship model:** the AI creates reviewable entities and relationships such as sources, source families, roles, companies, products, projects, artifacts, skills, themes, psychometric patterns, outcomes, claims, and narratives.
- **Intelligent classification:** CVs/resumes are tagged as targeted career documents, psychometric reports as sensitive operating-style evidence, Blogger posts as public writing with inferred themes, and work outputs as private proof assets until approved.
- **Public context enrichment:** when company, product, role, or domain entities are extracted, the AI should research public sources such as company websites and articles to enrich the private graph, with owner review before anything public changes.
- **Gap-driven interview:** the AI asks targeted questions only where the corpus lacks context, contains ambiguity, or needs lived experience: motivations, judgment calls, impact, lessons, leadership, conflict, and personal operating style.
- **AI-led positioning:** the AI infers themes and market positioning heavily, then asks the owner to approve, correct, or enrich them.
- **Approval-gated publishing:** every public claim, theme, artifact, private-supported label, and visitor-answer policy must be approved before use.
- **Targeted profile generation:** the owner can provide a job spec, advert, opportunity brief, client problem, or audience target. ProofKind maps the target to evidence and generates a public profile experience aligned to that target, including gaps that need owner context.
- **Generated profile experiences:** ProofKind should generate sample public profile UIs and interactive previews for the owner to review. Once approved, the public profile is published through a controlled renderer using approved public data.
- **Owner private workbench:** the authenticated owner can chat with AI across their full corpus, including private sources, public sources, draft claims, approved claims, rejected claims, source metadata, and interview answers.
- **Living knowledge base:** connected sources refresh over time, changed data creates draft updates, and public profile changes remain approval-gated.
- **Professional memory:** the private system can learn from journals, reflection notes, performance reviews, psychometric reports, goals, feedback, and decision history to build a deeper owner model.
- **Professional coach direction:** future owner tools can support performance review preparation, promotion cases, opportunity fit analysis, interview practice, difficult conversation preparation, development experiments, and career strategy.
- **Connector extensibility:** new data sources should be added through connector adapters and tenant-specific installs, not by rebuilding the product around each source.
- **Multi-tenant by default:** every user gets an isolated tenant workspace from day one; AI tools, retrieval, storage, and chat sessions must never cross tenant boundaries.

## Public Profile

- Visitors can browse an owner-approved generated profile experience with narrative, themes, work evidence, capabilities, selected artifacts, credibility signals, and interaction design shaped by the AI/owner collaboration.
- Visitors can ask broad public-profile questions such as "Who is Muhammad?", "Where has he worked?", "What is his leadership style?", "What does he know about AI?", "Is he well recommended?", and "Show me professional work."
- Visitors can also start an anonymous fit session by describing their role, project, company, or problem.
- The public AI acts as a **public profile assistant** and a candid fit advisor when the visitor asks about fit.
- The public AI can use only owner-approved public claims, approved public profile sections, approved artifact summaries, and approved private-supported statements.
- If recommendations, work samples, employer timelines, or leadership-style claims have not been approved into the public profile, the public AI must say that rather than infer from private data.
- Private-work-backed claims appear as owner-approved, private-supported claims, not exposed source material.
- Primary CTA: book a conversation.
- Secondary validation CTA: "I'd like a profile like this" plus feedback capture.

## Validation Plan

- Success: qualified visitors book conversations after using the profile without needing extra explanation.
- SaaS signal: senior experts click or say they want their own version after seeing yours.
- Quality test: visitors trust the profile more because claims are evidence-backed and the agent is candid rather than purely promotional.
- Risk test: if visitors treat it like a fancy portfolio and ignore chat, fit sessions, booking, and "I want one too," narrow the scope.

## Assumptions

- First paid segment after your own MVP: senior experts, consultants, executives, product/tech leaders, and specialists with rich career artifacts.
- Recruiter search, subscriptions, and candidate marketplaces come later.
- V1 technology stack is Google-first: Firebase App Hosting, Firebase Authentication, Cloud Firestore, Cloud Storage for Firebase, Genkit, Gemini API, Firestore Vector Search, Cloud Run Services, Cloud Run Jobs, Cloud Scheduler, and Cloud Tasks.
- V1 platform architecture is tenant-scoped and connector-based; MCP is a future adapter option, not the core security boundary.
- Deep personalization sources such as journals, performance reviews, psychometrics, and coaching notes are private by default and should not feed public visitor answers unless transformed into owner-approved generalized claims.
- Portability and trust matter because professional profile platforms can disappear or change direction.
