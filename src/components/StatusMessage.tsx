import type { ReactNode } from 'react';
import type { IconComponent } from './icons';

interface StatusMessageProps {
  icon: IconComponent;
  title: string;
  children?: ReactNode;
  /** `alert` is announced immediately by screen readers (errors); `status` politely. */
  role?: 'status' | 'alert';
  /** Use 1 when the message is the main content of the page. */
  headingLevel?: 1 | 2;
  action?: { label: string; onClick: () => void };
  /** Extra content below the message (e.g. suggestions). */
  footer?: ReactNode;
}

/** Generic centered message used for empty, no-results and error states. */
export function StatusMessage({
  icon: Icon,
  title,
  children,
  role = 'status',
  headingLevel = 2,
  action,
  footer,
}: StatusMessageProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <>
      <div className={`text-center pt-5 px-3 ${footer ? 'pb-0' : 'pb-5'}`} role={role}>
        <Icon className="display-4 text-body-secondary" />
        <Heading className="h4 mt-3">{title}</Heading>
        {children && <p className="text-body-secondary mb-3">{children}</p>}
        {action && (
          <button type="button" className="btn btn-primary" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
      {/* Outside the status element: it holds buttons, which should not be re-announced. */}
      {footer && <div className="text-center px-3 pb-5">{footer}</div>}
    </>
  );
}
