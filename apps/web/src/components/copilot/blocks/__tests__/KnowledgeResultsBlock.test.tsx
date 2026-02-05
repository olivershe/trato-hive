// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KnowledgeResultsBlock from '../KnowledgeResultsBlock';

const MOCK_RESULTS = [
  {
    content: 'Revenue for Q3 was $5.2 million, representing a 12% increase year-over-year.',
    source: 'Financial Report Q3.pdf',
    score: 0.92,
  },
  {
    content: 'The company has 150 employees across 3 offices.',
    source: 'Company Overview.docx',
    score: 0.74,
  },
];

describe('KnowledgeResultsBlock', () => {
  it('renders source count header', () => {
    render(
      <KnowledgeResultsBlock
        props={{ query: 'revenue', results: MOCK_RESULTS }}
      />
    );

    expect(screen.getByText('2 sources found')).toBeTruthy();
  });

  it('renders source names', () => {
    render(
      <KnowledgeResultsBlock
        props={{ query: 'revenue', results: MOCK_RESULTS }}
      />
    );

    expect(screen.getByText('Financial Report Q3.pdf')).toBeTruthy();
    expect(screen.getByText('Company Overview.docx')).toBeTruthy();
  });

  it('renders citation markers with numbers', () => {
    render(
      <KnowledgeResultsBlock
        props={{ query: 'revenue', results: MOCK_RESULTS }}
      />
    );

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders relevance scores', () => {
    render(
      <KnowledgeResultsBlock
        props={{ query: 'revenue', results: MOCK_RESULTS }}
      />
    );

    expect(screen.getByText('92%')).toBeTruthy();
    expect(screen.getByText('74%')).toBeTruthy();
  });

  it('renders empty state when no results', () => {
    render(
      <KnowledgeResultsBlock
        props={{ query: 'xyz', results: [] }}
      />
    );

    expect(screen.getByText(/No knowledge results/)).toBeTruthy();
  });

  it('first result is expanded by default', () => {
    // Use a query that won't appear in content so highlightQuery doesn't split text nodes
    render(
      <KnowledgeResultsBlock
        props={{ query: 'xyz', results: MOCK_RESULTS }}
      />
    );

    // First result content should be visible (no highlight splitting)
    expect(screen.getByText(/Revenue for Q3/)).toBeTruthy();
  });

  it('expands/collapses on header click', () => {
    render(
      <KnowledgeResultsBlock
        props={{ query: 'xyz', results: MOCK_RESULTS }}
      />
    );

    // Second result is collapsed by default — click to expand
    fireEvent.click(screen.getByText('Company Overview.docx'));
    expect(screen.getByText(/The company has 150 employees/)).toBeTruthy();
  });

  it('calls onAction when follow-up clicked', () => {
    const onAction = vi.fn();
    render(
      <KnowledgeResultsBlock
        props={{ query: 'xyz', results: MOCK_RESULTS }}
        onAction={onAction}
      />
    );

    // Click "Ask follow-up" on the first (expanded) result
    const followUpButtons = screen.getAllByText('Ask follow-up');
    fireEvent.click(followUpButtons[0]);

    expect(onAction).toHaveBeenCalledWith(
      expect.stringContaining('Tell me more about:')
    );
  });

  it('shows Snapshot label when historical', () => {
    render(
      <KnowledgeResultsBlock
        props={{ query: 'revenue', results: MOCK_RESULTS }}
        isHistorical
      />
    );

    expect(screen.getByText('Snapshot')).toBeTruthy();
  });
});
