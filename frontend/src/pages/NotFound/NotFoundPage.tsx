import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return <section className="not-found-page" aria-labelledby="not-found-heading">
    <span className="not-found-page__code" aria-hidden="true">404</span>
    <h1 id="not-found-heading">This page took a different path.</h1>
    <p>The page you're looking for isn't here. Let's get you back to the community.</p>
    <Link className="not-found-page__back" to="/">Back to the SOS board <span aria-hidden="true">→</span></Link>
  </section>;
}
