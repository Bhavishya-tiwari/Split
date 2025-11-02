# User Group Mapping Table Migration

## Overview
This folder contains the migration for the `user_group_mapping` table, which creates a many-to-many relationship between users and groups in the Splitwise clone application.

## Files

### `user-group-mapping-migration.sql`
Creates the `user_group_mapping` table and sets up read-only access policies.

**What it does:**
- Creates a `user_group_mapping` table with the following fields:
  - `id`: UUID (auto-generated) - Primary key
  - `user_id`: UUID (foreign key to `profiles.id`) - The user in the group
  - `group_id`: UUID (foreign key to `groups.id`) - The group the user belongs to
  - `role`: Text field with CHECK constraint - Either 'admin' or 'member' (default: 'member')
  - `joined_at`: Timestamp when user joined the group

- **Foreign Key Constraints:**
  - `user_id` references `profiles.id` with CASCADE delete
  - `group_id` references `groups.id` with CASCADE delete
  - If either the user or group is deleted, the mapping is automatically removed

- **Unique Constraint:**
  - `UNIQUE(user_id, group_id)` prevents a user from being added to the same group multiple times

- **Indexes:**
  - Index on `user_id` for efficient queries by user
  - Index on `group_id` for efficient queries by group

- **Row Level Security (RLS):**
  - RLS is enabled but **no policies are granted** to ANON or authenticated users
  - All access must go through API routes using the service role key

## Migration Order
Run this migration **after** both:
1. `profiles` table exists (Users table folder)
2. `groups` table exists (Groups table folder)

And **before**:
3. `groups-rls-policies-migration.sql` (Groups table folder)

## Security Model

### API-Only Access
- **ALL database operations** (SELECT, INSERT, UPDATE, DELETE) are performed exclusively through API routes
- API routes use the Supabase service role key, which bypasses RLS
- No direct database access is permitted from the client/frontend
- The ANON key has **zero** access to this table

### Why This Approach?
- **Complete server-side control:** All business logic and authorization happens in API routes
- **Better security:** No risk of exposing membership data through client-side queries
- **Flexible authorization:** Complex permission logic (admin vs member) can be implemented in code
- **Prevents data leaks:** Users cannot directly query to discover other users or groups
- **Audit trail:** All operations go through controlled API endpoints

### Available API Endpoints
- `GET /api/groups/members?group_id={id}` - Fetch all members of a group (requires membership)
- `POST /api/groups/members` - Add a member to a group (admin only)
- `PUT /api/groups/members` - Update member role (admin only)
- `DELETE /api/groups/members?group_id={id}&user_id={id}` - Remove member (admin only)

### Notes
- The `role` field ('admin' or 'member') is used to implement group management permissions
- Admins can add/remove members and modify group settings
- Regular members can view group info and expenses but cannot modify membership
- All authorization checks are performed server-side in API routes

