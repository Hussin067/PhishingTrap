import { useCallback, useEffect, useState } from "react";

/**
 * Loads data for a page. `loading` is derived (the stored result belongs to a
 * different key), so there is no synchronous setState inside the effect.
 * `deps` must be a small array of primitives that identify the request.
 */
export function useAdminData(fetcher, deps) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const key = JSON.stringify([...deps, nonce]);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((error) => !cancelled && setState({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = state.key !== key;
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return {
    data: loading ? null : state.data,
    error: loading ? null : state.error,
    loading,
    reload,
  };
}
