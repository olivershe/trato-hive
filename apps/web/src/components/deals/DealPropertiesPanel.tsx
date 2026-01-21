/**
 * DealPropertiesPanel Component
 *
 * Notion-style properties panel for deal pages.
 * Displays deal properties from DatabaseEntry with inline editing support.
 *
 * Phase 12: Deals Database Architecture Migration
 */
"use client";

import { useCallback } from "react";
import { api } from "@/trpc/react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Tag,
  User,
  Target,
  Layers,
  Loader2,
} from "lucide-react";
import { PropertyRow } from "./PropertyRow";
import { CellRenderer, type CellColumn, type StatusOption } from "@/components/shared/cells";
import {
  DEAL_STAGE_OPTIONS,
  DEAL_PRIORITY_OPTIONS,
  DEAL_SOURCE_OPTIONS,
  DEAL_TYPE_OPTIONS,
} from "@trato-hive/shared";

// Map StatusOption color to CellColumn StatusColor (extend types as needed)
type ExtendedStatusColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'violet' | 'pink' | 'orange' | 'amber' | 'emerald';

// Column definitions for inline editing
const PROPERTY_COLUMNS: Record<string, CellColumn> = {
  stage: {
    id: 'stage',
    name: 'Stage',
    type: 'STATUS',
    statusOptions: DEAL_STAGE_OPTIONS.map((opt): StatusOption => ({
      ...opt,
      color: opt.color as ExtendedStatusColor,
    })),
  },
  priority: {
    id: 'priority',
    name: 'Priority',
    type: 'STATUS',
    statusOptions: DEAL_PRIORITY_OPTIONS.map((opt): StatusOption => ({
      ...opt,
      color: opt.color as ExtendedStatusColor,
    })),
  },
  type: {
    id: 'type',
    name: 'Type',
    type: 'SELECT',
    options: DEAL_TYPE_OPTIONS,
  },
  value: {
    id: 'value',
    name: 'Value',
    type: 'NUMBER',
  },
  probability: {
    id: 'probability',
    name: 'Probability',
    type: 'NUMBER',
  },
  expectedCloseDate: {
    id: 'expectedCloseDate',
    name: 'Expected Close',
    type: 'DATE',
  },
  source: {
    id: 'source',
    name: 'Source',
    type: 'SELECT',
    options: DEAL_SOURCE_OPTIONS,
  },
  leadPartner: {
    id: 'leadPartner',
    name: 'Lead Partner',
    type: 'PERSON',
  },
};

interface DealPropertiesPanelProps {
  entryId: string;
  dealId?: string;
  className?: string;
}

export function DealPropertiesPanel({ entryId, dealId, className = "" }: DealPropertiesPanelProps) {
  const utils = api.useUtils();

  // Fetch entry with schema
  const { data: entry, isLoading } = api.dealsDatabase.getEntry.useQuery(
    { entryId },
    { enabled: !!entryId }
  );

  // Mutation for updating entry properties
  const updateEntry = api.dealsDatabase.updateEntry.useMutation({
    onSuccess: () => {
      // Invalidate entry query to refresh the panel
      utils.dealsDatabase.getEntry.invalidate({ entryId });
      // Also invalidate deal queries to keep pipeline in sync
      if (dealId) {
        utils.deal.get.invalidate({ id: dealId });
        utils.deal.list.invalidate();
      }
    },
  });

  // Handler to save a property value
  const handleSave = useCallback(
    (columnId: string) => (newValue: unknown) => {
      updateEntry.mutate({
        entryId,
        properties: { [columnId]: newValue },
      });
    },
    [entryId, updateEntry]
  );

  if (isLoading) {
    return (
      <div className={`bg-alabaster rounded-xl border border-gold/10 p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-orange" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  const props = entry.properties as Record<string, unknown>;

  return (
    <div className={`bg-alabaster rounded-xl border border-gold/10 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-charcoal/60 mb-3 uppercase tracking-wide">Properties</h3>

      <div className="space-y-0.5">
        {/* Stage */}
        <PropertyRow icon={Layers} label="Stage">
          <CellRenderer
            column={PROPERTY_COLUMNS.stage}
            value={props.stage}
            onSave={handleSave('stage')}
            className="text-sm"
          />
        </PropertyRow>

        {/* Priority */}
        <PropertyRow icon={Target} label="Priority">
          <CellRenderer
            column={PROPERTY_COLUMNS.priority}
            value={props.priority}
            onSave={handleSave('priority')}
            className="text-sm"
          />
        </PropertyRow>

        {/* Type */}
        <PropertyRow icon={Tag} label="Type">
          <CellRenderer
            column={PROPERTY_COLUMNS.type}
            value={props.type}
            onSave={handleSave('type')}
            className="text-sm"
          />
        </PropertyRow>

        {/* Value */}
        <PropertyRow icon={DollarSign} label="Value">
          <CellRenderer
            column={PROPERTY_COLUMNS.value}
            value={props.value}
            onSave={handleSave('value')}
            className="text-sm"
          />
        </PropertyRow>

        {/* Probability */}
        <PropertyRow icon={TrendingUp} label="Probability">
          <CellRenderer
            column={PROPERTY_COLUMNS.probability}
            value={props.probability}
            onSave={handleSave('probability')}
            className="text-sm"
          />
        </PropertyRow>

        {/* Expected Close */}
        <PropertyRow icon={Calendar} label="Expected Close">
          <CellRenderer
            column={PROPERTY_COLUMNS.expectedCloseDate}
            value={props.expectedCloseDate}
            onSave={handleSave('expectedCloseDate')}
            className="text-sm"
          />
        </PropertyRow>

        {/* Source */}
        <PropertyRow icon={User} label="Source">
          <CellRenderer
            column={PROPERTY_COLUMNS.source}
            value={props.source}
            onSave={handleSave('source')}
            className="text-sm"
          />
        </PropertyRow>

        {/* Lead Partner */}
        <PropertyRow icon={User} label="Lead Partner">
          <CellRenderer
            column={PROPERTY_COLUMNS.leadPartner}
            value={props.leadPartner}
            onSave={handleSave('leadPartner')}
            className="text-sm"
          />
        </PropertyRow>
      </div>
    </div>
  );
}
