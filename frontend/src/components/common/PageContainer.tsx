import {type ReactNode } from 'react';
import './PageContainer.css';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageContainer({ title, subtitle, actions, children }: PageContainerProps) {
  return (
    <section className="ui-page-container">
      {(title || subtitle || actions) && (
        <header className="ui-page-container__header">
          <div className="ui-page-container__heading">
            {title && <h1 className="ui-page-container__title">{title}</h1>}
            {subtitle && <p className="ui-page-container__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="ui-page-container__actions">{actions}</div>}
        </header>
      )}
      <div className="ui-page-container__body">{children}</div>
    </section>
  );
}
