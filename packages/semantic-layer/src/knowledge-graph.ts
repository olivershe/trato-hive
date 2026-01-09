/**
 * Knowledge Graph Service
 *
 * Neo4j-based knowledge graph with multi-tenancy support.
 * Handles entity nodes, relationships, and graph traversals.
 */
import neo4j, { Driver, Session } from 'neo4j-driver';
import type {
  KnowledgeGraphConfig,
  GraphDeal,
  GraphCompany,
  GraphDocument,
  GraphFact,
  FactChain,
  RelatedCompany,
  PersonDealResult,
  SharedCustomerResult,
  FactType,
} from './types';

// =============================================================================
// Knowledge Graph Service Class
// =============================================================================

export class KnowledgeGraphService {
  private driver: Driver | null = null;
  private config: KnowledgeGraphConfig;

  constructor(config: KnowledgeGraphConfig) {
    this.config = config;
  }

  // ===========================================================================
  // Connection Management
  // ===========================================================================

  /**
   * Connect to Neo4j
   */
  async connect(): Promise<void> {
    if (this.driver) {
      return;
    }

    this.driver = neo4j.driver(
      this.config.uri,
      neo4j.auth.basic(this.config.user, this.config.password)
    );

    // Verify connectivity
    await this.driver.verifyConnectivity();
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  /**
   * Get a session for running queries
   */
  private getSession(): Session {
    if (!this.driver) {
      throw new Error('Not connected to Neo4j. Call connect() first.');
    }
    return this.driver.session();
  }

  // ===========================================================================
  // Node Upserts
  // ===========================================================================

  /**
   * Upsert a Deal node
   */
  async upsertDeal(deal: GraphDeal): Promise<void> {
    const session = this.getSession();
    try {
      await session.run(
        `
        MERGE (d:Deal {dealId: $dealId, organizationId: $organizationId})
        SET d.name = $name,
            d.type = $type,
            d.stage = $stage,
            d.value = $value,
            d.updatedAt = datetime()
        `,
        {
          dealId: deal.dealId,
          organizationId: deal.organizationId,
          name: deal.name,
          type: deal.type,
          stage: deal.stage,
          value: deal.value ?? null,
        }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Upsert a Company node
   */
  async upsertCompany(company: GraphCompany): Promise<void> {
    const session = this.getSession();
    try {
      await session.run(
        `
        MERGE (c:Company {companyId: $companyId, organizationId: $organizationId})
        SET c.name = $name,
            c.industry = $industry,
            c.sector = $sector,
            c.employees = $employees,
            c.revenue = $revenue,
            c.location = $location,
            c.updatedAt = datetime()
        `,
        {
          companyId: company.companyId,
          organizationId: company.organizationId,
          name: company.name,
          industry: company.industry ?? null,
          sector: company.sector ?? null,
          employees: company.employees ?? null,
          revenue: company.revenue ?? null,
          location: company.location ?? null,
        }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Upsert a Document node
   */
  async upsertDocument(document: GraphDocument): Promise<void> {
    const session = this.getSession();
    try {
      await session.run(
        `
        MERGE (d:Document {documentId: $documentId, organizationId: $organizationId})
        SET d.name = $name,
            d.type = $type,
            d.status = $status,
            d.fileUrl = $fileUrl,
            d.updatedAt = datetime()
        `,
        {
          documentId: document.documentId,
          organizationId: document.organizationId,
          name: document.name,
          type: document.type,
          status: document.status,
          fileUrl: document.fileUrl,
        }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Upsert a Fact node with optional relationships
   */
  async upsertFact(
    fact: GraphFact,
    documentId?: string,
    companyId?: string
  ): Promise<void> {
    const session = this.getSession();
    try {
      // Create/update the fact node
      await session.run(
        `
        MERGE (f:Fact {factId: $factId, organizationId: $organizationId})
        SET f.type = $type,
            f.subject = $subject,
            f.predicate = $predicate,
            f.object = $object,
            f.confidence = $confidence,
            f.sourceText = $sourceText,
            f.updatedAt = datetime()
        `,
        {
          factId: fact.factId,
          organizationId: fact.organizationId,
          type: fact.type,
          subject: fact.subject,
          predicate: fact.predicate,
          object: fact.object,
          confidence: fact.confidence,
          sourceText: fact.sourceText,
        }
      );

      // Create CONTAINS and SOURCE_DOCUMENT relationships if documentId provided
      if (documentId) {
        await session.run(
          `
          MATCH (d:Document {documentId: $documentId, organizationId: $organizationId})
          MATCH (f:Fact {factId: $factId, organizationId: $organizationId})
          MERGE (d)-[:CONTAINS]->(f)
          MERGE (f)-[:SOURCE_DOCUMENT]->(d)
          `,
          {
            documentId,
            factId: fact.factId,
            organizationId: fact.organizationId,
          }
        );
      }

      // Create ABOUT relationship if companyId provided
      if (companyId) {
        await session.run(
          `
          MATCH (c:Company {companyId: $companyId, organizationId: $organizationId})
          MATCH (f:Fact {factId: $factId, organizationId: $organizationId})
          MERGE (f)-[:ABOUT]->(c)
          `,
          {
            companyId,
            factId: fact.factId,
            organizationId: fact.organizationId,
          }
        );
      }
    } finally {
      await session.close();
    }
  }

  // ===========================================================================
  // Relationship Operations
  // ===========================================================================

  /**
   * Link a Deal to a Company (OWNS relationship)
   */
  async linkDealToCompany(
    dealId: string,
    companyId: string,
    organizationId: string
  ): Promise<void> {
    const session = this.getSession();
    try {
      await session.run(
        `
        MATCH (d:Deal {dealId: $dealId, organizationId: $organizationId})
        MATCH (c:Company {companyId: $companyId, organizationId: $organizationId})
        MERGE (d)-[:OWNS]->(c)
        `,
        { dealId, companyId, organizationId }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Link a Company to a Document (HAS relationship)
   */
  async linkCompanyToDocument(
    companyId: string,
    documentId: string,
    organizationId: string
  ): Promise<void> {
    const session = this.getSession();
    try {
      await session.run(
        `
        MATCH (c:Company {companyId: $companyId, organizationId: $organizationId})
        MATCH (d:Document {documentId: $documentId, organizationId: $organizationId})
        MERGE (c)-[:HAS]->(d)
        `,
        { companyId, documentId, organizationId }
      );
    } finally {
      await session.close();
    }
  }

  // ===========================================================================
  // Query Methods
  // ===========================================================================

  /**
   * Get all facts for a company
   */
  async getCompanyFacts(
    companyId: string,
    organizationId: string
  ): Promise<GraphFact[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (f:Fact)-[:ABOUT]->(c:Company {companyId: $companyId, organizationId: $organizationId})
        WHERE f.organizationId = $organizationId
        RETURN f
        ORDER BY f.confidence DESC
        `,
        { companyId, organizationId }
      );

      return result.records.map((record) => this.recordToGraphFact(record.get('f')));
    } finally {
      await session.close();
    }
  }

  /**
   * Get facts by type for a company
   */
  async getFactsByType(
    companyId: string,
    factType: FactType,
    organizationId: string
  ): Promise<GraphFact[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (f:Fact {type: $factType})-[:ABOUT]->(c:Company {companyId: $companyId, organizationId: $organizationId})
        WHERE f.organizationId = $organizationId
        RETURN f
        ORDER BY f.confidence DESC
        `,
        { companyId, factType, organizationId }
      );

      return result.records.map((record) => this.recordToGraphFact(record.get('f')));
    } finally {
      await session.close();
    }
  }

  /**
   * Get related companies (companies sharing facts with this one)
   */
  async getRelatedCompanies(
    companyId: string,
    organizationId: string
  ): Promise<RelatedCompany[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (c1:Company {companyId: $companyId, organizationId: $organizationId})<-[:ABOUT]-(f:Fact)-[:ABOUT]->(c2:Company)
        WHERE c2.companyId <> $companyId AND c2.organizationId = $organizationId
        WITH c2, collect(DISTINCT f.type) as relationTypes, count(f) as sharedFactCount
        RETURN c2, relationTypes, sharedFactCount
        ORDER BY sharedFactCount DESC
        `,
        { companyId, organizationId }
      );

      return result.records.map((record) => ({
        company: this.recordToGraphCompany(record.get('c2')),
        sharedFacts: record.get('sharedFactCount').toNumber(),
        relationshipTypes: record.get('relationTypes') as string[],
      }));
    } finally {
      await session.close();
    }
  }

  // ===========================================================================
  // Traversal Methods
  // ===========================================================================

  /**
   * Find all risks for a company
   */
  async findCompanyRisks(
    companyId: string,
    organizationId: string
  ): Promise<FactChain[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (f:Fact {type: 'RISK'})-[:ABOUT]->(c:Company {companyId: $companyId, organizationId: $organizationId})
        WHERE f.organizationId = $organizationId
        OPTIONAL MATCH (f)-[:SOURCE_DOCUMENT]->(d:Document)
        RETURN f, d
        ORDER BY f.confidence DESC
        `,
        { companyId, organizationId }
      );

      return result.records.map((record) => ({
        fact: this.recordToGraphFact(record.get('f')),
        sourceDocument: record.get('d')
          ? this.recordToGraphDocument(record.get('d'))
          : undefined,
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Find key persons across multiple deals
   */
  async findKeyPersonsAcrossDeals(
    organizationId: string
  ): Promise<PersonDealResult[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (f:Fact {type: 'KEY_PERSON', organizationId: $organizationId})-[:ABOUT]->(c:Company)<-[:OWNS]-(deal:Deal)
        WITH f.subject as personName, collect({dealId: deal.dealId, dealName: deal.name, role: f.object}) as dealRoles, count(f) as mentions
        WHERE mentions > 1
        RETURN personName, dealRoles, mentions
        ORDER BY mentions DESC
        `,
        { organizationId }
      );

      return result.records.map((record) => ({
        personName: record.get('personName') as string,
        deals: record.get('dealRoles') as Array<{
          dealId: string;
          dealName: string;
          role: string;
        }>,
        totalMentions: record.get('mentions').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Find companies with shared customers
   */
  async findCompaniesWithSharedCustomers(
    organizationId: string
  ): Promise<SharedCustomerResult[]> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (f:Fact {type: 'CUSTOMER', organizationId: $organizationId})-[:ABOUT]->(c:Company)
        WITH f.object as customerName, collect({companyId: c.companyId, companyName: c.name}) as companies
        WHERE size(companies) > 1
        RETURN customerName, companies
        ORDER BY size(companies) DESC
        `,
        { organizationId }
      );

      return result.records.map((record) => ({
        customerName: record.get('customerName') as string,
        companies: record.get('companies') as Array<{
          companyId: string;
          companyName: string;
        }>,
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Get the full chain for a fact (fact + source document + about company)
   */
  async getFactChain(
    factId: string,
    organizationId: string
  ): Promise<FactChain | null> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (f:Fact {factId: $factId, organizationId: $organizationId})
        OPTIONAL MATCH (f)-[:SOURCE_DOCUMENT]->(d:Document)
        OPTIONAL MATCH (f)-[:ABOUT]->(c:Company)
        RETURN f, d, c
        `,
        { factId, organizationId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      return {
        fact: this.recordToGraphFact(record.get('f')),
        sourceDocument: record.get('d')
          ? this.recordToGraphDocument(record.get('d'))
          : undefined,
        aboutCompany: record.get('c')
          ? this.recordToGraphCompany(record.get('c'))
          : undefined,
      };
    } finally {
      await session.close();
    }
  }

  // ===========================================================================
  // Cleanup Operations
  // ===========================================================================

  /**
   * Delete all nodes for an organization
   */
  async deleteByOrganization(
    organizationId: string
  ): Promise<{ nodesDeleted: number }> {
    const session = this.getSession();
    try {
      const result = await session.run(
        `
        MATCH (n {organizationId: $organizationId})
        DETACH DELETE n
        RETURN count(n) as nodesDeleted
        `,
        { organizationId }
      );

      const nodesDeleted = result.records[0]?.get('nodesDeleted')?.toNumber() || 0;
      return { nodesDeleted };
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a specific fact
   */
  async deleteFact(factId: string, organizationId: string): Promise<void> {
    const session = this.getSession();
    try {
      await session.run(
        `
        MATCH (f:Fact {factId: $factId, organizationId: $organizationId})
        DETACH DELETE f
        `,
        { factId, organizationId }
      );
    } finally {
      await session.close();
    }
  }

  // ===========================================================================
  // Setup
  // ===========================================================================

  /**
   * Create indexes for optimal query performance
   */
  async setupIndexes(): Promise<void> {
    const session = this.getSession();
    try {
      // Create composite indexes for each node type
      const indexQueries = [
        'CREATE INDEX deal_org_idx IF NOT EXISTS FOR (d:Deal) ON (d.dealId, d.organizationId)',
        'CREATE INDEX company_org_idx IF NOT EXISTS FOR (c:Company) ON (c.companyId, c.organizationId)',
        'CREATE INDEX document_org_idx IF NOT EXISTS FOR (d:Document) ON (d.documentId, d.organizationId)',
        'CREATE INDEX fact_org_idx IF NOT EXISTS FOR (f:Fact) ON (f.factId, f.organizationId)',
        'CREATE INDEX fact_type_idx IF NOT EXISTS FOR (f:Fact) ON (f.type, f.organizationId)',
      ];

      for (const query of indexQueries) {
        await session.run(query);
      }
    } finally {
      await session.close();
    }
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private recordToGraphFact(node: any): GraphFact {
    return {
      factId: node.properties.factId,
      type: node.properties.type as FactType,
      subject: node.properties.subject,
      predicate: node.properties.predicate,
      object: node.properties.object,
      confidence: typeof node.properties.confidence === 'object'
        ? node.properties.confidence.toNumber()
        : node.properties.confidence,
      sourceText: node.properties.sourceText,
      organizationId: node.properties.organizationId,
    };
  }

  private recordToGraphCompany(node: any): GraphCompany {
    return {
      companyId: node.properties.companyId,
      name: node.properties.name,
      industry: node.properties.industry ?? undefined,
      sector: node.properties.sector ?? undefined,
      employees: node.properties.employees
        ? typeof node.properties.employees === 'object'
          ? node.properties.employees.toNumber()
          : node.properties.employees
        : undefined,
      revenue: node.properties.revenue
        ? typeof node.properties.revenue === 'object'
          ? node.properties.revenue.toNumber()
          : node.properties.revenue
        : undefined,
      location: node.properties.location ?? undefined,
      organizationId: node.properties.organizationId,
    };
  }

  private recordToGraphDocument(node: any): GraphDocument {
    return {
      documentId: node.properties.documentId,
      name: node.properties.name,
      type: node.properties.type,
      status: node.properties.status,
      fileUrl: node.properties.fileUrl,
      organizationId: node.properties.organizationId,
    };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a knowledge graph service instance
 */
export function createKnowledgeGraphService(
  config: KnowledgeGraphConfig
): KnowledgeGraphService {
  return new KnowledgeGraphService(config);
}

/**
 * Create knowledge graph service from environment variables
 */
export function createKnowledgeGraphServiceFromEnv(): KnowledgeGraphService {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri) {
    throw new Error('NEO4J_URI environment variable is required');
  }

  if (!user) {
    throw new Error('NEO4J_USER environment variable is required');
  }

  if (!password) {
    throw new Error('NEO4J_PASSWORD environment variable is required');
  }

  return new KnowledgeGraphService({
    uri,
    user,
    password,
  });
}
