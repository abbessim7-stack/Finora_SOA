import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface RefreshValue {
  key: number;
  refresh: () => void;
}

const RefreshContext = createContext<RefreshValue>({ key: 0, refresh: () => undefined });

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState(0);
  const value = useMemo<RefreshValue>(() => ({ key, refresh: () => setKey((current) => current + 1) }), [key]);
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

export function useRefresh(): RefreshValue {
  return useContext(RefreshContext);
}
