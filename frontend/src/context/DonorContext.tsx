import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { DonorDashboardProfile, EligibleOpenRequest, UpdateDonorProfileDto } from '../types/donor.types';
import { donorsApi } from '../services/donors.api';
import { pledgesApi } from '../services/pledges.api';

interface DonorContextType {
  profile: DonorDashboardProfile | null;
  eligibleRequests: EligibleOpenRequest[];
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  actionError: string | null;
  fetchDonorData: () => Promise<void>;
  updateProfile: (dto: UpdateDonorProfileDto) => Promise<void>;
  createPledge: (requestId: string) => Promise<void>;
  withdrawPledge: (pledgeId: string) => Promise<void>;
  deactivateAccount: () => Promise<void>;
}

const DonorContext = createContext<DonorContextType | undefined>(undefined);

export const DonorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<DonorDashboardProfile | null>(null);
  const [eligibleRequests, setEligibleRequests] = useState<EligibleOpenRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDonorData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profileData, requestsData] = await Promise.all([
        donorsApi.getMyProfile(),
        donorsApi.getEligibleRequests(),
      ]);
      setProfile(profileData);
      setEligibleRequests(requestsData);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading donor data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonorData();
  }, [fetchDonorData]);

  const updateProfile = async (dto: UpdateDonorProfileDto) => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const updatedProfile = await donorsApi.updateMyProfile(dto);
      setProfile(updatedProfile);
    
      const updatedRequests = await donorsApi.getEligibleRequests();
      setEligibleRequests(updatedRequests);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update profile.');
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const createPledge = async (requestId: string) => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      await pledgesApi.createPledge(requestId);
      await fetchDonorData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit pledge.');
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const withdrawPledge = async (pledgeId: string) => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      await pledgesApi.withdrawPledge(pledgeId);
      await fetchDonorData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to withdraw pledge.');
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const deactivateAccount = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      await donorsApi.deactivateAccount();
      setProfile(null);
      setEligibleRequests([]);
    } catch (err: any) {
      setActionError(err.message || 'Failed to deactivate account.');
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <DonorContext.Provider
      value={{
        profile,
        eligibleRequests,
        isLoading,
        isActionLoading,
        error,
        actionError,
        fetchDonorData,
        updateProfile,
        createPledge,
        withdrawPledge,
        deactivateAccount,
      }}
    >
      {children}
    </DonorContext.Provider>
  );
};

export const useDonor = () => {
  const context = useContext(DonorContext);
  if (!context) {
    throw new Error('useDonor must be used within a DonorProvider');
  }
  return context;
};