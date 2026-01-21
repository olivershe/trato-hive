/**
 * Tools Index
 *
 * Exports all tools for the ActionAgent.
 */

// Deal tools
export {
  updateDealTool,
  createDealTool,
  getDealSummaryTool,
  executeUpdateDeal,
  executeCreateDeal,
  executeGetDealSummary,
  type UpdateDealInput,
  type CreateDealInput,
  type GetDealSummaryInput,
  type DealToolContext,
} from './deal-tools';

// Company tools
export {
  updateCompanyTool,
  createCompanyTool,
  executeUpdateCompany,
  executeCreateCompany,
  type UpdateCompanyInput,
  type CreateCompanyInput,
  type CompanyToolContext,
} from './company-tools';

// Search tools
export {
  searchDealsTool,
  searchKnowledgeTool,
  createTaskTool,
  executeSearchDeals,
  executeSearchKnowledge,
  executeCreateTask,
  type SearchDealsInput,
  type SearchKnowledgeInput,
  type CreateTaskInput,
  type SearchToolContext,
  type SearchToolDeps,
} from './search-tools';

// All tools array for ActionAgent
import { updateDealTool, createDealTool, getDealSummaryTool } from './deal-tools';
import { updateCompanyTool, createCompanyTool } from './company-tools';
import { searchDealsTool, searchKnowledgeTool, createTaskTool } from './search-tools';

export const ALL_TOOLS = [
  updateDealTool,
  createDealTool,
  getDealSummaryTool,
  updateCompanyTool,
  createCompanyTool,
  searchDealsTool,
  searchKnowledgeTool,
  createTaskTool,
];
