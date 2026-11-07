import { useEffect, useState } from 'react';
import { useT } from '../App.jsx';
import { announceProfileUpdate, api } from '../api.js';

export default function AccountSettings() {
  const t = useT();
  const [account, setAccount] = useState(null);
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.getAccount().then(user => {
      if (!active) return;
      setAccount(user);
      setEmail(user.email);
    }).catch(err => {
      if (!active) return;
      if (err.status === 401) location.hash = '#/edit';
      else setError(err.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateEmail = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const result = await api.updateAccount({ email, currentPassword: emailPassword });
      setAccount(result.user);
      setEmailPassword('');
      setMessage(t('settings_email_saved'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError(t('settings_password_mismatch'));
      return;
    }
    setBusy(true);
    try {
      await api.updatePassword({ currentPassword: passwordCurrent, newPassword });
      setPasswordCurrent('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(t('settings_password_saved'));
      window.setTimeout(() => { location.hash = '#/edit'; }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async e => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.deleteAccount({ currentPassword: deletePassword });
      announceProfileUpdate(null);
      location.hash = '#/';
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (loading) return <div className="wrap narrow sec" role="status">{t('loading')}</div>;

  return <section className="wrap settings-page">
    <div className="dashboard-heading">
      <div><p className="eyebrow">{t('settings_eyebrow')}</p><h1>{t('settings_title')}</h1><p className="muted">{t('settings_intro')}</p></div>
      <div className="actions"><a className="btn ghost sm" href="#/dashboard">{t('dashboard_title')}</a><a className="btn ghost sm" href="#/edit">{t('edit_profile')}</a></div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="resume-success" role="status">{message}</p>}
    {account && <>
      <article className="dashboard-card settings-card">
        <h2>{t('settings_email_title')}</h2>
        <form className="settings-form" onSubmit={updateEmail}>
          <label className="field"><span>{t('email')}</span><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="field"><span>{t('settings_current_password')}</span><input type="password" autoComplete="current-password" required value={emailPassword} onChange={e => setEmailPassword(e.target.value)} /></label>
          <button className="btn" type="submit" disabled={busy}>{t('settings_save_email')}</button>
        </form>
      </article>
      <article className="dashboard-card settings-card">
        <h2>{t('settings_password_title')}</h2>
        <p className="muted">{t('settings_password_description')}</p>
        <form className="settings-form" onSubmit={resetPassword}>
          <label className="field"><span>{t('settings_current_password')}</span><input type="password" autoComplete="current-password" minLength="8" required value={passwordCurrent} onChange={e => setPasswordCurrent(e.target.value)} /></label>
          <label className="field"><span>{t('settings_new_password')}</span><input type="password" autoComplete="new-password" minLength="8" required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
          <label className="field"><span>{t('settings_confirm_password')}</span><input type="password" autoComplete="new-password" minLength="8" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>
          <button className="btn" type="submit" disabled={busy}>{t('settings_update_password')}</button>
        </form>
      </article>
      <article className="dashboard-card settings-card danger-card">
        <h2>{t('settings_delete_title')}</h2>
        <p className="muted">{t('settings_delete_description')}</p>
        <form className="settings-form" onSubmit={deleteAccount}>
          <label className="settings-confirm"><input type="checkbox" required checked={deleteConfirmed} onChange={e => setDeleteConfirmed(e.target.checked)} /><span>{t('settings_delete_confirm')}</span></label>
          <label className="field"><span>{t('settings_current_password')}</span><input type="password" autoComplete="current-password" required value={deletePassword} onChange={e => setDeletePassword(e.target.value)} /></label>
          <button className="btn danger-button" type="submit" disabled={busy || !deleteConfirmed}>{t('settings_delete_action')}</button>
        </form>
      </article>
    </>}
  </section>;
}
