import { useLanguage } from '../../context/LanguageContext';
import './ErrorMessage.css';

interface ErrorMessageProps { message: string; onRetry?: () => void }

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { t } = useLanguage();
  return (
    <div className="ui-error" role="alert">
      <p className="ui-error__message">{t(message)}</p>
      {onRetry && <button className="ui-error__retry" type="button" onClick={onRetry}>{t('Try again')}</button>}
    </div>
  );
}

export default ErrorMessage;
