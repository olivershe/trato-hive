/**
 * Services Barrel Export
 *
 * All business logic services are exported from here.
 */
export { DealService, type DealListResult, type FactSheetResult } from './deals.service';
export { ActivityService, type LogActivityParams } from './activity.service';
export { DatabaseService } from './database.service';
export {
  FactMapperService,
  type SuggestedEntry,
  type FactSuggestionOptions,
  type FactWithSource,
} from './fact-mapper.service';
export {
  SuggestionService,
  type ApplySuggestionInput,
  type DismissSuggestionInput,
  type ApplySuggestionResult,
  type DismissSuggestionResult,
} from './suggestion.service';
