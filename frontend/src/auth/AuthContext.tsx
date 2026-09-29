import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api } from '../api/client';
import type { ApiClient, LoginCredentials, Role, User } from '../api/types';

export const SESSION_STORAGE_KEY = 'agentic-hrms.session';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  client: ApiClient;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  can: (allowed: readonly Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'accessToken' in parsed) {
      const token = (parsed as { accessToken: unknown }).accessToken;
      return typeof token === 'string' ? token : null;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredToken(accessToken: string | null): void {
  try {
    if (accessToken) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken }));
    } else {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    return;
  }
}

export interface AuthProviderProps {
  children: ReactNode;
  client?: ApiClient;
}

export function AuthProvider({ children, client = api }: AuthProviderProps) {
  const storedToken = useMemo(() => readStoredToken(), []);
  const [status, setStatus] = useState<AuthStatus>(storedToken ? 'loading' : 'anonymous');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (!storedToken) {
      return;
    }
    let cancelled = false;
    void client
      .me(storedToken)
      .then((restoredUser) => {
        if (cancelled) {
          return;
        }
        setUser(restoredUser);
        setAccessToken(storedToken);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        writeStoredToken(null);
        setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, [client, storedToken]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const session = await client.login(credentials);
      writeStoredToken(session.accessToken);
      setUser(session.user);
      setAccessToken(session.accessToken);
      setStatus('authenticated');
      return session.user;
    },
    [client],
  );

  const logout = useCallback(() => {
    writeStoredToken(null);
    setUser(null);
    setAccessToken(null);
    setStatus('anonymous');
  }, []);

  const can = useCallback(
    (allowed: readonly Role[]) => (user ? allowed.includes(user.role) : false),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, accessToken, client, login, logout, can }),
    [status, user, accessToken, client, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
