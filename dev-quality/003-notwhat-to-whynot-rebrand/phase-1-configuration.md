# Phase 1: Configuration & Package Metadata

## Objective
Update all package metadata and configuration files to use "whynot" branding.

## Files to Update

### 1. `package.json`
**Changes**:
```json
{
  "name": "notwhat"  →  "name": "whynot"
}
```

### 2. `package-lock.json`
**Changes**:
- Update package name references
- May regenerate automatically when package.json changes

### 3. `.env.example`
**Changes**:
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/notwhat
→
DATABASE_URL=postgres://postgres:postgres@localhost:5432/whynot

DB_NAME=notwhat  →  DB_NAME=whynot
```

### 4. `.env.staging`
**Changes**:
- Same as `.env.example`
- Update database connection strings

### 5. `README.md`
**Changes**:
- Project title
- Any references to "notwhat" in documentation
- Installation instructions

### 6. `.github/copilot-instructions.md`
**Changes**:
- Update project overview section
- Replace "NotWhat" with "WhyNot"

## Steps

1. **Update package.json**
   ```bash
   # Change name field from "notwhat" to "whynot"
   ```

2. **Regenerate package-lock.json**
   ```bash
   npm install
   ```

3. **Update environment files**
   - Edit `.env.example`
   - Edit `.env.staging`
   - Update local `.env` (manual, not tracked)

4. **Update README.md**
   - Replace project name
   - Update any command examples
   - Update description

5. **Update Copilot instructions**
   - Find/replace "NotWhat" → "WhyNot"
   - Find/replace "notwhat" → "whynot"

## Validation

- [ ] `package.json` shows correct name
- [ ] `npm install` runs without errors
- [ ] Environment file examples are correct
- [ ] README displays new project name
- [ ] No broken references in documentation

## Acceptance Criteria

- ✅ All configuration files use "whynot"
- ✅ npm commands work correctly
- ✅ Documentation is consistent
- ✅ No "notwhat" references remain in config files

## Estimated Time
**30 minutes**

## Status
⏳ **PENDING**
