import { Link } from 'react-router';
import { CompassIcon } from '../components/icons';
import { StatusMessage } from '../components/StatusMessage';

export function NotFoundPage() {
  return (
    <>
      <title>Page not found - BookSearch</title>
      <StatusMessage icon={CompassIcon} title="404 - Page not found" headingLevel={1}>
        The page you are looking for does not exist. <Link to="/">Go back to the search</Link>.
      </StatusMessage>
    </>
  );
}
