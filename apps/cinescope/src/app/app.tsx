import { Navigate, Route, Routes } from 'react-router-dom';
import { BookingProvider } from '../booking/BookingContext';
import CheckoutPage from '../pages/CheckoutPage/CheckoutPage';
import ConfirmationPage from '../pages/ConfirmationPage/ConfirmationPage';
import MovieListPage from '../pages/MovieListPage/MovieListPage';
import SeatSelectionPage from '../pages/SeatSelectionPage/SeatSelectionPage';
import SummaryPage from '../pages/SummaryPage/SummaryPage';
import { RequireActiveBooking, RequirePaidBooking } from '../routing/guards';
import { ToastProvider } from '../toast/ToastContext';

export function App() {
  return (
    <ToastProvider>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<MovieListPage />} />
          <Route path="/screenings/:id/seats" element={<SeatSelectionPage />} />
          <Route
            path="/screenings/:id/summary"
            element={
              <RequireActiveBooking>
                <SummaryPage />
              </RequireActiveBooking>
            }
          />
          <Route
            path="/screenings/:id/checkout"
            element={
              <RequireActiveBooking>
                <CheckoutPage />
              </RequireActiveBooking>
            }
          />
          <Route
            path="/confirmation"
            element={
              <RequirePaidBooking>
                <ConfirmationPage />
              </RequirePaidBooking>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BookingProvider>
    </ToastProvider>
  );
}

export default App;
