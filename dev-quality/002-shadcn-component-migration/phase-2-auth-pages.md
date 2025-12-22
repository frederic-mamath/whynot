# Phase 2: Migrate Authentication Pages

## Objective
Convert Login and Register pages to use Shadcn components (Input, Label, Card, Button) and Lucide icons, creating a polished authentication experience.

## Files to Update

1. `client/src/pages/Login.tsx`
2. `client/src/pages/Register.tsx`

## Steps

### 1. Update Login Page
- Replace native `<input>` with `<Input>` component
- Add `<Label>` for form fields
- Replace `<button>` with Shadcn `<Button>`
- Wrap form in `<Card>` component
- Add Lucide icons: `LogIn`, `Mail`, `Lock`
- Apply Tailwind layout utilities
- Use design tokens for all colors
- Add proper error state styling

### 2. Update Register Page
- Same changes as Login page
- Additional icon: `UserPlus`
- Ensure password confirmation field has proper validation
- Add visual feedback for password strength (optional enhancement)

### 3. Improve Layout
- Center cards on page with Tailwind utilities
- Add gradient background (optional)
- Ensure mobile responsiveness
- Add proper spacing between form fields

## Design Considerations

### Form Structure
```tsx
<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>Welcome Back</CardTitle>
    <CardDescription>Sign in to your account</CardDescription>
  </CardHeader>
  <CardContent>
    <form>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        {/* More fields... */}
        <Button className="w-full">
          <LogIn className="size-4 mr-2" />
          Sign In
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
```

### Icon Placement
- Email field: `Mail` icon (optional: inside input or next to label)
- Password field: `Lock` icon
- Submit button: `LogIn` or `UserPlus` icon before text

### Error States
- Use design token: `text-destructive`
- Show below relevant field
- Consider using Alert component (if added in Phase 1)

## Acceptance Criteria

### Login Page
- [ ] All `<input>` replaced with `<Input>`
- [ ] All fields have `<Label>` components
- [ ] Form button uses Shadcn `<Button>`
- [ ] Form wrapped in `<Card>` component
- [ ] Lucide icons added appropriately
- [ ] Error messages styled with design tokens
- [ ] Page is mobile responsive
- [ ] No TypeScript errors
- [ ] Login functionality still works

### Register Page
- [ ] Same criteria as Login page
- [ ] Password confirmation field included
- [ ] Register button has `UserPlus` icon
- [ ] Validation works correctly
- [ ] Registration functionality still works

### Both Pages
- [ ] Consistent styling between Login and Register
- [ ] Cards centered on page
- [ ] Proper spacing (4px increments)
- [ ] Links to switch between Login/Register work
- [ ] Focus states work correctly
- [ ] Keyboard navigation works

## Testing Checklist

- [ ] Can login with valid credentials
- [ ] Error shown for invalid credentials
- [ ] Can register new account
- [ ] Password validation works
- [ ] Link to switch pages works
- [ ] Forms work on mobile devices
- [ ] Tab navigation through form fields
- [ ] Enter key submits form

## Status
📝 **PLANNING** - Waiting for Phase 1 completion

## Estimated Time
2 hours (1 hour per page)

## Notes
- Don't change authentication logic - only UI
- Keep error handling exactly as it was
- Test both pages thoroughly before marking complete
- Consider adding loading states to buttons during submission
