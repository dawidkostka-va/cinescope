import { useState } from 'react';

/**
 * Snapshots a guard predicate once, at the moment this hook first runs (i.e. when the
 * route is entered). Later changes to the booking while the customer stays on the screen
 * must not trigger a redirect.
 */
export function useBookingGuard(predicate: () => boolean): boolean {
  const [allowed] = useState(predicate);
  return allowed;
}
