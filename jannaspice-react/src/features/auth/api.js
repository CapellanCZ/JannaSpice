import { supabase } from '../../lib/supabase/client.js';
import { getErrorMessage } from '../../lib/supabase/errors.js';
import {
  firstValidationMessage,
  validateProfileInput,
  validateResetPasswordInput,
  validateSignInInput,
  validateSignUpInput
} from './validation.js';

function mapProfile(user, profile) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: profile?.full_name || user.user_metadata?.full_name || user.email,
    phone: profile?.phone || user.user_metadata?.phone || '',
    role: profile?.role || 'client'
  };
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(getErrorMessage(error, 'Could not load profile.'));
  return data;
}

function isMissingSessionError(error) {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (
    message.includes('auth session missing')
    || message.includes('session missing')
    || error.name === 'AuthSessionMissingError'
  );
}

function mapAuthError(error, fallback) {
  const message = (error?.message || '').toLowerCase();
  if (message.includes('user already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (message.includes('password') && (message.includes('weak') || message.includes('pwned') || message.includes('leaked'))) {
    return 'That password is too weak or has appeared in a data breach. Choose a stronger one.';
  }
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return 'Invalid email or password.';
  }
  if (message.includes('email')) {
    return getErrorMessage(error, 'Please check your email address.');
  }
  return getErrorMessage(error, fallback);
}

export class ValidationError extends Error {
  constructor(errors) {
    super(firstValidationMessage(errors));
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export async function getCurrentUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError && !isMissingSessionError(sessionError)) {
    throw new Error(getErrorMessage(sessionError, 'Could not restore session.'));
  }

  const sessionUser = sessionData.session?.user;
  if (!sessionUser) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (isMissingSessionError(userError)) return null;
    throw new Error(getErrorMessage(userError, 'Could not restore session.'));
  }

  const user = userData.user;
  if (!user) return null;
  const profile = await fetchProfile(user.id);
  return mapProfile(user, profile);
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (!session?.user) {
      callback(null, event);
      return;
    }
    try {
      const profile = await fetchProfile(session.user.id);
      callback(mapProfile(session.user, profile), event);
    } catch {
      callback(mapProfile(session.user, null), event);
    }
  });
  return () => data.subscription.unsubscribe();
}

export async function signIn({ email, password }) {
  const result = validateSignInInput({ email, password });
  if (!result.ok) throw new ValidationError(result.errors);

  const { data, error } = await supabase.auth.signInWithPassword(result.value);
  if (error) throw new Error(mapAuthError(error, 'Invalid credentials.'));
  const profile = await fetchProfile(data.user.id);
  return mapProfile(data.user, profile);
}

export async function signUp({ email, password, name, phone, confirmPassword }) {
  const result = validateSignUpInput({ email, password, name, phone, confirmPassword });
  if (!result.ok) throw new ValidationError(result.errors);

  const { name: fullName, phone: mobile, email: mail, password: pass } = result.value;

  const { data, error } = await supabase.auth.signUp({
    email: mail,
    password: pass,
    options: {
      data: { full_name: fullName, phone: mobile }
    }
  });
  if (error) throw new Error(mapAuthError(error, 'Could not create account.'));
  if (data.session && data.user) {
    const profile = await fetchProfile(data.user.id);
    return mapProfile(data.user, profile);
  }
  return signIn({ email: mail, password: pass });
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error && !isMissingSessionError(error)) {
    throw new Error(getErrorMessage(error, 'Could not sign out.'));
  }
}

export async function requestPasswordReset(email) {
  const mail = String(email || '').trim().toLowerCase();
  if (!mail) throw new ValidationError({ email: 'Enter a valid email address.' });

  const { error } = await supabase.auth.resetPasswordForEmail(mail, {
    redirectTo: `${window.location.origin}/`
  });
  if (error) throw new Error(mapAuthError(error, 'Could not send reset email.'));
}

export async function updatePassword({ password, confirmPassword }) {
  const result = validateResetPasswordInput({ password, confirmPassword });
  if (!result.ok) throw new ValidationError(result.errors);

  const { error } = await supabase.auth.updateUser({ password: result.value.password });
  if (error) throw new Error(mapAuthError(error, 'Could not update password.'));
}

export async function updateProfile({ name, phone }) {
  const result = validateProfileInput({ name, phone });
  if (!result.ok) throw new ValidationError(result.errors);

  const { error } = await supabase.rpc('update_my_profile', {
    p_full_name: result.value.name,
    p_phone: result.value.phone
  });
  if (error) throw new Error(getErrorMessage(error, 'Could not update profile.'));

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(getErrorMessage(userError, 'Could not refresh profile.'));
  const profile = await fetchProfile(userData.user.id);
  return mapProfile(userData.user, profile);
}
