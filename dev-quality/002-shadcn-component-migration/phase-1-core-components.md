# Phase 1: Add Core Shadcn Components

## Objective
Create the foundational Shadcn UI components (Input, Label, Card) that will be used across all pages and components in subsequent phases.

## Files to Create

1. `client/src/components/ui/Input/Input.tsx`
2. `client/src/components/ui/Input/index.ts`
3. `client/src/components/ui/Label/Label.tsx`
4. `client/src/components/ui/Label/index.ts`
5. `client/src/components/ui/Card/Card.tsx`
6. `client/src/components/ui/Card/index.ts`

## Dependencies to Install

```bash
npm install @radix-ui/react-label
```

**Note**: No additional dependencies needed for Input and Card (built with native elements).

## Steps

### 1. Create Input Component
- Based on Shadcn UI Input component
- Support standard HTML input attributes
- Add error state styling
- Include TypeScript types

### 2. Create Label Component
- Based on @radix-ui/react-label
- Proper label/input association
- Accessibility attributes

### 3. Create Card Component
- Create compound component structure:
  - `Card` - Container
  - `CardHeader` - Header section
  - `CardTitle` - Title text
  - `CardDescription` - Description text
  - `CardContent` - Main content area
  - `CardFooter` - Footer section
- All use design tokens for colors

### 4. Update STYLING.md
- Add Input component documentation with examples
- Add Label component documentation with examples
- Add Card component documentation with examples
- Include usage patterns for form fields

### 5. Create Example Usage
- Create simple test in existing component to verify styling works

## Design Considerations

### Input Component
- Must work seamlessly with Label
- Support all native input types (text, email, password, number, etc.)
- Error states should use `text-destructive` and `border-destructive`
- Focus ring should use `ring-ring` design token

### Card Component
- Should be composable (use parts as needed)
- Default styling: white background, subtle border, small shadow
- Hover state: increased shadow (optional)
- All spacing should use Tailwind utilities

## Acceptance Criteria

- [ ] Input component created and exports properly
- [ ] Label component created and exports properly  
- [ ] Card component created with all sub-components
- [ ] All components use design tokens (no hardcoded colors)
- [ ] All components have TypeScript types
- [ ] STYLING.md updated with usage examples
- [ ] Components can be imported with `@/components/ui/Input` pattern
- [ ] No TypeScript errors
- [ ] No build errors

## Testing Checklist

- [ ] Import Input in a test file
- [ ] Import Label in a test file
- [ ] Import Card in a test file
- [ ] Verify autocomplete works for component props
- [ ] Verify design tokens render correctly
- [ ] Check responsive behavior

## Status
✅ **DONE** - All components created and documented

## Completed Tasks
- [x] Input component created and exports properly
- [x] Label component created and exports properly  
- [x] Card component created with all sub-components
- [x] All components use design tokens (no hardcoded colors)
- [x] All components have TypeScript types
- [x] STYLING.md updated with usage examples
- [x] Components can be imported with `@/components/ui/Input` pattern
- [x] @radix-ui/react-label dependency installed

## Estimated Time
2 hours

**Actual Time**: ~30 minutes (faster than estimated)

## Notes
- Follow the exact pattern from the Button component for consistency
- Reference official Shadcn documentation for component APIs
- Keep components minimal - don't over-engineer
