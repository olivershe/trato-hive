# Agents Package (@trato-hive/agents)

**Parent:** Root CLAUDE.md
**Purpose:** Agentic Orchestration - Multi-step AI workflows with BullMQ job queues
**Last Updated:** 2025-11-18
**Layer Mapping:** Layer 4 (Agentic Layer - Workflow Orchestration)

---

## 1. Purpose

The `@trato-hive/agents` package implements **Layer 4: Agentic Orchestration** - the workflow engine that composes AI capabilities into coherent multi-step processes. It provides:

1. **Agent Types:** Pre-built agents for Sourcing, Pipeline OS, Diligence, and Generator workflows
2. **Workflow Orchestration:** State management, conditional routing, and parallel execution
3. **BullMQ Integration:** Background job processing with Redis-backed queues
4. **Multi-Step Workflows:** Sequential, parallel, conditional, and iterative execution patterns
5. **Agent Lifecycle:** Init → Plan → Execute → Verify → Report
6. **Resilient Execution:** Retry logic, error handling, and workflow resumption

**Key Characteristics:**
- **Declarative workflows** - Define agents as composable steps
- **Idempotent & resumable** - Recover from failures without data loss
- **Job queue integration** - Long-running workflows via BullMQ workers
- **Citation-aware** - All agent outputs maintain verifiable fact links
- **Type-safe** - Full TypeScript with strict mode

**Used By:** `apps/api` (tRPC endpoints trigger agents), `packages/semantic-layer` (fact extraction workflows), `packages/data-plane` (document processing pipelines)

---

## 2. Ownership

**AI Engineering & Backend Team** - All changes require:
1. Workflow testing (unit + integration for each agent type)
2. Performance analysis (latency, queue throughput)
3. Cost review (LLM token usage per workflow)

**Breaking Changes:** Agent interface changes require migration guide and version bump.

---

## 3. Technology Stack

**Workflow Framework:**
- **LangChain.js 0.3.11** - Agent orchestration primitives, tool integration
- **@langchain/core 1.0.4** - Base message types, tool calling interfaces
- **LangGraph** (via LangChain) - Stateful workflows with conditional routing

**Job Queue:**
- **BullMQ 5.28.1** - Redis-backed job processing with retries, priority, delays
- **ioredis 5.4.2** - Redis client for BullMQ connection

**AI Integration:**
- **@trato-hive/ai-core** (workspace) - LLM service, embeddings, RAG
- **@trato-hive/semantic-layer** (workspace) - Fact retrieval, knowledge graph queries
- **@anthropic-ai/sdk 0.32.1** - Direct Claude SDK access for agent reasoning

**Validation & Types:**
- **Zod 3.23.8** - Schema validation for agent inputs/outputs
- **@trato-hive/shared** (workspace) - Shared types, validators

**Build & Test:**
- **tsup 8.3.5** (CJS + ESM), **TypeScript 5.6.3** (strict mode)
- **Vitest 2.1.8**

---

## 4. Architecture

### Directory Structure

```
packages/agents/src/
├── types/
│   ├── workflow.ts        # Workflow state, job interfaces
│   └── agent.ts           # Agent base types
├── workers/
│   └── index.ts           # BullMQ worker setup
├── sourcing-agent.ts      # Module 2: AI-Native company discovery
├── pipeline-agent.ts      # Module 3: Deal pipeline orchestration
├── diligence-agent.ts     # Module 4: VDR Q&A with citations
├── generator-agent.ts     # Module 5: Document generation (IC decks, LOIs)
├── document-agent.ts      # Data Plane: Document processing workflows
└── index.ts               # Package exports
```

### Workflow Execution Flow

```
User Request (via tRPC)
    ↓
API Endpoint (apps/api)
    ↓
Queue Job (BullMQ)
    ↓
┌──────────────────────────────────────┐
│ Agent Worker (processes job)         │
│   1. Init: Load workflow definition  │
│   2. Plan: Determine steps           │
│   3. Execute: Run steps (sequential/ │
│      parallel/conditional)           │
│   4. Verify: Validate outputs        │
│   5. Report: Return results          │
└──────────────────────────────────────┘
    ↓
Update State (PostgreSQL via Prisma)
    ↓
Emit Event (WebSocket for real-time updates)
    ↓
Return to User
```

### Multi-Step Workflow Patterns

1. **Sequential:** Sourcing Agent → Parse Query → Retrieve Companies → Rank → Return
2. **Parallel:** Diligence Agent → Multiple risk scans across document sections concurrently
3. **Conditional:** Pipeline Agent → If deal stage = "due diligence", trigger risk analysis
4. **Iterative:** Generator Agent → Loop through IC deck sections, generate each slide

---

## 5. Environment Variables

**Required:**

```bash
# Redis (BullMQ)
REDIS_URL=redis://localhost:6379   # BullMQ job queue connection

# AI Services (from ai-core)
ANTHROPIC_API_KEY=sk-ant-api03-xxx  # Claude Sonnet for agent reasoning
OPENAI_API_KEY=sk-xxx               # Embeddings for similarity matching

# Database (from db)
DATABASE_URL=postgresql://...       # Workflow state persistence
```

**Optional:**

```bash
# BullMQ Configuration
BULLMQ_CONCURRENCY=5                # Max concurrent jobs per worker
BULLMQ_MAX_RETRIES=3                # Retry failed jobs 3 times
BULLMQ_RETRY_DELAY_MS=5000          # Initial retry delay (exponential backoff)

# Agent Timeouts
AGENT_TIMEOUT_MS=300000             # 5 minutes max per agent execution
AGENT_STEP_TIMEOUT_MS=60000         # 1 minute max per workflow step

# Cost Management
ENABLE_AGENT_COST_TRACKING=true     # Track LLM token usage per agent
MAX_TOKENS_PER_AGENT_RUN=100000     # Prevent runaway costs
```

---

## 6. Agent Types

### 6.1 Sourcing Agent (Module 2: Discovery)

**Purpose:** AI-Native company discovery with lookalike search

```typescript
// src/sourcing-agent.ts
import { createLLMService, createEmbeddingService } from '@trato-hive/ai-core';
import { searchFacts } from '@trato-hive/semantic-layer';

export interface SourcingCriteria {
  industry?: string;
  location?: string;
  revenue?: { min?: number; max?: number };
  employees?: { min?: number; max?: number };
  lookalikeDealId?: string;
}

export interface SourcedCompany {
  name: string;
  description: string;
  industry: string;
  location: string;
  estimatedRevenue?: number;
  estimatedEmployees?: number;
  similarityScore?: number;
  sources: string[];
}

export class SourcingAgent {
  async discoverCompanies(criteria: SourcingCriteria): Promise<SourcedCompany[]> {
    // 1. Parse search criteria with LLM
    const llm = createLLMService('anthropic');
    const query = await llm.generate({
      prompt: `Extract structured search criteria: ${JSON.stringify(criteria)}`,
      systemPrompt: 'Extract industry, location, size filters as JSON.',
      temperature: 0.0,
    });

    // 2. Generate embedding from criteria
    const embeddings = createEmbeddingService();
    const queryText = `${criteria.industry} companies in ${criteria.location}`;
    const embedding = await embeddings.generate(queryText);

    // 3. Vector similarity search in semantic-layer
    const facts = await searchFacts({
      embedding,
      limit: 50,
      filter: { type: 'company_profile' },
    });

    // 4. Rank and filter with LLM
    const ranked = await llm.generate({
      prompt: `Rank these companies by relevance: ${JSON.stringify(facts)}`,
      temperature: 0.2,
    });

    return JSON.parse(ranked.text);
  }

  async findLookalikes(dealId: string, limit: number = 10): Promise<SourcedCompany[]> {
    // 1. Fetch deal details from db
    // 2. Extract company characteristics
    // 3. Generate embedding of characteristics
    // 4. Vector search for similar companies
    // 5. Return top N lookalikes
    throw new Error('Lookalike search not yet implemented');
  }
}
```

### 6.2 Pipeline Agent (Module 3: Deals)

**Purpose:** Monitor deals, suggest next actions, populate "My Tasks" inbox

```typescript
// src/pipeline-agent.ts
export interface DealContext {
  dealId: string;
  stage: 'prospect' | 'qualification' | 'diligence' | 'closed';
  lastActivity: Date;
  blockers: string[];
}

export interface NextStep {
  action: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  assignee?: string;
}

export class PipelineAgent {
  async suggestNextSteps(dealId: string): Promise<NextStep[]> {
    // 1. Fetch deal state from db
    // 2. Analyze recent activities
    // 3. Identify blockers (e.g., missing documents, pending approvals)
    // 4. Generate next steps with LLM
    // 5. Return prioritized action items
    throw new Error('Pipeline orchestration not yet implemented');
  }
}
```

### 6.3 Diligence Agent (Module 4: VDR Q&A)

**Purpose:** Answer diligence questions with citations from VDR documents

```typescript
// src/diligence-agent.ts
import { createRAGService, createLLMService } from '@trato-hive/ai-core';
import { searchFacts } from '@trato-hive/semantic-layer';

export interface DiligenceQuestion {
  dealId: string;
  question: string;
  userId: string;
}

export interface AnswerWithCitations {
  answer: string;
  citations: {
    factId: string;
    documentId: string;
    pageNumber: number;
    excerpt: string;
  }[];
  confidence: number;
}

export class DiligenceAgent {
  async answerQuestion(question: DiligenceQuestion): Promise<AnswerWithCitations> {
    // 1. Search VDR documents via semantic-layer
    const facts = await searchFacts({
      query: question.question,
      filter: { dealId: question.dealId },
      limit: 10,
    });

    // 2. Query with RAG (retrieve + generate with citations)
    const rag = createRAGService();
    const llm = createLLMService();

    const response = await rag.query({
      query: question.question,
      facts,
      maxContextTokens: 8192,
    }, llm);

    return {
      answer: response.answer,
      citations: response.citations.map(c => ({
        factId: c.factId,
        documentId: facts.find(f => f.id === c.factId)?.sourceDocumentId || '',
        pageNumber: facts.find(f => f.id === c.factId)?.pageNumber || 0,
        excerpt: c.excerpt,
      })),
      confidence: 0.85, // TODO: Calculate confidence from citation density
    };
  }
}
```

### 6.4 Generator Agent (Module 5: Document Creation)

**Purpose:** Generate IC decks, LOIs, memos with citations

```typescript
// src/generator-agent.ts
export interface DocumentGenerationRequest {
  dealId: string;
  documentType: 'ic_deck' | 'loi' | 'memo';
  templateId: string;
  sections: string[];
}

export interface GeneratedDocument {
  content: string; // Markdown or structured format
  citations: { sectionId: string; factIds: string[] }[];
  metadata: {
    generatedAt: Date;
    tokensUsed: number;
    estimatedCost: number;
  };
}

export class GeneratorAgent {
  async generateDocument(request: DocumentGenerationRequest): Promise<GeneratedDocument> {
    // 1. Load template structure
    // 2. For each section:
    //    a. Query semantic-layer for relevant facts
    //    b. Build narrative outline with LLM
    //    c. Generate section content with citations
    // 3. Assemble full document
    // 4. Stream draft to user for review
    throw new Error('Document generation not yet implemented');
  }
}
```

---

## 7. Workflow Orchestration (LangGraph Patterns)

### Sequential Workflow (Sourcing Agent)

```typescript
import { StateGraph, Annotation } from '@langchain/langgraph';

// Define workflow state
const SourcingStateAnnotation = Annotation.Root({
  criteria: Annotation<SourcingCriteria>,
  parsedQuery: Annotation<string>,
  embedding: Annotation<number[]>,
  facts: Annotation<any[]>,
  rankedCompanies: Annotation<SourcedCompany[]>,
});

// Nodes
async function parseQuery(state: typeof SourcingStateAnnotation.State) {
  const llm = createLLMService();
  const result = await llm.generate({
    prompt: `Parse search criteria: ${JSON.stringify(state.criteria)}`,
    temperature: 0.0,
  });
  return { parsedQuery: result.text };
}

async function generateEmbedding(state: typeof SourcingStateAnnotation.State) {
  const embeddings = createEmbeddingService();
  const embedding = await embeddings.generate(state.parsedQuery);
  return { embedding };
}

async function retrieveFacts(state: typeof SourcingStateAnnotation.State) {
  const facts = await searchFacts({
    embedding: state.embedding,
    limit: 50,
  });
  return { facts };
}

async function rankCompanies(state: typeof SourcingStateAnnotation.State) {
  const llm = createLLMService();
  const ranked = await llm.generate({
    prompt: `Rank companies: ${JSON.stringify(state.facts)}`,
    temperature: 0.2,
  });
  return { rankedCompanies: JSON.parse(ranked.text) };
}

// Build workflow
const sourcingWorkflow = new StateGraph(SourcingStateAnnotation)
  .addNode('parseQuery', parseQuery)
  .addNode('generateEmbedding', generateEmbedding)
  .addNode('retrieveFacts', retrieveFacts)
  .addNode('rankCompanies', rankCompanies)
  .addEdge('__start__', 'parseQuery')
  .addEdge('parseQuery', 'generateEmbedding')
  .addEdge('generateEmbedding', 'retrieveFacts')
  .addEdge('retrieveFacts', 'rankCompanies')
  .addEdge('rankCompanies', '__end__')
  .compile();

// Invoke
const result = await sourcingWorkflow.invoke({
  criteria: { industry: 'SaaS', location: 'USA' },
});
```

### Conditional Workflow (Pipeline Agent)

```typescript
// Conditional routing based on deal stage
function shouldTriggerDiligence(state: typeof PipelineStateAnnotation.State) {
  if (state.dealStage === 'diligence' && !state.diligenceStarted) {
    return 'startDiligence';
  }
  return '__end__';
}

const pipelineWorkflow = new StateGraph(PipelineStateAnnotation)
  .addNode('analyzeDeal', analyzeDeal)
  .addNode('startDiligence', startDiligence)
  .addEdge('__start__', 'analyzeDeal')
  .addConditionalEdges(
    'analyzeDeal',
    shouldTriggerDiligence,
    ['startDiligence', '__end__']
  )
  .addEdge('startDiligence', '__end__')
  .compile();
```

---

## 8. BullMQ Integration (Background Jobs)

### Worker Setup

```typescript
// src/workers/index.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { DiligenceAgent } from '../diligence-agent';

export interface DiligenceJobData {
  dealId: string;
  question: string;
  userId: string;
}

export class DiligenceWorker {
  private worker: Worker<DiligenceJobData>;
  private connection: IORedis;

  constructor(redisUrl: string) {
    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker<DiligenceJobData>(
      'diligence-queue',
      async (job: Job<DiligenceJobData>) => {
        return this.processQuestion(job.data);
      },
      {
        connection: this.connection,
        concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '5'),
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // per 1 second
        },
      }
    );

    // Event listeners
    this.worker.on('completed', (job: Job) => {
      console.log(`Diligence job ${job.id} completed`);
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`Diligence job ${job?.id} failed:`, error.message);
    });

    this.worker.on('progress', (job: Job, progress: number) => {
      console.log(`Diligence job ${job.id} progress: ${progress}%`);
    });
  }

  private async processQuestion(data: DiligenceJobData): Promise<any> {
    const agent = new DiligenceAgent();

    // Update progress
    await this.worker.getJob(data.dealId)?.updateProgress(25);

    const answer = await agent.answerQuestion({
      dealId: data.dealId,
      question: data.question,
      userId: data.userId,
    });

    await this.worker.getJob(data.dealId)?.updateProgress(100);

    return answer;
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.connection.quit();
  }
}

export const createDiligenceWorker = (redisUrl: string): DiligenceWorker => {
  return new DiligenceWorker(redisUrl);
};
```

### Queue Job from API

```typescript
// apps/api/routes/diligence.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!);

const diligenceQueue = new Queue('diligence-queue', { connection });

export const diligenceRouter = router({
  askQuestion: protectedProcedure
    .input(z.object({ dealId: z.string(), question: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Queue the job
      const job = await diligenceQueue.add('answer-question', {
        dealId: input.dealId,
        question: input.question,
        userId: ctx.userId,
      }, {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200,      // Keep last 200 failed jobs
        attempts: 3,            // Retry 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 5000,          // Start with 5s delay
        },
      });

      return { jobId: job.id };
    }),
});
```

---

## 9. Multi-Step Workflows with State Management

### Iterative Workflow (Generator Agent - IC Deck)

```typescript
enum Step {
  LoadTemplate,
  GenerateExecutiveSummary,
  GenerateFinancials,
  GenerateRisks,
  AssembleDocument,
  Finish,
}

const worker = new Worker(
  'generator-queue',
  async (job: Job) => {
    let step = job.data.step || Step.LoadTemplate;

    while (step !== Step.Finish) {
      switch (step) {
        case Step.LoadTemplate: {
          const template = await loadTemplate(job.data.templateId);
          await job.updateData({ step: Step.GenerateExecutiveSummary, template });
          step = Step.GenerateExecutiveSummary;
          break;
        }
        case Step.GenerateExecutiveSummary: {
          const summary = await generateSection('executive_summary', job.data.dealId);
          await job.updateData({ step: Step.GenerateFinancials, summary });
          step = Step.GenerateFinancials;
          break;
        }
        case Step.GenerateFinancials: {
          const financials = await generateSection('financials', job.data.dealId);
          await job.updateData({ step: Step.GenerateRisks, financials });
          step = Step.GenerateRisks;
          break;
        }
        case Step.GenerateRisks: {
          const risks = await generateSection('risks', job.data.dealId);
          await job.updateData({ step: Step.AssembleDocument, risks });
          step = Step.AssembleDocument;
          break;
        }
        case Step.AssembleDocument: {
          const document = await assembleDocument(job.data);
          await job.updateData({ step: Step.Finish, document });
          return document;
        }
        default: {
          throw new Error('Invalid step');
        }
      }
    }
  },
  { connection }
);
```

---

## 10. Agent Lifecycle Management

```typescript
// Agent lifecycle interface
export interface AgentLifecycle<TInput, TOutput> {
  init(input: TInput): Promise<{ runId: string; context: Record<string, any> }>;
  plan(runId: string): Promise<string[]>; // Returns step names
  execute(runId: string): Promise<TOutput>;
  verify(runId: string, output: TOutput): Promise<boolean>;
  report(runId: string): Promise<{ status: string; result: TOutput }>;
}

// Example implementation
export class BaseDiligenceAgent implements AgentLifecycle<DiligenceQuestion, AnswerWithCitations> {
  async init(input: DiligenceQuestion) {
    const runId = uuidv4();
    const context = {
      dealId: input.dealId,
      question: input.question,
      userId: input.userId,
      createdAt: new Date(),
    };

    // Persist to db
    await db.workflowRun.create({
      data: {
        runId,
        workflowId: 'diligence-agent',
        status: 'pending',
        context,
      },
    });

    return { runId, context };
  }

  async plan(runId: string) {
    // Determine required steps
    return [
      'retrieve_facts',
      'generate_answer',
      'extract_citations',
      'validate_citations',
    ];
  }

  async execute(runId: string) {
    const run = await db.workflowRun.findUnique({ where: { runId } });
    const steps = await this.plan(runId);

    for (const step of steps) {
      await this.executeStep(runId, step);
    }

    const result = await this.getResult(runId);
    return result;
  }

  async verify(runId: string, output: AnswerWithCitations) {
    // Validate that all citations link to real facts
    const validCitations = output.citations.every(c => c.factId && c.documentId);
    return validCitations && output.confidence > 0.7;
  }

  async report(runId: string) {
    const run = await db.workflowRun.findUnique({ where: { runId } });
    return {
      status: run.status,
      result: run.context.result,
    };
  }
}
```

---

## 11. Exported Interfaces

```typescript
// src/index.ts
export { SourcingAgent, createSourcingAgent } from './sourcing-agent';
export { PipelineAgent } from './pipeline-agent';
export { DiligenceAgent } from './diligence-agent';
export { GeneratorAgent } from './generator-agent';
export { DocumentProcessingWorker, createDocumentProcessingWorker } from './workers';

export type {
  SourcingCriteria,
  SourcedCompany,
} from './sourcing-agent';

export type {
  DealContext,
  NextStep,
} from './pipeline-agent';

export type {
  DiligenceQuestion,
  AnswerWithCitations,
} from './diligence-agent';

export type {
  DocumentGenerationRequest,
  GeneratedDocument,
} from './generator-agent';

export type {
  WorkerConfig,
  DocumentProcessingJob,
} from './workers';
```

---

## 12. Integration Examples

### From apps/api (Trigger Diligence Agent)

```typescript
import { DiligenceAgent } from '@trato-hive/agents';
import { router, protectedProcedure } from '../trpc';

export const diligenceRouter = router({
  askQuestion: protectedProcedure
    .input(z.object({ dealId: z.string(), question: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const agent = new DiligenceAgent();

      const answer = await agent.answerQuestion({
        dealId: input.dealId,
        question: input.question,
        userId: ctx.userId,
      });

      return answer;
    }),
});
```

### From semantic-layer (Document Processing Workflow)

```typescript
import { createDocumentProcessingWorker } from '@trato-hive/agents';

const worker = createDocumentProcessingWorker({
  redisUrl: process.env.REDIS_URL!,
});

// Worker processes document ingestion jobs:
// 1. Download from S3
// 2. OCR extraction (Reducto AI)
// 3. Fact extraction (TIC Core)
// 4. Embedding generation
// 5. Store in Pinecone + Neo4j
```

---

## 13. Testing Requirements

### Coverage Target: ≥80%

**Unit Tests:**
- Agent initialization and configuration
- Workflow state transitions
- Step execution logic
- Error handling and retries

**Integration Tests:**
- BullMQ job queue (add job → worker processes → result)
- End-to-end agent workflows (mock LLM responses)
- State persistence (PostgreSQL)

### Example Test

```typescript
// src/diligence-agent.test.ts
import { describe, it, expect, vi } from 'vitest';
import { DiligenceAgent } from './diligence-agent';

describe('DiligenceAgent', () => {
  it('should answer question with citations', async () => {
    const agent = new DiligenceAgent();

    // Mock LLM and semantic-layer
    vi.mock('@trato-hive/ai-core', () => ({
      createRAGService: () => ({
        query: async () => ({
          answer: 'Revenue was $10M in 2023 [1].',
          citations: [{ factId: 'fact-1', excerpt: 'Revenue: $10M' }],
        }),
      }),
    }));

    const answer = await agent.answerQuestion({
      dealId: 'deal-1',
      question: 'What was the revenue in 2023?',
      userId: 'user-1',
    });

    expect(answer.answer).toContain('$10M');
    expect(answer.citations).toHaveLength(1);
    expect(answer.citations[0].factId).toBe('fact-1');
  });

  it('should handle missing facts gracefully', async () => {
    const agent = new DiligenceAgent();

    // Mock empty facts
    vi.mock('@trato-hive/semantic-layer', () => ({
      searchFacts: async () => [],
    }));

    const answer = await agent.answerQuestion({
      dealId: 'deal-1',
      question: 'What was the EBITDA?',
      userId: 'user-1',
    });

    expect(answer.answer).toContain('No relevant facts found');
    expect(answer.citations).toHaveLength(0);
  });
});
```

---

## 14. Common Patterns

### Pattern 1: Agent Factory with Config

```typescript
function createAgent<T>(type: 'sourcing' | 'pipeline' | 'diligence' | 'generator'): T {
  const config = {
    redisUrl: process.env.REDIS_URL!,
    llmProvider: process.env.DEFAULT_LLM_PROVIDER || 'anthropic',
  };

  switch (type) {
    case 'sourcing': return new SourcingAgent(config) as T;
    case 'pipeline': return new PipelineAgent(config) as T;
    case 'diligence': return new DiligenceAgent() as T;
    case 'generator': return new GeneratorAgent(config) as T;
  }
}
```

### Pattern 2: Workflow Resumption on Failure

```typescript
async function resumeWorkflow(runId: string) {
  const run = await db.workflowRun.findUnique({ where: { runId } });

  if (run.status === 'failed' || run.status === 'running') {
    // Resume from last completed step
    const lastStep = run.context.lastCompletedStep;
    const workflow = loadWorkflow(run.workflowId);

    await workflow.resumeFrom(lastStep);
  }
}
```

### Pattern 3: Progress Streaming to Client

```typescript
// In worker
await job.updateProgress(25);
// Emit WebSocket event
io.to(job.data.userId).emit('agent:progress', {
  jobId: job.id,
  progress: 25,
  step: 'Retrieving facts',
});
```

---

## 15. Anti-Patterns

### ❌ DON'T skip state persistence

```typescript
// Bad - state lost on crash
const result = await agent.execute();

// Good
const { runId } = await agent.init(input);
await agent.execute(runId); // State saved to db
```

### ❌ DON'T ignore job retries

```typescript
// Bad
await queue.add('job', data);

// Good
await queue.add('job', data, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});
```

### ❌ DON'T hard-code workflow steps

```typescript
// Bad
async function workflow() {
  const step1 = await doStep1();
  const step2 = await doStep2();
  return step2;
}

// Good - use LangGraph StateGraph for declarative workflows
const workflow = new StateGraph(StateAnnotation)
  .addNode('step1', doStep1)
  .addNode('step2', doStep2)
  .compile();
```

### ❌ DON'T skip citation validation

```typescript
// Bad
return { answer: llmResponse.text, citations: [] };

// Good
const citations = extractor.linkCitations(llmResponse.text, facts);
return { answer: llmResponse.text, citations };
```

---

## 16. Troubleshooting

### Problem: Jobs stuck in "waiting" state

**Solution:** Check Redis connection and worker status:

```bash
# Verify Redis is running
redis-cli ping

# Check BullMQ queues
redis-cli KEYS "bull:*"

# Restart workers
pnpm --filter agents dev
```

### Problem: Worker crashes on long-running jobs

**Solution:** Increase timeout and enable job resumption:

```typescript
const worker = new Worker('queue', processor, {
  lockDuration: 300000, // 5 minutes
  maxStalledCount: 2,   // Retry stalled jobs twice
});
```

### Problem: High LLM costs from agent workflows

**Solution:** Add token budget enforcement:

```typescript
const MAX_TOKENS_PER_RUN = 100000;

async function execute(runId: string) {
  let tokensUsed = 0;

  for (const step of steps) {
    const result = await executeStep(step);
    tokensUsed += result.usage.totalTokens;

    if (tokensUsed > MAX_TOKENS_PER_RUN) {
      throw new Error('Token budget exceeded');
    }
  }
}
```

---

## 17. Non-Negotiables

1. **All agents MUST persist state** (PostgreSQL via Prisma)
2. **All agents MUST be idempotent & resumable** (retry-safe)
3. **BullMQ required for long-running workflows** (>30s execution time)
4. **≥80% test coverage** (unit + integration)
5. **Citation-first principle** (all outputs link to sources)
6. **Workflow timeout enforcement** (prevent infinite loops)
7. **Token budget tracking** (prevent runaway costs)
8. **Type-safe interfaces** (no `any` types)
9. **Retry logic REQUIRED** (exponential backoff, 3 attempts)
10. **Progress reporting for long jobs** (WebSocket updates to client)

---

## 18. Resources

**Documentation:**
- Root CLAUDE.md Section 3 (Architecture Overview)
- docs/architecture/agentic-layer.md (Layer 4 architecture)
- packages/ai-core/CLAUDE.md (LLM orchestration)
- packages/semantic-layer/CLAUDE.md (Fact retrieval)

**External:**
- [BullMQ Documentation](https://docs.bullmq.io/)
- [LangChain.js Docs](https://js.langchain.com/docs/)
- [LangGraph Workflows](https://langchain-ai.github.io/langgraphjs/)

**Context7 References:**
- BullMQ: `/taskforcesh/bullmq`
- LangChain JavaScript: `/websites/langchain_oss_javascript`
- LangGraph: `/websites/langchain-ai_github_io_langgraphjs`
