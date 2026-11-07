import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useT } from '../App.jsx';
import { ACCENTS, blank, cleanSlug } from '../store.js';
import { announceProfileUpdate, api } from '../api.js';

const ProfileView = lazy(() => import('../components/ProfileView.jsx'));
const QrBox = lazy(() => import('../components/QrBox.jsx'));

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }

export default function Editor() {
  const t = useT();
  const [d, setD] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [crop, setCrop] = useState(null);
  const fileInput = useRef(null);
  const drag = useRef(null);
  const set = (k, v) => { setD(p => ({ ...p, [k]: v })); setDone(false); };

  const onImageSelected = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError(t('photo_type_error'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t('photo_size_error'));
      return;
    }
    try {
      const src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(t('photo_read_error')));
        reader.readAsDataURL(file);
      });
      const image = await new Promise((resolve, reject) => {
        const loaded = new Image();
        loaded.onload = () => resolve(loaded);
        loaded.onerror = () => reject(new Error(t('photo_read_error')));
        loaded.src = src;
      });
      setCrop({ image, zoom: 1, x: 0, y: 0 });
    } catch (err) {
      setError(err.message || t('photo_read_error'));
    }
  };

  const saveCrop = () => {
    if (!crop) return;
    const size = 240;
    const scale = Math.max(size / crop.image.naturalWidth, size / crop.image.naturalHeight) * crop.zoom;
    const cropSize = size / scale;
    const centerX = crop.image.naturalWidth / 2 - crop.x / scale;
    const centerY = crop.image.naturalHeight / 2 - crop.y / scale;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) {
      setError(t('photo_save_error'));
      return;
    }
    try {
      context.drawImage(crop.image,
        centerX - cropSize / 2, centerY - cropSize / 2, cropSize, cropSize,
        0, 0, canvas.width, canvas.height
      );
      set('avatar', canvas.toDataURL('image/jpeg', 0.86));
      setCrop(null);
      setError('');
    } catch {
      setError(t('photo_save_error'));
    }
  };

  const clampCropOffset = (offset, imageLength, zoom) => {
    const scale = Math.max(240 / crop.image.naturalWidth, 240 / crop.image.naturalHeight) * zoom;
    return Math.max((240 - imageLength * scale) / 2, Math.min((imageLength * scale - 240) / 2, offset));
  };

  useEffect(() => {
    let active = true;
    api.getMyProfile()
      .then(profile => {
        if (!active) return;
        setD(profile);
        setAuthenticated(true);
      })
      .catch(err => {
        if (!active) return;
        if (err.status !== 401) setError(err.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const setProj = (i, k, v) => set('projects', d.projects.map((p, j) => j === i ? { ...p, [k]: v } : p));
  const link = `${location.origin}${location.pathname}#/u/${d.slug}`;
  const onAuthSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (authMode === 'register') await api.register(email, password);
      else await api.login(email, password);
      announceProfileUpdate(await api.getMyProfile());
      location.hash = '#/dashboard';
    } catch (err) {
      setError(err.message);
    }
  };
  const saveDraft = async () => {
    setError('');
    setDone(false);
    try {
      const profile = await api.updateMyProfile(d);
      setD(profile);
      announceProfileUpdate(profile);
    } catch (err) {
      setError(err.message);
    }
  };
  const onPublish = async e => {
    e.preventDefault();
    setError('');
    try {
      const profile = await api.updateMyProfile(d);
      await api.publishMyProfile();
      setD({ ...profile, isPublished: true });
      announceProfileUpdate({ ...profile, isPublished: true });
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  };
  const onUnpublish = async () => {
    setError('');
    try {
      await api.unpublishMyProfile();
      setD(current => {
        const updated = { ...current, isPublished: false };
        announceProfileUpdate(updated);
        return updated;
      });
      setDone(false);
    } catch (err) {
      setError(err.message);
    }
  };
  const onLogout = async () => {
    setError('');
    try {
      await api.logout();
      setAuthenticated(false);
      setD(blank());
      setDone(false);
      announceProfileUpdate(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="wrap narrow sec" role="status">{t('loading')}</div>;

  if (!authenticated) {
    return (
      <div className="wrap narrow sec">
        <form className="auth-form" onSubmit={onAuthSubmit}>
          <h1>{authMode === 'login' ? t('login_title') : t('register_title')}</h1>
          <p className="muted">{authMode === 'login' ? t('login_description') : t('register_description')}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Field label={t('email')}><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
          <Field label={t('password')}><input type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength="8" value={password} onChange={e => setPassword(e.target.value)} required /></Field>
          <button className="btn" type="submit">{authMode === 'login' ? t('login') : t('register')}</button>
          <button className="link" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}>
            {authMode === 'login' ? t('need_account') : t('have_account')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="wrap ed">
      <form onSubmit={onPublish} className="ed-form">
        <div className="editor-heading">
          <div><h1>{t('ed_title')}</h1><p className="muted small">{t('saved')}</p></div>
          <button type="button" className="btn ghost sm" onClick={onLogout}>{t('logout')}</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}

        <fieldset><legend>{t('ed_basic')}</legend>
          <div className="photo-field">
            <button type="button" className="avatar avatar-upload" onClick={() => fileInput.current?.click()} aria-label={t('photo_upload')}>
              {d.avatar ? <img src={d.avatar} alt="" /> : (d.name || '?').split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase()}
            </button>
            <div>
              <button type="button" className="link" onClick={() => fileInput.current?.click()}>{t(d.avatar ? 'photo_change' : 'photo_upload')}</button>
              <p className="muted small">{t('photo_hint')}</p>
              <input ref={fileInput} className="visually-hidden" type="file" accept="image/*" onChange={onImageSelected} />
            </div>
          </div>
          <Field label={t('name')}><input value={d.name} onChange={e => set('name', e.target.value)} required /></Field>
          <Field label={t('role')}><input value={d.role} onChange={e => set('role', e.target.value)} /></Field>
          <Field label={t('bio')}><textarea rows="3" value={d.bio} onChange={e => set('bio', e.target.value)} /></Field>
          <div className="two">
            <Field label={t('email')}><input type="email" value={d.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label={t('phone')}><input type="tel" value={d.phone} onChange={e => set('phone', e.target.value)} /></Field>
            <Field label={t('whatsapp')}><input inputMode="numeric" value={d.whatsapp} onChange={e => set('whatsapp', e.target.value)} /></Field>
            <Field label={t('website')}><input type="text" inputMode="url" placeholder="https://example.com" value={d.website} onChange={e => set('website', e.target.value)} /></Field>
          </div>
          <Field label={t('skills')}><input value={d.skills} onChange={e => set('skills', e.target.value)} /></Field>
          <Field label={t('services')}><textarea rows="3" value={d.services} onChange={e => set('services', e.target.value)} /></Field>
        </fieldset>

        <fieldset><legend>{t('projects')}</legend>
          {d.projects.map((p, i) => (
            <div className="proj" key={i}>
              <input aria-label={t('p_title')} placeholder={t('p_title')} value={p.title} onChange={e => setProj(i, 'title', e.target.value)} />
              <input aria-label={t('p_desc')} placeholder={t('p_desc')} value={p.desc} onChange={e => setProj(i, 'desc', e.target.value)} />
              <input aria-label={t('p_url')} placeholder={t('p_url')} type="text" inputMode="url" value={p.url} onChange={e => setProj(i, 'url', e.target.value)} />
              <button type="button" className="link" onClick={() => set('projects', d.projects.filter((_, j) => j !== i))}>{t('remove')}</button>
            </div>
          ))}
          <button type="button" className="btn ghost sm" onClick={() => set('projects', [...d.projects, { title: '', desc: '', url: '' }])}>{t('add_project')}</button>
        </fieldset>

        <fieldset><legend>{t('design')}</legend>
          <div className="swatches">
            {Object.entries(ACCENTS).map(([k, c]) => <button type="button" key={k} aria-label={k} aria-pressed={d.accent === k} className={d.accent === k ? 'on' : ''} style={{ background: c }} onClick={() => set('accent', k)} />)}
          </div>
          <Field label={t('slug')}>
            <input value={d.slug} onChange={e => set('slug', cleanSlug(e.target.value))} required />
            <small className="muted">{t('slug_hint')}</small>
          </Field>
        </fieldset>

        <div className="actions editor-actions">
          <button className="btn ghost" type="button" onClick={saveDraft}>{t('save_draft')}</button>
          <button className="btn" type="submit">{t('publish')}</button>
          {d.isPublished && <button className="btn ghost" type="button" onClick={onUnpublish}>{t('unpublish')}</button>}
        </div>

        {done && <div className="done">
          <p>{t('published_at')}</p>
          <code>{link}</code>
          <div className="actions">
            <button type="button" className="btn ghost sm" onClick={e => { navigator.clipboard?.writeText(link); e.target.textContent = t('copied'); }}>{t('copy')}</button>
            <a className="btn ghost sm" href={`#/u/${d.slug}`}>{t('open')}</a>
          </div>
          <Suspense fallback={<div className="skel-qr" />}><QrBox url={link} label={t('dl_qr')} /></Suspense>
        </div>}
      </form>

      <aside className="ed-prev">
        <p className="muted small">{t('preview')}</p>
        <div className="frame"><Suspense fallback={<div className="skel-card" />}><ProfileView data={d} /></Suspense></div>
      </aside>
      {crop && <div className="crop-backdrop" role="presentation">
        <section className="crop-dialog" role="dialog" aria-modal="true" aria-labelledby="crop-title">
          <h2 id="crop-title">{t('photo_position_title')}</h2>
          <p className="muted">{t('photo_position_hint')}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div
            className="crop-viewport"
            onPointerDown={e => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, cropX: crop.x, cropY: crop.y };
            }}
            onPointerMove={e => {
              if (!drag.current || drag.current.pointerId !== e.pointerId) return;
              const scale = Math.max(240 / crop.image.naturalWidth, 240 / crop.image.naturalHeight) * crop.zoom;
              setCrop(current => ({
                ...current,
                x: Math.max((240 - crop.image.naturalWidth * scale) / 2, Math.min((crop.image.naturalWidth * scale - 240) / 2, drag.current.cropX + e.clientX - drag.current.x)),
                y: Math.max((240 - crop.image.naturalHeight * scale) / 2, Math.min((crop.image.naturalHeight * scale - 240) / 2, drag.current.cropY + e.clientY - drag.current.y))
              }));
            }}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
          >
            <img
              src={crop.image.src}
              alt=""
              draggable="false"
              style={{
                width: crop.image.naturalWidth * Math.max(240 / crop.image.naturalWidth, 240 / crop.image.naturalHeight) * crop.zoom,
                height: crop.image.naturalHeight * Math.max(240 / crop.image.naturalWidth, 240 / crop.image.naturalHeight) * crop.zoom,
                transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px))`
              }}
            />
            <span className="crop-circle" aria-hidden="true" />
          </div>
          <label className="crop-zoom">{t('photo_zoom')}
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={crop.zoom}
              onChange={e => {
                const zoom = Number(e.target.value);
                setCrop(current => ({
                  ...current,
                  zoom,
                  x: clampCropOffset(current.x, current.image.naturalWidth, zoom),
                  y: clampCropOffset(current.y, current.image.naturalHeight, zoom)
                }));
              }}
            />
          </label>
          <div className="actions crop-actions">
            <button type="button" className="btn ghost" onClick={() => setCrop(null)}>{t('cancel')}</button>
            {d.avatar && <button type="button" className="link" onClick={() => { set('avatar', ''); setCrop(null); }}>{t('photo_remove')}</button>}
            <button type="button" className="btn" onClick={saveCrop}>{t('photo_apply')}</button>
          </div>
        </section>
      </div>}
    </div>
  );
}
