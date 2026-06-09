import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const AUTO_DISMISS_MS = 4000;

type BannerState = { id: string; message: string } | null;

type ErrorBannerContextValue = {
  current: BannerState;
  showError: (message: string) => void;
  clearError: () => void;
};

export const ErrorBannerContext =
  createContext<ErrorBannerContextValue | null>(null);

export function ErrorBannerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<BannerState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    cancelTimer();
    setCurrent(null);
  }, [cancelTimer]);

  const showError = useCallback(
    (message: string) => {
      cancelTimer();
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setCurrent({ id, message });
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setCurrent(null);
      }, AUTO_DISMISS_MS);
    },
    [cancelTimer],
  );

  useEffect(() => cancelTimer, [cancelTimer]);

  return (
    <ErrorBannerContext.Provider value={{ current, showError, clearError }}>
      {children}
    </ErrorBannerContext.Provider>
  );
}
