import TextField from '@mui/material/TextField';
import type { ReactNode } from 'react';

interface FormTextFieldProps {
  label: string;
  labelTestId: string;
  inputTestId: string;
  errorTestId: string;
  value: string;
  error?: string;
  showError: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function FormTextField({
  label,
  labelTestId,
  inputTestId,
  errorTestId,
  value,
  error,
  showError,
  onChange,
  onBlur,
}: FormTextFieldProps): ReactNode {
  return (
    <TextField
      label={<span data-testid={labelTestId}>{label}</span>}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      error={showError && !!error}
      helperText={showError && error ? <span data-testid={errorTestId}>{error}</span> : undefined}
      slotProps={{ htmlInput: { 'data-testid': inputTestId } }}
      fullWidth
    />
  );
}
