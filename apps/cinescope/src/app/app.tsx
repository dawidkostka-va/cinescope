import { Navigate, Route, Routes } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MovieListPage } from '../pages/MovieListPage/MovieListPage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage/SeatSelectionPage';
import { SummaryPage } from '../pages/SummaryPage/SummaryPage';
import { CheckoutPage } from '../pages/CheckoutPage/CheckoutPage';
import { ConfirmationPage } from '../pages/ConfirmationPage/ConfirmationPage';

export function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Routes>
        <Route path="/" element={<MovieListPage />} />
        <Route path="/screenings/:screeningId/seats" element={<SeatSelectionPage />} />
        <Route path="/screenings/:screeningId/summary" element={<SummaryPage />} />
        <Route path="/screenings/:screeningId/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LocalizationProvider>
  );
}

export default App;
