import { useEffect, useRef, useState } from 'react';
import { useT } from '../App.jsx';
import { api } from '../api.js';
import { ACCENTS } from '../store.js';

const templates = [
  'classic', 'modern', 'minimal', 'sidebar', 'compact', 'elegant', 'bold', 'creative',
  'executive', 'academic', 'professional', 'simple', 'contrast', 'timeline', 'editorial',
  'geometric', 'monochrome', 'coral', 'forest', 'outline'
];
const templateLayouts = {
  modern: 'split',
  sidebar: 'sidebar',
  creative: 'sidebar',
  executive: 'sidebar',
  academic: 'sidebar',
  timeline: 'timeline',
  geometric: 'split'
};
const colors = [
  '#426cf5', '#0f9d78', '#d98a0b', '#d6455d', '#1f2433',
  '#7c3aed', '#0891b2', '#ea580c', '#be123c', '#15803d',
  '#1d4ed8', '#9333ea', '#0f766e', '#b45309', '#4f46e5',
  '#334155', '#db2777', '#65a30d', '#0284c7', '#6b21a8'
];

function fromProfile(profile) {
  return {
    personal: {
      name: profile.name || '', role: profile.role || '', email: profile.email || '',
      phone: profile.phone || '', whatsapp: profile.whatsapp || '', location: '', website: profile.website || '',
      avatar: profile.avatar || '', summary: profile.bio || ''
    },
    experience: [],
    education: [],
    projects: (profile.projects || []).map(project => ({ title: project.title || '', description: project.desc || '', url: project.url || '' })),
    services: (profile.services || '').split('\n').map(item => item.trim()).filter(Boolean),
    skills: (profile.skills || '').split(/[,\n]/).map(name => name.trim()).filter(Boolean).map(name => ({ name, level: 3 })),
    languages: []
  };
}

function Field({ label, value, onChange, multiline = false, type = 'text' }) {
  return <label className="field"><span>{label}</span>{multiline
    ? <textarea rows="3" value={value} onChange={e => onChange(e.target.value)} />
    : <input type={type} value={value} onChange={e => onChange(e.target.value)} />}</label>;
}

function ResumePreview({ resume, title, template, color, t, previewRef }) {
  const { personal } = resume;
  const layout = templateLayouts[template] || 'standard';
  const identity = <header className="resume-paper-head">
    {personal.avatar && <img className="resume-photo" src={personal.avatar} alt="" />}
    <div>
      <h1>{personal.name || t('resume_your_name')}</h1>
      <p className="resume-role">{personal.role || title}</p>
      <p className="resume-contact">{[personal.email, personal.phone, personal.whatsapp, personal.location, personal.website].filter(Boolean).join(' · ')}</p>
    </div>
  </header>;
  const summary = personal.summary && <section className="resume-section-summary"><h2>{t('resume_summary')}</h2><p>{personal.summary}</p></section>;
  const experience = resume.experience.length > 0 && <section className="resume-section-experience"><h2>{t('resume_experience')}</h2>
    {resume.experience.map((item, i) => <div className="resume-entry" key={i}>
      <div className="resume-entry-head"><strong>{item.role || t('resume_role')}</strong><span>{[item.startDate, item.endDate].filter(Boolean).join(' – ')}</span></div>
      <p>{[item.company, item.location].filter(Boolean).join(' · ')}</p>
      {item.description && <p>{item.description}</p>}
    </div>)}
  </section>;
  const projects = resume.projects.length > 0 && <section className="resume-section-projects"><h2>{t('projects')}</h2>
    {resume.projects.map((item, i) => <div className="resume-entry" key={i}>
      <strong>{item.title}</strong><p>{item.description}</p>{item.url && <p>{item.url}</p>}
    </div>)}
  </section>;
  const services = resume.services.length > 0 && <section className="resume-section-services"><h2>{t('services')}</h2><ul className="resume-bullets">
    {resume.services.map((item, i) => <li key={i}>{item}</li>)}
  </ul></section>;
  const education = resume.education.length > 0 && <section className="resume-section-education"><h2>{t('resume_education')}</h2>
    {resume.education.map((item, i) => <div className="resume-entry" key={i}>
      <div className="resume-entry-head"><strong>{item.degree || t('resume_degree')}</strong><span>{[item.startDate, item.endDate].filter(Boolean).join(' – ')}</span></div>
      <p>{item.school}</p>{item.description && <p>{item.description}</p>}
    </div>)}
  </section>;
  const skills = resume.skills.length > 0 && <section className="resume-section-skills"><h2>{t('resume_skills')}</h2><ul className="resume-levels">
    {resume.skills.map((item, i) => <li key={i}><span>{item.name}</span><span className="level-bars" aria-label={`${item.level} / 4`}>{[1, 2, 3, 4].map(n => <i key={n} className={n <= item.level ? 'filled' : ''} />)}</span></li>)}
  </ul></section>;
  const languages = resume.languages.length > 0 && <section className="resume-section-languages"><h2>{t('resume_languages')}</h2><ul className="resume-levels">
    {resume.languages.map((item, i) => <li key={i}><span>{item.name}</span><span className="level-bars" aria-label={`${item.level} / 4`}>{[1, 2, 3, 4].map(n => <i key={n} className={n <= item.level ? 'filled' : ''} />)}</span></li>)}
  </ul></section>;
  return (
    <article ref={previewRef} className={`resume-paper template-${template} layout-${layout}`} style={{ '--resume-accent': color }}>
      {layout === 'sidebar' ? <>
        <aside className="resume-sidebar">
          {identity}
          <div className="resume-sidebar-sections">{skills}{languages}{services}</div>
        </aside>
        <main className="resume-main">{summary}{experience}{education}{projects}</main>
      </> : layout === 'split' ? <>
        {identity}
        <div className="resume-columns">
          <main className="resume-main">{summary}{experience}{projects}{education}</main>
          <aside className="resume-side-column">{skills}{languages}{services}</aside>
        </div>
      </> : layout === 'timeline' ? <>
        {identity}
        <main className="resume-timeline">{summary}{experience}{education}{projects}
          <div className="resume-timeline-bottom">{skills}{languages}{services}</div>
        </main>
      </> : <>
        {identity}{summary}{experience}{projects}{services}{education}{skills}{languages}
      </>}
    </article>
  );
}

export default function ResumeBuilder({ id }) {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [title, setTitle] = useState(t('resume_default_title'));
  const [template, setTemplate] = useState('classic');
  const [color, setColor] = useState(colors[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState('');
  const resumePreviewRef = useRef(null);
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    let active = true;
    const load = id
      ? api.getResume(id).then(value => {
        if (!active) return;
        setResume(value.resume);
        setTitle(value.title);
        setTemplate(value.template);
        setColor(value.color);
      })
      : api.getMyProfile().then(value => {
        if (!active) return;
        setProfile(value);
        setResume(fromProfile(value));
        setColor(ACCENTS[value.accent] || colors[0]);
      });
    load.catch(err => {
      if (!active) return;
      if (err.status === 401) {
        location.hash = '#/edit';
        return;
      }
      setError(err.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const updatePersonal = (key, value) => setResume(current => ({ ...current, personal: { ...current.personal, [key]: value } }));
  const updateEntry = (section, index, key, value) => setResume(current => ({
    ...current,
    [section]: current[section].map((entry, i) => i === index ? { ...entry, [key]: value } : entry)
  }));
  const addEntry = section => {
    const entry = section === 'experience'
      ? { role: '', company: '', location: '', startDate: '', endDate: '', description: '' }
      : section === 'education'
        ? { school: '', degree: '', startDate: '', endDate: '', description: '' }
        : section === 'projects'
          ? { title: '', description: '', url: '' }
          : section === 'services' ? '' : { name: '', level: section === 'skills' ? 3 : 1 };
    setResume(current => ({ ...current, [section]: [...current[section], entry] }));
  };
  const removeEntry = (section, index) => setResume(current => ({
    ...current,
    [section]: current[section].filter((_, i) => i !== index)
  }));

  const save = async () => {
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      const payload = { title, template, color, resume };
      const result = id ? await api.updateResume(id, payload) : await api.createResume(payload);
      setTitle(result.title);
      if (!id) location.hash = `#/resume/${result.id}`;
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const exportResume = async format => {
    setError('');
    setExporting(format);
    try {
      const { downloadResumePdf, downloadResumeWord } = await import('../resumeExport.js');
      const options = {
        element: resumePreviewRef.current,
        filename: resume.personal.name || title
      };
      if (format === 'pdf') await downloadResumePdf(options);
      else await downloadResumeWord(options);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting('');
    }
  };

  if (loading) return <div className="wrap narrow sec" role="status">{t('loading')}</div>;
  if (!resume) return <section className="wrap narrow sec"><p className="form-error" role="alert">{error}</p><a className="btn" href="#/dashboard">{t('dashboard_title')}</a></section>;

  const sections = [
    ['experience', t('resume_experience')], ['education', t('resume_education')],
    ['projects', t('projects')], ['services', t('services')],
    ['skills', t('resume_skills')], ['languages', t('resume_languages')]
  ];

  return <section className="wrap resume-builder">
    <div className="resume-toolbar">
      <div><p className="eyebrow">{t('resume_builder')}</p><h1>{t('resume_editor_title')}</h1></div>
      <div className="actions">
        <a className="btn ghost sm" href="#/dashboard">{t('dashboard_title')}</a>
        <details className="resume-download" ref={downloadMenuRef}>
          <summary className="btn ghost sm" aria-disabled={Boolean(exporting)} onClick={event => {
            if (exporting) event.preventDefault();
          }}>
            {exporting ? t('resume_exporting') : t('resume_download')}
            <span className="resume-download-chevron" aria-hidden="true" />
          </summary>
          <div className="resume-download-menu">
            <button type="button" role="menuitem" disabled={Boolean(exporting)} onClick={() => {
              downloadMenuRef.current.open = false;
              exportResume('pdf');
            }}>{t('resume_download_pdf')}</button>
            <button type="button" role="menuitem" disabled={Boolean(exporting)} onClick={() => {
              downloadMenuRef.current.open = false;
              exportResume('word');
            }}>{t('resume_download_word')}</button>
          </div>
        </details>
        <button className="btn sm" type="button" onClick={save} disabled={saving}>{saving ? t('loading') : t('resume_save')}</button>
      </div>
    </div>
    <p className="muted">{t('resume_seeded')} {profile?.name ? `(${profile.name})` : ''}</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {saved && <p className="resume-success" role="status">{t('resume_saved')}</p>}
    <div className="resume-layout">
      <div className="resume-controls">
        <fieldset><legend>{t('resume_design')}</legend>
          <Field label={t('resume_title')} value={title} onChange={setTitle} />
          <p className="field-label">{t('resume_templates')}</p>
          <div className="template-grid">{templates.map((name, index) =>
            <button type="button" key={name} className={`template-choice ${template === name ? 'selected' : ''}`} aria-pressed={template === name} onClick={() => setTemplate(name)}>
              <span className={`template-thumb template-${name} thumb-layout-${templateLayouts[name] || 'standard'}`} style={{ '--resume-accent': color }} aria-hidden="true">
                <i /><i /><i /><i />
              </span>
              <span>{index + 1}. {t(`template_${name}`)}</span>
            </button>)}</div>
          <p className="field-label">{t('resume_color')}</p>
          <div className="color-palette">{colors.map(value =>
            <button type="button" key={value} title={value} aria-label={`${t('resume_color')} ${value}`} aria-pressed={color === value} className={color === value ? 'selected' : ''} style={{ backgroundColor: value }} onClick={() => setColor(value)} />
          )}</div>
          <label className="field color-picker"><span>{t('resume_custom_color')}</span><input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
        </fieldset>

        <fieldset><legend>{t('resume_personal')}</legend>
          {[
            ['name', t('name')], ['role', t('role')], ['email', t('email')], ['phone', t('phone')], ['whatsapp', t('whatsapp')],
            ['location', t('resume_location')], ['website', t('website')]
          ].map(([key, label]) => <Field key={key} label={label} value={resume.personal[key]} onChange={value => updatePersonal(key, value)} />)}
          <Field label={t('resume_summary')} value={resume.personal.summary} onChange={value => updatePersonal('summary', value)} multiline />
        </fieldset>

        {sections.map(([section, label]) => <fieldset key={section}>
          <legend>{label}</legend>
          {resume[section].map((item, index) => <div className="resume-form-entry" key={index}>
            {section === 'experience' && <>
              <Field label={t('resume_role')} value={item.role} onChange={v => updateEntry(section, index, 'role', v)} />
              <Field label={t('resume_company')} value={item.company} onChange={v => updateEntry(section, index, 'company', v)} />
              <Field label={t('resume_location')} value={item.location} onChange={v => updateEntry(section, index, 'location', v)} />
              <div className="two">
                <Field label={t('resume_start')} value={item.startDate} onChange={v => updateEntry(section, index, 'startDate', v)} />
                <Field label={t('resume_end')} value={item.endDate} onChange={v => updateEntry(section, index, 'endDate', v)} />
              </div>
              <Field label={t('resume_description')} value={item.description} onChange={v => updateEntry(section, index, 'description', v)} multiline />
            </>}
            {section === 'projects' && <>
              <Field label={t('p_title')} value={item.title} onChange={v => updateEntry(section, index, 'title', v)} />
              <Field label={t('p_desc')} value={item.description} onChange={v => updateEntry(section, index, 'description', v)} multiline />
              <Field label={t('p_url')} value={item.url} onChange={v => updateEntry(section, index, 'url', v)} />
            </>}
            {section === 'services' && <Field label={t('services')} value={item} onChange={value => setResume(current => ({
              ...current, services: current.services.map((service, i) => i === index ? value : service)
            }))} />}
            {section === 'education' && <>
              <Field label={t('resume_school')} value={item.school} onChange={v => updateEntry(section, index, 'school', v)} />
              <Field label={t('resume_degree')} value={item.degree} onChange={v => updateEntry(section, index, 'degree', v)} />
              <div className="two">
                <Field label={t('resume_start')} value={item.startDate} onChange={v => updateEntry(section, index, 'startDate', v)} />
                <Field label={t('resume_end')} value={item.endDate} onChange={v => updateEntry(section, index, 'endDate', v)} />
              </div>
              <Field label={t('resume_description')} value={item.description} onChange={v => updateEntry(section, index, 'description', v)} multiline />
            </>}
            {['skills', 'languages'].includes(section) && <>
              <Field label={section === 'skills' ? t('resume_skill') : t('resume_language')} value={item.name} onChange={v => updateEntry(section, index, 'name', v)} />
              <label className="field"><span>{section === 'skills' ? t('resume_skill_level') : t('resume_language_level')}</span>
                <select value={item.level} onChange={e => updateEntry(section, index, 'level', Number(e.target.value))}>
                  {(section === 'skills'
                    ? [[1, t('resume_level_beginner')], [2, t('resume_level_intermediate')], [3, t('resume_level_advanced')], [4, t('resume_level_expert')]]
                    : [[1, t('resume_level_low')], [2, t('resume_level_conversational')], [3, t('resume_level_proficient')], [4, t('resume_level_native')]]
                  ).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                </select>
              </label>
            </>}
            <button type="button" className="link" onClick={() => removeEntry(section, index)}>{t('remove')}</button>
          </div>)}
          <button type="button" className="btn ghost sm" onClick={() => addEntry(section)}>{t('resume_add')} {label.toLowerCase()}</button>
        </fieldset>)}
      </div>
      <aside className="resume-preview-wrap"><p className="muted small">{t('preview')}</p>
        <ResumePreview previewRef={resumePreviewRef} resume={resume} title={title} template={template} color={color} t={t} />
      </aside>
    </div>
  </section>;
}
