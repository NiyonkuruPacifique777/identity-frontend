import { lazy, Suspense, useEffect, useState, createContext, useContext } from 'react';
import { dict, LANGS } from './i18n.js';
import { api } from './api.js';

const Ctx = createContext({ lang: 'en' });
export const useT = () => { const { lang } = useContext(Ctx); return k => dict[lang]?.[k] ?? dict.en[k] ?? k; };

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Editor = lazy(() => import('./pages/Editor.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const PublicProfile = lazy(() => import('./pages/PublicProfile.jsx'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder.jsx'));
const AccountSettings = lazy(() => import('./pages/AccountSettings.jsx'));

const route = () => location.hash.replace(/^#/, '') || '/';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('identity.lang') || 'en');
  const [path, setPath] = useState(route());
  const [profile, setProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  useEffect(() => { const f = () => { setPath(route()); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  useEffect(() => { document.documentElement.lang = lang; localStorage.setItem('identity.lang', lang); }, [lang]);
  useEffect(() => {
    let active = true;
    const loadProfile = () => {
      api.getMyProfile()
        .then(value => {
          if (!active) return;
          setProfile(value);
          setProfileChecked(true);
        })
        .catch(() => {
          if (!active) return;
          setProfile(null);
          setProfileChecked(true);
        });
    };
    const onProfileUpdated = event => {
      if (event.detail !== undefined) {
        setProfile(event.detail);
        setProfileChecked(true);
      }
      else loadProfile();
    };
    loadProfile();
    addEventListener('identity:profile-updated', onProfileUpdated);
    return () => {
      active = false;
      removeEventListener('identity:profile-updated', onProfileUpdated);
    };
  }, []);

  const t = k => dict[lang][k] ?? k;
  let page = <Landing />;
  if (path.startsWith('/edit')) page = <Editor />;
  else if (path.startsWith('/dashboard')) page = <Dashboard />;
  else if (path.startsWith('/resume')) page = <ResumeBuilder id={path === '/resume/new' ? null : path.split('/')[2] || null} />;
  else if (path.startsWith('/settings')) page = <AccountSettings />;
  else if (path.startsWith('/u/')) page = <PublicProfile slug={path.slice(3)} />;

  return (
    <Ctx.Provider value={{ lang }}>
      <header className="bar">
        <div className="wrap bar-in">
          <a href="#/" className="logo"><span className="mark" />Identity</a>
          <nav className="bar-r">
            <div className="langs" role="group" aria-label="Language">
              {LANGS.map(([c, l]) => <button key={c} className={c === lang ? 'on' : ''} onClick={() => setLang(c)} aria-pressed={c === lang}>{l}</button>)}
            </div>
            {profile ? (
              <a href="#/settings" className="account-link" title={t('settings_title')}>
                <span className="account-avatar" aria-hidden="true">
                  {profile.avatar
                    ? <img src={profile.avatar} alt="" />
                    : (profile.name || t('your_profile')).trim().charAt(0).toUpperCase()}
                </span>
                <span className="account-name">{profile.name || t('your_profile')}</span>
              </a>
            ) : profileChecked ? (
              <>
                <a href="#/edit" className="btn ghost sm">{t('login')}</a>
                <a href="#/edit" className="btn sm">{t('nav_start')}</a>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main>
        <Suspense fallback={<div className="wrap skel-page"><i /><i /><i /></div>}>{page}</Suspense>
      </main>
      <footer className="foot"><div className="wrap">© {new Date().getFullYear()} Identity · {t('footer')}</div></footer>
    </Ctx.Provider>
  );
}
