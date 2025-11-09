# Groups Table Migration

## Overview
This folder contains the migrations for the `groups` table, which stores group information for the Splitwise clone application.

## Files (Run in Order)

### 1. `groups-table-migration.sql`
Creates the `groups` table structure.

**What it does:**
- Creates a `groups` table with the following fields:
  - `id`: UUID (auto-generated) - Primary key
  - `name`: Name of the group (required)
  - `description`: Optional description of the group
  - `icon`: Icon identifier from lucide-react library (default: 'Users')
  - `created_by`: UUID (foreign key to `profiles.id`) - User who created the group
  - `created_at`: Timestamp when group was created
  - `updated_at`: Timestamp when group was last updated

- **Foreign Key Constraints:**
  - `created_by` references `profiles.id` with CASCADE delete
  - If the creator's profile is deleted, the group is also deleted

- **Indexes:**
  - Index on `created_by` for better query performance

- **Row Level Security:**
  - RLS is enabled but policies are added in a separate file (see below)

### 2. `groups-rls-policies-migration.sql`
Documents the RLS policy approach for the `groups` table.

**What it does:**
- **No policies are defined** for ANON or authenticated users
- RLS is enabled (for security), but no access is granted to client keys
- This file serves as documentation explaining the security model

**Why separate file?**
- This must run AFTER the `user_group_mapping` table is created to maintain consistency in migration order
- Kept separate for clarity and to document the security approach

## Migration Order
1. Run `groups-table-migration.sql` (after profiles table exists)
2. Run `user-group-mapping-migration.sql` (from User Group Mapping table folder)
3. Run `groups-rls-policies-migration.sql` (this completes the groups table setup)

## Security Model

### API-Only Access
- **ALL database operations** (SELECT, INSERT, UPDATE, DELETE) are performed exclusively through API routes
- API routes use the Supabase service role key, which bypasses RLS
- No direct database access is permitted from the client/frontend
- The ANON key has **zero** access to this table

### Why This Approach?
- **Complete server-side control:** All business logic and authorization happens in API routes
- **Better security:** No risk of exposing data through client-side queries
- **Flexible authorization:** Complex permission logic can be implemented in code
- **Audit trail:** All operations go through controlled API endpoints
- **Future-proof:** Easy to add additional security layers, rate limiting, logging, etc.

### Available API Endpoints
- `GET /api/groups` - Fetch all groups for authenticated user
- `GET /api/groups?id={id}` - Fetch single group details
- `POST /api/groups` - Create a new group
- `PUT /api/groups` - Update group details (admin only)
- `DELETE /api/groups?id={id}` - Delete a group (admin only)

