import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback<ShowToast>((text) => {
    setMessage(text);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Snackbar
        open={message !== null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" data-testid="toast" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
