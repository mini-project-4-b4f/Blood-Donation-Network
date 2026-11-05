import type { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps { title: string; description?: string; action?: ReactNode }

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="ui-empty">
      <span className="ui-empty__icon" aria-hidden="true">♡</span>
      <h2 className="ui-empty__title">{title}</h2>
      {description && <p className="ui-empty__description">{description}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </section>
  );
}
