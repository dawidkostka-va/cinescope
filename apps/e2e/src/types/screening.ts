export interface Screening {
  id: number;
  movieId: number;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm`, 24-hour. */
  time: string;
  /** Seat identifiers, `R<row>C<column>`. */
  occupiedSeats: string[];
}
