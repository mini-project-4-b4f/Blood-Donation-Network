import React, { useState, useEffect } from 'react';
import { useDonor } from '../../context/DonorContext';
import type { Area } from '../../types/donor.types';
import './pages/DonorProfile/DonorProfilePage.css';
export const DonorProfilePage: React.FC = () => {
  const { profile, updateProfile, deactivateAccount, isActionLoading, actionError } = useDonor();

  const [phone, setPhone] = useState<string>('');
  const [areaId, setAreaId] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [areas, setAreas] = useState<Area[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || '');
      setAreaId(profile.area?.id || '');
      setIsAvailable(profile.isAvailable ?? true);
    }
  }, [profile]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch('/api/areas');
        if (response.ok) {
          const data = await response.json();
          setAreas(data);
        }
      } catch (err) {
        console.error('Failed to fetch areas', err);
      }
    };
    fetchAreas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    try {
      await updateProfile({ phone, areaId, isAvailable });
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateAccount();
      alert('Your account has been deactivated.');
    } catch (err) {

    }
  };

  if (!profile) {
    return (
      <div className="donor-profile-loading">
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="donor-profile">
      <h1 className="donor-profile__title">Donor Profile </h1>

      {successMsg && (
        <div className="donor-profile-alert donor-profile-alert--success" role="alert">
          {successMsg}
        </div>
      )}

      {actionError && (
        <div className="donor-profile-alert donor-profile-alert--error" role="alert">
          {actionError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="donor-profile-form">
        <div className="donor-profile-form__group">
          <label className="donor-profile-form__label">Full Name (Read-only)</label>
          <input
            type="text"
            className="donor-profile-form__input"
            value={profile.fullName}
            disabled
          />
        </div>

        <div className="donor-profile-form__group">
          <label className="donor-profile-form__label">Blood Type (Read-only)</label>
          <input
            type="text"
            className="donor-profile-form__input"
            value={profile.bloodType}
            disabled
          />
        </div>

        <div className="donor-profile-form__group">
          <label className="donor-profile-form__label" htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="text"
            className="donor-profile-form__input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="donor-profile-form__group">
          <label className="donor-profile-form__label" htmlFor="area">Area</label>
          <select
            id="area"
            className="donor-profile-form__select"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            required
          >
            <option value="">Select area...</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        <div className="donor-profile-form__group donor-profile-form__group--checkbox">
          <label className="donor-profile-form__checkbox-label">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            <span>I am available and ready to donate blood when needed</span>
          </label>
        </div>

        <button
          type="submit"
          className="donor-profile-btn donor-profile-btn--primary"
          disabled={isActionLoading}
        >
          {isActionLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <hr className="donor-profile-divider" />

    
      <div className="donor-profile-danger-zone">
        <h3 className="donor-profile-danger-zone__title">Security & Deactivation Zone</h3>
        <p className="donor-profile-danger-zone__desc">
          When you deactivate your account, you will no longer appear in eligible donor lists and any active pledge will be automatically withdrawn.
        </p>

        {!showDeactivateConfirm ? (
          <button
            type="button"
            className="donor-profile-btn donor-profile-btn--danger"
            onClick={() => setShowDeactivateConfirm(true)}
          >
            Deactivate Account
          </button>
        ) : (
          <div className="donor-profile-confirm-box">
            <p>Are you sure you want to deactivate your account?</p>
            <div className="donor-profile-confirm-actions">
              <button
                type="button"
                className="donor-profile-btn donor-profile-btn--danger"
                onClick={handleDeactivate}
                disabled={isActionLoading}
              >
                Confirm Deactivation
              </button>
              <button
                type="button"
                className="donor-profile-btn donor-profile-btn--secondary"
                onClick={() => setShowDeactivateConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};