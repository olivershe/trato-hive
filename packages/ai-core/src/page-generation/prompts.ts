/**
 * Page Generation LLM Prompts
 *
 * Two-phase strategy:
 * 1. Outline phase: Given prompt + context, produce section titles and types
 * 2. Expansion phase: For each section, produce GeneratedBlock[] JSON
 */
import type { GenerationTemplate, GeneratedBlockType } from './types';

// =============================================================================
// System Prompts
// =============================================================================

export const PAGE_GENERATION_SYSTEM_PROMPT = `You are Trato Hive, an AI assistant for M&A (mergers and acquisitions) professionals.
You generate structured document content based on user prompts and available context.

Your output is a JSON array of content blocks that will be rendered in a rich text editor.
Each block has a "type" and relevant fields.

Available block types:
- heading: Section heading. Fields: level (1|2|3), content (text)
- paragraph: Body text. Fields: content (text with **bold**, *italic*, [N] citations)
- bulletList: Unordered list. Fields: items (string[])
- orderedList: Numbered list. Fields: items (string[])
- taskList: Checklist. Fields: tasks ({ text, checked }[])
- blockquote: Quote or callout. Fields: content (text)
- callout: Highlighted note. Fields: content (text), emoji (icon)
- divider: Horizontal separator. No fields needed.
- codeBlock: Code snippet. Fields: content (code), language
- table: Data table. Fields: table ({ headers: string[], rows: string[][] })
- database: Interactive database (creates real sortable/filterable table). Fields: database ({ name, columns: { name, type, options? }[], entries: Record[] })

Database column types: TEXT, NUMBER, SELECT, DATE, CHECKBOX, URL, STATUS

IMPORTANT RULES:
- Output ONLY valid JSON arrays. No markdown, no prose outside JSON.
- Use [N] notation for citations referencing the numbered context items.
- Use **bold** for emphasis and *italic* for secondary emphasis in text content.
- When creating databases, populate them with real data from the context.
- Start with a heading block, then alternate between text and structured content.
- Be specific and data-driven when context is available.`;

// =============================================================================
// Outline Prompt
// =============================================================================

export function buildOutlinePrompt(
  userPrompt: string,
  template: GenerationTemplate | undefined,
  contextSummary: string
): string {
  const templateHint = template ? getTemplateHint(template) : '';

  return `Generate an outline for a structured document page.

USER REQUEST: ${userPrompt}

${templateHint ? `TEMPLATE GUIDANCE:\n${templateHint}\n` : ''}
${contextSummary ? `AVAILABLE CONTEXT:\n${contextSummary}\n` : ''}
Respond with a JSON object:
{
  "title": "Page title",
  "sections": [
    {
      "title": "Section Title",
      "description": "Brief description of what this section covers",
      "blockTypes": ["heading", "paragraph", "bulletList"]
    }
  ]
}

Include 4-8 sections. Each section should have a mix of block types for variety.
For data-heavy sections, include "database" or "table" in blockTypes.`;
}

// =============================================================================
// Section Expansion Prompt
// =============================================================================

export function buildSectionPrompt(
  sectionTitle: string,
  sectionDescription: string,
  blockTypes: GeneratedBlockType[],
  context: string,
  citationStartIndex: number
): string {
  const hasDatabaseType = blockTypes.includes('database');
  const hasTableType = blockTypes.includes('table');

  let dataHint = '';
  if (hasDatabaseType) {
    dataHint = `
IMPORTANT: Include at least one "database" block with:
- A descriptive name
- 3-6 columns with appropriate types
- 3-10 pre-populated entries based on the context
Database entries should use column names as keys in the entries objects.`;
  }
  if (hasTableType) {
    dataHint += `
Include at least one "table" block with headers and data rows.`;
  }

  return `Expand this section into content blocks.

SECTION: ${sectionTitle}
DESCRIPTION: ${sectionDescription}
EXPECTED BLOCK TYPES: ${blockTypes.join(', ')}

CONTEXT (cite as [${citationStartIndex}], [${citationStartIndex + 1}], etc.):
${context}
${dataHint}

Respond with a JSON array of blocks. Start with a heading (level 2) for the section title, then expand with content blocks.
Example format:
[
  { "type": "heading", "level": 2, "content": "${sectionTitle}" },
  { "type": "paragraph", "content": "Overview text with **bold** and [${citationStartIndex}] citations." },
  { "type": "bulletList", "items": ["Point one", "Point two", "Point three"] }
]`;
}

// =============================================================================
// Template Hints
// =============================================================================

function getTemplateHint(template: GenerationTemplate): string {
  switch (template) {
    case 'dd-report':
      return `This is a Due Diligence Report. Include these sections:
- Executive Summary (key findings, recommendation)
- Company Overview (history, structure, leadership)
- Financial Analysis (revenue, EBITDA, margins, growth) — include a database with financial metrics
- Market & Competition (market size, competitors, positioning)
- Legal & Regulatory (compliance, pending litigation, IP)
- Risk Assessment — include a risk database with likelihood/impact ratings
- Recommendations & Next Steps`;

    case 'competitor-analysis':
      return `This is a Competitor Analysis. Include these sections:
- Market Overview (size, trends, dynamics)
- Competitor Profiles (key players, strengths/weaknesses)
- Comparative Analysis — include a database comparing competitors across metrics
- SWOT Analysis (per competitor)
- Strategic Implications
- Opportunities & Threats`;

    case 'market-report':
      return `This is a Market Report. Include these sections:
- Market Overview (size, growth rate, key segments)
- Market Trends & Drivers
- Key Players — include a database of major companies with market share
- Regional Analysis
- Regulatory Environment
- Market Outlook & Forecasts`;

    case 'company-overview':
      return `This is a Company Overview. Include these sections:
- Company Profile (founding, mission, HQ, employees)
- Products & Services
- Financial Performance — include a table with key metrics
- Leadership Team — include a database with key executives
- Recent Developments
- Strengths & Challenges`;

    case 'custom':
    default:
      return '';
  }
}

// =============================================================================
// Template Metadata (for UI)
// =============================================================================

export const GENERATION_TEMPLATES = [
  {
    id: 'dd-report' as const,
    name: 'DD Report',
    description: 'Comprehensive due diligence report with financials and risks',
    icon: '📋',
    suggestedPrompt: 'Create a due diligence report for this deal',
  },
  {
    id: 'competitor-analysis' as const,
    name: 'Competitor Analysis',
    description: 'Analyze competitors with comparison databases',
    icon: '🏆',
    suggestedPrompt: 'Create a competitor analysis for this market',
  },
  {
    id: 'market-report' as const,
    name: 'Market Report',
    description: 'Market overview with trends, players, and forecasts',
    icon: '📊',
    suggestedPrompt: 'Create a market report for this industry',
  },
  {
    id: 'company-overview' as const,
    name: 'Company Overview',
    description: 'Company profile with leadership and financials',
    icon: '🏢',
    suggestedPrompt: 'Create a company overview profile',
  },
  {
    id: 'custom' as const,
    name: 'Custom',
    description: 'Write your own prompt from scratch',
    icon: '✨',
    suggestedPrompt: '',
  },
];
