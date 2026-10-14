import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BookingProvider } from '../context/BookingContext';
import { ToastProvider } from '../context/ToastContext';
import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <ToastProvider>
            <BookingProvider>
              <App />
            </BookingProvider>
          </ToastProvider>
        </BrowserRouter>
      </LocalizationProvider>,
    );
    expect(baseElement).toBeTruthy();
  });
});
