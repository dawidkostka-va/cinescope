export interface ReservationCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ReservationRequest {
  screeningId: number;
  seats: string[];
  customer: ReservationCustomer;
  totalPrice: number;
}

export interface Reservation extends ReservationRequest {
  id: number;
}
