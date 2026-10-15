import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../toast/ToastContext';
import { BookingProvider } from '../booking/BookingContext';
import { MovieListPage } from '../pages/MovieListPage/MovieListPage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage/SeatSelectionPage';
import { SummaryPage } from '../pages/SummaryPage/SummaryPage';
import { CheckoutPage } from '../pages/CheckoutPage/CheckoutPage';
import { ConfirmationPage } from '../pages/ConfirmationPage/ConfirmationPage';

export function App() {
  return (
    <ToastProvider>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<MovieListPage />} />
          <Route path="/screenings/:id/seats" element={<SeatSelectionPage />} />
          <Route path="/screenings/:id/summary" element={<SummaryPage />} />
          <Route path="/screenings/:id/checkout" element={<CheckoutPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BookingProvider>
    </ToastProvider>
  );
}

export default App;
