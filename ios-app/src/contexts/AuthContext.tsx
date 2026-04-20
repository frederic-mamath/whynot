import { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getToken, setToken, removeToken } from "@/lib/auth";

export type AuthUser = {
  id: number;
  email: string;
  isVerified: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) setHasToken(true);
    setIsInitializing(false);
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: hasToken && !isInitializing,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser({
        id: meQuery.data.id,
        email: meQuery.data.email,
        isVerified: meQuery.data.isVerified,
      });
    }
    if (meQuery.isError) {
      removeToken();
      setHasToken(false);
    }
  }, [meQuery.data, meQuery.isError]);

  const isLoading =
    isInitializing || (hasToken && (meQuery.isLoading || meQuery.isFetching));

  const login = async (token: string, loginUser: AuthUser) => {
    await setToken(token);
    setHasToken(true);
    setUser(loginUser);
  };

  const logout = async () => {
    await removeToken();
    setHasToken(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
