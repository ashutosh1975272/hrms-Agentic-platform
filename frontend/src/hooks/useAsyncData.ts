import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface SettledState<T> {
  key: string;
  data: T | null;
  error: string | null;
}

function toMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Something went wrong. Please try again.';
}

export function useAsyncData<T>(
  loader: (accessToken: string) => Promise<T>,
  accessToken: string | null,
): AsyncState<T> {
  const [state, setState] = useState<SettledState<T>>({ key: '', data: null, error: null });

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
  }, [loader, accessToken]);

  const settled = accessToken !== null && state.key === accessToken;
  return {
    data: settled ? state.data : null,
    error: settled ? state.error : null,
    loading: !settled,
  };
}
