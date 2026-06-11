import { useContext } from "react";
import { ErrorBannerContext } from "@/contexts/ErrorBannerContext";

export function useErrorBanner() {
  const ctx = useContext(ErrorBannerContext);
  if (ctx === null) {
    throw new Error(
      "useErrorBanner() must be used within an <ErrorBannerProvider>",
    );
  }
  return ctx;
}
