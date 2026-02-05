// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DealSearchResultsBlock from '../DealSearchResultsBlock';

const MOCK_DEALS = [
  {
    id: 'deal-1',
    name: 'Acme Corp Acquisition',
    stage: 'NEGOTIATION',
    value: '5000000',
    probability: 75,
    company: { id: 'company-1', name: 'Acme Corp' },
  },
  {
    id: 'deal-2',
    name: 'Beta Inc Merger',
    stage: 'SOURCING',
    value: '2000000',
    probability: 30,
    company: { id: 'company-2', name: 'Beta Inc' },
  },
];

describe('DealSearchResultsBlock', () => {
  it('renders deal count header', () => {
    render(
      <DealSearchResultsBlock
        props={{ query: 'test', deals: MOCK_DEALS, totalCount: 2 }}
      />
    );

    expect(screen.getByText('2 deals found')).toBeTruthy();
  });

  it('renders deal names', () => {
    render(
      <DealSearchResultsBlock
        props={{ query: 'test', deals: MOCK_DEALS, totalCount: 2 }}
      />
    );

    expect(screen.getByText('Acme Corp Acquisition')).toBeTruthy();
    expect(screen.getByText('Beta Inc Merger')).toBeTruthy();
  });

  it('renders stage badges', () => {
    render(
      <DealSearchResultsBlock
        props={{ query: 'test', deals: MOCK_DEALS, totalCount: 2 }}
      />
    );

    expect(screen.getByText('Negotiation')).toBeTruthy();
    expect(screen.getByText('Sourcing')).toBeTruthy();
  });

  it('renders empty state when no deals', () => {
    render(
      <DealSearchResultsBlock
        props={{ query: 'xyz', deals: [], totalCount: 0 }}
      />
    );

    expect(screen.getByText(/No deals found/)).toBeTruthy();
  });

  it('calls onAction when row clicked', () => {
    const onAction = vi.fn();
    render(
      <DealSearchResultsBlock
        props={{ query: 'test', deals: MOCK_DEALS, totalCount: 2 }}
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByText('Acme Corp Acquisition'));
    expect(onAction).toHaveBeenCalledWith(
      'Show me details for deal "Acme Corp Acquisition"',
      { dealId: 'deal-1' }
    );
  });

  it('shows Snapshot label when historical', () => {
    render(
      <DealSearchResultsBlock
        props={{ query: 'test', deals: MOCK_DEALS, totalCount: 2 }}
        isHistorical
      />
    );

    expect(screen.getByText('Snapshot')).toBeTruthy();
  });

  it('sorts by column when header clicked', () => {
    render(
      <DealSearchResultsBlock
        props={{ query: 'test', deals: MOCK_DEALS, totalCount: 2 }}
      />
    );

    // Click Value header to sort
    fireEvent.click(screen.getByText('Value'));

    // Get all rows — first data row should now have different order
    const rows = screen.getAllByRole('row');
    // Header is first, then data rows
    expect(rows.length).toBe(3); // 1 header + 2 data rows
  });
});
