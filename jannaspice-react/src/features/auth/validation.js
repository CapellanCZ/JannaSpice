/** Auth input validation & normalization (shared by UI and API). */

export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(09|\+639)\d{9}$/;
const NAME_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\-.\s]{1,79}$/;

export function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

export function normalizeName(name = '') {
  return String(name).trim().replace(/\s+/g, ' ');
}

/** Accept 09XXXXXXXXX or +639XXXXXXXXX; store as 09XXXXXXXXX. */
export function normalizePhone(phone = '') {
  const raw = String(phone).trim().replace(/[\s()-]/g, '');
  if (/^\+639\d{9}$/.test(raw)) return `0${raw.slice(3)}`;
  if (/^639\d{9}$/.test(raw)) return `0${raw.slice(2)}`;
  return raw;
}

export function getPasswordChecks(password = '') {
  const value = String(password);
  return {
    minLength: value.length >= PASSWORD_MIN_LENGTH,
    hasLower: /[a-z]/.test(value),
    hasUpper: /[A-Z]/.test(value),
    hasDigit: /\d/.test(value),
    hasSymbol: /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(value)
  };
}

export function isStrongPassword(password = '') {
  const checks = getPasswordChecks(password);
  return Object.values(checks).every(Boolean);
}

/**
 * @returns {{ ok: true, value: object } | { ok: false, errors: Record<string, string> }}
 */
export function validateSignUpInput({ name, phone, email, password, confirmPassword }) {
  const errors = {};
  const fullName = normalizeName(name);
  const mobile = normalizePhone(phone);
  const mail = normalizeEmail(email);
  const pass = String(password ?? '');
  const confirm = confirmPassword == null ? null : String(confirmPassword);

  if (!fullName) {
    errors.name = 'Full name is required.';
  } else if (fullName.length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  } else if (fullName.length > 80) {
    errors.name = 'Full name must be 80 characters or less.';
  } else if (!NAME_RE.test(fullName)) {
    errors.name = 'Use letters only (spaces, hyphen, apostrophe allowed).';
  }

  if (!mobile) {
    errors.phone = 'Mobile number is required.';
  } else if (!PHONE_RE.test(mobile)) {
    errors.phone = 'Use a valid PH mobile (09XXXXXXXXX or +639XXXXXXXXX).';
  }

  if (!mail) {
    errors.email = 'Email is required.';
  } else if (mail.length > 254) {
    errors.email = 'Email is too long.';
  } else if (!EMAIL_RE.test(mail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!pass) {
    errors.password = 'Password is required.';
  } else if (!isStrongPassword(pass)) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include upper, lower, number, and symbol.`;
  }

  if (confirm !== null) {
    if (!confirm) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (confirm !== pass) {
      errors.confirmPassword = 'Passwords do not match.';
    }
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name: fullName,
      phone: mobile,
      email: mail,
      password: pass
    }
  };
}

/**
 * @returns {{ ok: true, value: object } | { ok: false, errors: Record<string, string> }}
 */
export function validateSignInInput({ email, password }) {
  const errors = {};
  const mail = normalizeEmail(email);
  const pass = String(password ?? '');

  if (!mail || !EMAIL_RE.test(mail)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!pass) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, value: { email: mail, password: pass } };
}

export function validateProfileInput({ name, phone }) {
  const errors = {};
  const fullName = normalizeName(name);
  const mobile = normalizePhone(phone);

  if (!fullName) {
    errors.name = 'Full name is required.';
  } else if (fullName.length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  } else if (fullName.length > 80) {
    errors.name = 'Full name must be 80 characters or less.';
  } else if (!NAME_RE.test(fullName)) {
    errors.name = 'Use letters only (spaces, hyphen, apostrophe allowed).';
  }

  if (!mobile) {
    errors.phone = 'Mobile number is required.';
  } else if (!PHONE_RE.test(mobile)) {
    errors.phone = 'Use a valid PH mobile (09XXXXXXXXX or +639XXXXXXXXX).';
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, value: { name: fullName, phone: mobile } };
}

export function validateResetPasswordInput({ password, confirmPassword }) {
  const errors = {};
  const pass = String(password ?? '');
  const confirm = String(confirmPassword ?? '');

  if (!pass) {
    errors.password = 'Password is required.';
  } else if (!isStrongPassword(pass)) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include upper, lower, number, and symbol.`;
  }

  if (!confirm) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (confirm !== pass) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  return { ok: true, value: { password: pass } };
}

export function firstValidationMessage(errors = {}) {
  const first = Object.values(errors)[0];
  return first || 'Please fix the highlighted fields.';
}
