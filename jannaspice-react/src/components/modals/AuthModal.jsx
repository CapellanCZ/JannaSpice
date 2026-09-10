import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  getPasswordChecks,
  PASSWORD_MIN_LENGTH,
  validateResetPasswordInput,
  validateSignInInput,
  validateSignUpInput
} from '../../features/auth/index.js';
import { BrandMark, Field, IconButton, ModalShell } from '../ui/index.jsx';

function PasswordStrength({ password, visible }) {
  if (!visible) return null;
  const checks = getPasswordChecks(password);
  const items = [
    { ok: checks.minLength, label: `${PASSWORD_MIN_LENGTH}+ characters` },
    { ok: checks.hasUpper, label: 'Uppercase' },
    { ok: checks.hasLower, label: 'Lowercase' },
    { ok: checks.hasDigit, label: 'Number' },
    { ok: checks.hasSymbol, label: 'Symbol' }
  ];
  return (
    <ul className="mt-2 grid grid-cols-2 gap-1.5">
      {items.map((item) => (
        <li key={item.label} className={`text-[11px] font-medium flex items-center gap-1.5 ${item.ok ? 'text-green-600' : 'text-spice-900/40'}`}>
          <i className={`fa-solid ${item.ok ? 'fa-circle-check' : 'fa-circle'} text-[9px]`}></i>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export default function AuthModal() {
  const {
    authModal, closeAuthModal, isSignupMode, authView, toggleAuthMode, handleAuth,
    openForgotPassword, handleForgotPassword, handleResetPassword, showLogin
  } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('client@demo.com');
  const [password, setPassword] = useState('Password123!');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!authModal.open) return null;

  const view = authView || (isSignupMode ? 'signup' : 'login');

  function clearFieldError(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function resetFormExtras() {
    setName('');
    setPhone('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (view === 'forgot') {
        const result = await handleForgotPassword(email.trim());
        if (result?.errors) setErrors(result.errors);
        return;
      }

      if (view === 'recovery') {
        const local = validateResetPasswordInput({ password, confirmPassword });
        if (!local.ok) {
          setErrors(local.errors);
          return;
        }
        const result = await handleResetPassword({ password, confirmPassword });
        if (result?.ok) resetFormExtras();
        else if (result?.errors) setErrors(result.errors);
        return;
      }

      const payload = {
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim(),
        confirmPassword
      };
      const local = isSignupMode ? validateSignUpInput(payload) : validateSignInInput(payload);
      if (!local.ok) {
        setErrors(local.errors);
        return;
      }
      setErrors({});
      const result = await handleAuth(payload);
      if (result?.ok) resetFormExtras();
      else if (result?.errors) setErrors(result.errors);
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    closeAuthModal();
    resetFormExtras();
  }

  function switchMode() {
    setErrors({});
    setConfirmPassword('');
    setShowConfirmPassword(false);
    toggleAuthMode();
  }

  const inputClass = (field) =>
    `input-modern ${errors[field] ? 'input-error' : ''}`;

  const titles = {
    signup: { heading: 'Create Account', sub: 'Join to start booking.' },
    login: { heading: 'Welcome Back', sub: 'Sign in to manage bookings.' },
    forgot: { heading: 'Reset Password', sub: 'We will email you a reset link.' },
    recovery: { heading: 'Choose a new password', sub: 'Use 8+ characters with upper, lower, number, and symbol.' }
  };
  const copy = titles[view] || titles.login;

  return (
    <ModalShell open onClose={close} labelledBy="auth-title">
      <IconButton onClick={close} label="Close" className="dialog-close" />
      <div className="ui-dialog-body">
        <div className="text-center mb-2">
          <div className="flex justify-center mb-3"><BrandMark icon="fa-user-lock" /></div>
          <h3 id="auth-title" className="font-serif font-bold text-2xl text-spice-900">{copy.heading}</h3>
          <p className="text-sm text-spice-900/60 mt-1">{copy.sub}</p>
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {view === 'signup' && (
            <Field label="Full Name" error={errors.name}>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); clearFieldError('name'); }}
                className={inputClass('name')}
                placeholder="Juan Dela Cruz"
                autoComplete="name"
                maxLength={80}
              />
            </Field>
          )}
          {view === 'signup' && (
            <Field label="Mobile Number" error={errors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); clearFieldError('phone'); }}
                className={inputClass('phone')}
                placeholder="09XX XXX XXXX"
                autoComplete="tel"
                inputMode="tel"
                maxLength={13}
              />
            </Field>
          )}
          {view !== 'recovery' && (
            <Field label="Email Address" error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearFieldError('email'); }}
                className={inputClass('email')}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </Field>
          )}
          {(view === 'login' || view === 'signup' || view === 'recovery') && (
            <Field label={view === 'recovery' ? 'New Password' : 'Password'} error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}
                  className={`${inputClass('password')} pr-12`}
                  placeholder="••••••••"
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-spice-900/40 hover:text-spice-500 hover:bg-sand-100 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <PasswordStrength password={password} visible={view === 'signup' || view === 'recovery'} />
            </Field>
          )}
          {(view === 'signup' || view === 'recovery') && (
            <Field label="Confirm Password" error={errors.confirmPassword}>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                  className={`${inputClass('confirmPassword')} pr-12`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-spice-900/40 hover:text-spice-500 hover:bg-sand-100 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </Field>
          )}
          {view === 'login' && (
            <div className="text-right -mt-1">
              <button type="button" onClick={openForgotPassword} className="text-xs font-bold text-spice-500 hover:underline">Forgot password?</button>
            </div>
          )}
          <div className="pt-2">
            <button type="submit" className="w-full btn-primary" disabled={submitting}>
              {submitting ? 'Please wait…' : (
                view === 'signup' ? 'Sign Up' : view === 'forgot' ? 'Send reset link' : view === 'recovery' ? 'Save new password' : 'Sign In'
              )}
            </button>
          </div>
        </form>
        {view !== 'recovery' && (
          <div className="text-center text-sm text-spice-900/60 border-t border-sand-200 pt-4">
            {view === 'forgot' ? (
              <button type="button" onClick={showLogin} className="font-bold text-spice-500 hover:underline">Back to sign in</button>
            ) : (
              <>
                <span>{view === 'signup' ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
                <button type="button" onClick={switchMode} className="font-bold text-spice-500 hover:underline">{view === 'signup' ? 'Log in' : 'Sign up'}</button>
              </>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
