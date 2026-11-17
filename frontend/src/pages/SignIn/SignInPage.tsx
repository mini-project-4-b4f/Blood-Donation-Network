import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import './SignInPage.css';

export default function SignInPage() {
  const { user, signIn, isAuthLoading, authError, clearAuthError } = useAuth();
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) clearAuthError(); });
    return () => { active = false; };
  }, [clearAuthError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const signedInUser = await signIn({ identifier: identifier.trim(), password });
    if (signedInUser) navigate(signedInUser.role === 'COORDINATOR' ? '/coordinator/requests' : '/donor/dashboard', { replace: true });
  }

  if (user) return <Navigate to={user.role === 'COORDINATOR' ? '/coordinator/requests' : '/donor/dashboard'} replace />;

  return (
    <div className="sign-in-page">
      <aside className="sign-in-page__intro">
        <span className="sign-in-page__eyebrow">{t('A COMMUNITY THAT CARES')}</span>
        <h1 className="sign-in-page__headline">{t('A little of you.')}<br />{t('A lifeline for someone.')}</h1>
        <p>{t('Every connection brings a hospital one step closer to the blood it needs. Thank you for being part of it.')}</p>
        <div className="sign-in-page__promise"><span aria-hidden="true">♡</span> {t('Your next act of kindness starts here.')}</div>
      </aside>
      <section className="sign-in-page__card" aria-labelledby="sign-in-heading">
        <span className="sign-in-page__eyebrow">{t('WELCOME BACK')}</span>
        <h2 id="sign-in-heading">{t('Sign in to your account')}</h2>
        <p className="sign-in-page__description">{t('For volunteer donors and blood-bank coordinators.')}</p>
        <form className="sign-in-page__form" onSubmit={(event) => void handleSubmit(event)}>
          {authError && <ErrorMessage message={authError} />}
          <label className="sign-in-page__field" htmlFor="sign-in-identifier">{t('Phone number or email')}
            <input id="sign-in-identifier" name="identifier" autoComplete="username" value={identifier} required onChange={(event) => { setIdentifier(event.target.value); clearAuthError(); }} />
          </label>
          <label className="sign-in-page__field" htmlFor="sign-in-password">{t('Password')}
            <input id="sign-in-password" name="password" type="password" autoComplete="current-password" value={password} required onChange={(event) => { setPassword(event.target.value); clearAuthError(); }} />
          </label>
          <div className="sign-in-page__submit"><Button type="submit" isLoading={isAuthLoading}>{t('Sign In')}</Button></div>
        </form>
        <p className="sign-in-page__register">{t('New to the network?')} <Link to="/sign-up">{t('Become a donor')}</Link></p>
        <Link className="sign-in-page__back" to="/">← {t('Back to the SOS board')}</Link>
      </section>
    </div>
  );
}
