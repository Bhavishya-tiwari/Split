# Groups Components

This folder contains all the components related to the Groups feature.

## Components

### `CreateGroupModal`

Modal component for creating a new group. Handles form submission, validation, and API calls.

**Props:**

- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal is closed
- `onSuccess: () => void` - Callback when group is successfully created

### `GroupCard`

Displays a single group card with its information.

**Props:**

- `group: Group` - Group data to display

### `GroupsList`

Grid layout component that renders multiple group cards.

**Props:**

- `groups: Group[]` - Array of groups to display

### `EmptyGroupsState`

Empty state component shown when user has no groups.

**Props:**

- `onCreateClick: () => void` - Callback when create button is clicked

### `LoadingState`

Loading spinner component shown while data is being fetched.

### `GroupsHeader`

Header component with title and create group button.

**Props:**

- `onCreateClick: () => void` - Callback when create button is clicked

## Types

### `Group`

Main interface for group data:

```typescript
{
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

## Usage

```tsx
import {
  CreateGroupModal,
  GroupsList,
  EmptyGroupsState,
  LoadingState,
  GroupsHeader,
  type Group,
} from '@/components/Groups';
```
