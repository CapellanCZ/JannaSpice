export {
  getCurrentUser,
  onAuthStateChange,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  updatePassword,
  updateProfile,
  ValidationError
} from './api.js';

export {
  validateSignUpInput,
  validateSignInInput,
  validateProfileInput,
  validateResetPasswordInput,
  getPasswordChecks,
  PASSWORD_MIN_LENGTH,
  firstValidationMessage,
  normalizeEmail,
  normalizeName,
  normalizePhone
} from './validation.js';
