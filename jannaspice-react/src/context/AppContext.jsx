import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { CONFIG } from '../data/data.js';
import { supabase } from '../lib/supabase/client.js';
import * as authApi from '../features/auth/index.js';
import * as bookingsApi from '../features/bookings/index.js';
import * as blackoutsApi from '../features/blackouts/index.js';
import * as notificationsApi from '../features/notifications/index.js';
import * as catalogApi from '../features/catalog/index.js';
import * as paymentsApi from '../features/payments/index.js';
import { dispatchEmails } from '../features/emails/index.js';
import { checkDateAvailability } from '../features/availability/index.js';

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function getMinDateString() {
  const date = new Date();
  date.setDate(date.getDate() + CONFIG.prepLeadTimeDays);
  return date.toISOString().split('T')[0];
}

export function AppProvider({ children }) {
  const [view, setView] = useState('home');
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [authView, setAuthView] = useState('login');
  const pendingAuthCallback = useRef(null);

  const fallback = catalogApi.fallbackCatalog();
  const [packages, setPackages] = useState(fallback.packages);
  const [menuOptions, setMenuOptions] = useState(fallback.menuOptions);
  const [menuItems, setMenuItems] = useState(fallback.menuItems);

  const [reservationsQueue, setReservationsQueue] = useState([]);
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [clientNotifications, setClientNotifications] = useState([]);

  const [authModal, setAuthModal] = useState({ open: false });
  const [chatModal, setChatModal] = useState({ open: false, resId: null, role: 'client' });
  const [detailPanel, setDetailPanel] = useState({ open: false, resId: null });
  const [clientDetailModal, setClientDetailModal] = useState({ open: false, resId: null });
  const [successModal, setSuccessModal] = useState({ open: false, message: '' });
  const [blackoutModal, setBlackoutModal] = useState({ open: false });
  const [profileModal, setProfileModal] = useState({ open: false });
  const [catalogModal, setCatalogModal] = useState({ open: false });
  const [alertModal, setAlertModal] = useState({ open: false, message: '', title: 'Notice', type: 'info' });
  const alertCallback = useRef(null);

  const customAlert = useCallback((message, title = 'Notice', type = 'info', callback = null) => {
    alertCallback.current = callback;
    setAlertModal({ open: true, message, title, type });
  }, []);

  const closeCustomAlert = useCallback((confirmed = false) => {
    setAlertModal(a => ({ ...a, open: false }));
    const cb = alertCallback.current;
    alertCallback.current = null;
    if (cb) setTimeout(() => cb(confirmed), 200);
  }, []);

  const switchAppView = useCallback((v) => {
    setView(v);
    window.scrollTo(0, 0);
  }, []);

  const refreshReservations = useCallback(async () => {
    const rows = await bookingsApi.listReservations();
    setReservationsQueue(rows);
    return rows;
  }, []);

  const refreshBlackouts = useCallback(async () => {
    const rows = await blackoutsApi.listBlackouts();
    setBlackoutDates(rows);
    return rows;
  }, []);

  const refreshNotifications = useCallback(async (email) => {
    const rows = await notificationsApi.listNotifications(email);
    setClientNotifications(rows);
    return rows;
  }, []);

  const refreshCatalog = useCallback(async (includeInactive = false) => {
    try {
      const catalog = await catalogApi.listCatalog({ includeInactive });
      if (catalog.packages.length) setPackages(catalog.packages);
      if (Object.values(catalog.menuOptions).some((list) => list.length)) {
        setMenuOptions(catalog.menuOptions);
      }
      setMenuItems(catalog.menuItems);
      return catalog;
    } catch {
      const catalog = catalogApi.fallbackCatalog();
      setPackages(catalog.packages);
      setMenuOptions(catalog.menuOptions);
      setMenuItems(catalog.menuItems);
      return catalog;
    }
  }, []);

  const loadWorkspace = useCallback(async (user) => {
    await refreshCatalog(user?.role === 'manager').catch(() => {});
    if (user) {
      await bookingsApi.expireUnpaidReservations().catch(() => {});
      dispatchEmails();
    }
    if (!user) {
      const blackouts = await blackoutsApi.listBlackouts();
      setBlackoutDates(blackouts);
      setReservationsQueue([]);
      setClientNotifications([]);
      return;
    }
    const [reservations, blackouts, notifications] = await Promise.all([
      bookingsApi.listReservations(),
      blackoutsApi.listBlackouts(),
      notificationsApi.listNotifications(user.email)
    ]);
    setReservationsQueue(reservations);
    setBlackoutDates(blackouts);
    setClientNotifications(notifications);
  }, [refreshCatalog]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (cancelled) return;
        setCurrentUser(user);
        await loadWorkspace(user);
        if (user) {
          setView(user.role === 'manager' ? 'manager' : 'client-dashboard');
        }
      } catch (err) {
        if (cancelled) return;
        setCurrentUser(null);
        try {
          await loadWorkspace(null);
        } catch {
          // Public home can still render without workspace data.
        }
        const message = err?.message || '';
        if (!/auth session missing/i.test(message)) {
          customAlert(message || 'Could not restore session.', 'Error', 'error');
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [customAlert, loadWorkspace]);

  // Clients never stay on the public marketing site while signed in.
  useEffect(() => {
    if (!authReady || !currentUser) return;
    if (currentUser.role === 'manager') return;
    if (view === 'home') setView('client-dashboard');
  }, [authReady, currentUser, view]);

  useEffect(() => {
    return authApi.onAuthStateChange(async (user, event) => {
      setCurrentUser(user);
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('recovery');
        setAuthModal({ open: true });
      }
      try {
        await loadWorkspace(user);
      } catch (err) {
        const message = err?.message || '';
        if (!/auth session missing/i.test(message)) {
          customAlert(message || 'Could not load workspace.', 'Error', 'error');
        }
      }
    });
  }, [customAlert, loadWorkspace]);

  useEffect(() => {
    const channel = supabase
      .channel('jannaspice-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        refreshReservations().catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservation_messages' }, () => {
        refreshReservations().catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blackout_dates' }, () => {
        refreshBlackouts().catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        if (currentUser) refreshNotifications(currentUser.email).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_proofs' }, () => {
        refreshReservations().catch(() => {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, refreshReservations, refreshBlackouts, refreshNotifications]);

  const requireAuth = useCallback((callback) => {
    if (!currentUser) {
    pendingAuthCallback.current = callback;
    setIsSignupMode(false);
    setAuthView('login');
    setAuthModal({ open: true });
    } else {
      callback();
    }
  }, [currentUser]);

  const openAuthModal = useCallback((mode) => {
    setIsSignupMode(mode === 'signup');
    setAuthView(mode === 'signup' ? 'signup' : mode === 'forgot' ? 'forgot' : mode === 'recovery' ? 'recovery' : 'login');
    setAuthModal({ open: true });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal({ open: false });
    if (authView !== 'recovery') setAuthView(isSignupMode ? 'signup' : 'login');
  }, [authView, isSignupMode]);

  const toggleAuthMode = useCallback(() => {
    setIsSignupMode((m) => {
      const next = !m;
      setAuthView(next ? 'signup' : 'login');
      return next;
    });
  }, []);

  const openForgotPassword = useCallback(() => setAuthView('forgot'), []);
  const showLogin = useCallback(() => {
    setIsSignupMode(false);
    setAuthView('login');
  }, []);

  const handleAuth = useCallback(async ({ email, password, name, phone, confirmPassword }) => {
    try {
      const user = isSignupMode
        ? await authApi.signUp({ email, password, name, phone, confirmPassword })
        : await authApi.signIn({ email, password });
      setCurrentUser(user);
      await loadWorkspace(user);
      setAuthModal({ open: false });
      const cb = pendingAuthCallback.current;
      pendingAuthCallback.current = null;
      if (cb) setTimeout(cb, 0);
      else switchAppView(user.role === 'manager' ? 'manager' : 'client-dashboard');
      return { ok: true };
    } catch (err) {
      if (err?.name === 'ValidationError' && err.errors) {
        return { ok: false, errors: err.errors };
      }
      customAlert(err.message, 'Error', 'error');
      return { ok: false, errors: null };
    }
  }, [isSignupMode, customAlert, switchAppView, loadWorkspace]);

  const handleForgotPassword = useCallback(async (email) => {
    try {
      await authApi.requestPasswordReset(email);
      customAlert('If that email is registered, a reset link is on the way.', 'Check your email', 'success');
      setAuthView('login');
      return { ok: true };
    } catch (err) {
      if (err?.name === 'ValidationError' && err.errors) return { ok: false, errors: err.errors };
      customAlert(err.message, 'Error', 'error');
      return { ok: false, errors: null };
    }
  }, [customAlert]);

  const handleResetPassword = useCallback(async ({ password, confirmPassword }) => {
    try {
      await authApi.updatePassword({ password, confirmPassword });
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
      await loadWorkspace(user);
      setAuthModal({ open: false });
      setAuthView('login');
      customAlert('Password updated. You are signed in.', 'Success', 'success');
      return { ok: true };
    } catch (err) {
      if (err?.name === 'ValidationError' && err.errors) return { ok: false, errors: err.errors };
      customAlert(err.message, 'Error', 'error');
      return { ok: false, errors: null };
    }
  }, [customAlert, loadWorkspace]);

  const handleUpdateProfile = useCallback(async ({ name, phone }) => {
    try {
      const user = await authApi.updateProfile({ name, phone });
      setCurrentUser(user);
      setProfileModal({ open: false });
      customAlert('Profile updated.', 'Success', 'success');
      return { ok: true };
    } catch (err) {
      if (err?.name === 'ValidationError' && err.errors) return { ok: false, errors: err.errors };
      customAlert(err.message, 'Error', 'error');
      return { ok: false, errors: null };
    }
  }, [customAlert]);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch (err) {
      customAlert(err.message, 'Error', 'error');
      return;
    }
    setCurrentUser(null);
    setReservationsQueue([]);
    setClientNotifications([]);
    switchAppView('home');
    customAlert('You have logged out successfully.');
  }, [switchAppView, customAlert]);

  const markClientNotificationsRead = useCallback(async () => {
    await notificationsApi.markNotificationsRead();
    if (currentUser) await refreshNotifications(currentUser.email);
  }, [currentUser, refreshNotifications]);

  const clearClientNotifications = useCallback(async () => {
    await notificationsApi.clearNotifications();
    setClientNotifications([]);
  }, []);

  const runMutation = useCallback(async (fn, successAlert) => {
    try {
      const result = await fn();
      dispatchEmails();
      await Promise.all([
        refreshReservations(),
        currentUser ? refreshNotifications(currentUser.email) : Promise.resolve()
      ]);
      if (successAlert) customAlert(successAlert.message, successAlert.title, successAlert.type);
      return result;
    } catch (err) {
      customAlert(err.message, 'Error', 'error');
      throw err;
    }
  }, [refreshReservations, refreshNotifications, currentUser, customAlert]);

  const createReservation = useCallback((payload) => (
    runMutation(() => bookingsApi.createReservation(payload))
  ), [runMutation]);

  const submitChangeRequest = useCallback((resId, data) => (
    runMutation(() => bookingsApi.submitChangeRequest(resId, data))
  ), [runMutation]);

  const updateReservationStatus = useCallback((id, status) => (
    runMutation(() => bookingsApi.updateReservationStatus(id, status))
  ), [runMutation]);

  const cancelReservation = useCallback((id) => (
    runMutation(() => bookingsApi.cancelReservation(id))
  ), [runMutation]);

  const logPayment = useCallback((id, type) => (
    runMutation(() => bookingsApi.logPayment(id, type))
  ), [runMutation]);

  const approveChangeRequest = useCallback((resId) => (
    runMutation(
      () => bookingsApi.approveChangeRequest(resId),
      { message: 'Change request approved and applied to booking.', title: 'Success', type: 'success' }
    )
  ), [runMutation]);

  const rejectChangeRequest = useCallback((resId) => (
    runMutation(
      () => bookingsApi.rejectChangeRequest(resId),
      { message: 'Change request rejected.', title: 'Notice', type: 'info' }
    )
  ), [runMutation]);

  const requestCancellation = useCallback((id) => (
    runMutation(() => bookingsApi.requestCancellation(id))
  ), [runMutation]);

  const confirmCancellation = useCallback((id) => (
    runMutation(
      () => bookingsApi.confirmCancellation(id),
      { message: 'Cancellation confirmed. The date slot is released.', title: 'Cancelled', type: 'success' }
    )
  ), [runMutation]);

  const rejectCancellation = useCallback((id, note) => (
    runMutation(
      () => bookingsApi.rejectCancellation(id, note),
      { message: 'Cancellation request declined.', title: 'Notice', type: 'info' }
    )
  ), [runMutation]);

  const submitPaymentProof = useCallback((payload) => (
    runMutation(
      () => paymentsApi.uploadPaymentProof(payload),
      { message: 'Payment proof submitted. Waiting for owner verification.', title: 'Proof uploaded', type: 'success' }
    )
  ), [runMutation]);

  const reviewPaymentProof = useCallback((proofId, decision, note) => (
    runMutation(() => paymentsApi.reviewPaymentProof(proofId, decision, note))
  ), [runMutation]);

  const savePackage = useCallback(async (payload) => {
    try {
      await catalogApi.upsertPackage(payload);
      await refreshCatalog(true);
      customAlert('Package saved.', 'Success', 'success');
    } catch (err) {
      customAlert(err.message, 'Error', 'error');
      throw err;
    }
  }, [refreshCatalog, customAlert]);

  const saveMenuItem = useCallback(async (payload) => {
    try {
      await catalogApi.upsertMenuItem(payload);
      await refreshCatalog(true);
      customAlert('Menu item saved.', 'Success', 'success');
    } catch (err) {
      customAlert(err.message, 'Error', 'error');
      throw err;
    }
  }, [refreshCatalog, customAlert]);

  const sendMessage = useCallback(async (resId, _role, text) => {
    try {
      await bookingsApi.sendMessage(resId, text);
      await refreshReservations();
    } catch (err) {
      customAlert(err.message, 'Error', 'error');
    }
  }, [refreshReservations, customAlert]);

  const addBlackout = useCallback(async (entry) => {
    try {
      await blackoutsApi.addBlackout(entry);
      await refreshBlackouts();
    } catch (err) {
      customAlert(err.message, 'Error', 'error');
    }
  }, [refreshBlackouts, customAlert]);

  const deleteBlackout = useCallback(async (id) => {
    try {
      await blackoutsApi.deleteBlackout(id);
      await refreshBlackouts();
    } catch (err) {
      customAlert(err.message, 'Error', 'error');
    }
  }, [refreshBlackouts, customAlert]);

  const openChat = useCallback((resId, role) => setChatModal({ open: true, resId, role }), []);
  const closeChat = useCallback(() => setChatModal(c => ({ ...c, open: false })), []);
  const openDetail = useCallback((resId) => setDetailPanel({ open: true, resId }), []);
  const closeDetail = useCallback(() => setDetailPanel(d => ({ ...d, open: false })), []);
  const openClientDetail = useCallback((resId) => setClientDetailModal({ open: true, resId }), []);
  const closeClientDetail = useCallback(() => setClientDetailModal(d => ({ ...d, open: false })), []);
  const openBlackoutModal = useCallback(() => setBlackoutModal({ open: true }), []);
  const closeBlackoutModal = useCallback(() => setBlackoutModal({ open: false }), []);
  const openSuccessModal = useCallback((message) => setSuccessModal({ open: true, message }), []);
  const closeSuccessModal = useCallback(() => setSuccessModal({ open: false, message: '' }), []);
  const openProfileModal = useCallback(() => setProfileModal({ open: true }), []);
  const closeProfileModal = useCallback(() => setProfileModal({ open: false }), []);
  const openCatalogModal = useCallback(() => setCatalogModal({ open: true }), []);
  const closeCatalogModal = useCallback(() => setCatalogModal({ open: false }), []);

  const value = {
    CONFIG, getMinDateString, authReady, checkDateAvailability,
    view, switchAppView,
    currentUser, isSignupMode, authView,
    packages, menuOptions, menuItems,
    requireAuth, openAuthModal, closeAuthModal, toggleAuthMode, openForgotPassword, showLogin,
    handleAuth, handleForgotPassword, handleResetPassword, handleUpdateProfile, handleLogout,
    reservationsQueue, createReservation, submitChangeRequest, updateReservationStatus,
    cancelReservation, logPayment, approveChangeRequest, rejectChangeRequest, sendMessage,
    requestCancellation, confirmCancellation, rejectCancellation,
    submitPaymentProof, reviewPaymentProof, getProofSignedUrl: paymentsApi.getProofSignedUrl,
    nextPaymentType: paymentsApi.nextPaymentType, pendingProofFor: paymentsApi.pendingProofFor,
    savePackage, saveMenuItem, refreshCatalog,
    blackoutDates, addBlackout, deleteBlackout,
    clientNotifications, markClientNotificationsRead, clearClientNotifications,
    authModal, chatModal, openChat, closeChat,
    detailPanel, openDetail, closeDetail,
    clientDetailModal, openClientDetail, closeClientDetail,
    blackoutModal, openBlackoutModal, closeBlackoutModal,
    profileModal, openProfileModal, closeProfileModal,
    catalogModal, openCatalogModal, closeCatalogModal,
    successModal, openSuccessModal, closeSuccessModal,
    alertModal, customAlert, closeCustomAlert
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
