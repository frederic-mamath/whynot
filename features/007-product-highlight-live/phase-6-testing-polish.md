# Phase 6: Testing & Polish

**Status**: 🔲 Not Started  
**Estimated Time**: 1-2 hours  
**Dependencies**: Phases 1-5 complete

---

## Objective

Thoroughly test the product highlighting feature across all user flows, fix bugs, and polish the UX.

---

## Testing Scenarios

### Scenario 1: SELLER Highlights Product (15 min)

**Steps**:
1. Login as SELLER user
2. Create or join a channel as host
3. Associate at least 2 products to the channel
4. Open "Promoted Products" panel
5. Click "Highlight" on Product A
6. Verify:
   - [ ] Product A shows "Currently Highlighted" badge
   - [ ] Product A has highlighted styling (border-primary, bg-primary/5)
   - [ ] "Highlight" button changes to "Unhighlight"
   - [ ] Other products' "Highlight" buttons are disabled
   - [ ] Success toast appears
   - [ ] HighlightedProduct component appears below chat input
   - [ ] Sparkles button appears in VerticalControlPanel with badge "1"

---

### Scenario 2: SELLER Switches Highlighted Product (10 min)

**Steps**:
1. With Product A highlighted (from Scenario 1)
2. Click "Unhighlight" on Product A
3. Verify:
   - [ ] Product A styling returns to normal
   - [ ] "Unhighlight" button changes back to "Highlight"
   - [ ] HighlightedProduct component disappears
   - [ ] Sparkles button disappears
4. Click "Highlight" on Product B
5. Verify:
   - [ ] Product B is now highlighted
   - [ ] HighlightedProduct component shows Product B
   - [ ] Transition is smooth

---

### Scenario 3: BUYER Receives Highlight in Real-time (15 min)

**Setup**: Open two browser windows (SELLER + BUYER)

**Steps**:
1. SELLER highlights Product A
2. In BUYER window, verify:
   - [ ] HighlightedProduct component appears immediately (< 500ms)
   - [ ] Toast notification appears: "🌟 New Product Highlighted"
   - [ ] Sparkles button appears with badge "1"
   - [ ] Product details are correct (name, price, image, description)
3. SELLER unhighlights Product A
4. In BUYER window, verify:
   - [ ] HighlightedProduct component disappears
   - [ ] Toast notification appears: "Highlight removed"
   - [ ] Sparkles button disappears

---

### Scenario 4: BUYER Joins Mid-Highlight (10 min)

**Steps**:
1. SELLER highlights Product A
2. BUYER opens channel (fresh page load)
3. Verify:
   - [ ] HighlightedProduct component appears immediately on load
   - [ ] Product A details are displayed
   - [ ] Sparkles button appears
   - [ ] No toast notification (only show for real-time updates)

---

### Scenario 5: BUYER Toggles Visibility (10 min)

**Steps**:
1. With Product A highlighted
2. BUYER clicks Sparkles button
3. Verify:
   - [ ] HighlightedProduct component hides
   - [ ] Sparkles button remains visible
4. BUYER clicks Sparkles button again
5. Verify:
   - [ ] HighlightedProduct component shows again
6. BUYER clicks "X" (close) button on HighlightedProduct
7. Verify:
   - [ ] Component hides (same as toggling)

---

### Scenario 6: BUYER Clicks Product for Details (10 min)

**Steps**:
1. With Product A highlighted
2. BUYER clicks on HighlightedProduct (anywhere in the card)
3. Verify:
   - [ ] ProductDetailsSheet opens from the right
   - [ ] Full product details shown (name, price, description, image)
   - [ ] Sheet has proper styling (theme-compatible)
4. BUYER closes sheet
5. Verify:
   - [ ] Sheet closes smoothly
   - [ ] HighlightedProduct component still visible

---

### Scenario 7: Multi-User Synchronization (15 min)

**Setup**: 3 browser windows (SELLER + BUYER1 + BUYER2)

**Steps**:
1. SELLER highlights Product A
2. Verify all windows show Product A immediately
3. SELLER unhighlights Product A
4. Verify all windows remove highlight immediately
5. SELLER highlights Product B
6. Verify all windows show Product B immediately
7. Test with one BUYER toggling visibility:
   - [ ] Other users unaffected (local state only)

---

### Scenario 8: Permissions Enforcement (10 min)

**Steps**:
1. Login as BUYER user
2. Join a channel as viewer
3. Open "Promoted Products" panel
4. Verify:
   - [ ] No "Highlight" or "Unhighlight" buttons visible
   - [ ] Can see highlighted product (if SELLER highlights one)
   - [ ] Can toggle visibility via Sparkles button
5. Attempt direct tRPC call (dev tools):
   ```js
   trpcClient.channel.highlightProduct.mutate({channelId: 1, productId: 1})
   ```
6. Verify:
   - [ ] Backend returns 403 Forbidden error

---

### Scenario 9: WebSocket Reconnection (10 min)

**Steps**:
1. SELLER highlights Product A
2. BUYER sees Product A
3. Simulate disconnect (pause network in dev tools, or stop server briefly)
4. SELLER highlights Product B (while BUYER is disconnected)
5. BUYER reconnects
6. Verify:
   - [ ] BUYER sees Product B (not Product A)
   - [ ] State syncs correctly on reconnect

---

### Scenario 10: Edge Cases (15 min)

**Test Cases**:
- [ ] Highlight product with no image (placeholder shows)
- [ ] Highlight product with very long name (truncated)
- [ ] Highlight product with very long description (line-clamp works)
- [ ] Unhighlight when no product is highlighted (error handling)
- [ ] Highlight non-existent product (backend validation)
- [ ] Highlight product not promoted to channel (backend validation)
- [ ] Two SELLERs in same channel (only host can highlight)
- [ ] SELLER leaves channel while product highlighted (state persists)

---

### Scenario 11: Theme Compatibility (10 min)

**Steps**:
1. Highlight a product in light mode
2. Verify:
   - [ ] HighlightedProduct component styling correct
   - [ ] PromotedProducts highlighted item styling correct
   - [ ] ProductDetailsSheet styling correct
   - [ ] Sparkles button styling correct
3. Switch to dark mode
4. Verify:
   - [ ] All components adapt to dark theme
   - [ ] No contrast issues
   - [ ] Border colors visible

---

### Scenario 12: Responsive Design (15 min)

**Devices to test**:
- [ ] Mobile (375px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1920px width)

**Check**:
- [ ] HighlightedProduct component fits screen
- [ ] Image sizes adjust responsively
- [ ] Text truncation works
- [ ] Buttons are touch-friendly (min 44px tap target)
- [ ] ProductDetailsSheet opens correctly on mobile
- [ ] Sparkles button not obscured by other controls
- [ ] Reserved auction space visible

---

## Performance Testing

- [ ] Initial load time with highlighted product (< 2s)
- [ ] WebSocket message delivery time (< 500ms)
- [ ] UI update time after message received (< 100ms)
- [ ] No memory leaks (test with 10+ highlight/unhighlight cycles)
- [ ] No WebSocket message duplication

---

## Polish Checklist

### Animations
- [ ] HighlightedProduct slides in smoothly (bottom → up)
- [ ] HighlightedProduct fades out smoothly
- [ ] Sparkles button appears with fade-in
- [ ] ProductDetailsSheet slides in from right
- [ ] Toast notifications animate properly

### Loading States
- [ ] "Highlight" button shows loading spinner during mutation
- [ ] "Unhighlight" button shows loading spinner during mutation
- [ ] Buttons disabled during loading (prevent double-click)

### Error Handling
- [ ] Network errors show toast with retry option
- [ ] Permission errors show clear message
- [ ] Validation errors show specific message
- [ ] WebSocket disconnect shows reconnecting indicator (optional)

### Accessibility
- [ ] All buttons have proper `title` attributes
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Screen reader announces highlight changes (aria-live)
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible

### UX Improvements
- [ ] Empty state when no products promoted (in PromotedProducts)
- [ ] Empty state when product is unhighlighted (hide component)
- [ ] Clear visual hierarchy in HighlightedProduct
- [ ] Consistent spacing and padding
- [ ] Smooth scrolling when product appears

---

## Bug Fixes (if found)

Document any bugs found during testing:

| Bug | Severity | Steps to Reproduce | Fix Status |
|-----|----------|-------------------|------------|
| _Example: Highlight doesn't clear on channel leave_ | High | 1. Highlight product<br>2. Leave channel<br>3. Return | ✅ Fixed |
| | | | |

---

## Acceptance Criteria

✅ All 12 testing scenarios pass  
✅ No critical bugs  
✅ WebSocket synchronization works reliably (< 500ms)  
✅ Permissions enforced (SELLER only can highlight)  
✅ Theme compatibility verified (light/dark)  
✅ Responsive design works on mobile/tablet/desktop  
✅ Animations smooth and performant  
✅ Loading states and error handling in place  
✅ Accessibility standards met  
✅ Performance benchmarks met  

---

## Final Steps

1. **Code Review**: Review all code for quality and consistency
2. **Documentation**: Update README or feature docs if needed
3. **Deployment**: Merge to main branch, deploy to staging
4. **User Testing**: Have 2-3 real users test the feature
5. **Monitor**: Watch logs for errors in first 24 hours
6. **Iterate**: Address any issues found in production

---

## Notes

- Use browser dev tools to simulate slow networks (3G)
- Test on real mobile devices, not just emulators
- Consider adding analytics tracking (PostHog) for future insights
- Document known limitations for future auction feature
- Keep phase files updated with actual time spent
