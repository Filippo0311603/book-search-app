import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryChips } from './CategoryChips';

describe('CategoryChips', () => {
  const many = ['A', 'B', 'C', 'D', 'E', 'F'];

  it('shows at most 4 chips and a +N chip for the rest', () => {
    render(<CategoryChips labels={many} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByText('E', { exact: true })).not.toBeInTheDocument();
  });

  it('exposes the hidden labels to screen readers as text, not as an aria-label on the item', () => {
    render(<CategoryChips labels={many} />);
    const more = screen.getAllByRole('listitem')[4];
    expect(more).not.toHaveAttribute('aria-label');
    expect(screen.getByText('+2')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('and 2 more: E, F')).toHaveClass('visually-hidden');
  });

  it('has no +N chip when everything fits, and nothing when empty', () => {
    const { container, rerender } = render(<CategoryChips labels={['A', 'B']} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText(/more:/)).not.toBeInTheDocument();
    rerender(<CategoryChips labels={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
