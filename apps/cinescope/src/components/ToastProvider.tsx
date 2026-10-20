import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';

type ShowToast = (message: string) => void;

function noop() {
  // default context value; overridden by the provider
}

const ToastContext = createContext<ShowToast>(noop);

interface ToastState {
  message: string;
  key: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback<ShowToast>((message) => {
    setToast((prev) => ({ message, key: (prev?.key ?? 0) + 1 }));
  }, []);

  const handleClose = useCallback(() => setToast(null), []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Snackbar
          key={toast.key}
          open
          autoHideDuration={4000}
          onClose={handleClose}
          message={toast.message}
          data-testid="toast"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
