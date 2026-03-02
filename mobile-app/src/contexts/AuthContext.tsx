import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { trpc } from "@/lib/trpc";
import { getToken, setToken, removeToken } from "@/lib/auth";

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = getToken();
        if (storedToken) {
          setTokenState(storedToken);
        }
      } catch {
        // Token read failed — continue as unauthenticated
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch current user when token changes
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser({ id: meQuery.data.id, email: meQuery.data.email });
    }
    if (meQuery.error) {
      // Token is invalid — clear it
      setUser(null);
      setTokenState(null);
      removeToken();
    }
  }, [meQuery.data, meQuery.error]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation.mutateAsync({ email, password });
      await setToken(result.token);
      setTokenState(result.token);
      setUser({ id: result.user.id, email: result.user.email });
    },
    [loginMutation],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const result = await registerMutation.mutateAsync({ email, password });
      await setToken(result.token);
      setTokenState(result.token);
      setUser({ id: result.user.id, email: result.user.email });
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    await removeToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
