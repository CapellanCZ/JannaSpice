export {
  getCurrentUser,
  onAuthStateChange,
  signIn,
  signUp,
  signOut,
  ValidationError
} from './api.js';

export {
  validateSignUpInput,
  validateSignInInput,
  getPasswordChecks,
  PASSWORD_MIN_LENGTH,
  firstValidationMessage,
  normalizeEmail,
  normalizeName,
  normalizePhone
} from './validation.js';
