// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DealMutationConfirmationBlock from '../DealMutationConfirmationBlock';

const MOCK_UPDATE_PROPS = {
  type: 'updated' as const,
  deal: {
    id: 'deal-1',
    name: 'Acme Corp Acquisition',
    stage: 'NEGOTIATION',
    probability: 75,
    value: '5000000',
  },
  changes: [
    { field: 'stage', from: 'INITIAL_REVIEW', to: 'NEGOTIATION' },
    { field: 'probability', from: 40, to: 75 },
  ],
};

const MOCK_CREATE_PROPS = {
  type: 'created' as const,
  deal: {
    id: 'deal-2',
    name: 'Beta Inc Merger',
    stage: 'SOURCING',
    value: '2000000',
    companyName: 'Beta Inc',
  },
};

describe('DealMutationConfirmationBlock', () => {
  describe('update mode', () => {
    it('renders "Deal Updated" header', () => {
      render(<DealMutationConfirmationBlock props={MOCK_UPDATE_PROPS} />);
      expect(screen.getByText('Deal Updated')).toBeTruthy();
    });

    it('renders deal name', () => {
      render(<DealMutationConfirmationBlock props={MOCK_UPDATE_PROPS} />);
      expect(screen.getByText('Acme Corp Acquisition')).toBeTruthy();
    });

    it('renders before and after stage badges', () => {
      render(<DealMutationConfirmationBlock props={MOCK_UPDATE_PROPS} />);
      expect(screen.getByText('Initial Review')).toBeTruthy();
      // "Negotiation" appears in both the change row and the current state row
      expect(screen.getAllByText('Negotiation').length).toBe(2);
    });

    it('renders before and after probability', () => {
      render(<DealMutationConfirmationBlock props={MOCK_UPDATE_PROPS} />);
      expect(screen.getByText('40%')).toBeTruthy();
      // 75% appears in both the change row and the current state row
      expect(screen.getAllByText('75%').length).toBeGreaterThanOrEqual(1);
    });

    it('renders field labels', () => {
      render(<DealMutationConfirmationBlock props={MOCK_UPDATE_PROPS} />);
      expect(screen.getByText('Stage')).toBeTruthy();
      expect(screen.getByText('Probability')).toBeTruthy();
    });
  });

  describe('create mode', () => {
    it('renders "Deal Created" header', () => {
      render(<DealMutationConfirmationBlock props={MOCK_CREATE_PROPS} />);
      expect(screen.getByText('Deal Created')).toBeTruthy();
    });

    it('renders deal name', () => {
      render(<DealMutationConfirmationBlock props={MOCK_CREATE_PROPS} />);
      expect(screen.getByText('Beta Inc Merger')).toBeTruthy();
    });

    it('renders stage badge', () => {
      render(<DealMutationConfirmationBlock props={MOCK_CREATE_PROPS} />);
      expect(screen.getByText('Sourcing')).toBeTruthy();
    });

    it('renders company name', () => {
      render(<DealMutationConfirmationBlock props={MOCK_CREATE_PROPS} />);
      expect(screen.getByText('Beta Inc')).toBeTruthy();
    });

    it('renders formatted value', () => {
      render(<DealMutationConfirmationBlock props={MOCK_CREATE_PROPS} />);
      expect(screen.getByText('$2,000,000')).toBeTruthy();
    });
  });

  describe('actions', () => {
    it('renders View Deal button', () => {
      render(<DealMutationConfirmationBlock props={MOCK_UPDATE_PROPS} />);
      expect(screen.getByText('View Deal')).toBeTruthy();
    });

    it('calls onAction when "Ask about this deal" clicked', () => {
      const onAction = vi.fn();
      render(
        <DealMutationConfirmationBlock
          props={MOCK_UPDATE_PROPS}
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
        <DealMutationConfirmationBlock
          props={MOCK_UPDATE_PROPS}
          isHistorical
        />
      );

      expect(screen.getByText('Snapshot')).toBeTruthy();
    });
  });
});
