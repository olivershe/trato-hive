# Agentic Layer (Layer 4)

**Status:** Draft
**Last Updated:** 2025‑11‑12
**Owner:** Workflow Orchestration Team
**Priority:** High

The **Agentic Layer** is responsible for composing AI capabilities into coherent workflows. Agents encapsulate multi‑step processes that involve reasoning, data retrieval, decision making and user interaction. This document details agent types, orchestration patterns and the state management model.

## 1. Responsibilities

1. **Workflow Definitions:** Define tasks as declarative workflows (YAML or JSON) describing the steps, inputs, outputs and conditions. Each workflow is versioned and can be updated without redeploying code.
2. **Orchestration Engine:** Execute workflows by invoking services across layers (Data Plane, Semantic Layer, TIC Core) and managing state between steps. Handle parallelism, retries and error handling.
3. **Agent Lifecycle:** Manage the lifecycle of agents: initialise context, plan steps, execute actions, verify results and report outcomes. Agents should be idempotent and resumable.
4. **State Management:** Maintain transient state (variables, partial results) across steps. Persist state where necessary (e.g., in a workflow run database) to support recovery and auditing.
5. **Agent Catalogue:** Provide a registry of available agents and their capabilities. Agents include Sourcing, Pipeline OS, Diligence and Generator agents.
6. **Exported Interfaces:** Expose functions to invoke specific agents with inputs and receive results.

## 2. Agent Types

### 2.1 Sourcing Agent (Module 2)

Parses user thesis, calls the TIC Core for query understanding, retrieves candidate companies from the Semantic Layer, ranks them and constructs target lists. It can also call the Lookalike Service to expand lists. Returns search results, lookalikes and market maps.

### 2.2 Pipeline OS Agent (Module 3)

Monitors deals in the pipeline, analyses deal state and suggests next actions (e.g., move to diligence, schedule a call). It may summarise recent activities and highlight blocking items. Integrates with the Command Center to populate the “My Tasks” inbox.

### 2.3 Diligence Agent (Module 4)

Accepts questions during diligence, searches VDR documents via the Semantic Layer, and uses the TIC Core to generate answers with citations. Detects duplicate questions to reduce noise. Can trigger risk scans for documents and summarise non‑standard clauses.

### 2.4 Generator Agent (Module 5)

Generates documents (IC decks, LOIs, memos) by querying the Semantic Layer for facts, building narrative outlines, invoking the TIC Core for text generation and assembling outputs with golden citations. Streams draft content for review and iterates based on feedback.

## 3. Workflow Definitions

Workflows are defined declaratively. A sample YAML snippet for a sourcing query might look like:

```yaml
id: sourcing-query
version: 1
steps:
  - id: parse-query
    service: tic-core
    method: queryTIC
    params:
      query: "{{input.query}}"
      format: json
    save: queryAnalysis

  - id: retrieve-companies
    service: semantic-layer
    method: queryFacts
    params:
      criteria: { thesis: "{{queryAnalysis.thesis}}" }
    save: candidates

  - id: rank
    service: agents
    method: rankCandidates
    params:
      candidates: "{{candidates}}"
    save: ranked

  - id: respond
    service: return
    data: "{{ranked}}"
```

The orchestration engine interprets this workflow, resolves references, executes services and saves outputs. Conditions and parallel branches can be expressed for more complex scenarios.

## 4. Agent Lifecycle

Agents follow a consistent lifecycle:
1. **Init:** Load workflow definition, validate inputs and create a run record.
2. **Plan:** Determine required steps and sequence (may be dynamic based on input).
3. **Execute:** Perform steps sequentially or in parallel. Manage retries and handle failures.
4. **Verify:** Optionally validate results (e.g., cross‑check facts, ensure citations exist). For low‑confidence outputs, ask for human approval.
5. **Report:** Return final results to the caller (Experience Layer) and log the run for auditing.

## 5. Multi‑Step Patterns

- **Sequential:** Steps run one after the other; output of one feeds into the next. Example: parse query → retrieve companies → rank.
- **Parallel:** Steps run concurrently and results are aggregated. Example: run multiple risk scans across different document sections simultaneously.
- **Conditional:** Flow branches based on intermediate results. Example: if the search returns too few candidates, broaden criteria.
- **Iterative:** Loop through a set of items. Example: generate slides for each section of an IC deck.

## 6. State Management

State is stored in memory during execution but persisted for long‑running workflows. A `WorkflowRun` record includes:
```typescript
interface WorkflowRun {
  runId: string
  workflowId: string
  version: number
  createdAt: Date
  updatedAt: Date
  status: "pending" | "running" | "completed" | "failed"
  context: Record<string, any>  // key-value store for step outputs
  logs: LogEntry[]
}
```

Agents should be resilient to interruptions. If a worker crashes, the engine should reload the run from the last saved state and resume.

## 7. Exported Interfaces

```typescript
// invoke the sourcing agent
async function invokeSourcingAgent(params: { userId: string, firmId: string, query: string }): Promise<SourcingResult>

// invoke the pipeline OS agent to suggest next steps
async function invokePipelineAgent(params: { dealId: string }): Promise<NextSteps[]>

// invoke the diligence agent to answer a question
async function invokeDiligenceAgent(params: { dealId: string, question: string }): Promise<AnswerWithCitations>

// invoke the generator agent to create an IC deck or LOI
async function invokeGeneratorAgent(params: { dealId: string, documentType: "ic_deck" | "loi", templateId: string }): Promise<GeneratedDocument>
```

## 8. Conclusion

The Agentic Layer binds the lower‑level services into workflows that deliver business value. By defining agents declaratively and managing their lifecycle, Trato Hive can introduce new AI capabilities quickly without coupling the UI to underlying services. This modular, cost‑aware design ensures we can add features while keeping our infrastructure lean and maintainable.
