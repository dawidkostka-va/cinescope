import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../lib/toast';
import CheckoutPage from '../pages/CheckoutPage';
import ConfirmationPage from '../pages/ConfirmationPage';
import MovieListPage from '../pages/MovieListPage';
import SeatSelectionPage from '../pages/SeatSelectionPage';
import SummaryPage from '../pages/SummaryPage';

export function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<MovieListPage />} />
        <Route path="/screenings/:id/seats" element={<SeatSelectionPage />} />
        <Route path="/screenings/:id/summary" element={<SummaryPage />} />
        <Route path="/screenings/:id/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
