import { SUGGESTED_SEARCHES } from '../constants';

/** Ready-made queries for the empty state: one click fills the search box and searches. */
export function SuggestedSearches({ onSelect }: { onSelect: (term: string) => void }) {
  return (
    <div role="group" aria-label="Suggested searches" className="mt-4">
      <p className="small text-body-secondary mb-2">Or try one of these:</p>
      <div className="d-flex flex-wrap justify-content-center gap-2">
        {SUGGESTED_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            className="btn btn-sm rounded-pill chip"
            onClick={() => onSelect(term)}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
