import { useCallback, useEffect, useState } from 'react';

export interface ResourceState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Something went wrong. Please try again.';
}

/**
 * Loads a resource for the signed-in session and exposes an explicit `reload`
 * so mutations can refresh the view without remounting the page.
 */
export function useResource<T>(loader: (accessToken: string) => Promise<T>, accessToken: string | null): ResourceState<T> {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null }>({
    key: '',
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let cancelled = false;
    void loader(accessToken)
      .then((data) => {
        if (!cancelled) {
          setState({ key: accessToken, data, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setState({ key: accessToken, data: null, error: toMessage(cause) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loader, accessToken, attempt]);

  const reload = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const settled = accessToken !== null && state.key === accessToken;
  return {
    data: settled ? state.data : null,
    error: settled ? state.error : null,
    loading: !settled,
    reload,
  };
}
