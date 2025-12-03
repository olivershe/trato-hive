# Agents Package (@trato-hive/agents)

## Purpose

Agentic Orchestration (Layer 4) for multi-step AI workflows using LangGraph and BullMQ.

## Tech Stack

- **Orchestration:** LangGraph, LangChain.js
- **Queue:** BullMQ (Redis-backed)
- **AI:** `@trato-hive/ai-core` (LLM), `@trato-hive/semantic-layer` (Facts)

## Agent Types

- **Sourcing Agent:** Company discovery & lookalike search.
- **Pipeline Agent:** Deal monitoring & next step suggestions.
- **Diligence Agent:** VDR Q&A with citations (RAG).
- **Generator Agent:** Document creation (IC Decks, LOIs).

## Architecture

- **Worker:** Processes BullMQ jobs (`workers/index.ts`).
- **Lifecycle:** Init → Plan → Execute → Verify → Report.
- **State:** Persisted in Postgres via Prisma.

## Common Patterns

### Sequential Workflow (LangGraph)

```typescript
// sourcing-agent.ts
const workflow = new StateGraph(StateAnnotation)
  .addNode('parse', parseQuery)
  .addNode('search', retrieveFacts)
  .addEdge('__start__', 'parse')
  .addEdge('parse', 'search')
  .compile()
```

### BullMQ Worker

```typescript
// workers/index.ts
new Worker(
  'diligence-queue',
  async (job) => {
    const agent = new DiligenceAgent()
    return await agent.answerQuestion(job.data)
  },
  { connection }
)
```

## Non-Negotiables

- **Resilience:** All agents must handle retries and resume from state.
- **Citations:** All outputs must link to verifiable facts.
- **Async:** Long-running tasks must use BullMQ.
- **Cost:** Track token usage per run.
