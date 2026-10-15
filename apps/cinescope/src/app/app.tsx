import { Navigate, Route, Routes } from 'react-router-dom';
import { BookingProvider } from '../booking/BookingContext';
import { ToastProvider } from '../components/Toast/ToastContext';
import Checkout from '../pages/Checkout/Checkout';
import Confirmation from '../pages/Confirmation/Confirmation';
import MovieList from '../pages/MovieList/MovieList';
import SeatMap from '../pages/SeatMap/SeatMap';
import Summary from '../pages/Summary/Summary';

export function App() {
  return (
    <ToastProvider>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<MovieList />} />
          <Route path="/screenings/:id/seats" element={<SeatMap />} />
          <Route path="/screenings/:id/summary" element={<Summary />} />
          <Route path="/screenings/:id/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BookingProvider>
    </ToastProvider>
  );
}

export default App;
