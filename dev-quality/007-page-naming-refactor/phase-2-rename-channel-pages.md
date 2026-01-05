# Phase 2: Rename Channel Pages

## Objective

Rename all Channel-related pages to follow the `<Entity><Action>Page` naming convention.

## Files to Update

### Files to Rename:
- `client/src/pages/ChannelsPage.tsx` → `ChannelListPage.tsx`
- `client/src/pages/ChannelPage.tsx` → `ChannelDetailsPage.tsx`
- `client/src/pages/CreateChannelPage.tsx` → `ChannelCreatePage.tsx`

### Files to Modify:
- `client/src/App.tsx` (update imports and route components)

## Steps

1. **Navigate to pages directory**
   ```bash
   cd client/src/pages
   ```

2. **Rename files using git mv (preserves history)**
   ```bash
   git mv ChannelsPage.tsx ChannelListPage.tsx
   git mv ChannelPage.tsx ChannelDetailsPage.tsx
   git mv CreateChannelPage.tsx ChannelCreatePage.tsx
   ```

3. **Update component export names**
   - In `ChannelListPage.tsx`: Change `export default function ChannelsPage()` to `export default function ChannelListPage()`
   - In `ChannelDetailsPage.tsx`: Change `export default function ChannelPage()` to `export default function ChannelDetailsPage()`
   - In `ChannelCreatePage.tsx`: Change `export default function CreateChannelPage()` to `export default function ChannelCreatePage()`

4. **Update imports in App.tsx**
   ```typescript
   // Old imports
   import ChannelsPage from "./pages/ChannelsPage";
   import ChannelPage from "./pages/ChannelPage";
   import CreateChannelPage from "./pages/CreateChannelPage";
   
   // New imports
   import ChannelListPage from "./pages/ChannelListPage";
   import ChannelDetailsPage from "./pages/ChannelDetailsPage";
   import ChannelCreatePage from "./pages/ChannelCreatePage";
   ```

5. **Update route components in App.tsx**
   ```typescript
   // Update component references in routes
   <Route path="/channels" element={<ChannelListPage />} />
   <Route path="/channel/:channelId" element={<ChannelDetailsPage />} />
   <Route path="/create-channel" element={<ProtectedRoute requireRole="SELLER"><ChannelCreatePage /></ProtectedRoute>} />
   ```

6. **Search for any other references**
   ```bash
   grep -r "ChannelsPage\|ChannelPage\|CreateChannelPage" client/src --include="*.tsx" --include="*.ts"
   ```

7. **Test the changes**
   - Build: `npm run build`
   - Manually test routes:
     - `/channels` 
     - `/channel/:id`
     - `/create-channel`

## Design Considerations

- Use `git mv` instead of regular `mv` to preserve Git history
- Update component export names to match file names for consistency
- Keep route paths unchanged (only internal naming changes)

## Acceptance Criteria

- [x] All 3 channel pages renamed using `git mv`
- [x] Component export names updated in each file
- [x] All imports in App.tsx updated
- [x] No other references to old names in codebase
- [x] `npm run build` succeeds without errors
- [ ] Route `/channels` loads correctly
- [ ] Route `/channel/:id` loads correctly
- [ ] Route `/create-channel` loads correctly
- [ ] Navigation from navbar works

## Status

⏳ IN PROGRESS - Files renamed, build successful, ready for manual testing

## Notes

- Phase 1 (ARCHITECTURE.md update) is already complete (✅)
- This is the first code refactoring phase
- Keep changes focused on Channel pages only
