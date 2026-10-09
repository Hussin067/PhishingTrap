import { createContext, useContext, useMemo, useState } from "react";

const AdminContext = createContext(null);

const STORAGE_KEY = "adminIncludeSynthetic";

/**
 * Holds the "include synthetic demo data" switch for every admin page.
 * Default is ON because the only data in the database today is synthetic;
 * a banner on every page says so.
 */
export function AdminProvider({ email, children }) {
  const [includeSynthetic, setIncludeSyntheticState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const value = useMemo(
    () => ({
      email,
      includeSynthetic,
      setIncludeSynthetic: (next) => {
        setIncludeSyntheticState(next);
        try {
          sessionStorage.setItem(STORAGE_KEY, String(next));
        } catch {
          /* storage unavailable: keep in memory only */
        }
      },
    }),
    [email, includeSynthetic]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside AdminLayout");
  return context;
}
