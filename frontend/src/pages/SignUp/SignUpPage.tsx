import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { BloodType } from '../../types/auth.types';
import { BLOOD_TYPES } from '../../constants';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import Loading from '../../components/common/Loading';
import './SignUpPage.css';

export default function SignUpPage() {
  const { user, areas, loadAreas, signUp, isAuthLoading, isAreasLoading, authError, clearAuthError } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bloodType, setBloodType] = useState<BloodType | ''>('');
  const [areaId, setAreaId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return loadAreas(); });
    return () => { active = false; };
  }, [loadAreas]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bloodType || !areaId || !fullName.trim()) return;
    const signedUpUser = await signUp({ fullName: fullName.trim(), phone: phone.trim(), email, password, bloodType, areaId });
    if (signedUpUser) navigate('/donor/dashboard', { replace: true });
  }

  if (user) return <Navigate to={user.role === 'COORDINATOR' ? '/coordinator/requests' : '/donor/dashboard'} replace />;

  return (
    <div className="sign-up-page">
      <header className="sign-up-page__intro">
        <span className="sign-up-page__eyebrow">{t("BE SOMEONE'S LIFELINE")}</span>
        <h1>{t('Join a community that gives.')}</h1>
        <p>{t('Create your donor account. When a hospital needs your help, find the requests you can respond to.')}</p>
      </header>
      <section className="sign-up-page__card" aria-labelledby="sign-up-heading">
        <h2 id="sign-up-heading">{t('Become a donor')}</h2>
        <p className="sign-up-page__description">{t('A few details to help connect you with your community.')}</p>
        <form className="sign-up-page__form" onSubmit={(event) => void handleSubmit(event)}>
          {authError && <ErrorMessage message={authError} onRetry={areas.length === 0 ? () => void loadAreas() : undefined} />}
          <div className="sign-up-page__grid">
            <div className="sign-up-page__field"><label htmlFor="sign-up-name">{t('Full name')}</label>
              <input id="sign-up-name" name="fullName" autoComplete="name" required  value={fullName} onChange={(event) => { setFullName(event.target.value); clearAuthError(); }} />
            </div>
            <div className="sign-up-page__field"><label htmlFor="sign-up-phone">{t('Phone number')}</label>
              <input id="sign-up-phone" name="phone" type="tel" autoComplete="tel" required value={phone} onChange={(event) => { setPhone(event.target.value); clearAuthError(); }} />
            </div>
            <div className="sign-up-page__field"><label htmlFor="sign-up-email">{t('Email (optional)')}</label>
              <input id="sign-up-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); clearAuthError(); }} />
            </div>
            <div className="sign-up-page__field"><label htmlFor="sign-up-password">{t('Password')}</label>
              <input id="sign-up-password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="sign-up-password-help" value={password} onChange={(event) => { setPassword(event.target.value); clearAuthError(); }} />
              <span className="sign-up-page__help" id="sign-up-password-help">{t('At least 8 characters.')}</span>
            </div>
            <div className="sign-up-page__field"><label htmlFor="sign-up-blood">{t('Blood type')}</label>
              <select id="sign-up-blood" name="bloodType" required value={bloodType} onChange={(event) => { setBloodType(event.target.value as BloodType); clearAuthError(); }}>
                <option value="" disabled>{t('Select your blood type')}</option>
                {BLOOD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="sign-up-page__field"><label htmlFor="sign-up-area">{t('Area')}</label>
              <select id="sign-up-area" name="areaId" required disabled={isAreasLoading || areas.length === 0} value={areaId} onChange={(event) => { setAreaId(event.target.value); clearAuthError(); }}>
                <option value="" disabled>{t('Select your area')}</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </div>
          </div>
          {isAreasLoading && <Loading message={t('Loading supported areas…')} />}
          {!isAreasLoading && areas.length === 0 && !authError && <ErrorMessage message={t('No supported areas are available right now.')} onRetry={() => void loadAreas()} />}
          <p className="sign-up-page__privacy">{t('Your contact details are never shown on the public SOS board.')}</p>
          <div className="sign-up-page__submit"><Button type="submit" isLoading={isAuthLoading} disabled={isAreasLoading || areas.length === 0}>{t('Create Donor Account')}</Button></div>
        </form>
        <p className="sign-up-page__signin">{t('Already part of the network?')} <Link to="/sign-in">{t('Sign in')}</Link></p>
      </section>
    </div>
  );
}
