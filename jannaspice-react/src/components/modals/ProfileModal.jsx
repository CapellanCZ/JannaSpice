import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { validateProfileInput } from '../../features/auth/index.js';
import { Field, ModalHeader, ModalShell } from '../ui/index.jsx';

export default function ProfileModal() {
  const { profileModal, closeProfileModal, currentUser, handleUpdateProfile } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profileModal.open && currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setErrors({});
    }
  }, [profileModal.open, currentUser]);

  if (!profileModal.open || !currentUser) return null;

  async function submit(e) {
    e.preventDefault();
    const local = validateProfileInput({ name, phone });
    if (!local.ok) {
      setErrors(local.errors);
      return;
    }
    setSubmitting(true);
    try {
      const result = await handleUpdateProfile({ name, phone });
      if (result?.errors) setErrors(result.errors);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open onClose={closeProfileModal} labelledBy="profile-title">
      <ModalHeader id="profile-title" title="Edit profile" subtitle={currentUser.email} onClose={closeProfileModal} />
      <form onSubmit={submit} className="ui-dialog-body">
        <Field label="Full Name" error={errors.name}>
          <input className={`input-modern ${errors.name ? 'input-error' : ''}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Mobile Number" error={errors.phone}>
          <input className={`input-modern ${errors.phone ? 'input-error' : ''}`} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={13} />
        </Field>
        <button type="submit" className="w-full btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save profile'}</button>
      </form>
    </ModalShell>
  );
}
