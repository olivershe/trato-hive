import { DealStage } from '../types/deal'

/**
 * Pipeline Stage Definitions
 * Uses DealStage from types/deal as the source of truth for keys
 */

export interface StageInfo {
  label: string
  color: string
  description: string
  order: number
}

export const PIPELINE_STAGE_INFO: Record<keyof typeof DealStage, StageInfo> = {
  [DealStage.SOURCING]: {
    label: 'Sourcing',
    color: '#94A3B8', // slate-400
    description: 'Identifying potential targets',
    order: 1,
  },
  [DealStage.INITIAL_REVIEW]: {
    label: 'Initial Review',
    color: '#60A5FA', // blue-400
    description: 'High-level assessment of the opportunity',
    order: 2,
  },
  [DealStage.PRELIMINARY_DUE_DILIGENCE]: {
    label: 'Prelim DD',
    color: '#818CF8', // indigo-400
    description: 'Initial data gathering and analysis',
    order: 3,
  },
  [DealStage.DEEP_DUE_DILIGENCE]: {
    label: 'Deep DD',
    color: '#A78BFA', // violet-400
    description: 'Comprehensive audit and verification',
    order: 4,
  },
  [DealStage.NEGOTIATION]: {
    label: 'Negotiation',
    color: '#F472B6', // pink-400
    description: 'Discussing terms and valuation',
    order: 5,
  },
  [DealStage.CLOSING]: {
    label: 'Closing',
    color: '#FB923C', // orange-400
    description: 'Finalizing legal documents and transfer',
    order: 6,
  },
  [DealStage.CLOSED_WON]: {
    label: 'Closed Won',
    color: '#34D399', // emerald-400
    description: 'Deal successfully completed',
    order: 7,
  },
  [DealStage.CLOSED_LOST]: {
    label: 'Closed Lost',
    color: '#F87171', // red-400
    description: 'Deal lost or abandoned',
    order: 8,
  },
}

export const PIPELINE_STAGES = Object.values(DealStage)
