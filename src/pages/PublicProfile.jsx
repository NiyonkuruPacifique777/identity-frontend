import { useEffect, useState } from 'react';
import { useT } from '../App.jsx';
import { SAMPLE } from '../store.js';
import { api } from '../api.js';
import ProfileView from '../components/ProfileView.jsx';

export default function PublicProfile({ slug }) {
  const t = useT();
  const [data, setData] = useState(slug === 'demo' ? SAMPLE : null);
  const [loading, setLoading] = useState(slug !== 'demo');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (slug === 'demo') {
      setData(SAMPLE);
      setError('');
      setLoading(false);
      return () => { active = false; };
    }
    setData(null);
    setError('');
    setLoading(true);
    api.getPublicProfile(slug)
      .then(profile => { if (active) setData(profile); })
      .catch(err => {
        if (!active) return;
        setData(null);
        if (err.status !== 404) setError(err.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);
  useEffect(() => { if (data) document.title = `${data.name} · ${data.role}`; return () => { document.title = 'Identity'; }; }, [data]);
  if (loading) return <div className="wrap narrow sec" role="status">{t('loading')}</div>;
  if (error) return <div className="wrap narrow sec"><h1>{t('load_error')}</h1><p className="form-error" role="alert">{error}</p><a className="btn" href="#/">{t('back')}</a></div>;
  if (!data) return <div className="wrap narrow sec"><h1>{t('not_found')}</h1><p className="muted">{t('not_found_d')}</p><a className="btn" href="#/">{t('back')}</a></div>;
  return <div className="wrap narrow sec grid-bg-soft"><ProfileView data={data} /></div>;
}
