import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import apiClient from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('mv_token');
    if (!token) { setLoading(false); return; }

    apiClient.get('/auth/verify')
      .then(({ data }) => {
        if (data.valid) setUser(data.user);
        else {
          ['mv_token', 'mv_user_type', 'mv_user_id'].forEach(k => localStorage.removeItem(k));
        }
      })
      .catch(() => {
        ['mv_token', 'mv_user_type', 'mv_user_id'].forEach(k => localStorage.removeItem(k));
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Registration helpers ───────────────────────────────────────────────────
  const initiateRegistration = useCallback(async (contactMethod, contactValue) => {
    const { data } = await apiClient.post('/auth/register/initiate', { contactMethod, contactValue });
    return data; // { sessionId, expiresIn }
  }, []);

  const verifyOTP = useCallback(async (sessionId, otp) => {
    const { data } = await apiClient.post('/auth/register/verify-otp', { sessionId, otp });
    return data; // { tempToken }
  }, []);

  const setPin = useCallback(async (tempToken, pin, pinLength, userType, additionalData) => {
    const { data } = await apiClient.post('/auth/register/set-pin',
      { pin, pinLength, userType, additionalData },
      { headers: { Authorization: `Bearer ${tempToken}` } }
    );
    if (data.jwt) {
      localStorage.setItem('mv_token', data.jwt);
      localStorage.setItem('mv_refresh', data.refreshToken);
      localStorage.setItem('mv_user_id', data.userId || '');
      localStorage.setItem('mv_user_type', userType || '');
      setUser({ userId: data.userId, userType });
    }
    return data;
  }, []);

  // ── Fetch & store role-specific profile ID after login ────────────────────
  const fetchAndStoreProfileId = useCallback(async (user) => {
    if (!user?.userId || !user?.userType) return;
    try {
      if (user.userType === 'doctor') {
        const res = await apiClient.get('/doctor/search/available?limit=1').catch(() => null);
        // Try to find doctor by userId
        const docRes = await apiClient.get(`/doctor/by-user/${user.userId}`).catch(() => null);
        if (docRes?.data?.data?.id) {
          localStorage.setItem('mv_doctor_id', docRes.data.data.id);
          localStorage.setItem('mv_user_id', user.userId);
          if (docRes.data.data) {
            localStorage.setItem('mv_doctor_data', JSON.stringify({
              id: docRes.data.data.id,
              fullName: docRes.data.data.fullName,
              medicalCouncilRegNo: docRes.data.data.medicalCouncilRegNo,
              specialization: docRes.data.data.specialization,
              hospitalId: docRes.data.data.hospitalId,
              clinicName: docRes.data.data.clinicName,
              digitalSignatureUrl: docRes.data.data.digitalSignatureUrl || null,
            }));
          }
        }
      } else if (user.userType === 'patient') {
        const patRes = await apiClient.get('/patient/profile').catch(() => null);
        if (patRes?.data?.data?.id) {
          localStorage.setItem('mv_patient_id', patRes.data.data.id);
          localStorage.setItem('mv_user_id', user.userId);
        }
      } else if (user.userType === 'hospital_admin' || user.userType === 'hospital') {
        // Store hospital ID from user metadata if available
        if (user.hospital) localStorage.setItem('mv_hospital_id', user.hospital);
        localStorage.setItem('mv_user_id', user.userId);
      }
    } catch (_) {}
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier, pin, deviceInfo) => {
    const { data } = await apiClient.post('/auth/login', { identifier, pin, deviceInfo });
    if (data.jwt) {
      localStorage.setItem('mv_token', data.jwt);
      localStorage.setItem('mv_refresh', data.refreshToken);
      localStorage.setItem('mv_user_id', data.user?.userId || '');
      localStorage.setItem('mv_user_type', data.user?.userType || '');
      setUser(data.user);
      // Fetch role-specific profile ID asynchronously
      fetchAndStoreProfileId(data.user);
    }
    return data;
  }, [fetchAndStoreProfileId]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await apiClient.post('/auth/logout'); } catch (_) {}
    ['mv_token','mv_refresh','mv_user_id','mv_user_type','mv_doctor_id','mv_doctor_data','mv_patient_id','mv_hospital_id','mv_admin_session'].forEach(k => localStorage.removeItem(k));
    setUser(null);
    router.push('/login');
  }, [router]);

  // ── Forgot PIN ─────────────────────────────────────────────────────────────
  const initiateForgotPin = useCallback(async (identifier) => {
    const { data } = await apiClient.post('/auth/forgot-pin/initiate', { identifier });
    return data;
  }, []);

  const verifyForgotPinOTP = useCallback(async (sessionId, otp) => {
    const { data } = await apiClient.post('/auth/forgot-pin/verify-otp', { sessionId, otp });
    return data;
  }, []);

  const resetPin = useCallback(async (resetToken, newPin, pinLength) => {
    const { data } = await apiClient.post('/auth/forgot-pin/reset',
      { newPin, pinLength },
      { headers: { Authorization: `Bearer ${resetToken}` } }
    );
    return data;
  }, []);

  // ── Manual user injection (used by OTP login flows) ────────────────────────
  const setAuthUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated,
      initiateRegistration, verifyOTP, setPin,
      login, logout, setAuthUser,
      initiateForgotPin, verifyForgotPinOTP, resetPin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
