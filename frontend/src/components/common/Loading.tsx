import { useLanguage } from '../../context/LanguageContext';
import './Loading.css';

export function Loading({ message = 'Loading…' }: { message?: string }) {
  const { t } = useLanguage();
  return <div className="ui-loading" role="status"><span className="ui-loading__spinner" aria-hidden="true" /><span>{t(message)}</span></div>;
}

export default Loading;
