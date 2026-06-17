# ProofKind Professional Memory And Coach

Status: product expansion direction  
Date: 2026-06-16  
Related: [Product Vision](./productVision.md), [Data Ingestion Architecture](./dataIngestionArchitecture.md), [Technical Architecture](./technicalArchitecturePlan.md)

## Strategic Direction

ProofKind should evolve from an evidence-backed professional profile into a private professional memory and AI coach.

The public profile is the wedge. The private owner AI is the deeper product.

```text
professional evidence system
  + private career memory
  + reflective memory
  + feedback and performance memory
  + psychometric context
  + goals and opportunity history
  -> personal professional coach
```

The long-term product loop is:

```text
professional memory
  -> self-understanding
  -> opportunity fit
  -> deliberate development
  -> evidence-backed action
  -> reflection
  -> updated memory
```

## Why This Matters

AI-augmented professional development is becoming a durable category because work, skills, and career paths are changing quickly.

ProofKind can be more than a profile builder if it helps the owner answer:

- Who am I professionally?
- What patterns define my best work?
- Where am I credible?
- Where am I under-proven?
- What should I do next?
- How do I become more valuable?
- How do I show that value with evidence?

The key is that ProofKind's coaching is grounded in the owner's real history, not generic advice.

## Product Layers

### Layer 1: Evidence-Backed Profile

The v1 wedge.

- private source ingestion
- claim graph
- owner approval
- public profile
- visitor fit advisor

### Layer 2: Owner Private Workbench

The owner can ask questions across their full private and public corpus.

Examples:

- "What patterns show up in my leadership history?"
- "Which previous work is relevant to this new problem?"
- "What public evidence do I have for product strategy?"
- "Where does my professional story contradict itself?"

### Layer 3: Professional Memory

The system builds a living, private model of the owner's professional identity.

Memory types:

- career timeline
- skill evolution
- domain evolution
- project history
- evidence-backed strengths
- feedback themes
- operating style
- values and motivators
- constraints and preferences
- development areas
- decision history
- opportunity evaluations

### Layer 4: Personal Professional Coach

The coach helps the owner improve decisions, preparation, positioning, and growth.

Examples:

- performance review preparation
- promotion case building
- interview preparation
- opportunity fit analysis
- difficult conversation preparation
- leadership reflection
- development experiments
- personal strategy planning
- public narrative refinement

## Deep Personalization Sources

Add a new source category: **deep personalization sources**.

Examples:

- journals
- reflection notes
- 1:1 notes
- performance reviews
- manager feedback
- peer feedback
- 360 feedback
- OKRs and goals
- development plans
- psychometric reports
- coaching notes
- self-assessments
- decision journals

These sources should feed the private owner model first, not the public profile.

## Source Use Model

| Source type | Primary use |
|---|---|
| CVs, work samples, blogs, GitHub | Evidence-backed claims |
| Journals and reflections | Values, motivations, patterns, lived context |
| Performance reviews | Strengths, development areas, manager/peer perception |
| Psychometrics | Working style, communication style, risks/caveats |
| Public web/company/product research | External context and corroboration |
| Goals and OKRs | Progress, priorities, performance review preparation |
| Decision journals | Decision patterns and learning loops |

## Privacy Rules

Default visibility:

```text
journals -> private only
performance reviews -> private + employer_sensitive
psychometrics -> private + psychometric_sensitive
coaching notes -> private only
public use -> only owner-approved generalized claims
```

The system can use these sources to help the owner privately, but it must not expose them to public visitors by default.

Public-safe transformation example:

```text
Private feedback:
  "Moves faster than the team can absorb."

Possible owner-approved public wording:
  "Known for high-velocity problem solving, with a bias toward clarifying complexity and moving teams toward action."
```

## Private Owner Model

ProofKind should maintain a private owner model that is separate from public claims.

This is a later-phase product surface, not v1 implementation scope. The names below are reserved so the model stays coherent when the coach direction is deliberately pulled forward, but they should not drive sprint-1 repositories, rules, UI, or agent tools.

Suggested collections:

```text
tenants/{tenantId}/personalInsights/{insightId}
tenants/{tenantId}/feedbackReports/{reportId}
tenants/{tenantId}/reflectionEntries/{entryId}
tenants/{tenantId}/personalizationMemory/{memoryId}
tenants/{tenantId}/goals/{goalId}
tenants/{tenantId}/developmentExperiments/{experimentId}
tenants/{tenantId}/decisionJournalEntries/{entryId}
tenants/{tenantId}/opportunityEvaluations/{evaluationId}
tenants/{tenantId}/coachingSessions/{sessionId}
```

Suggested fields:

```text
sourceDomain:
  professional_evidence
  reflective_private
  feedback_sensitive
  psychometric_sensitive
  goal_tracking
  decision_history
  public_context

allowedUse:
  private_chat
  owner_synthesis
  coaching
  profile_draft
  public_candidate
  public_allowed
```

## Coaching Capabilities

### Personal Operating Model

The AI builds a private model of:

- decision style
- energy patterns
- collaboration style
- communication preferences
- conflict patterns
- motivators
- derailers
- environments where the owner thrives

### Opportunity Fit Engine

Answers:

- Will this role energize or drain me?
- Does this company fit my values?
- What evidence supports my fit?
- What gaps would I need to close?
- What should I ask in interviews?

### Performance Review And Promotion Copilot

Continuously collects:

- wins
- impact
- goals met
- stakeholder feedback
- leadership moments
- lessons learned

Outputs:

- performance review drafts
- promotion case evidence
- manager-ready summaries
- development themes
- proof gaps

### Feedback Intelligence

Finds patterns across:

- manager feedback
- peer feedback
- recommendations
- 360 feedback
- self-reflections
- psychometric reports

Outputs:

- recurring strengths
- repeated blind spots
- perception gaps
- growth themes over time
- working-style caveats

### Professional Simulation Gym

Practice scenarios using real professional memory:

- interviews
- salary negotiation
- board presentations
- difficult stakeholder conversations
- performance review conversations
- client pitches
- leadership conflict scenarios

### Decision Journal

Records and revisits major career decisions:

- why the owner made the decision
- assumptions at the time
- expected upside/downside
- what happened
- what was learned

### Proof Gap Monitor

Identifies where the owner's aspirations lack evidence.

Examples:

- "You claim strategic leadership, but your public proof is weak."
- "You have strong private evidence for transformation work, but no approved public story."
- "You keep targeting product leadership roles, but your public profile underplays product outcomes."

### Development Experiments

Suggests small, concrete experiments:

- "In the next stakeholder meeting, summarize risk tradeoffs before recommending a path."
- "Ask your manager for feedback on executive communication after this presentation."
- "Write a short public post about this pattern from your past work."

### Personal Board Of Advisors

Different AI modes can challenge the owner differently:

- career strategist
- executive coach
- skeptical recruiter
- product mentor
- communication coach
- performance review advisor
- negotiation coach

Each mode uses the same private memory but has different prompts, tools, and boundaries.

## Safety Boundaries

ProofKind must stay in professional development, career strategy, performance reflection, and evidence-backed growth.

Do not position or implement the coach as:

- therapy
- medical or mental health advice
- diagnosis
- automated employment decisioning
- employer surveillance
- psychometric scoring for public visitors
- a replacement for professional legal/HR advice

The coach can help the owner reflect and prepare, but should disclose uncertainty and encourage human judgment for high-stakes decisions.

## V1 Boundary

Do not build the full professional coach first.

Design the data model so the coach can emerge naturally:

- source domains
- allowed uses
- private personalization memory
- feedback reports
- reflection entries
- goals
- decision journal entries
- opportunity evaluations
- coaching sessions

Build sequence:

1. Evidence-backed profile.
2. Owner private workbench.
3. CV timeline and claim graph.
4. Psychometric/private feedback synthesis.
5. Performance review/promotion copilot.
6. Opportunity fit engine.
7. Broader professional coach.

## Positioning

Long-term positioning:

> ProofKind is your private professional memory and AI coach, turning your real work history into clearer decisions, stronger growth, and public proof you control.

The product becomes powerful when it helps the owner connect self-understanding, professional development, and public credibility.
