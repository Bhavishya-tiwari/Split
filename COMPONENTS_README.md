# Components Documentation

## Overview

The home layout has been compartmentalized into smaller, reusable components for better code organization and maintainability.

## New Components

### 1. **Navbar** (`src/components/Navbar.tsx`)
- Displays the app branding and menu button
- Accepts `onMenuOpen` callback prop to trigger the side menu
- Sticky header with consistent styling

### 2. **BottomNavigation** (`src/components/BottomNavigation.tsx`)
- Fixed bottom navigation bar with three sections: Groups, Friends, and Activity
- Active state highlighting based on current route
- Uses Next.js router for navigation
- Responsive design for mobile and desktop

### 3. **SideMenu** (`src/components/SideMenu.tsx`)
- Right-side sliding menu with backdrop
- Contains Profile and Log Out options
- Handles user authentication (sign out)
- Smooth animations and transitions

### 4. **Profile Page** (`src/app/home/profile/page.tsx`)
- Full user profile management interface
- Displays user information from Supabase
- Edit mode for updating profile details (full name, phone)
- Real-time data sync with Supabase
- Beautiful, modern UI with loading states and success/error messages

## Updated Files

### **HomeLayout** (`src/app/home/layout.tsx`)
- Simplified from 239 lines to just 30 lines
- Now imports and uses the component modules
- Manages only the menu open/close state
- Clean and easy to maintain

## Supabase Integration

### Database Setup

Run the SQL migration file to set up the profiles table:

```bash
# In your Supabase SQL Editor, run:
supabase-profiles-migration.sql
```

This will:
- Create a `profiles` table with proper foreign key relationships
- Set up Row Level Security (RLS) policies
- Create a trigger to automatically create profile entries when users sign up

### Profile Table Schema

```sql
profiles (
  id: UUID (references auth.users)
  email: TEXT
  full_name: TEXT
  phone: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
)
```

## Navigation Routes

- `/home` - Groups page (main)
- `/home/friends` - Friends page (to be implemented)
- `/home/activity` - Activity page (to be implemented)
- `/home/profile` - User profile page

## Benefits of Compartmentalization

1. **Reusability**: Components can be used in other parts of the app
2. **Maintainability**: Easier to find and fix bugs
3. **Testability**: Each component can be tested independently
4. **Readability**: Smaller, focused files are easier to understand
5. **Scalability**: Easy to add new features or modify existing ones

## Future Improvements

- Add Friends page implementation
- Add Activity page implementation
- Add profile photo upload functionality
- Add email verification status
- Add account settings section

