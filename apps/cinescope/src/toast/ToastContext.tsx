import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {
  // no-op default, replaced by the provider
});

interface ToastState {
  message: string;
  id: number;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback<ShowToast>((message) => {
    setToast({ message, id: Date.now() });
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Snackbar
        key={toast?.id}
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast?.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ content: { 'data-testid': 'toast' } as object }}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
