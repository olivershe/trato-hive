// @vitest-environment jsdom
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ViewProvider, useView } from './ViewContext';
import { describe, it, expect } from 'vitest';

describe('ViewContext', () => {
    it('should provide default values', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ViewProvider>{children}</ViewProvider>
        );
        const { result } = renderHook(() => useView(), { wrapper });

        expect(result.current.currentView).toBe('kanban');
        expect(result.current.deals.length).toBeGreaterThan(0);
    });

    it('should switch views', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ViewProvider>{children}</ViewProvider>
        );
        const { result } = renderHook(() => useView(), { wrapper });

        act(() => {
            result.current.setView('table');
        });

        expect(result.current.currentView).toBe('table');
    });

    it('should update deals', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ViewProvider>{children}</ViewProvider>
        );
        const { result } = renderHook(() => useView(), { wrapper });

        const dealId = result.current.deals[0].id;
        const originalStage = result.current.deals[0].stage;

        act(() => {
            // Change stage
            result.current.updateDeal(dealId, { stage: 'CLOSING' });
        });

        expect(result.current.deals[0].stage).toBe('CLOSING');
        expect(result.current.deals[0].stage).not.toBe(originalStage);
    });
});
