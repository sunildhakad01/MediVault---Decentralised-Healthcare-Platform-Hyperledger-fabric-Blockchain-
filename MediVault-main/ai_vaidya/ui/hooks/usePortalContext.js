// AI-Vaidya — usePortalContext.js | MediVault Platform

import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';

// Inline portal policy data (subset needed by the UI)
// Mirrors ai_vaidya/config/portal_policies.js to avoid server-only imports on client
const UI_PORTAL_POLICIES = {
  patient: {
    file_upload_allowed: true,
    file_types_allowed: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    suggested_prompts: [
      'Explain my latest blood test report',
      'I have a headache — should I see a doctor?',
      'What is metformin used for?',
      'Summarise my current medicines',
      'I have these symptoms — what should I do?',
    ],
    badge_label: 'Patient',
    badge_color: 'bg-teal-100 text-teal-700',
    placeholder: 'Ask about medicines, symptoms, or your health records...',
  },
  doctor: {
    file_upload_allowed: true,
    file_types_allowed: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dcm'],
    suggested_prompts: [
      "Summarise this patient's clinical history",
      'What does the guideline say about this condition?',
      "Check drug interactions for this patient's medications",
      'Generate a SOAP note for this encounter',
      'Risk stratify this patient for cardiac events',
    ],
    badge_label: 'Doctor',
    badge_color: 'bg-blue-100 text-blue-700',
    placeholder: 'Ask about this patient\'s case, guidelines, or drug interactions...',
  },
  hospital: {
    file_upload_allowed: true,
    file_types_allowed: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dcm'],
    suggested_prompts: [
      'Show high-risk patients in this ward',
      'Which patients missed morning medication?',
      'Generate ward round summary',
      'Check drug interaction alerts across admissions',
      'Which patients are ready for discharge?',
    ],
    badge_label: 'Hospital',
    badge_color: 'bg-purple-100 text-purple-700',
    placeholder: 'Ask about patients, ward status, or clinical decisions...',
  },
  admin: {
    file_upload_allowed: false,
    file_types_allowed: [],
    suggested_prompts: [
      'How many alerts were triggered this week?',
      'Show platform usage summary',
      'Compliance report for this month',
    ],
    badge_label: 'Admin',
    badge_color: 'bg-gray-100 text-gray-600',
    placeholder: 'Ask about platform analytics or system health...',
  },
};

// Maps pathname prefix to portal ID
function detectPortalFromPath(pathname) {
  if (pathname.startsWith('/patient'))  return 'patient';
  if (pathname.startsWith('/doctor'))   return 'doctor';
  if (pathname.startsWith('/hospital')) return 'hospital';
  if (pathname.startsWith('/admin'))    return 'admin';
  return null;
}

// Maps auth userType to portal ID
function detectPortalFromUserType(userType) {
  if (!userType) return null;
  if (userType === 'patient')                               return 'patient';
  if (userType === 'doctor')                                return 'doctor';
  if (userType === 'hospital_admin' || userType === 'hospital') return 'hospital';
  if (userType === 'admin')                                 return 'admin';
  return null;
}

/**
 * Detects the current portal from the URL and auth state.
 * Returns everything the AI-Vaidya UI needs to operate.
 */
export function usePortalContext() {
  const router = useRouter();
  const { user } = useAuth();

  return useMemo(() => {
    // Primary: detect from URL path (most reliable in a Next.js multi-portal app)
    const portalFromPath = detectPortalFromPath(router.pathname);
    // Fallback: detect from auth user type
    const portalFromUser = detectPortalFromUserType(user?.userType);
    const portalId = portalFromPath || portalFromUser;

    if (!portalId) {
      return {
        portalId: null,
        patientId: null,
        userName: null,
        userRole: null,
        suggestedPrompts: [],
        isFileUploadAllowed: false,
        allowedFileTypes: [],
        badgeLabel: null,
        badgeColor: '',
        inputPlaceholder: 'Ask AI-Vaidya a health question...',
      };
    }

    const policy = UI_PORTAL_POLICIES[portalId] || UI_PORTAL_POLICIES.patient;

    // Resolve patient ID:
    // - Patient portal: own ID from localStorage
    // - Doctor/Hospital viewing a patient: URL query param ?patientId= or ?id=
    let patientId = null;
    if (portalId === 'patient') {
      patientId = typeof window !== 'undefined'
        ? localStorage.getItem('mv_patient_id')
        : null;
    } else {
      patientId = router.query.patientId || router.query.id || null;
    }

    return {
      portalId,
      patientId,
      userName: user?.userId || null,
      userRole: user?.userType || null,
      suggestedPrompts: policy.suggested_prompts,
      isFileUploadAllowed: policy.file_upload_allowed,
      allowedFileTypes: policy.file_types_allowed,
      badgeLabel: policy.badge_label,
      badgeColor: policy.badge_color,
      inputPlaceholder: policy.placeholder,
    };
  }, [router.pathname, router.query, user]);
}
