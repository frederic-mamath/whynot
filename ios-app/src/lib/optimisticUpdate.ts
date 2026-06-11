// Skip the post-mutation round-trip: patch the tRPC query cache immediately
// after a mutation succeeds, then invalidate in the background so the next
// fetch reconciles with the server.
//
// Convention from ios-app/CLAUDE.md — applies to every non-live-session
// mutation. The live screen (and useAgoraAudience) is the explicit exception:
// concurrent bidders mean the server is the source of truth there; never patch.
//
// Use the inline `setData` + `invalidate` pattern for queries that take an
// input filter (e.g., `product.list({ shopId })`). This helper covers the
// no-input case, which is the common one.

type Updater<TData> = (old: TData | undefined) => TData | undefined;

type NoInputQuery<TData> = {
  setData: (input: undefined, updater: Updater<TData>) => void;
  invalidate: () => Promise<void> | void;
};

export function optimisticUpdate<TData>(
  query: NoInputQuery<TData>,
  updater: Updater<TData>,
): void {
  query.setData(undefined, updater);
  void query.invalidate();
}

export function updateById<T extends { id: number | string }>(
  list: T[] | undefined,
  id: T["id"],
  patch: Partial<T>,
): T[] | undefined {
  return list?.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function removeById<T extends { id: number | string }>(
  list: T[] | undefined,
  id: T["id"],
): T[] | undefined {
  return list?.filter((item) => item.id !== id);
}
