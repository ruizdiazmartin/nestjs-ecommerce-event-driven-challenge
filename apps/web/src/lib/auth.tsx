import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getProfile, login, normalizeApiError, register } from './api';
import type { UserProfile } from './types';

type AuthContextValue = {
  token: string | null;
  user: UserProfile | null;
  initializing: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isMerchant: boolean;
  isCustomer: boolean;
};

const TOKEN_KEY = 'challenge_access_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function hasRole(user: UserProfile | null, roleName: string): boolean {
  return !!user?.roles?.some((role) => role.name === roleName);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return window.localStorage.getItem(TOKEN_KEY);
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const profile = await getProfile(token);
      setUser(profile);
    } catch {
      clearSession();
    }
  }, [clearSession, token]);

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      if (!token) {
        if (!ignore) {
          setUser(null);
          setInitializing(false);
        }
        return;
      }

      try {
        const profile = await getProfile(token);
        if (!ignore) {
          setUser(profile);
        }
      } catch {
        if (!ignore) {
          clearSession();
        }
      } finally {
        if (!ignore) {
          setInitializing(false);
        }
      }
    }

    void bootstrap();

    return () => {
      ignore = true;
    };
  }, [clearSession, token]);

  const loginUser = useCallback(async (email: string, password: string) => {
    const auth = await login(email, password);
    window.localStorage.setItem(TOKEN_KEY, auth.accessToken);
    setToken(auth.accessToken);

    try {
      const profile = await getProfile(auth.accessToken);
      setUser(profile);
    } catch (error) {
      clearSession();
      throw normalizeApiError(error);
    }
  }, [clearSession]);

  const registerUser = useCallback(
    async (email: string, password: string) => {
      await register(email, password);
      await loginUser(email, password);
    },
    [loginUser],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      initializing,
      loginUser,
      registerUser,
      logout,
      refreshProfile,
      isAdmin: hasRole(user, 'Admin'),
      isMerchant: hasRole(user, 'Merchant'),
      isCustomer: hasRole(user, 'Customer'),
    }),
    [
      initializing,
      loginUser,
      logout,
      refreshProfile,
      registerUser,
      token,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
