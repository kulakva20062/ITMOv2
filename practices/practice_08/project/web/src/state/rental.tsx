import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { calculateRental } from '@legacy/calc.js';

export type RentalEstimate = {
  carId: string;
  days: number;
  extras: string[];
  result: ReturnType<typeof calculateRental>;
};

export type RentalStore = {
  estimate: RentalEstimate | null;
  setEstimate: (next: RentalEstimate | null) => void;
  chosenCarId: string | null;
  chooseCar: (carId: string) => void;
  resetEstimate: () => void;
};

const RentalContext = createContext<RentalStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [estimate, setEstimate] = useState<RentalEstimate | null>(null);
  const [chosenCarId, setChosenCarId] = useState<string | null>(null);

  const chooseCar = useCallback((carId: string) => {
    setChosenCarId(carId);
    setEstimate(null);
  }, []);

  const resetEstimate = useCallback(() => {
    setEstimate(null);
  }, []);

  const value = useMemo(
    () => ({ estimate, setEstimate, chosenCarId, chooseCar, resetEstimate }),
    [estimate, chosenCarId, chooseCar, resetEstimate],
  );

  return <RentalContext.Provider value={value}>{children}</RentalContext.Provider>;
}

export function useRental() {
  const store = useContext(RentalContext);
  if (!store) {
    throw new Error('useRental должен вызываться внутри AppProvider.');
  }
  return store;
}
