import { getPageItems } from '../features/books/pagination';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface PageButtonProps {
  label: string;
  disabled?: boolean;
  active?: boolean;
  /** Extra classes on the <li>; used to hide the least useful buttons on phones. */
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}

function PageButton({ label, disabled, active, className, onClick, children }: PageButtonProps) {
  return (
    <li
      className={`page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="page-link"
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </li>
  );
}

export function Paginator({ currentPage, totalPages, onPageChange }: PaginatorProps) {
  if (totalPages <= 1) return null;

  const atStart = currentPage <= 1;
  const atEnd = currentPage >= totalPages;

  return (
    <nav aria-label="Search results pages">
      <ul className="pagination pagination-sm flex-wrap justify-content-center mb-0">
        <PageButton
          label="First page"
          className="d-none d-sm-block"
          disabled={atStart}
          onClick={() => onPageChange(1)}
        >
          <span aria-hidden="true">&laquo;</span>
        </PageButton>
        <PageButton
          label="Previous page"
          disabled={atStart}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <span aria-hidden="true">&lsaquo;</span>
        </PageButton>
        {getPageItems(currentPage, totalPages).map((item) =>
          typeof item === 'number' ? (
            <PageButton
              key={item}
              label={`Page ${item}`}
              active={item === currentPage}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PageButton>
          ) : (
            <li key={item} className="page-item disabled" aria-hidden="true">
              <span className="page-link">&hellip;</span>
            </li>
          ),
        )}
        <PageButton
          label="Next page"
          disabled={atEnd}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span aria-hidden="true">&rsaquo;</span>
        </PageButton>
        <PageButton
          label="Last page"
          className="d-none d-sm-block"
          disabled={atEnd}
          onClick={() => onPageChange(totalPages)}
        >
          <span aria-hidden="true">&raquo;</span>
        </PageButton>
      </ul>
    </nav>
  );
}
