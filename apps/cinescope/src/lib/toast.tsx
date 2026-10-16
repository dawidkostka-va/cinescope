import Snackbar from '@mui/material/Snackbar';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);

  const showToast = useCallback((next: string) => {
    setMessage(next);
    setToastKey((key) => key + 1);
  }, []);

  const handleClose = useCallback((_event: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setMessage(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        key={toastKey}
        open={message !== null}
        autoHideDuration={4000}
        onClose={handleClose}
        message={<span data-testid="toast">{message}</span>}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
