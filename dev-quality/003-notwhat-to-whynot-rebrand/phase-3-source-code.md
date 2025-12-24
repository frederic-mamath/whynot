# Phase 3: Source Code & Documentation

## Objective
Replace all "notwhat" references in source code, documentation, and configuration comments.

## Files to Update

### 1. Feature Documentation
**File**: `features/001-live-streaming-channels/phase-1-setup-infrastructure.md`
- Find/replace "notwhat" → "whynot"
- Update any database references

### 2. Dev-Quality Documentation
**Files**:
- `dev-quality/002-shadcn-component-migration/phase-3-navigation.md`
- `dev-quality/002-shadcn-component-migration/phase-6-polish.md`
- Any references to project name

### 3. GitHub Copilot Instructions
**File**: `.github/copilot-instructions.md`
- Replace "NotWhat Project" → "WhyNot Project"
- Replace "notwhat" → "whynot"
- Update project overview section

### 4. Main README
**File**: `README.md`
- Project title
- Description
- Installation instructions
- Any command examples

### 5. UI Components (if any contain hardcoded text)
**File**: `client/src/components/NavBar/NavBar.tsx`
- Check for any hardcoded "NotWhat" text
- Replace with "WhyNot" if present

### 6. Database Connection Comments
**File**: `src/db/index.ts`
- Check code comments
- Update if "notwhat" is mentioned

## Search Strategy

### Find all occurrences:
```bash
# Case-insensitive search across non-binary files
grep -r -i "notwhat\|notWhat\|NotWhat\|NOTWHAT" \
  --exclude-dir={node_modules,dist,.git,client/dist} \
  --exclude="*.lock" \
  .
```

### By file type:
```bash
# Documentation
find . -name "*.md" ! -path "./node_modules/*" -exec grep -l "notwhat" {} \;

# TypeScript/JavaScript
find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) ! -path "./node_modules/*" ! -path "./dist/*" -exec grep -l "notwhat" {} \;
```

## Steps

1. **Search for all occurrences**
   ```bash
   grep -r "notwhat" --exclude-dir={node_modules,dist,.git} .
   ```

2. **Update feature documentation**
   - Edit `features/001-live-streaming-channels/phase-1-setup-infrastructure.md`
   - Replace all references

3. **Update dev-quality documentation**
   - Edit phase files in `dev-quality/002-shadcn-component-migration/`
   - Replace all references

4. **Update GitHub Copilot instructions**
   - Edit `.github/copilot-instructions.md`
   - Replace "NotWhat" → "WhyNot"
   - Replace "notwhat" → "whynot"

5. **Update README.md**
   - Replace project name
   - Update any setup instructions

6. **Update UI components**
   - Check `client/src/components/NavBar/NavBar.tsx`
   - Replace any visible text

7. **Update code comments**
   - Check `src/db/index.ts`
   - Update any comments mentioning "notwhat"

## Validation

- [ ] All documentation updated
- [ ] No "notwhat" in markdown files
- [ ] GitHub Copilot instructions reflect new name
- [ ] UI shows correct branding
- [ ] Code comments updated
- [ ] README is accurate

## Acceptance Criteria

- ✅ All documentation uses "whynot"
- ✅ No "notwhat" references in source code
- ✅ GitHub Copilot instructions updated
- ✅ README reflects new project name
- ✅ UI components use correct branding

## Estimated Time
**1.5 hours**

## Status
⏳ **PENDING** (Can start after Phase 1)

## Notes
- Use find/replace carefully to avoid breaking code
- Review changes before committing
- Test application after changes to ensure nothing broke
- Git history will preserve old references (expected and normal)
