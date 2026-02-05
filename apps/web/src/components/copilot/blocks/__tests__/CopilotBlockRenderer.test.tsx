// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CopilotBlockRenderer } from '../CopilotBlockRenderer';

describe('CopilotBlockRenderer', () => {
  it('renders unknown block fallback for unregistered component', () => {
    render(
      <CopilotBlockRenderer
        component="nonexistent-block"
        props={{}}
      />
    );

    expect(screen.getByText(/Unknown block: nonexistent-block/)).toBeTruthy();
  });

  it('does not wrap unknown blocks in layout div', () => {
    const { container } = render(
      <CopilotBlockRenderer
        component="nonexistent-block"
        props={{}}
        layout="full-width"
      />
    );

    // Unknown blocks render directly without a layout wrapper
    expect((container.firstChild as HTMLElement).className).toContain('rounded-xl');
    expect((container.firstChild as HTMLElement).className).not.toContain('w-full');
  });
});
