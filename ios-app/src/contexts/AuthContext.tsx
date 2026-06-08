/* eslint-disable @typescript-eslint/no-floating-promises -- TODO: removed by ticket-006 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-react-native";
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
  const posthog = usePostHog();
  const identifiedWithRoleRef = useRef<number | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) setHasToken(true);
    setIsInitializing(false);
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: hasToken && !isInitializing,
    retry: false,
  });

  const rolesQuery = trpc.role.myRoles.useQuery(undefined, {
    enabled: !!user,
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

  // Identify the user in PostHog as soon as their role is known.
  // Identify is idempotent — calling it again on cold start just updates properties.
  useEffect(() => {
    if (!posthog || !user || !rolesQuery.data) return;
    if (identifiedWithRoleRef.current === user.id) return;
    const role = rolesQuery.data.roles.includes("SELLER") ? "SELLER" : "BUYER";
    posthog.identify(user.id.toString(), { role });
    identifiedWithRoleRef.current = user.id;
  }, [posthog, user, rolesQuery.data]);

  const isLoading =
    isInitializing || (hasToken && (meQuery.isLoading || meQuery.isFetching));

  const login = async (token: string, loginUser: AuthUser) => {
    await setToken(token);
    setHasToken(true);
    setUser(loginUser);
    // Identify immediately with the userId. The role property will be added
    // by the useEffect above once role.myRoles resolves.
    posthog?.identify(loginUser.id.toString());
  };

  const logout = async () => {
    await removeToken();
    setHasToken(false);
    setUser(null);
    identifiedWithRoleRef.current = null;
    posthog?.reset();
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
