# Users Table Migration

## Overview
This folder contains the migration for the user profiles table, which extends Supabase's authentication system with additional user information.

## Files

### `supabase-profiles-migration.sql`
Creates the `profiles` table and sets up automatic profile creation for new users.

**What it does:**
- Creates a `profiles` table with the following fields:
  - `id`: UUID (references `auth.users.id`) - Primary key
  - `email`: User's email address
  - `full_name`: User's full name
  - `phone`: User's phone number
  - `created_at`: Timestamp when profile was created
  - `updated_at`: Timestamp when profile was last updated

- **Row Level Security (RLS) Policies:**
  - Users can view their own profile (SELECT)
  - Users can update their own profile (UPDATE)
  - Users can insert their own profile (INSERT)

- **Automatic Profile Creation:**
  - Creates a trigger function `handle_new_user()` that automatically creates a profile entry when a new user signs up via Supabase Auth
  - The trigger copies the email and full_name from the auth metadata

## Migration Order
Run this migration **first** before any other tables, as other tables reference the `profiles` table.

## Notes
- This table is the foundation for user identity in the application
- All user-related foreign keys in other tables reference `profiles.id`, not `auth.users.id`

