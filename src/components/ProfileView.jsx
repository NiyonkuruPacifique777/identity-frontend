import { useState } from 'react';
import { useT } from '../App.jsx';
import { ACCENTS, downloadVcf } from '../store.js';

const list = s => (s || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean);

export default function ProfileView({ data }) {
  const t = useT();
  const [view, setView] = useState('card');
  const acc = ACCENTS[data.accent] || ACCENTS.blue;
  const initials = (data.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const skills = list(data.skills);
  const services = (data.services || '').split('\n').map(x => x.trim()).filter(Boolean);
  const wa = data.whatsapp ? `https://wa.me/${data.whatsapp.replace(/\D/g, '')}` : '';

  return (
    <article className="pv" style={{ '--acc': acc }}>
      <div className="pv-head">
        <div className="avatar">
          {data.avatar ? <img src={data.avatar} alt="" /> : initials}
        </div>
        <div>
          <h2>{data.name || '—'}</h2>
          <p className="muted">{data.role}</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {[['card', 'v_card'], ['portfolio', 'v_portfolio'], ['services', 'v_services']].map(([k, l]) =>
          <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{t(l)}</button>)}
      </div>

      <div className="pv-body">
        {view === 'card' && <>
          {data.bio && <p>{data.bio}</p>}
          <div className="actions">
            {data.email && <a className="btn ghost" href={`mailto:${data.email}`}>{t('email_btn')}</a>}
            {data.phone && <a className="btn ghost" href={`tel:${data.phone}`}>{t('call')}</a>}
            {wa && <a className="btn ghost" href={wa} target="_blank" rel="noopener noreferrer">{t('wa')}</a>}
            {data.website && <a className="btn ghost" href={data.website} target="_blank" rel="noopener noreferrer">{t('website')}</a>}
            <button className="btn acc" onClick={() => downloadVcf(data)}>{t('save_contact')}</button>
          </div>
        </>}

        {view === 'portfolio' && <>
          {skills.length > 0 && <section><h3>{t('skills_h')}</h3><ul className="chips">{skills.map(s => <li key={s}>{s}</li>)}</ul></section>}
          {data.projects?.length > 0 && <section><h3>{t('projects_h')}</h3>
            <ul className="projects">{data.projects.map((p, i) => <li key={i}>
              <strong>{p.title}</strong><span className="muted">{p.desc}</span>
              {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer">{t('visit')}</a>}
            </li>)}</ul></section>}
        </>}

        {view === 'services' && <>
          {services.length > 0 && <section><h3>{t('services_h')}</h3><ul className="svc">{services.map(s => <li key={s}>{s}</li>)}</ul></section>}
          <a className="btn acc" href={wa || (data.email ? `mailto:${data.email}` : '#')} target={wa ? '_blank' : undefined} rel="noopener noreferrer">{t('inquire')}</a>
        </>}
      </div>
    </article>
  );
}
