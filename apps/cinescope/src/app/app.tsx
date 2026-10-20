import { Navigate, Route, Routes } from 'react-router-dom';
import { BookingProvider } from '../booking/BookingContext';
import { ToastProvider } from '../toast/ToastContext';
import { MovieListPage } from '../pages/movie-list/MovieListPage';
import { SeatSelectionPage } from '../pages/seat-selection/SeatSelectionPage';
import { SummaryPage } from '../pages/summary/SummaryPage';
import { CheckoutPage } from '../pages/checkout/CheckoutPage';
import { ConfirmationPage } from '../pages/confirmation/ConfirmationPage';

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
