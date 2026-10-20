export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Reservation {
  id: number;
  screeningId: number;
  seats: string[];
  customer: Customer;
  totalPrice: number;
}

export interface ReservationRequest {
  screeningId: number;
  seats: string[];
  customer: Customer;
  totalPrice: number;
}
