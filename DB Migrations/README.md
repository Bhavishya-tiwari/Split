# Database Migrations

This folder contains all database migrations for the Split App (Splitwise clone).

## 🔒 Security Model

### API-Only Database Access
This application uses an **API-only approach** for all database operations:

- ✅ **All reads and writes** go through API routes (`/api/*`)
- ✅ API routes use the **service role key** (bypasses RLS)
- ✅ **No direct database access** from the client/frontend
- ✅ **ANON key has ZERO access** to protected tables

### Why This Approach?
1. **Complete server-side control** - All business logic and authorization in API routes
2. **Better security** - No risk of data exposure through client-side queries
3. **Flexible authorization** - Complex permission logic implemented in code
4. **Prevents data leaks** - Users cannot directly query to discover data
5. **Audit trail** - All operations through controlled endpoints
6. **Future-proof** - Easy to add rate limiting, logging, analytics, etc.

### RLS Strategy
- RLS is **enabled** on all tables (for defense-in-depth)
- **No policies** are granted to ANON or authenticated users
- Tables are effectively "locked down" for direct access
- Service role key bypasses RLS for API route operations

## 📋 Migration Order

Run migrations in this exact order:

### 1. Users Table
Located in: `Users table/`

```bash
# Run in Supabase SQL Editor:
1. supabase-profiles-migration.sql
```

Creates the `profiles` table for user information.

### 2. Groups Table
Located in: `Groups table/`

```bash
# Run in Supabase SQL Editor:
1. groups-table-migration.sql
```

Creates the `groups` table for storing group information.

### 3. User Group Mapping Table
Located in: `User Group Mapping table/`

```bash
# Run in Supabase SQL Editor:
1. user-group-mapping-migration.sql
```

Creates the many-to-many relationship between users and groups.

### 4. Groups RLS Policies
Located in: `Groups table/`

```bash
# Run in Supabase SQL Editor:
1. groups-rls-policies-migration.sql
```

Documents the RLS approach (no actual policies are created).

### 5. User Group Mapping RLS
Located in: `User Group Mapping table/`

```bash
# Run in Supabase SQL Editor:
1. user-group-mapping-RLS.sql
```

Documents the RLS approach (no actual policies are created).

### 6. Expenses Table
Located in: `Expenses table/`

```bash
# Run in Supabase SQL Editor:
1. expenses-table-migration.sql
2. expenses-rls-policies-migration.sql
```

Creates the `expenses` table for storing expense records. Expenses belong to groups and have cascade delete rules.

### 7. Expense Payers Table
Located in: `Expense Payers table/`

```bash
# Run in Supabase SQL Editor:
1. expense-payers-migration.sql
2. expense-payers-rls-policies-migration.sql
```

Creates the `expense_payers` table to track who paid for each expense and how much.

### 8. Expense Splits Table
Located in: `Expense Splits table/`

```bash
# Run in Supabase SQL Editor:
1. expense-splits-migration.sql
2. expense-splits-rls-policies-migration.sql
```

Creates the `expense_splits` table to track how expenses are split among users.

### 9. Automatic Updated_At Triggers
Located in: `Triggers/`

```bash
# Run in Supabase SQL Editor:
1. automatic-updated-at-trigger.sql
```

Sets up automatic `updated_at` timestamp updates for all tables whenever a row is modified. See `Triggers/README.md` for detailed documentation on all triggers.

### 10. Database Functions (Optional but Recommended)
Located in: `Functions/`

```bash
# Run in Supabase SQL Editor:
1. upsert-expense-function.sql
```

Creates reusable PostgreSQL functions for complex operations. The `upsert_expense_from_json` function handles creating/updating expenses with payers and splits in a single atomic transaction. See `Functions/README.md` for detailed documentation and usage examples.

## 🧹 Cleanup (If Upgrading)

If you previously had read policies on these tables, run:

```bash
# Run in Supabase SQL Editor:
cleanup-old-rls-policies.sql
```

This will:
- Drop old RLS policies that granted read access
- Remove helper functions no longer needed
- Confirm RLS is still enabled

**⚠️ IMPORTANT:** Only run cleanup AFTER:
1. Updating all frontend code to use API routes
2. Verifying service role key is configured in API routes
3. Testing that your app works with the new approach

## 📁 Folder Structure

```
DB Migrations/
├── README.md (this file)
├── SCHEMA_DIAGRAM.md
├── cleanup-old-rls-policies.sql
├── Triggers/
│   ├── README.md
│   ├── profile-creation-trigger.sql
│   └── automatic-updated-at-trigger.sql
├── Functions/
│   ├── README.md
│   └── upsert-expense-function.sql
├── Users table/
│   ├── README.md
│   └── supabase-profiles-migration.sql
├── Groups table/
│   ├── README.md
│   ├── groups-table-migration.sql
│   └── groups-rls-policies-migration.sql
├── User Group Mapping table/
│   ├── README.md
│   ├── user-group-mapping-migration.sql
│   └── user-group-mapping-RLS.sql
├── Expenses table/
│   ├── README.md
│   ├── expenses-table-migration.sql
│   └── expenses-rls-policies-migration.sql
├── Expense Payers table/
│   ├── README.md
│   ├── expense-payers-migration.sql
│   └── expense-payers-rls-policies-migration.sql
└── Expense Splits table/
    ├── README.md
    ├── expense-splits-migration.sql
    └── expense-splits-rls-policies-migration.sql
```

## 🔑 Environment Setup

### Required Environment Variables

Your API routes need access to the service role key:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ Keep secret!
```

**⚠️ NEVER commit or expose the service role key!**

### Service Role Client Setup

```typescript
// utils/supabase/service.ts
import { createClient } from '@supabase/supabase-js'

export const createServiceRoleClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

## 🛣️ API Routes

### Groups API (`/api/groups`)
- `GET /api/groups` - Fetch all groups for authenticated user
- `GET /api/groups?id={id}` - Fetch single group details
- `POST /api/groups` - Create a new group
- `PUT /api/groups` - Update group details (admin only)
- `DELETE /api/groups?id={id}` - Delete a group (admin only)

### Group Members API (`/api/groups/members`)
- `GET /api/groups/members?group_id={id}` - Fetch all members of a group
- `POST /api/groups/members` - Add a member to a group (admin only)
- `PUT /api/groups/members` - Update member role (admin only)
- `DELETE /api/groups/members?group_id={id}&user_id={id}` - Remove member (admin only)

### Expenses API (`/api/expenses`)
- `GET /api/expenses?group_id={id}` - Fetch all expenses for a group
- `GET /api/expenses?id={id}` - Fetch single expense with payers and splits
- `POST /api/expenses` - Create a new expense with payers and splits (uses `upsert_expense_from_json` function)
- `PUT /api/expenses` - Update expense details (uses `upsert_expense_from_json` function)
- `DELETE /api/expenses?id={id}` - Delete an expense (cascades to payers and splits)

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Service Role](https://supabase.com/docs/guides/api/using-the-service-role-key)

## ❓ FAQ

### Q: Why not use RLS policies instead of API routes?
**A:** API routes provide:
- More flexible authorization logic
- Better audit trails and logging
- Easier testing and debugging
- Protection against client-side query manipulation
- Ability to add middleware (rate limiting, analytics, etc.)

### Q: Is RLS completely disabled?
**A:** No! RLS is **enabled** on all tables. We just don't grant any policies to ANON/authenticated users. This provides defense-in-depth security.

### Q: What if I need to do complex queries?
**A:** All complex queries should be implemented in API routes. This gives you full control over:
- Query optimization
- Data transformation
- Authorization logic
- Error handling

### Q: Can I still use the ANON key for auth?
**A:** Yes! The ANON key is still used for:
- User authentication (`auth.signUp`, `auth.signIn`, etc.)
- Session management
- Auth-related operations

It just doesn't have access to read/write data tables directly.

## 🔄 Migration from Old Approach

If you're migrating from an approach where the frontend directly queries Supabase:

1. ✅ Create API routes for all database operations
2. ✅ Update frontend to call API routes instead of Supabase directly
3. ✅ Test thoroughly in development
4. ✅ Run `cleanup-old-rls-policies.sql` to remove old policies
5. ✅ Deploy and test in production

---

## 🗃️ Database Schema Overview

### Tables and Relationships

```
profiles (users)
    ↓ (created_by)
    ├── groups
    │   └── expenses
    │       ├── expense_payers
    │       └── expense_splits
    └── user_group_mapping
```

### Cascade Delete Rules

#### When a user is deleted:
- ✅ All groups created by that user are deleted
- ✅ All expenses created by that user are deleted
- ✅ All payments made by that user are deleted
- ✅ All expense splits for that user are deleted
- ✅ All group memberships for that user are deleted

#### When a group is deleted:
- ✅ All expenses in that group are deleted
- ✅ All group memberships are deleted

#### When an expense is deleted:
- ✅ All payment records (expense_payers) are deleted
- ✅ All split records (expense_splits) are deleted

**Last Updated:** November 9, 2025

