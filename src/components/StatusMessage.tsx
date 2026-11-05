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
}

/** Generic centered message used for empty, no-results and error states. */
export function StatusMessage({
  icon: Icon,
  title,
  children,
  role = 'status',
  headingLevel = 2,
  action,
}: StatusMessageProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div className="text-center py-5 px-3" role={role}>
      <Icon className="display-4 text-secondary" />
      <Heading className="h4 mt-3">{title}</Heading>
      {children && <p className="text-secondary mb-3">{children}</p>}
      {action && (
        <button type="button" className="btn btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
