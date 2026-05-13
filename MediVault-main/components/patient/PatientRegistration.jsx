import { useState } from "react";
import { useRouter } from "next/router";
import {
  FiHeart, FiUser, FiPhone, FiLock, FiCheckCircle, FiMail,
} from "react-icons/fi";
import {
  MdLocalHospital, MdHealthAndSafety, MdVerifiedUser, MdSecurity,
} from "react-icons/md";
import { FaHospitalUser, FaHeartbeat, FaStethoscope } from "react-icons/fa";
import { Card, Button, Input, Select } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import apiClient from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Steps: 1 = verify secondary contact, 2 = OTP, 3 = profile form
const STEPS = { CONTACT: 1, OTP: 2, PROFILE: 3 };

const PatientRegistration = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Determine which contact to verify (opposite of what they registered with).
  // We persist the registration method in localStorage at account creation time
  // because the user object only contains userId + userType after setPin.
  const registrationMethod = typeof window !== 'undefined'
    ? localStorage.getItem('mv_registration_method')
    : null;
  const registeredWithEmail = registrationMethod === 'email'
    || (!registrationMethod && !!user?.email && !user?.mobile);
  const secondaryLabel = registeredWithEmail ? "Mobile Number" : "Email Address";
  const secondaryType  = registeredWithEmail ? "mobile" : "email";

  const [step,        setStep]        = useState(STEPS.CONTACT);
  const [contact,     setContact]     = useState("");
  const [phone,       setPhone]       = useState(""); // for +91 prefix display
  const [sessionId,   setSessionId]   = useState("");
  const [otp,         setOtp]         = useState("");
  const [loading,     setLoading]     = useState(false);

  // Profile fields
  const [fullName,          setFullName]          = useState("");
  const [dob,               setDob]               = useState("");
  const [gender,            setGender]            = useState("");
  const [bloodGroup,        setBloodGroup]        = useState("");
  const [address,           setAddress]           = useState("");
  const [city,              setCity]              = useState("");
  const [state,             setState]             = useState("");
  const [pincode,           setPincode]           = useState("");
  const [aadhaarLast4,      setAadhaarLast4]      = useState("");
  const [emergencyName,     setEmergencyName]     = useState("");
  const [emergencyPhone,    setEmergencyPhone]    = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  // Step 1: Send OTP to secondary contact
  const handleSendOTP = async (e) => {
    e.preventDefault();
    const contactValue = secondaryType === "mobile" ? `+91${phone}` : contact;
    if (secondaryType === "mobile" && !/^\d{10}$/.test(phone)) {
      return toast.error("Enter a valid 10-digit mobile number");
    }
    if (secondaryType === "email" && !/\S+@\S+\.\S+/.test(contact)) {
      return toast.error("Enter a valid email address");
    }
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/verify-secondary/initiate", { contactValue });
      setSessionId(data.sessionId);
      setContact(contactValue);
      toast.success(`OTP sent to your ${secondaryLabel}`);
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setLoading(true);
    try {
      await apiClient.post("/auth/verify-secondary/confirm", { sessionId, otp, contactValue: contact });
      toast.success(`${secondaryLabel} verified!`);
      setStep(STEPS.PROFILE);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit profile
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Full name is required");
    if (!dob)             return toast.error("Date of birth is required");
    if (!gender)          return toast.error("Gender is required");

    const phoneForProfile = secondaryType === "mobile" ? contact : (user?.mobile || "");
    const emailForProfile = secondaryType === "email"  ? contact : (user?.email  || "");

    setLoading(true);
    try {
      const { data } = await apiClient.post("/patient/register", {
        userId: user.userId,
        fullName: fullName.trim(),
        phone: phoneForProfile,
        email: emailForProfile,
        dob,
        gender,
        bloodGroup,
        address: address.trim(),
        city:    city.trim(),
        state:   state.trim(),
        pincode: pincode.trim(),
        aadhaarLast4: aadhaarLast4.trim(),
        emergencyContact: emergencyName ? {
          name:     emergencyName.trim(),
          phone:    emergencyPhone.trim(),
          relation: emergencyRelation.trim(),
        } : {},
      });
      if (data.data?.id) {
        localStorage.setItem("mv_patient_id", data.data.id);
      }
      // Clean up the registration method flag now that profile is complete
      localStorage.removeItem('mv_registration_method');
      toast.success(`Profile created! Patient ID: ${data.data?.uniquePatientId}`);
      router.push("/patient/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Profile creation failed");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [secondaryLabel, "Verify OTP", "Profile"];
  const inputCls = "w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 transition-colors";

  return (
    <div className="max-w-3xl mx-auto py-8 relative">
      {/* Background accents */}
      <div className="absolute opacity-5 overflow-hidden pointer-events-none">
        <FaHeartbeat className="absolute top-20 right-20 h-32 w-32 text-blue-600 animate-pulse" />
        <FaStethoscope className="absolute bottom-20 left-20 h-24 w-24 text-emerald-600" />
      </div>

      {/* Header */}
      <div className="text-center mb-10 relative z-10">
        <div className="flex justify-center mb-4">
          <div className="p-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl shadow-2xl">
            <FaHospitalUser className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Patient Profile</h1>
        {user && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mt-2">
            <MdVerifiedUser className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Account: {user.userId}</span>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {stepLabels.map((label, idx) => {
          const num = idx + 1;
          return (
            <div key={label} className="flex items-center">
              <div className={`flex flex-col items-center ${step >= num ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow ${
                  step > num  ? "bg-emerald-500" :
                  step === num ? "bg-blue-500 ring-2 ring-blue-300" : "bg-gray-300"
                }`}>
                  {step > num
                    ? <FiCheckCircle className="h-5 w-5 text-white" />
                    : <span className="text-white text-sm font-bold">{num}</span>}
                </div>
                <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
              </div>
              {idx < stepLabels.length - 1 && (
                <div className={`w-16 h-1 mx-2 rounded ${step > num ? "bg-emerald-400" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Secondary contact ── */}
      {step === STEPS.CONTACT && (
        <form onSubmit={handleSendOTP} className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              {secondaryType === "mobile"
                ? <FiPhone className="h-5 w-5 text-emerald-600" />
                : <FiMail  className="h-5 w-5 text-emerald-600" />}
              Verify Your {secondaryLabel}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {secondaryType === "mobile"
                ? "You registered with email. Add and verify your mobile number."
                : "You registered with mobile. Add and verify your email address."}
            </p>

            {secondaryType === "mobile" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                <div className="flex items-center border-2 border-emerald-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 bg-white">
                  <span className="px-4 py-3 bg-emerald-50 text-emerald-700 font-bold border-r-2 border-emerald-200 text-sm">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="XXXXXXXXXX"
                    className="flex-1 px-4 py-3 outline-none text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="you@email.com"
                  className={inputCls}
                  required
                />
              </div>
            )}
          </Card>

          <div className="flex justify-center gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={loading}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700">
              <FiHeart className="mr-2 h-4 w-4" /> Back to Home
            </Button>
            <Button type="submit" loading={loading}
              disabled={loading || (secondaryType === "mobile" ? phone.length !== 10 : !contact)}
              className="px-10 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold hover:from-blue-600 hover:to-indigo-600 rounded-xl shadow-lg">
              {loading ? <LoadingSpinner size="small" color="white" /> : "Send OTP"}
            </Button>
          </div>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === STEPS.OTP && (
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MdVerifiedUser className="h-5 w-5 text-blue-600" /> Verify OTP
            </h2>
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
              OTP sent to <strong>{contact}</strong>
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl text-center text-2xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              maxLength={6}
              autoFocus
            />
          </Card>

          <div className="flex justify-center gap-4">
            <Button type="button" variant="outline" onClick={() => setStep(STEPS.CONTACT)} disabled={loading}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700">
              Back
            </Button>
            <Button type="submit" loading={loading} disabled={loading || otp.length !== 6}
              className="px-10 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold hover:from-blue-600 hover:to-indigo-600 rounded-xl shadow-lg">
              {loading ? <LoadingSpinner size="small" color="white" /> : "Verify OTP"}
            </Button>
          </div>
        </form>
      )}

      {/* ── Step 3: Profile Form ── */}
      {step === STEPS.PROFILE && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Personal Info */}
          <Card className="border-2 border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="h-5 w-5 text-blue-600" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="As per Aadhaar" className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth *</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender *</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls} required>
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Blood Group</label>
                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Aadhaar Last 4 digits</label>
                <input type="text" value={aadhaarLast4}
                  onChange={e => setAadhaarLast4(e.target.value.replace(/\D/g,"").slice(0,4))}
                  placeholder="XXXX" className={inputCls} maxLength={4} />
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card className="border-2 border-blue-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="House no, Street, Area" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                <input type="text" value={state} onChange={e => setState(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pincode</label>
                <input type="text" value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g,"").slice(0,6))}
                  placeholder="6-digit pincode" className={inputCls} maxLength={6} />
              </div>
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-2 border-orange-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Emergency Contact <span className="text-sm font-normal text-gray-400">(optional)</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                <input type="text" value={emergencyName} onChange={e => setEmergencyName(e.target.value)}
                  placeholder="Contact name" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <input type="tel" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Relation</label>
                <input type="text" value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)}
                  placeholder="e.g. Father" className={inputCls} />
              </div>
            </div>
          </Card>

          <div className="flex justify-center gap-4">
            <Button type="button" variant="outline" onClick={() => setStep(STEPS.OTP)} disabled={loading}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700">
              Back
            </Button>
            <Button type="submit" loading={loading} disabled={loading}
              className="px-12 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg hover:from-blue-600 hover:to-indigo-600 rounded-xl shadow-lg">
              {loading
                ? <><LoadingSpinner size="small" color="white" /><span className="ml-2">Saving...</span></>
                : <><FaHospitalUser className="mr-2 h-5 w-5" />Complete Registration</>}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PatientRegistration;
