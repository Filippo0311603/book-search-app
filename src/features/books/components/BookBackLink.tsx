import type { MouseEvent } from 'react';
import { Link, useNavigate, useNavigationType } from 'react-router';
import { ArrowLeftIcon } from '../../../components/icons';

interface BookBackLinkProps {
  /** Query string of the results page the user came from (empty when unknown). */
  search: string;
  /** True when the user reached this page from the results list (history has it just before). */
  cameFromResults: boolean;
}

/**
 * Goes back in history when the previous entry is the results page (keeps scroll position and
 * avoids stacking entries); otherwise links to the saved search URL (refresh, shared link).
 */
export function BookBackLink({ search, cameFromResults }: BookBackLinkProps) {
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const isPlainClick = !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0;
    if (cameFromResults && navigationType === 'PUSH' && isPlainClick) {
      event.preventDefault();
      void navigate(-1);
    }
  };

  return (
    <Link
      to={{ pathname: '/', search }}
      onClick={handleClick}
      className="btn btn-outline-secondary btn-sm mb-4"
    >
      <ArrowLeftIcon className="me-1" />
      Back to results
    </Link>
  );
}
