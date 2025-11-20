import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const ConnectivityBanner: React.FC = () => {
  const toastIdRef = useRef<string | number | null>(null);

  const check = async () => {
    try {
      const res = await fetch('/health');
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json().catch(() => ({}));

      if (json?.status === 'ok' || json?.status === 'healthy') {
        // If we had a toast showing, dismiss it or show success
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
          toast.success('System Recovered', {
            description: 'All systems are operational again.',
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            duration: 4000,
          });
        }
      }
    } catch (e) {
      // Down
      const message = 'Cannot reach backend services. Please check your connection.';
      if (!toastIdRef.current) {
        toastIdRef.current = toast.error('System Offline', {
          description: message,
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          duration: Infinity, // Persistent
          action: {
            label: 'Retry',
            onClick: () => check(),
          },
        });
      }
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  return null; // No visual component, just toasts
};

export default ConnectivityBanner;
