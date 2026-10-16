import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/Toast/ToastProvider';
import { MovieList } from '../pages/MovieList/MovieList';
import { SeatMap } from '../pages/SeatMap/SeatMap';
import { Summary } from '../pages/Summary/Summary';
import { Checkout } from '../pages/Checkout/Checkout';
import { Confirmation } from '../pages/Confirmation/Confirmation';

export function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<MovieList />} />
        <Route path="/screenings/:id/seats" element={<SeatMap />} />
        <Route path="/screenings/:id/summary" element={<Summary />} />
        <Route path="/screenings/:id/checkout" element={<Checkout />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
