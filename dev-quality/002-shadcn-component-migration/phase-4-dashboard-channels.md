# Phase 4: Migrate Dashboard & Channels

## Objective
Convert Dashboard, Channels list, and Create Channel pages to use Shadcn components and Lucide icons, creating a cohesive and professional user experience.

## Files to Update

1. `client/src/pages/Dashboard.tsx`
2. `client/src/pages/Channels/ChannelsPage.tsx`
3. `client/src/pages/CreateChannel/CreateChannelPage.tsx`

## Steps

### 1. Migrate Dashboard Page
- Wrap content sections in `<Card>` components
- Replace `<button>` with Shadcn `<Button>`
- Add Lucide icons for stats/metrics: `Users`, `Video`, `Clock`, `Activity`
- Add `<Badge>` for status indicators (if Badge component created)
- Apply Tailwind grid layout for dashboard cards
- Use design tokens for all colors

### 2. Migrate Channels List Page
- Each channel as a `<Card>` component
- Add Lucide icons:
  - `Video` for channel type
  - `Users` for participants
  - `Lock` for private channels
  - `Plus` or `PlusCircle` for create button
- Add `<Badge>` for participant count and status
- Replace buttons with Shadcn `<Button>`
- Empty state message with illustration/icon
- Grid layout with Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

### 3. Migrate Create Channel Page
- Form fields with `<Input>` and `<Label>`
- Add checkbox/switch for privacy setting
- Replace button with Shadcn `<Button>`
- Add icons: `Plus`, `Video`, `Lock`
- Wrap form in `<Card>` component
- Apply Tailwind layout utilities

## Design Considerations

### Dashboard Layout
```tsx
<div className="min-h-screen bg-background p-6">
  <div className="max-w-7xl mx-auto space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <Button onClick={handleLogout}>
        <LogOut className="size-4 mr-2" />
        Logout
      </Button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
          <Video className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12</div>
        </CardContent>
      </Card>
      {/* More stat cards... */}
    </div>
  </div>
</div>
```

### Channel Card Layout
```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <div className="flex items-start justify-between">
      <CardTitle className="flex items-center gap-2">
        <Video className="size-5" />
        {channel.name}
      </CardTitle>
      {channel.is_private && (
        <Badge variant="secondary">
          <Lock className="size-3 mr-1" />
          Private
        </Badge>
      )}
    </div>
    <CardDescription className="flex items-center gap-2 mt-2">
      <Users className="size-4" />
      {channel.participantCount} / {channel.max_participants}
    </CardDescription>
  </CardHeader>
  <CardFooter>
    <Button className="w-full">
      Join Channel
    </Button>
  </CardFooter>
</Card>
```

### Create Channel Form
```tsx
<Card className="w-full max-w-md mx-auto">
  <CardHeader>
    <CardTitle>Create New Channel</CardTitle>
    <CardDescription>Start a live video/audio session</CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Channel Name</Label>
        <Input id="name" placeholder="My Awesome Channel" />
      </div>
      {/* More fields... */}
      <Button type="submit" className="w-full">
        <Plus className="size-4 mr-2" />
        Create Channel
      </Button>
    </form>
  </CardContent>
</Card>
```

### Empty State (No Channels)
```tsx
<div className="text-center py-12">
  <Video className="size-16 mx-auto text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">No channels yet</h3>
  <p className="text-muted-foreground mb-4">
    Be the first to create a live channel
  </p>
  <Button>
    <Plus className="size-4 mr-2" />
    Create Channel
  </Button>
</div>
```

## Acceptance Criteria

### Dashboard Page
- [ ] All cards use `<Card>` component
- [ ] Stats/metrics have appropriate Lucide icons
- [ ] Logout button uses Shadcn `<Button>` with `LogOut` icon
- [ ] Grid layout responsive with Tailwind
- [ ] Design tokens used for colors
- [ ] No TypeScript errors
- [ ] Dashboard data displays correctly

### Channels List Page
- [ ] Each channel is a `<Card>`
- [ ] All icons replaced with Lucide (`Video`, `Users`, `Lock`)
- [ ] Create button uses `Plus` icon
- [ ] Empty state has icon and proper messaging
- [ ] Grid layout: 1 col mobile, 2 tablet, 3 desktop
- [ ] Join/Full buttons work correctly
- [ ] Private channels show lock indicator
- [ ] Participant count displays correctly
- [ ] Navigation to channel works

### Create Channel Page
- [ ] Form uses `<Input>` and `<Label>`
- [ ] Privacy toggle implemented (checkbox or switch)
- [ ] Submit button has `Plus` icon
- [ ] Form wrapped in `<Card>`
- [ ] Error messages styled properly
- [ ] Channel creation works
- [ ] Redirects to new channel after creation
- [ ] Validation messages display

### All Pages
- [ ] Mobile responsive
- [ ] Design tokens used consistently
- [ ] Proper spacing (4px increments)
- [ ] No layout shifts
- [ ] Smooth transitions where appropriate

## Testing Checklist

- [ ] View dashboard and verify all data
- [ ] Click logout from dashboard
- [ ] View channels list (with channels)
- [ ] View channels list (empty state)
- [ ] Click "Create Channel" button
- [ ] Fill out create channel form
- [ ] Submit form and verify redirect
- [ ] Join existing channel
- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] Test on desktop viewport

## Status
✅ **DONE** - All three pages migrated successfully

## Completed Tasks

### Dashboard Page
- [x] All cards use `<Card>` component
- [x] Profile info has Lucide icons (`User`, `Mail`, `Calendar`, `CheckCircle`, `Clock`)
- [x] Logout button uses Shadcn `<Button>` with `LogOut` icon
- [x] Grid layout responsive with Tailwind
- [x] Design tokens used for colors
- [x] No TypeScript errors
- [x] Dashboard data displays correctly
- [x] Loading and error states styled properly

### Channels List Page
- [x] Each channel is a `<Card>`
- [x] All icons replaced with Lucide (`Video`, `Users`, `Lock`, `Plus`)
- [x] Create button uses `Plus` icon
- [x] Empty state has `Video` icon and proper messaging
- [x] Grid layout: 1 col mobile, 2 tablet, 3 desktop
- [x] Join/Full buttons work correctly with proper variants
- [x] Private channels show lock indicator
- [x] Participant count displays correctly
- [x] Navigation to channel works
- [x] Hover effect on cards

### Create Channel Page
- [x] Form uses `<Input>` and `<Label>`
- [x] Privacy toggle implemented with checkbox
- [x] Submit button has `Plus` icon
- [x] Form wrapped in `<Card>`
- [x] Error messages styled with design tokens
- [x] Icons added (`Video`, `Users`, `Lock`, `Plus`, `ArrowLeft`)
- [x] Channel creation works
- [x] Redirects to new channel after creation
- [x] Validation messages display
- [x] Helper text for each field
- [x] Back button with `ArrowLeft` icon

### All Pages
- [x] Mobile responsive
- [x] Design tokens used consistently
- [x] Proper spacing (4px increments)
- [x] No layout shifts
- [x] Smooth transitions where appropriate
- [x] Centered layouts with max-width containers

## Estimated Time
5 hours (1.5h Dashboard, 2h Channels List, 1.5h Create Channel)

**Actual Time**: ~30 minutes

## Notes
- Consider adding Badge component in Phase 1 if not already done
- Dashboard stats may be placeholder data - style the layout, not the logic
- Empty state is important UX - make it friendly and actionable
- Test channel creation flow thoroughly (it's a critical path)
