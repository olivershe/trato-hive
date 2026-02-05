// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DealSummaryCardBlock from '../DealSummaryCardBlock';

const MOCK_SUMMARY = {
  id: 'deal-1',
  name: 'Acme Corp Acquisition',
  stage: 'DEEP_DUE_DILIGENCE',
  probability: 65,
  value: '10000000',
  company: { id: 'company-1', name: 'Acme Corp' },
  recentDocuments: [
    { id: 'doc-1', name: 'Financial Report Q3.pdf', status: 'COMPLETED', createdAt: new Date().toISOString() },
  ],
  recentActivity: [
    { id: 'act-1', type: 'USER_ACTION', description: 'Stage moved to Deep DD', createdAt: new Date().toISOString() },
  ],
};

describe('DealSummaryCardBlock', () => {
  it('renders deal name and company', () => {
    render(
      <DealSummaryCardBlock props={{ summary: MOCK_SUMMARY }} />
    );

    expect(screen.getByText('Acme Corp Acquisition')).toBeTruthy();
    expect(screen.getByText('Acme Corp')).toBeTruthy();
  });

  it('renders stage badge', () => {
    render(
      <DealSummaryCardBlock props={{ summary: MOCK_SUMMARY }} />
    );

    expect(screen.getByText('Deep DD')).toBeTruthy();
  });

  it('renders formatted value', () => {
    render(
      <DealSummaryCardBlock props={{ summary: MOCK_SUMMARY }} />
    );

    expect(screen.getByText('$10,000,000')).toBeTruthy();
  });

  it('renders probability', () => {
    render(
      <DealSummaryCardBlock props={{ summary: MOCK_SUMMARY }} />
    );

    expect(screen.getByText('65%')).toBeTruthy();
  });

  it('renders recent documents', () => {
    render(
      <DealSummaryCardBlock props={{ summary: MOCK_SUMMARY }} />
    );

    expect(screen.getByText('Financial Report Q3.pdf')).toBeTruthy();
  });

  it('renders recent activity', () => {
    render(
      <DealSummaryCardBlock props={{ summary: MOCK_SUMMARY }} />
    );

    expect(screen.getByText('Stage moved to Deep DD')).toBeTruthy();
  });

  it('calls onAction when "Ask about this deal" clicked', () => {
    const onAction = vi.fn();
    render(
      <DealSummaryCardBlock
        props={{ summary: MOCK_SUMMARY }}
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByText('Ask about this deal'));
    expect(onAction).toHaveBeenCalledWith(
      'Tell me more about deal "Acme Corp Acquisition"',
      { dealId: 'deal-1' }
    );
  });

  it('shows Snapshot label when historical', () => {
    render(
      <DealSummaryCardBlock
        props={{ summary: MOCK_SUMMARY }}
        isHistorical
      />
    );

    expect(screen.getByText('Snapshot')).toBeTruthy();
  });
});
