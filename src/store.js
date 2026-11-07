export const ACCENTS = { blue: '#426cf5', emerald: '#0f9d78', amber: '#d98a0b', rose: '#d6455d', ink: '#1f2433' };

export const SAMPLE = {
  slug: 'pacifique', name: 'Pacifique Uwimana', role: 'Full Stack Developer', accent: 'blue',
  bio: 'I build reliable business software: ERP systems, e-commerce platforms and CRMs for growing companies in Kigali.',
  email: 'hello@example.com', phone: '+250788000000', whatsapp: '250788000000', website: 'https://example.com',
  skills: 'Node.js, PostgreSQL, React, Express, Python',
  services: 'Custom business software\nWebsite and e-commerce development\nSystem maintenance and support',
  projects: [
    { title: 'Company ERP', desc: 'Live ERP covering sales, stock and reporting.', url: '' },
    { title: 'E-commerce platform', desc: 'Online store with orders and payments.', url: '' }
  ]
};

export const blank = () => ({ slug: '', name: '', role: '', avatar: '', accent: 'blue', bio: '', email: '', phone: '', whatsapp: '', website: '', skills: '', services: '', projects: [] });
export const cleanSlug = s => s.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);

export function downloadVcf(d) {
  const v = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${d.name}`, `TITLE:${d.role}`, `TEL:${d.phone}`, `EMAIL:${d.email}`, `URL:${d.website}`, 'END:VCARD'].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([v], { type: 'text/vcard' }));
  a.download = (d.slug || 'contact') + '.vcf';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
