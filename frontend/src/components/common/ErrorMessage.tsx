import './ErrorMessage.css';

interface ErrorMessageProps { message: string; onRetry?: () => void }

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="ui-error" role="alert">
      <p className="ui-error__message">{message}</p>
      {onRetry && <button className="ui-error__retry" type="button" onClick={onRetry}>Try again</button>}
    </div>
  );
}
