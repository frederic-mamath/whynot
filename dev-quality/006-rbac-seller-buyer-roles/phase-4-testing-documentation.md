# Phase 4: Testing, Documentation & Cleanup

## Objective
Verify the complete RBAC implementation, update documentation, and ensure the system works end-to-end.

## Files to Update

### Documentation
- `ARCHITECTURE.md` - Add RBAC section
- `features/roles/README.md` - NEW: Feature documentation

### Testing
- Manual testing checklist
- Database verification queries

## Documentation Updates

### `ARCHITECTURE.md`
Add section under "Features":
```markdown
### Role-Based Access Control (RBAC)
Location: `features/roles/`

**Purpose**: Manage user permissions through role assignments.

**Available Roles**:
- **BUYER** (default): Can browse and purchase products
- **SELLER** (requires approval): Can create channels and sell products

**Tables**:
- `roles` - Available roles in the system
- `user_roles` - User role assignments with activation tracking

**Key Concepts**:
- All users automatically receive BUYER role on registration
- Users can request SELLER role via UI
- SELLER role requires admin approval (manual database update)
- Activation tracking: `activated_at` and `activated_by` columns
```

### `features/roles/README.md`
Create comprehensive feature documentation:
- Overview of RBAC system
- Role descriptions
- How to grant seller role (admin guide)
- API endpoints documentation
- Database schema reference
- Common queries for admins

## Manual Testing Checklist

### User Registration
- [ ] New user created successfully
- [ ] User automatically has BUYER role (activated)
- [ ] User can log in

### Seller Role Request
- [ ] Non-seller sees "Become a Seller" button
- [ ] Button click creates pending user_role
- [ ] Button changes to "Seller Request Pending"
- [ ] Success toast displayed
- [ ] Cannot request again while pending

### Admin Approval (Database)
- [ ] Find pending requests: `SELECT * FROM user_roles WHERE activated_at IS NULL`
- [ ] Activate role: `UPDATE user_roles SET activated_at = NOW(), activated_by = 1 WHERE id = ?`
- [ ] Verify UI updates on refresh

### Channel Creation Protection
- [ ] Non-seller cannot create channel (error message)
- [ ] Seller with pending request cannot create channel
- [ ] Activated seller can create channel successfully
- [ ] Error messages are user-friendly

### Edge Cases
- [ ] Cannot request duplicate role
- [ ] Cannot bypass role check via API
- [ ] Role check works with tRPC authentication
- [ ] Database constraints prevent invalid data

## Database Verification Queries

### Check All Roles
```sql
SELECT * FROM roles ORDER BY id;
```

### Check User Roles (with details)
```sql
SELECT 
  ur.id,
  u.email,
  r.name as role,
  ur.activated_at,
  activator.email as activated_by_email
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN users activator ON ur.activated_by = activator.id
ORDER BY ur.created_at DESC;
```

### Find Pending Seller Requests
```sql
SELECT 
  ur.id,
  u.email,
  ur.created_at as requested_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'SELLER' 
  AND ur.activated_at IS NULL
ORDER BY ur.created_at ASC;
```

### Activate Seller Role
```sql
UPDATE user_roles 
SET 
  activated_at = NOW(),
  activated_by = 1  -- Replace with your admin user ID
WHERE id = ?;  -- Replace with user_role ID
```

### Check User's Active Roles
```sql
SELECT r.name 
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = ? 
  AND ur.activated_at IS NOT NULL;
```

## Admin Guide

### Granting Seller Role

**Option 1: Direct SQL**
```sql
-- Find user
SELECT id, email FROM users WHERE email = 'user@example.com';

-- Find seller role ID
SELECT id FROM roles WHERE name = 'SELLER';

-- Check if pending request exists
SELECT * FROM user_roles 
WHERE user_id = ? AND role_id = ? AND activated_at IS NULL;

-- Activate the request
UPDATE user_roles 
SET activated_at = NOW(), activated_by = 1 
WHERE user_id = ? AND role_id = ?;
```

**Option 2: Direct Assignment (if no request)**
```sql
-- Insert directly as activated
INSERT INTO user_roles (user_id, role_id, activated_at, activated_by)
VALUES (?, (SELECT id FROM roles WHERE name = 'SELLER'), NOW(), 1);
```

## Cleanup Tasks

### Remove Old Code
- [ ] Verify `user_shop_roles` table is dropped
- [ ] Remove any old role-related code if exists
- [ ] Clean up unused imports

### Code Review
- [ ] Check TypeScript types are consistent
- [ ] Verify error messages are user-friendly
- [ ] Ensure proper error handling everywhere
- [ ] Check for console.logs to remove

## Steps

1. **Run complete migration**
   ```bash
   npm run migrate
   ```

2. **Verify database schema**
   - Check tables exist
   - Verify indexes created
   - Check initial data seeded

3. **Test user registration flow**
   - Create new user
   - Verify BUYER role assigned
   - Check database

4. **Test seller request flow**
   - Request seller role
   - Check pending state
   - Activate in database
   - Verify frontend updates

5. **Test channel creation protection**
   - Try as non-seller (should fail)
   - Try as pending seller (should fail)
   - Try as active seller (should succeed)

6. **Update documentation**
   - Add to ARCHITECTURE.md
   - Create features/roles/README.md
   - Add admin guide

7. **Final code review**
   - Check all files
   - Remove debug code
   - Verify type safety

## Acceptance Criteria
- [ ] All manual tests pass
- [ ] Database queries work as expected
- [ ] Documentation is clear and complete
- [ ] Admin can easily grant seller role
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Error messages are user-friendly
- [ ] Code follows project conventions

## Metrics

### Database
- Number of users with BUYER role: `SELECT COUNT(*) FROM user_roles WHERE role_id = 1 AND activated_at IS NOT NULL`
- Number of active sellers: `SELECT COUNT(*) FROM user_roles WHERE role_id = 2 AND activated_at IS NOT NULL`
- Number of pending requests: `SELECT COUNT(*) FROM user_roles WHERE activated_at IS NULL`

### Performance
- Time to check role: Should be < 50ms
- Database indexes properly used

## Status
📝 **PLANNING** - Ready to implement after Phase 3

## Notes
- Keep admin guide accessible for future reference
- Consider building admin UI for role management (future enhancement)
- Monitor pending seller requests regularly
