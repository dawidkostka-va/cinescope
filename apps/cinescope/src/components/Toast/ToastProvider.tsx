import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const TOAST_DURATION_MS = 4000;

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = useCallback((next: string) => {
    setMessage(next);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={TOAST_DURATION_MS}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          data-testid="toast"
          onClose={handleClose}
          severity="info"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
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
