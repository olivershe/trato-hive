/**
 * Knowledge Graph Service Unit Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { GraphDeal, GraphCompany, GraphDocument, GraphFact } from './types';

// Mock session and driver - must be defined at module level for hoisting
const mockSession = {
  run: vi.fn().mockResolvedValue({ records: [] }),
  close: vi.fn().mockResolvedValue(undefined),
};

const mockDriver = {
  verifyConnectivity: vi.fn().mockResolvedValue(undefined),
  session: vi.fn().mockReturnValue(mockSession),
  close: vi.fn().mockResolvedValue(undefined),
};

vi.mock('neo4j-driver', () => ({
  default: {
    driver: vi.fn().mockImplementation(() => mockDriver),
    auth: {
      basic: vi.fn().mockReturnValue({ scheme: 'basic' }),
    },
  },
}));

// Import after mock setup
import {
  KnowledgeGraphService,
  createKnowledgeGraphService,
  createKnowledgeGraphServiceFromEnv,
} from './knowledge-graph';

describe('KnowledgeGraphService', () => {
  let service: KnowledgeGraphService;
  const config = {
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'test-password',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = createKnowledgeGraphService(config);
  });

  describe('connection management', () => {
    it('should connect to Neo4j', async () => {
      await service.connect();
      expect(mockDriver.verifyConnectivity).toHaveBeenCalled();
    });

    it('should not reconnect if already connected', async () => {
      await service.connect();
      await service.connect();
      expect(mockDriver.verifyConnectivity).toHaveBeenCalledTimes(1);
    });

    it('should close connection', async () => {
      await service.connect();
      await service.close();
      expect(mockDriver.close).toHaveBeenCalled();
    });

    it('should throw if not connected when getting session', async () => {
      const freshService = createKnowledgeGraphService(config);
      // Access private method indirectly via public method
      await expect(freshService.upsertDeal({
        dealId: 'deal-1',
        name: 'Test Deal',
        type: 'ACQUISITION',
        stage: 'SCREENING',
        organizationId: 'org-1',
      })).rejects.toThrow('Not connected to Neo4j');
    });
  });

  describe('upsertDeal', () => {
    it('should upsert a deal node', async () => {
      await service.connect();

      const deal: GraphDeal = {
        dealId: 'deal-1',
        name: 'Test Deal',
        type: 'ACQUISITION',
        stage: 'SCREENING',
        value: 1000000,
        organizationId: 'org-1',
      };

      await service.upsertDeal(deal);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (d:Deal'),
        expect.objectContaining({
          dealId: 'deal-1',
          name: 'Test Deal',
          organizationId: 'org-1',
        })
      );
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('upsertCompany', () => {
    it('should upsert a company node', async () => {
      await service.connect();

      const company: GraphCompany = {
        companyId: 'company-1',
        name: 'Test Company',
        industry: 'Technology',
        employees: 500,
        organizationId: 'org-1',
      };

      await service.upsertCompany(company);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (c:Company'),
        expect.objectContaining({
          companyId: 'company-1',
          name: 'Test Company',
          industry: 'Technology',
        })
      );
    });
  });

  describe('upsertDocument', () => {
    it('should upsert a document node', async () => {
      await service.connect();

      const document: GraphDocument = {
        documentId: 'doc-1',
        name: 'Test Document.pdf',
        type: 'FINANCIAL',
        status: 'PROCESSED',
        fileUrl: 'https://example.com/doc.pdf',
        organizationId: 'org-1',
      };

      await service.upsertDocument(document);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (d:Document'),
        expect.objectContaining({
          documentId: 'doc-1',
          name: 'Test Document.pdf',
        })
      );
    });
  });

  describe('upsertFact', () => {
    it('should upsert a fact node', async () => {
      await service.connect();

      const fact: GraphFact = {
        factId: 'fact-1',
        type: 'FINANCIAL_METRIC',
        subject: 'Revenue',
        predicate: 'is',
        object: '$10M',
        confidence: 0.95,
        sourceText: 'Revenue is $10M',
        organizationId: 'org-1',
      };

      await service.upsertFact(fact);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (f:Fact'),
        expect.objectContaining({
          factId: 'fact-1',
          type: 'FINANCIAL_METRIC',
          subject: 'Revenue',
        })
      );
    });

    it('should create document relationships when documentId provided', async () => {
      await service.connect();

      const fact: GraphFact = {
        factId: 'fact-1',
        type: 'FINANCIAL_METRIC',
        subject: 'Revenue',
        predicate: 'is',
        object: '$10M',
        confidence: 0.95,
        sourceText: 'Revenue is $10M',
        organizationId: 'org-1',
      };

      await service.upsertFact(fact, 'doc-1');

      // Should be called twice: once for fact, once for relationships
      expect(mockSession.run).toHaveBeenCalledTimes(2);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CONTAINS'),
        expect.objectContaining({ documentId: 'doc-1' })
      );
    });

    it('should create company relationships when companyId provided', async () => {
      await service.connect();

      const fact: GraphFact = {
        factId: 'fact-1',
        type: 'KEY_PERSON',
        subject: 'John Doe',
        predicate: 'is',
        object: 'CEO',
        confidence: 0.9,
        sourceText: 'John Doe is CEO',
        organizationId: 'org-1',
      };

      await service.upsertFact(fact, undefined, 'company-1');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('ABOUT'),
        expect.objectContaining({ companyId: 'company-1' })
      );
    });
  });

  describe('linkDealToCompany', () => {
    it('should create OWNS relationship between deal and company', async () => {
      await service.connect();

      await service.linkDealToCompany('deal-1', 'company-1', 'org-1');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('OWNS'),
        expect.objectContaining({
          dealId: 'deal-1',
          companyId: 'company-1',
        })
      );
    });
  });

  describe('linkCompanyToDocument', () => {
    it('should create HAS relationship between company and document', async () => {
      await service.connect();

      await service.linkCompanyToDocument('company-1', 'doc-1', 'org-1');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('HAS'),
        expect.objectContaining({
          companyId: 'company-1',
          documentId: 'doc-1',
        })
      );
    });
  });

  describe('getCompanyFacts', () => {
    it('should return facts for a company', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: () => ({
              properties: {
                factId: 'fact-1',
                type: 'FINANCIAL_METRIC',
                subject: 'Revenue',
                predicate: 'is',
                object: '$10M',
                confidence: 0.95,
                sourceText: 'Revenue is $10M',
                organizationId: 'org-1',
              },
            }),
          },
        ],
      });

      const facts = await service.getCompanyFacts('company-1', 'org-1');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('ABOUT'),
        expect.objectContaining({ companyId: 'company-1' })
      );
      expect(facts).toHaveLength(1);
      expect(facts[0].factId).toBe('fact-1');
    });
  });

  describe('getFactsByType', () => {
    it('should return facts of a specific type', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: () => ({
              properties: {
                factId: 'fact-1',
                type: 'RISK',
                subject: 'Regulatory',
                predicate: 'has',
                object: 'compliance issues',
                confidence: 0.8,
                sourceText: 'Company has compliance issues',
                organizationId: 'org-1',
              },
            }),
          },
        ],
      });

      const facts = await service.getFactsByType('company-1', 'RISK', 'org-1');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('type: $factType'),
        expect.objectContaining({ factType: 'RISK' })
      );
      expect(facts).toHaveLength(1);
      expect(facts[0].type).toBe('RISK');
    });
  });

  describe('getRelatedCompanies', () => {
    it('should return companies sharing facts', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'c2') {
                return {
                  properties: {
                    companyId: 'company-2',
                    name: 'Related Company',
                    organizationId: 'org-1',
                  },
                };
              }
              if (key === 'relationTypes') return ['CUSTOMER'];
              if (key === 'sharedFactCount') return { toNumber: () => 3 };
              return null;
            },
          },
        ],
      });

      const related = await service.getRelatedCompanies('company-1', 'org-1');

      expect(related).toHaveLength(1);
      expect(related[0].company.companyId).toBe('company-2');
      expect(related[0].sharedFacts).toBe(3);
    });
  });

  describe('findCompanyRisks', () => {
    it('should return risk facts with source documents', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'f') {
                return {
                  properties: {
                    factId: 'risk-1',
                    type: 'RISK',
                    subject: 'Market',
                    predicate: 'has',
                    object: 'high competition',
                    confidence: 0.85,
                    sourceText: 'High competition in market',
                    organizationId: 'org-1',
                  },
                };
              }
              if (key === 'd') {
                return {
                  properties: {
                    documentId: 'doc-1',
                    name: 'Analysis.pdf',
                    type: 'REPORT',
                    status: 'PROCESSED',
                    fileUrl: 'https://example.com/analysis.pdf',
                    organizationId: 'org-1',
                  },
                };
              }
              return null;
            },
          },
        ],
      });

      const risks = await service.findCompanyRisks('company-1', 'org-1');

      expect(risks).toHaveLength(1);
      expect(risks[0].fact.type).toBe('RISK');
      expect(risks[0].sourceDocument?.documentId).toBe('doc-1');
    });
  });

  describe('findKeyPersonsAcrossDeals', () => {
    it('should return key persons appearing in multiple deals', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'personName') return 'John Doe';
              if (key === 'dealRoles') {
                return [
                  { dealId: 'deal-1', dealName: 'Deal A', role: 'CEO' },
                  { dealId: 'deal-2', dealName: 'Deal B', role: 'Board Member' },
                ];
              }
              if (key === 'mentions') return { toNumber: () => 2 };
              return null;
            },
          },
        ],
      });

      const persons = await service.findKeyPersonsAcrossDeals('org-1');

      expect(persons).toHaveLength(1);
      expect(persons[0].personName).toBe('John Doe');
      expect(persons[0].deals).toHaveLength(2);
      expect(persons[0].totalMentions).toBe(2);
    });
  });

  describe('findCompaniesWithSharedCustomers', () => {
    it('should return shared customers between companies', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'customerName') return 'Acme Corp';
              if (key === 'companies') {
                return [
                  { companyId: 'company-1', companyName: 'Vendor A' },
                  { companyId: 'company-2', companyName: 'Vendor B' },
                ];
              }
              return null;
            },
          },
        ],
      });

      const shared = await service.findCompaniesWithSharedCustomers('org-1');

      expect(shared).toHaveLength(1);
      expect(shared[0].customerName).toBe('Acme Corp');
      expect(shared[0].companies).toHaveLength(2);
    });
  });

  describe('getFactChain', () => {
    it('should return full fact chain', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({
        records: [
          {
            get: (key: string) => {
              if (key === 'f') {
                return {
                  properties: {
                    factId: 'fact-1',
                    type: 'FINANCIAL_METRIC',
                    subject: 'Revenue',
                    predicate: 'is',
                    object: '$10M',
                    confidence: 0.95,
                    sourceText: 'Revenue is $10M',
                    organizationId: 'org-1',
                  },
                };
              }
              if (key === 'd') {
                return {
                  properties: {
                    documentId: 'doc-1',
                    name: 'Financials.pdf',
                    type: 'FINANCIAL',
                    status: 'PROCESSED',
                    fileUrl: 'https://example.com/fin.pdf',
                    organizationId: 'org-1',
                  },
                };
              }
              if (key === 'c') {
                return {
                  properties: {
                    companyId: 'company-1',
                    name: 'Target Company',
                    organizationId: 'org-1',
                  },
                };
              }
              return null;
            },
          },
        ],
      });

      const chain = await service.getFactChain('fact-1', 'org-1');

      expect(chain).not.toBeNull();
      expect(chain?.fact.factId).toBe('fact-1');
      expect(chain?.sourceDocument?.documentId).toBe('doc-1');
      expect(chain?.aboutCompany?.companyId).toBe('company-1');
    });

    it('should return null for non-existent fact', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({ records: [] });

      const chain = await service.getFactChain('non-existent', 'org-1');

      expect(chain).toBeNull();
    });
  });

  describe('deleteByOrganization', () => {
    it('should delete all nodes for an organization', async () => {
      await service.connect();

      mockSession.run.mockResolvedValueOnce({
        records: [{ get: () => ({ toNumber: () => 50 }) }],
      });

      const result = await service.deleteByOrganization('org-1');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('DETACH DELETE'),
        expect.objectContaining({ organizationId: 'org-1' })
      );
      expect(result.nodesDeleted).toBe(50);
    });
  });

  describe('deleteFact', () => {
    it('should delete a specific fact', async () => {
      await service.connect();

      await service.deleteFact('fact-1', 'org-1');

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('DETACH DELETE'),
        expect.objectContaining({ factId: 'fact-1' })
      );
    });
  });

  describe('setupIndexes', () => {
    it('should create all required indexes', async () => {
      await service.connect();

      await service.setupIndexes();

      // Should create 5 indexes
      expect(mockSession.run).toHaveBeenCalledTimes(5);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX')
      );
    });
  });
});

describe('createKnowledgeGraphServiceFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw if NEO4J_URI is missing', () => {
    delete process.env.NEO4J_URI;
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';

    expect(() => createKnowledgeGraphServiceFromEnv()).toThrow('NEO4J_URI');
  });

  it('should throw if NEO4J_USER is missing', () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    delete process.env.NEO4J_USER;
    process.env.NEO4J_PASSWORD = 'password';

    expect(() => createKnowledgeGraphServiceFromEnv()).toThrow('NEO4J_USER');
  });

  it('should throw if NEO4J_PASSWORD is missing', () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    delete process.env.NEO4J_PASSWORD;

    expect(() => createKnowledgeGraphServiceFromEnv()).toThrow('NEO4J_PASSWORD');
  });

  it('should create service from environment variables', () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';

    const service = createKnowledgeGraphServiceFromEnv();
    expect(service).toBeInstanceOf(KnowledgeGraphService);
  });
});
