import { useEffect, useMemo, useState } from 'react';
import { useT } from '../App.jsx';
import { announceProfileUpdate, api } from '../api.js';

function profileCompletion(profile) {
  const checks = [
    Boolean(profile.name.trim()),
    Boolean(profile.role.trim()),
    Boolean(profile.bio.trim()),
    Boolean(profile.email || profile.phone || profile.whatsapp),
    Boolean(profile.skills.trim()),
    profile.projects.length > 0
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function Dashboard() {
  const t = useT();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [resumes, setResumes] = useState([]);
  const profileUrl = useMemo(
    () => `${location.origin}${location.pathname}#/u/${profile?.slug ?? ''}`,
    [profile?.slug]
  );

  useEffect(() => {
    let active = true;
    Promise.all([api.getMyProfile(), api.getResumes()])
      .then(([data, resumeList]) => {
        if (!active) return;
        setProfile(data);
        setResumes(resumeList);
        announceProfileUpdate(data);
      })
      .catch(err => {
        if (!active) return;
        if (err.status === 401) {
          location.hash = '#/edit';
          return;
        }
        setError(err.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const logout = async () => {
    setError('');
    try {
      await api.logout();
      announceProfileUpdate(null);
      location.hash = '#/edit';
    } catch (err) {
      setError(err.message);
    }
  };

  const copyLink = async () => {
    setError('');
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('copy_error'));
    }
  };

  const deleteResume = async resume => {
    if (!window.confirm(`${t('resume_delete_confirm')} "${resume.title}"?`)) return;
    setError('');
    try {
      await api.deleteResume(resume.id);
      setResumes(current => current.filter(item => item.id !== resume.id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="wrap narrow sec" role="status">{t('loading')}</div>;

  return (
    <section className="wrap dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">{t('dashboard_eyebrow')}</p>
          <h1>{t('dashboard_title')}{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}</h1>
          <p className="muted">{t('dashboard_intro')}</p>
        </div>
        <button type="button" className="btn ghost sm" onClick={logout}>{t('logout')}</button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {profile && (
        <>
          <div className="dashboard-grid">
            <article className="dashboard-card profile-summary">
              <div className="dashboard-card-heading">
                <div>
                  <p className="eyebrow">{t('your_profile')}</p>
                  <h2>{profile.name || t('untitled_profile')}</h2>
                  <p className="muted">{profile.role || t('add_profession')}</p>
                </div>
                <span className={`status-pill ${profile.isPublished ? 'published' : ''}`}>
                  {profile.isPublished ? t('status_published') : t('status_draft')}
                </span>
              </div>

              <div className="profile-address">
                <span className="muted small">{t('profile_address')}</span>
                <code>{profileUrl}</code>
              </div>

              <div className="actions">
                <a className="btn" href="#/edit">{t('edit_profile')}</a>
                {profile.isPublished && <a className="btn ghost" href={`#/u/${profile.slug}`}>{t('view_public_profile')}</a>}
                {profile.isPublished && <button type="button" className="btn ghost" onClick={copyLink}>{copied ? t('copied') : t('copy')}</button>}
              </div>
            </article>

            <article className="dashboard-card completion-card">
              <p className="eyebrow">{t('profile_strength')}</p>
              <div className="completion-value">{profileCompletion(profile)}%</div>
              <p className="muted">{t('profile_strength_description')}</p>
              <progress value={profileCompletion(profile)} max="100" aria-label={t('profile_strength')} />
            </article>
          </div>

          <article className="dashboard-card next-step">
            <div>
              <p className="eyebrow">{profile.isPublished ? t('next_step') : t('ready_to_publish')}</p>
              <h2>{profile.isPublished ? t('published_next_title') : t('draft_next_title')}</h2>
              <p className="muted">{profile.isPublished ? t('published_next_description') : t('draft_next_description')}</p>
            </div>
            <a className="btn" href="#/edit">{profile.isPublished ? t('update_profile') : t('complete_profile')}</a>
          </article>

          <article className="dashboard-card resume-dashboard">
            <div className="dashboard-card-heading">
              <div><p className="eyebrow">{t('resume_builder')}</p><h2>{t('resume_manage_title')}</h2><p className="muted">{t('resume_manage_description')}</p></div>
              <a className="btn" href="#/resume/new">{t('resume_build_button')}</a>
            </div>
            {resumes.length ? <ul className="resume-list">{resumes.map(resume => <li key={resume.id}>
              <div><strong>{resume.title}</strong><span className="muted small">{t(`template_${resume.template}`)}</span></div>
              <div className="actions">
                <a className="btn ghost sm" href={`#/resume/${resume.id}`}>{t('resume_edit')}</a>
                <button className="btn ghost sm" type="button" onClick={() => deleteResume(resume)}>{t('remove')}</button>
              </div>
            </li>)}</ul> : <p className="muted resume-empty">{t('resume_empty')}</p>}
          </article>

          <article className="dashboard-card account-dashboard">
            <div><p className="eyebrow">{t('settings_eyebrow')}</p><h2>{t('settings_title')}</h2><p className="muted">{t('settings_intro')}</p></div>
            <a className="btn ghost" href="#/settings">{t('settings_manage')}</a>
          </article>
        </>
      )}
    </section>
  );
}
