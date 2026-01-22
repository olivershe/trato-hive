/**
 * Agents Seed Script
 * Creates system agents for all organizations
 * [TASK-128] Custom Agents Database + File Attachments
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  email: string;
}

// System agent definitions
const SYSTEM_AGENTS = [
  {
    name: 'Financial Analyst',
    slug: 'financial-analyst',
    description: 'Reviews financial documents for key metrics and risks',
    icon: '📊',
    promptTemplate: `You are an expert M&A financial analyst with deep expertise in private equity due diligence.

Analyze the attached financial documents and provide a comprehensive analysis including:

## 1. Revenue Analysis
- Revenue trends over the available periods
- Growth rates (YoY and CAGR if applicable)
- Revenue composition by segment/product
- Seasonality patterns

## 2. EBITDA Calculation
- Reported EBITDA
- Adjustments and add-backs
- Adjusted EBITDA margins
- EBITDA bridge from prior period

## 3. Working Capital Assessment
- Current working capital levels
- Working capital as % of revenue
- Cash conversion cycle
- Seasonal patterns

## 4. Red Flags & Risks
- Revenue quality concerns
- Customer concentration
- Margin sustainability
- Accounting policy concerns
- One-time items that may recur

## 5. Key Metrics Summary
Provide a summary table of key financial metrics.

Deal: {{dealName}}
Company: {{companyName}}
Industry: {{industry}}
Date: {{date}}`,
    outputFormat: 'SUMMARY' as const,
    tags: ['financial', 'due-diligence', 'ebitda', 'revenue'],
  },
  {
    name: 'Legal Risk Spotter',
    slug: 'legal-risk',
    description: 'Identifies legal risks and compliance issues in contracts',
    icon: '⚖️',
    promptTemplate: `You are an experienced M&A legal counsel specializing in transaction risk assessment.

Review the attached legal documents and identify potential risks and issues:

## 1. Material Agreements Analysis
- Key contracts and their terms
- Change of control provisions
- Assignment requirements
- Termination rights

## 2. Litigation & Claims
- Pending or threatened litigation
- Historical claims patterns
- Insurance coverage assessment
- Potential exposure quantification

## 3. Compliance Assessment
- Regulatory compliance status
- Required licenses and permits
- Environmental considerations
- Data privacy compliance (GDPR, CCPA, etc.)

## 4. IP & Proprietary Rights
- IP ownership verification
- Third-party IP dependencies
- Employee IP assignment status
- Trade secret protection

## 5. Risk Summary Table
| Risk Area | Severity | Description | Mitigation |
|-----------|----------|-------------|------------|
| ... | ... | ... | ... |

Deal: {{dealName}}
Company: {{companyName}}
Date: {{date}}`,
    outputFormat: 'TABLE' as const,
    tags: ['legal', 'compliance', 'risk', 'contracts'],
  },
  {
    name: 'Tech Due Diligence',
    slug: 'tech-dd',
    description: 'Evaluates technology stack, IP, and technical risks',
    icon: '💻',
    promptTemplate: `You are a senior technology due diligence expert with experience in PE-backed software companies.

Analyze the attached technical documentation and assess:

## 1. Technology Stack Assessment
- Core technology components
- Architecture overview
- Cloud infrastructure (AWS/GCP/Azure)
- Third-party dependencies

## 2. Technical Debt Analysis
- Code quality indicators
- Documentation completeness
- Testing coverage
- Known technical issues

## 3. IP & Patent Review
- Proprietary technology
- Patent portfolio
- Open source compliance
- Licensing considerations

## 4. Team Assessment
- Key technical personnel
- Skill coverage gaps
- Vendor dependencies
- Succession planning

## 5. Scalability Analysis
- Current capacity utilization
- Scaling constraints
- Performance metrics
- Infrastructure costs

## 6. Risk Rating
| Area | Rating | Notes |
|------|--------|-------|
| Architecture | Low/Medium/High | ... |
| Tech Debt | Low/Medium/High | ... |
| Security | Low/Medium/High | ... |
| Scalability | Low/Medium/High | ... |
| Team | Low/Medium/High | ... |

Deal: {{dealName}}
Company: {{companyName}}
Industry: {{industry}}`,
    outputFormat: 'SUMMARY' as const,
    tags: ['technology', 'technical', 'architecture', 'ip'],
  },
  {
    name: 'Commercial DD Analyst',
    slug: 'commercial-dd',
    description: 'Analyzes market position, customers, and growth potential',
    icon: '📈',
    promptTemplate: `You are a commercial due diligence expert focusing on market analysis and growth assessment.

Analyze the attached materials and provide insights on:

## 1. Market Analysis
- Market size and growth (TAM/SAM/SOM)
- Market dynamics and trends
- Competitive landscape
- Regulatory environment

## 2. Customer Analysis
- Customer concentration
- Customer retention rates
- Contract terms and stickiness
- Customer acquisition costs

## 3. Competitive Position
- Key competitors
- Differentiation factors
- Market share estimates
- Competitive threats

## 4. Growth Assessment
- Historical growth drivers
- Future growth opportunities
- Geographic expansion potential
- Product roadmap alignment

## 5. Key Findings
- Top 3 investment positives
- Top 3 investment concerns
- Recommended focus areas for further diligence

Company: {{companyName}}
Industry: {{industry}}
Deal: {{dealName}}`,
    outputFormat: 'BULLETS' as const,
    tags: ['commercial', 'market', 'customers', 'growth'],
  },
  {
    name: 'Document Summarizer',
    slug: 'document-summarizer',
    description: 'Creates executive summaries of lengthy documents',
    icon: '📋',
    promptTemplate: `You are an executive assistant specialized in creating concise, actionable summaries for busy PE professionals.

Create a comprehensive executive summary of the attached document(s):

## Document Overview
- Document type and purpose
- Date and author (if available)
- Key stakeholders mentioned

## Executive Summary
Provide a 2-3 paragraph summary covering:
- Main purpose and conclusions
- Key data points and metrics
- Important decisions or recommendations

## Key Takeaways
List the 5-7 most important points from the document in bullet form.

## Action Items
Extract any explicit or implied action items, decisions needed, or follow-up requirements.

## Notable Quotes or Data
Highlight 2-3 notable quotes or data points that may be relevant for investment memos.

Context: {{dealName}} - {{companyName}}
Date: {{date}}`,
    outputFormat: 'SUMMARY' as const,
    tags: ['summary', 'executive', 'overview', 'quick'],
  },
];

export async function seedAgents(
  organizations: Organization[],
  users: User[]
): Promise<number> {
  console.log('📦 Seeding system agents...');

  let totalCreated = 0;

  for (const org of organizations) {
    // Find a user in this organization to use as creator
    // In a real scenario, we'd query for the owner, but for seed we'll use the first user
    const creator = users[0]; // Default to first user

    if (!creator) {
      console.log(`   ⚠️ No users available, skipping agents for ${org.name}`);
      continue;
    }

    for (const agentData of SYSTEM_AGENTS) {
      // Check if agent already exists
      const existing = await prisma.customAgent.findFirst({
        where: {
          organizationId: org.id,
          slug: agentData.slug,
        },
      });

      if (existing) {
        console.log(`   ↳ Agent "${agentData.name}" already exists for ${org.name}`);
        continue;
      }

      // Create the agent
      await prisma.customAgent.create({
        data: {
          organizationId: org.id,
          createdById: creator.id,
          name: agentData.name,
          slug: agentData.slug,
          description: agentData.description,
          icon: agentData.icon,
          promptTemplate: agentData.promptTemplate,
          outputFormat: agentData.outputFormat,
          tags: agentData.tags,
          isActive: true,
          isSystem: true,
        },
      });

      totalCreated++;
      console.log(`   ✓ Created "${agentData.name}" for ${org.name}`);
    }
  }

  return totalCreated;
}
