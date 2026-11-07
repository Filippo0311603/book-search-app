interface CategoryChipsProps {
  /** Unique labels (see `getCategoryLabels`). */
  labels: readonly string[];
  /** How many chips to show before collapsing the rest into a "+N" chip. */
  max?: number;
}

/** Compact category chips; Google can return dozens, so the overflow collapses into "+N". */
export function CategoryChips({ labels, max = 4 }: CategoryChipsProps) {
  if (labels.length === 0) return null;
  const shown = labels.slice(0, max);
  const hidden = labels.slice(max);

  return (
    <ul className="category-chips list-unstyled" aria-label="Categories">
      {shown.map((label) => (
        <li key={label} className="category-chip">
          {label}
        </li>
      ))}
      {hidden.length > 0 && (
        <li className="category-chip category-chip--more" title={hidden.join(', ')}>
          <span aria-hidden="true">+{hidden.length}</span>
          <span className="visually-hidden">
            and {hidden.length} more: {hidden.join(', ')}
          </span>
        </li>
      )}
    </ul>
  );
}
