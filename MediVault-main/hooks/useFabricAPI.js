/**
 * useFabricAPI – replaces useContract (Ethereum) with Hyperledger Fabric
 * All blockchain interactions now go through the Express backend at NEXT_PUBLIC_API_URL.
 * The backend holds the Fabric wallet + gateway; the frontend just calls REST endpoints.
 */
import { useCallback, useState } from 'react';
import apiClient from '../utils/api';
import toast from 'react-hot-toast';

const useFabricAPI = () => {
  const [loading, setLoading] = useState(false);

  // ── Doctor ────────────────────────────────────────────────────────────────
  const addDoctor = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/contracts/register-doctor', data);
      return res.data;
    } finally { setLoading(false); }
  }, []);

  const getDoctor = useCallback(async (doctorID) => {
    const res = await apiClient.get(`/contracts/doctor/${doctorID}`);
    return res.data?.data ?? res.data;
  }, []);

  const getAllDoctors = useCallback(async (params = {}) => {
    const res = await apiClient.get('/doctor/search/available', { params });
    return res.data?.data ?? [];
  }, []);

  const getDoctorId = useCallback(async (userId) => {
    try {
      const res = await apiClient.get(`/doctor/by-user/${userId}`);
      return res.data?.data?.id ?? null;
    } catch { return null; }
  }, []);

  const getDoctorDetails = useCallback(async (doctorId) => {
    try {
      const res = await apiClient.get(`/doctor/${doctorId}`);
      return res.data?.data ?? null;
    } catch { return null; }
  }, []);

  // ── Patient ───────────────────────────────────────────────────────────────
  const registerPatient = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/contracts/register-patient', data);
      return res.data;
    } finally { setLoading(false); }
  }, []);

  const getPatient = useCallback(async (patientID) => {
    const res = await apiClient.get(`/contracts/patient/${patientID}`);
    return res.data?.data ?? res.data;
  }, []);

  const getPatientId = useCallback(async (userId) => {
    try {
      const res = await apiClient.get('/patient/profile');
      return res.data?.data?.id ?? null;
    } catch { return null; }
  }, []);

  const getPatientDetails = useCallback(async (patientId) => {
    try {
      const res = await apiClient.get(`/patient/${patientId}/profile`);
      return res.data?.data ?? null;
    } catch { return null; }
  }, []);

  const getPatientHistory = useCallback(async (patientID) => {
    const res = await apiClient.get(`/contracts/patient/${patientID}/history`);
    return res.data?.data ?? [];
  }, []);

  const getPatientOrders = useCallback(async (patientId) => {
    try {
      const res = await apiClient.get('/patient/orders');
      return res.data?.data ?? [];
    } catch { return []; }
  }, []);

  // ── Medicines ─────────────────────────────────────────────────────────────
  const addMedicine = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/admin/medicines', data);
      toast.success('Medicine added successfully!');
      return res.data;
    } finally { setLoading(false); }
  }, []);

  const getAllMedicines = useCallback(async (params = {}) => {
    try {
      const res = await apiClient.get('/medicines', { params });
      return res.data?.data ?? [];
    } catch { return []; }
  }, []);

  const buyMedicine = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/patient/orders', data);
      toast.success('Order placed successfully!');
      return res.data;
    } finally { setLoading(false); }
  }, []);

  // ── Prescriptions ─────────────────────────────────────────────────────────
  const issuePrescription = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/prescriptions', data);
      toast.success('Prescription issued!');
      return res.data;
    } finally { setLoading(false); }
  }, []);

  const getPrescription = useCallback(async (prescriptionID) => {
    const res = await apiClient.get(`/prescriptions/${prescriptionID}`);
    return res.data?.data ?? res.data;
  }, []);

  // ── Appointments ──────────────────────────────────────────────────────────
  const bookAppointment = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/contracts/appointments', data);
      toast.success('Appointment booked!');
      return res.data;
    } finally { setLoading(false); }
  }, []);

  const getAppointment = useCallback(async (appointmentID) => {
    const res = await apiClient.get(`/appointments/${appointmentID}`);
    return res.data?.data ?? res.data;
  }, []);

  // ── User type resolution (replaces on-chain getUserType) ──────────────────
  const getUserType = useCallback(async (userId) => {
    // In Fabric mode the user type comes from the JWT via AuthContext.
    // This helper exists for backward-compat with components that call it.
    try {
      const res = await apiClient.get('/auth/verify');
      return res.data?.user ?? null;
    } catch { return null; }
  }, []);

  // ── Generic Fabric query (fallback) ───────────────────────────────────────
  const getUserData = useCallback(async () => {
    const res = await apiClient.get('/contracts/get-user-data');
    return res.data?.data ?? null;
  }, []);

  return {
    loading,
    // Doctor
    addDoctor, getDoctor, getAllDoctors, getDoctorId, getDoctorDetails,
    // Patient
    registerPatient, getPatient, getPatientId, getPatientDetails,
    getPatientHistory, getPatientOrders,
    // Medicine
    addMedicine, getAllMedicines, buyMedicine,
    // Prescription
    issuePrescription, getPrescription,
    // Appointment
    bookAppointment, getAppointment,
    // Misc
    getUserType, getUserData,
  };
};

export default useFabricAPI;
export { useFabricAPI };

// Named alias kept for easy drop-in replacement in legacy components
export const useHealthcareContract = useFabricAPI;
