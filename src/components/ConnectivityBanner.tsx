import React, { useEffect, useState } from 'react';

const ConnectivityBanner: React.FC = () => {
  const [status, setStatus] = useState<'ok' | 'degraded' | 'down'>('ok');
  const [message, setMessage] = useState<string>('');

  const check = async () => {
    try {
      const res = await fetch('/health');
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json().catch(() => ({}));
      if (json?.status === 'ok' || json?.status === 'healthy') {
        setStatus('ok');
        setMessage('All systems operational');
      } else {
        setStatus('degraded');
        setMessage('Service degraded');
      }
    } catch (e) {
      setStatus('down');
      setMessage('Cannot reach backend');
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  if (status === 'ok') return null;

  return (
    <div className={`w-full text-center text-sm py-2 ${status === 'down' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'}`}>
      {message}
    </div>
  );
};

export default ConnectivityBanner;
