import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/ToastProvider';
import { MovieListPage } from '../pages/MovieList/MovieListPage';
import { SeatMapPage } from '../pages/SeatMap/SeatMapPage';
import { SummaryPage } from '../pages/Summary/SummaryPage';
import { CheckoutPage } from '../pages/Checkout/CheckoutPage';
import { ConfirmationPage } from '../pages/Confirmation/ConfirmationPage';

export function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<MovieListPage />} />
        <Route path="/screenings/:id/seats" element={<SeatMapPage />} />
        <Route path="/screenings/:id/summary" element={<SummaryPage />} />
        <Route path="/screenings/:id/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
