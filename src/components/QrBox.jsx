import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QrBox({ url, label }) {
  const [src, setSrc] = useState('');
  useEffect(() => { QRCode.toDataURL(url, { width: 320, margin: 2, color: { dark: '#1f2433', light: '#ffffff' } }).then(setSrc); }, [url]);
  if (!src) return <div className="skel-qr" />;
  return <div className="qr"><img src={src} alt="QR code" width="160" height="160" /><a className="btn ghost sm" href={src} download="qr.png">{label}</a></div>;
}
