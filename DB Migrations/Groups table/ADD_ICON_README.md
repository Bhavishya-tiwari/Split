# Add Icon Column Migration

## Purpose
This migration adds an `icon` column to the `groups` table to store an identifier for a lucide-react icon that represents each group.

## Changes Made
- Added `icon` column of type TEXT with a default value of 'Users'
- The column stores the name of a lucide-react icon (e.g., 'Users', 'Home', 'Briefcase', 'Heart')

## How to Apply
Run the migration file in your Supabase SQL editor:
```sql
-- Add icon column to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Users';
```

## Icon Options
The icon field should contain valid lucide-react icon names. Common options include:
- Users
- Home
- Briefcase
- Heart
- Coffee
- Music
- Gamepad2
- Plane
- ShoppingBag
- Utensils
- GraduationCap
- Car
- Building
- TreePine

See the full list at: https://lucide.dev/icons/

