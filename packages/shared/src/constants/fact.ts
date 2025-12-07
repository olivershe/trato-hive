import { FactType } from '../types/fact'

export const FACT_TYPE_LABELS: Record<keyof typeof FactType, string> = {
  [FactType.FINANCIAL_METRIC]: 'Financial Metric',
  [FactType.KEY_PERSON]: 'Key Person',
  [FactType.PRODUCT]: 'Product',
  [FactType.CUSTOMER]: 'Customer',
  [FactType.RISK]: 'Risk Factor',
  [FactType.OPPORTUNITY]: 'Growth Opportunity',
  [FactType.OTHER]: 'Other',
}
