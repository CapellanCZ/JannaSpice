import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  getPasswordChecks,
  PASSWORD_MIN_LENGTH,
  validateSignInInput,
  validateSignUpInput
} from '../../features/auth/index.js';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-600 font-medium">{message}</p>;
}

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
  const { authModal, closeAuthModal, isSignupMode, toggleAuthMode, handleAuth } = useApp();
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
    const payload = {
      email: email.trim(),
      password,
      name: name.trim(),
      phone: phone.trim(),
      confirmPassword
    };

    const local = isSignupMode
      ? validateSignUpInput(payload)
      : validateSignInInput(payload);

    if (!local.ok) {
      setErrors(local.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const result = await handleAuth(payload);
      if (result?.ok) {
        resetFormExtras();
      } else if (result?.errors) {
        setErrors(result.errors);
      }
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
    `input-modern ${errors[field] ? 'border-red-300 focus:ring-red-200' : ''}`;

  return (
    <div className="fixed inset-0 bg-spice-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={close} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-sand-100 text-spice-900/60 hover:text-spice-900 hover:bg-sand-200"><i className="fa-solid fa-xmark"></i></button>
        <div className="text-center mb-6">
          <div className="bg-spice-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md mx-auto mb-3"><i className="fa-solid fa-user-lock"></i></div>
          <h3 className="font-serif font-bold text-2xl text-spice-900">{isSignupMode ? 'Create Account' : 'Welcome Back'}</h3>
          <p className="text-sm text-spice-900/60 mt-1">{isSignupMode ? 'Join to start booking.' : 'Sign in to manage bookings.'}</p>
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {isSignupMode && (
            <div>
              <label className="block text-sm font-medium text-spice-900 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); clearFieldError('name'); }}
                className={inputClass('name')}
                placeholder="Juan Dela Cruz"
                autoComplete="name"
                maxLength={80}
              />
              <FieldError message={errors.name} />
            </div>
          )}
          {isSignupMode && (
            <div>
              <label className="block text-sm font-medium text-spice-900 mb-1">Mobile Number</label>
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
              <FieldError message={errors.phone} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-spice-900 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearFieldError('email'); }}
              className={inputClass('email')}
              placeholder="name@example.com"
              autoComplete="email"
            />
            <FieldError message={errors.email} />
          </div>
          <div>
            <label className="block text-sm font-medium text-spice-900 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}
                className={`${inputClass('password')} pr-12`}
                placeholder="••••••••"
                autoComplete={isSignupMode ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-spice-900/40 hover:text-spice-500 hover:bg-sand-100 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <FieldError message={errors.password} />
            <PasswordStrength password={password} visible={isSignupMode} />
          </div>
          {isSignupMode && (
            <div>
              <label className="block text-sm font-medium text-spice-900 mb-1">Confirm Password</label>
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
              <FieldError message={errors.confirmPassword} />
            </div>
          )}
          <div className="pt-2">
            <button type="submit" className="w-full btn-primary" disabled={submitting}>
              {submitting ? 'Please wait…' : (isSignupMode ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-sm text-spice-900/60 border-t border-sand-200 pt-4">
          <span>{isSignupMode ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
          <button type="button" onClick={switchMode} className="font-bold text-spice-500 hover:underline">{isSignupMode ? 'Log in' : 'Sign up'}</button>
        </div>
      </div>
    </div>
  );
}
