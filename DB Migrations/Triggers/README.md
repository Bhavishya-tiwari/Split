# Database Triggers

This folder contains all database trigger configurations for the Split App.

## Overview

Triggers are automatic actions that execute in response to certain database events. Our application uses triggers for:
1. **Automatic timestamp updates** - Keep `updated_at` columns current
2. **User profile creation** - Automatically create profile when user signs up

---

## 📋 Trigger List

### 1. Automatic Profile Creation (`on_auth_user_created`)

**Location:** `auth.users` table  
**Event:** `AFTER INSERT`  
**Function:** `public.handle_new_user()`

#### Purpose
Automatically creates a profile in `public.profiles` whenever a new user signs up through Supabase Auth.

#### How It Works
```sql
-- Function Definition
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Definition
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### What Gets Created
When a user signs up:
- `id` → Copied from `auth.users.id` (UUID)
- `email` → Copied from `auth.users.email`
- `full_name` → Extracted from `auth.users.raw_user_meta_data->>'full_name'`
- `created_at` → Set to current timestamp

#### Example Flow
```
User signs up via Supabase Auth
    ↓
INSERT INTO auth.users (...)
    ↓ (Trigger fires automatically)
INSERT INTO public.profiles (id, email, full_name, created_at)
    ↓
User profile created ✅
```

#### SQL Files
- Primary location: `Users table/supabase-profiles-migration.sql`
- Reference copy: `Triggers/profile-creation-trigger.sql`

#### Notes
- This trigger is included in the users table migration
- The function uses `SECURITY DEFINER` to run with elevated privileges
- The trigger uses `NEW` to access the newly inserted row data
- `raw_user_meta_data` contains custom fields passed during sign-up

---

### 2. Automatic Timestamp Updates (`set_updated_at_*`)

**Location:** All tables with `updated_at` column  
**Event:** `BEFORE UPDATE`  
**Function:** `public.handle_updated_at()`

#### Purpose
Automatically updates the `updated_at` timestamp whenever a row is modified in any table.

#### How It Works
```sql
-- Function Definition
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Definition (example for groups table)
CREATE TRIGGER set_updated_at_groups
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### Tables with Auto-Update Triggers

| Trigger Name | Table | Purpose |
|--------------|-------|---------|
| `set_updated_at_profiles` | `public.profiles` | Track profile updates |
| `set_updated_at_groups` | `public.groups` | Track group modifications |
| `set_updated_at_user_group_mapping` | `public.user_group_mapping` | Track membership changes |
| `set_updated_at_expenses` | `public.expenses` | Track expense modifications |
| `set_updated_at_expense_payers` | `public.expense_payers` | Track payer changes |
| `set_updated_at_expense_splits` | `public.expense_splits` | Track split modifications |

#### Example Usage
```sql
-- Update a group name
UPDATE public.groups 
SET name = 'Updated Group Name' 
WHERE id = 'some-uuid';

-- The updated_at column is automatically set to NOW()
-- You don't need to include it in your UPDATE statement!
```

#### Benefits
- ✅ **No manual updates needed** - Never forget to update `updated_at`
- ✅ **Consistent timestamps** - All updates use the same logic
- ✅ **Less code** - Cleaner UPDATE queries
- ✅ **Automatic tracking** - Know when any record was last modified

#### SQL File
- `Triggers/automatic-updated-at-trigger.sql`

#### Notes
- The trigger runs `BEFORE UPDATE`, so the new timestamp is included in the update
- Uses `NEW` to modify the row before it's written to the database
- All tables share the same `handle_updated_at()` function

---

## 🔄 Trigger Execution Flow

### Profile Creation Trigger Flow
```
1. User submits signup form
2. Supabase Auth creates user in auth.users
3. ⚡ Trigger: on_auth_user_created fires
4. Function: handle_new_user() executes
5. Row inserted into public.profiles
6. User can now access the app
```

### Timestamp Update Trigger Flow
```
1. API executes UPDATE query
2. ⚡ Trigger: set_updated_at_* fires (BEFORE UPDATE)
3. Function: handle_updated_at() executes
4. NEW.updated_at set to NOW()
5. Row saved with new timestamp
6. Query returns with fresh updated_at value
```

---

## 🛠️ Managing Triggers

### View All Triggers
```sql
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### View Specific Trigger
```sql
SELECT 
  t.trigger_name,
  t.event_object_table,
  t.action_timing,
  t.event_manipulation,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = substring(t.action_statement from 'EXECUTE FUNCTION (.+)\(\)')
WHERE t.trigger_schema = 'public'
  AND t.trigger_name = 'on_auth_user_created';
```

### Disable a Trigger (Temporarily)
```sql
-- Disable trigger
ALTER TABLE public.groups DISABLE TRIGGER set_updated_at_groups;

-- Re-enable trigger
ALTER TABLE public.groups ENABLE TRIGGER set_updated_at_groups;
```

### Drop a Trigger
```sql
DROP TRIGGER IF EXISTS set_updated_at_groups ON public.groups;
```

### Drop the Function (removes all related triggers)
```sql
-- This will fail if any triggers still use the function
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Use CASCADE to drop function and all dependent triggers
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
```

---

## 🚨 Important Notes

### Security Considerations
- `handle_new_user()` uses `SECURITY DEFINER` to bypass RLS when creating profiles
- This is necessary because the user isn't authenticated yet during signup
- Always validate and sanitize data in `SECURITY DEFINER` functions

### Performance
- Triggers add minimal overhead (microseconds per operation)
- `BEFORE UPDATE` triggers are more efficient than `AFTER UPDATE` for modifications
- All our triggers are simple and optimized

### Testing Triggers
```sql
-- Test profile creation trigger
-- (Can't directly test auth.users, but can test the function)
SELECT public.handle_new_user();

-- Test updated_at trigger
UPDATE public.groups 
SET name = 'Test Update' 
WHERE id = (SELECT id FROM public.groups LIMIT 1)
RETURNING updated_at;
-- Should return current timestamp
```

### Debugging
If a trigger isn't working:
1. Check if trigger exists: `\dS public.groups` (in psql)
2. Check if function exists: `\df public.handle_updated_at`
3. Check trigger is enabled: Look at `trigger_enabled` in `pg_trigger`
4. Check function permissions
5. Review PostgreSQL logs for errors

---

## 📝 Migration Order

When setting up the database:

1. ✅ Create tables first
2. ✅ Create trigger functions
3. ✅ Create triggers on tables
4. ✅ Test triggers work

The triggers are available in:
- `Triggers/profile-creation-trigger.sql` (profile creation trigger - also in Users table migration)
- `Triggers/automatic-updated-at-trigger.sql` (timestamp update triggers)

---

## 📚 Resources

- [PostgreSQL Triggers Documentation](https://www.postgresql.org/docs/current/triggers.html)
- [PostgreSQL Trigger Functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [Supabase Triggers Guide](https://supabase.com/docs/guides/database/postgres/triggers)
- [Best Practices for Database Triggers](https://wiki.postgresql.org/wiki/Don%27t_Do_This#Don.27t_use_triggers)

---

**Last Updated:** November 9, 2025

