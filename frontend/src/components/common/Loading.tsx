import './Loading.css';

export function Loading({ message = 'Loading…' }: { message?: string }) {
  return <div className="ui-loading" role="status"><span className="ui-loading__spinner" aria-hidden="true" /><span>{message}</span></div>;
}

export default Loading;
