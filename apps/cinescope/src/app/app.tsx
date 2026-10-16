import { Navigate, Route, Routes } from 'react-router-dom';
import { BookingProvider } from './booking/BookingContext';
import { ToastProvider } from './components/Toast';
import MovieList from './routes/MovieList';
import SeatSelection from './routes/SeatSelection';
import Summary from './routes/Summary';
import Checkout from './routes/Checkout';
import Confirmation from './routes/Confirmation';

export function App() {
  return (
    <ToastProvider>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<MovieList />} />
          <Route path="/screenings/:id/seats" element={<SeatSelection />} />
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
