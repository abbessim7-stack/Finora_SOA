import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { currentMonth } from './format';

interface MonthValue {
  month: string;
  setMonth: (month: string) => void;
}

const MonthContext = createContext<MonthValue | null>(null);
const KEY = 'finora.month';

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonthState] = useState<string>(() => {
    const stored = localStorage.getItem(KEY);
    return stored && /^\d{4}-\d{2}$/.test(stored) ? stored : currentMonth();
  });

  const value = useMemo<MonthValue>(
    () => ({
      month,
      setMonth(next) {
        localStorage.setItem(KEY, next);
        setMonthState(next);
      },
    }),
    [month],
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth(): MonthValue {
  const context = useContext(MonthContext);
  if (!context) throw new Error('useMonth doit être utilisé dans MonthProvider');
  return context;
}
