import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {
  /* no-op default */
});

const TOAST_DURATION_MS = 4000;

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);

  const showToast = useCallback<ShowToast>((message) => {
    setToast((prev) => ({ message, key: (prev?.key ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Snackbar
        open={toast !== null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" data-testid="toast">
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
