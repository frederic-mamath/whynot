import { useCallback } from "react";
import { confirm } from "@/lib/alerts";

type ConfirmOptions = {
  title: string;
  message: string;
  destructiveLabel?: string;
  cancelLabel?: string;
};

export function useConfirm(options: ConfirmOptions) {
  return useCallback(
    async (onConfirm: () => void) => {
      const ok = await confirm(options);
      if (ok) onConfirm();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.title, options.message, options.destructiveLabel, options.cancelLabel],
  );
}
