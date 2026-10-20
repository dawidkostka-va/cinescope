import { Navigate, Route, Routes } from 'react-router-dom';
import MovieList from '../pages/movie-list/movie-list';
import SeatSelection from '../pages/seat-selection/seat-selection';
import Summary from '../pages/summary/summary';
import Checkout from '../pages/checkout/checkout';
import Confirmation from '../pages/confirmation/confirmation';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MovieList />} />
      <Route path="/screenings/:id/seats" element={<SeatSelection />} />
      <Route path="/screenings/:id/summary" element={<Summary />} />
      <Route path="/screenings/:id/checkout" element={<Checkout />} />
      <Route path="/confirmation" element={<Confirmation />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
