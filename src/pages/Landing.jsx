import { lazy, Suspense } from 'react';
import { useT } from '../App.jsx';
import { SAMPLE } from '../store.js';

const ProfileView = lazy(() => import('../components/ProfileView.jsx'));

export default function Landing() {
  const t = useT();
  return (
    <>
      <section className="hero grid-bg">
        <div className="wrap hero-in">
          <div>
            <h1>{t('hero_title')}</h1>
            <p className="lead">{t('hero_sub')}</p>
            <div className="actions">
              <a href="#/edit" className="btn">{t('cta_start')}</a>
              <a href="#/resume/new" className="btn resume-cta">{t('resume_build_button')}</a>
              <a href="#/u/demo" className="btn ghost">{t('cta_demo')}</a>
            </div>
          </div>
          <div className="frame">
            <Suspense fallback={<div className="skel-card" />}><ProfileView data={SAMPLE} /></Suspense>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <h2>{t('f_title')}</h2>
          <div className="cols">
            {[['f1_t', 'f1_d', '#426cf5'], ['f2_t', 'f2_d', '#0f9d78'], ['f3_t', 'f3_d', '#d98a0b']].map(([a, b, c]) =>
              <div className="cell" key={a} style={{ '--acc': c }}><h3>{t(a)}</h3><p className="muted">{t(b)}</p></div>)}
          </div>
        </div>
      </section>

      <section className="sec soft">
        <div className="wrap">
          <h2>{t('s_title')}</h2>
          <ol className="steps">{['s1', 's2', 's3'].map(s => <li key={s}>{t(s)}</li>)}</ol>
        </div>
      </section>
    </>
  );
}
