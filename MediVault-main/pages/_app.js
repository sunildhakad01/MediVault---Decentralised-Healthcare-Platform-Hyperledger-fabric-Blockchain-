import "../styles/globals.css";
import "../ai_vaidya/ui/styles/ai_vaidya.css";
import Head from "next/head";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Layout from "../components/layout/Layout";

// Pages that render without the main Layout (Header / Sidebar)
const NO_LAYOUT_PAGES = [
  "/login",
  "/register",
  "/register/role-select",
  "/forgot-pin",
  "/admin/login",
  "/hospital/register",
  "/hospital/status",
];

// Routes that require a valid JWT — unauthenticated users are sent to /login
const PROTECTED_PREFIXES = [
  "/patient",
  "/doctor",
  "/hospital",
  "/admin",
  "/chat",
  "/ai-vaidya",
  "/medicines",
  "/doctors",
];

// ── Inner shell (needs to be inside AuthProvider to call useAuth) ─────────────
function AppShell({ Component, pageProps, router }) {
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // All /hospital/* routes use HospitalDashboard's own full layout (sidebar + header)
  const isHospitalDashboardRoute = router.pathname.startsWith('/hospital/')
    && !NO_LAYOUT_PAGES.includes(router.pathname)
    && !router.pathname.startsWith('/hospital/resubmit/');

  const isAuthPage  = NO_LAYOUT_PAGES.includes(router.pathname)
    || router.pathname.startsWith('/hospital/resubmit/');
  const isProtected = PROTECTED_PREFIXES.some(p => router.pathname.startsWith(p));
  const isHomePage  = router.pathname === '/';

  const isHospitalAdmin = user?.userType === 'hospital_admin' || user?.userType === 'hospital';
  const isHospitalRoute = router.pathname.startsWith('/hospital/');
  const isHospitalStatusRoute = router.pathname === '/hospital/status'
    || router.pathname.startsWith('/hospital/resubmit/');

  useEffect(() => {
    if (authLoading) return;

    if (isHomePage && isAuthenticated && user) {
      const dest =
        user.userType === 'doctor'    ? '/doctor/dashboard'   :
        user.userType === 'admin'     ? '/admin/dashboard'    :
        isHospitalAdmin               ? '/hospital/dashboard' :
        '/patient/dashboard';
      router.replace(dest);
      return;
    }

    const isAdminRoute = router.pathname.startsWith('/admin');
    const hasAdminSession = !!localStorage.getItem('mv_admin_session');
    if (isProtected && !isAuthenticated && !isAuthPage) {
      if (isAdminRoute && hasAdminSession) return;
      router.replace(isAdminRoute ? '/admin/login' : '/login');
      return;
    }

    if (isAuthenticated && isHospitalAdmin && isHospitalRoute && !isHospitalStatusRoute) {
      const hospitalId = localStorage.getItem('mv_hospital_id');
      if (!hospitalId) return;

      import('../utils/api').then(({ default: apiClient }) => {
        apiClient.get(`/hospital/${hospitalId}/status`)
          .then(res => {
            const status = res.data?.data?.status;
            if (status && status !== 'approved') {
              router.replace('/hospital/status');
            }
          })
          .catch(() => {});
      });
    }
  }, [authLoading, isAuthenticated, user, isProtected, isHomePage, isHospitalAdmin, isHospitalRoute, isHospitalStatusRoute, router]);

  if (authLoading && isProtected) return null;
  if (authLoading && isHomePage) return null;

  if (isAuthPage || isHospitalDashboardRoute) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

// ── Suppress MetaMask extension noise ────────────────────────────────────────
// MetaMask's inpage.js fires an unhandled rejection when its background
// service worker is temporarily unreachable (a MetaMask-internal issue,
// not caused by application code). In Next.js dev mode every unhandled
// rejection surfaces as a full-page error overlay. We intercept and drop
// those specific rejections before they reach the overlay.
function useSupressMetaMaskErrors() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event) => {
      const msg  = event?.reason?.message ?? String(event?.reason ?? '');
      const stack = event?.reason?.stack  ?? '';
      const isMetaMaskError =
        msg.includes('MetaMask') ||
        msg.includes('Failed to connect') ||
        stack.includes('chrome-extension') ||
        stack.includes('inpage.js');
      if (isMetaMaskError) event.preventDefault();
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);
}

// ── Root app ──────────────────────────────────────────────────────────────────
function MyApp({ Component, pageProps, router }) {
  useSupressMetaMaskErrors();
  return (
    <>
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_NAME || "MediVault"}</title>
        <meta name="description" content="Secure Healthcare on Hyperledger Fabric" />
        <link rel="icon" href="/logo.png" />
      </Head>

      <AuthProvider>
        <AppShell
          Component={Component}
          pageProps={pageProps}
          router={router}
        />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "white",
              color: "#374151",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "16px",
            },
            success: { iconTheme: { primary: "#10B981", secondary: "white" } },
            error:   { iconTheme: { primary: "#EF4444", secondary: "white" } },
          }}
        />
      </AuthProvider>
    </>
  );
}

export default MyApp;
