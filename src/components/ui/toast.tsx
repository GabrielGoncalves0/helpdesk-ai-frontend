'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
        },
      }}
    />
  );
}

export { toast };
