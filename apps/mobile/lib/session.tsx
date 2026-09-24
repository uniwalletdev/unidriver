import type { DriverAccount, RegisterDriverInput } from '@unidriver/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, devDriverToken } from './api';
import { getItem, removeItem, setItem } from './storage';

const DRIVER_ID_KEY = 'unidriver.driverId';

interface Session {
  /** False until the saved session has been checked on launch. */
  ready: boolean;
  token: string | null;
  account: DriverAccount | null;
  register: (input: RegisterDriverInput) => Promise<void>;
  /** Re-fetch the account, or apply one an action already returned. */
  refresh: (next?: DriverAccount) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

/**
 * Dev-mode session: registering mints a `dev:<id>:DRIVER` token and the id is kept in secure
 * storage. Swapping in Clerk Expo later only changes how `token` is produced.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<DriverAccount | null>(null);

  useEffect(() => {
    void (async () => {
      const id = await getItem(DRIVER_ID_KEY);
      if (id) {
        const t = devDriverToken(id);
        try {
          setAccount(await api.me(t));
          setToken(t);
        } catch (e) {
          // A stale id (account gone) signs out; a network error keeps the id for next launch.
          if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
            await removeItem(DRIVER_ID_KEY);
          }
        }
      }
      setReady(true);
    })();
  }, []);

  const register = useCallback(async (input: RegisterDriverInput) => {
    const created = await api.registerDriver(input);
    await setItem(DRIVER_ID_KEY, created.id);
    setToken(devDriverToken(created.id));
    setAccount(created);
  }, []);

  const refresh = useCallback(
    async (next?: DriverAccount) => {
      if (next) {
        setAccount(next);
      } else if (token) {
        setAccount(await api.me(token));
      }
    },
    [token],
  );

  const signOut = useCallback(async () => {
    await removeItem(DRIVER_ID_KEY);
    setToken(null);
    setAccount(null);
  }, []);

  const value = useMemo(
    () => ({ ready, token, account, register, refresh, signOut }),
    [ready, token, account, register, refresh, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return session;
}
