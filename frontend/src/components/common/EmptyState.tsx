import type { ReactNode } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './EmptyState.css';

interface EmptyStateProps { title: string; description?: string; action?: ReactNode }

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const { t } = useLanguage();
  return (
    <section className="ui-empty">
      <span className="ui-empty__icon" aria-hidden="true">♡</span>
      <h2 className="ui-empty__title">{t(title)}</h2>
      {description && <p className="ui-empty__description">{t(description)}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </section>
  );
}

export default EmptyState;
