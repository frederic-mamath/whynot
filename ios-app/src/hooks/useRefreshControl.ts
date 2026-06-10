import { useState, useCallback } from "react";

type Query = {
  refetch: () => Promise<unknown>;
};

export function useRefreshControl(query: Query) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [query]);

  return { refreshing, onRefresh };
}
