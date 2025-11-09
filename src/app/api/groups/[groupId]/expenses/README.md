# Expenses API Routes

This directory contains the API routes for managing expenses within groups.

## Base URL

```
/api/groups/[groupId]/expenses
```

All endpoints require the user to be authenticated and a member of the specified group.

## Endpoints

### GET - Fetch All Expenses

Retrieves all expenses for a specific group.

**URL:** `GET /api/groups/[groupId]/expenses`

**Authentication:** Required

**Authorization:** User must be a member of the group

**Response:**
```json
{
  "expenses": [
    {
      "id": "uuid",
      "title": "Dinner at Restaurant",
      "group_id": "uuid",
      "currency": "INR",
      "created_by": "uuid",
      "created_at": "2025-11-09T10:00:00Z",
      "updated_at": "2025-11-09T10:00:00Z",
      "created_by_profile": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "expense_payers": [
        {
          "id": "uuid",
          "amount": 1000.00,
          "paid_by": "uuid",
          "payer_profile": {
            "id": "uuid",
            "full_name": "John Doe",
            "email": "john@example.com"
          }
        }
      ],
      "expense_splits": [
        {
          "id": "uuid",
          "user_id": "uuid",
          "amount": 500.00,
          "split_type": "equal",
          "percentage": null,
          "shares": null,
          "split_user_profile": {
            "id": "uuid",
            "full_name": "Jane Doe",
            "email": "jane@example.com"
          }
        }
      ]
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User is not a member of the group
- `500 Internal Server Error` - Server error

---

### POST - Create New Expense

Creates a new expense in the group.

**URL:** `POST /api/groups/[groupId]/expenses`

**Authentication:** Required

**Authorization:** User must be a member of the group

**Request Body:**
```json
{
  "title": "Dinner at Restaurant",
  "currency": "INR",
  "paid_by": "uuid",
  "amount": 1000.00,
  "splits": [
    {
      "user_id": "uuid",
      "amount": 500.00,
      "split_type": "equal"
    },
    {
      "user_id": "uuid",
      "amount": 500.00,
      "split_type": "equal"
    }
  ]
}
```

**Validation Rules:**
1. `title` is required (minimum 3 characters)
2. `paid_by` must be a valid user ID and member of the group
3. `amount` must be a positive number
4. `splits` must contain at least one split
5. All `user_id` values in splits must be members of the group
6. Sum of all split amounts must equal the total amount (within 0.01 tolerance)
7. **Cannot split an expense only to the payer** - at least one other person must be included in splits

**Response:**
```json
{
  "message": "Expense created successfully",
  "expense": {
    // Full expense object with all related data
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User is not a member of the group
- `500 Internal Server Error` - Server error

---

### PUT - Update Existing Expense

Updates an existing expense.

**URL:** `PUT /api/groups/[groupId]/expenses`

**Authentication:** Required

**Authorization:** User must be a member of the group

**Request Body:**
```json
{
  "expense_id": "uuid",
  "title": "Updated Dinner at Restaurant",
  "currency": "INR",
  "paid_by": "uuid",
  "amount": 1200.00,
  "splits": [
    {
      "user_id": "uuid",
      "amount": 600.00,
      "split_type": "equal"
    },
    {
      "user_id": "uuid",
      "amount": 600.00,
      "split_type": "equal"
    }
  ]
}
```

**Validation Rules:**
- Same as POST endpoint
- `expense_id` is required
- Expense must exist and belong to the specified group

**Response:**
```json
{
  "message": "Expense updated successfully",
  "expense": {
    // Full updated expense object
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed or expense doesn't belong to group
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User is not a member of the group
- `404 Not Found` - Expense not found
- `500 Internal Server Error` - Server error

---

### DELETE - Delete Expense

Deletes an expense (cascades to delete related payers and splits).

**URL:** `DELETE /api/groups/[groupId]/expenses?expense_id={uuid}`

**Authentication:** Required

**Authorization:** User must be a member of the group

**Query Parameters:**
- `expense_id` (required) - UUID of the expense to delete

**Response:**
```json
{
  "message": "Expense deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing expense_id or expense doesn't belong to group
- `401 Unauthorized` - User is not authenticated
- `403 Forbidden` - User is not a member of the group
- `404 Not Found` - Expense not found
- `500 Internal Server Error` - Server error

---

## Helper Functions

The API includes reusable helper functions that can be utilized for future ad-hoc expense features:

### `validateGroupMembership(serviceSupabase, userId, groupId)`

Validates if a user is a member of a group.

**Returns:** Membership object or null

### `validateAllUsersInGroup(serviceSupabase, userIds, groupId)`

Validates if all provided user IDs are members of the group.

**Returns:** 
```typescript
{
  valid: boolean;
  invalidUsers: string[];
}
```

### `validateExpenseData(data)`

Validates expense data structure and business rules.

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
}
```

**Validation Checks:**
- Title is required and at least 3 characters
- Group ID is required
- Payer ID is required
- Amount is positive
- At least one split exists
- All splits have valid user IDs and amounts
- Split amounts sum equals total amount
- Expense cannot be split only to the payer (must include at least one other person)

---

## Database Function

All CREATE and UPDATE operations use the `upsert_expense_from_json` database function, which:

1. Creates or updates the expense record
2. Manages expense_payers records (delete old, insert new)
3. Manages expense_splits records (delete old, insert new)
4. Ensures data consistency with transactions
5. Returns the expense UUID

**Note:** The database function has been simplified to focus on data mutation only. All validation logic is handled by the API layer for:
- Better separation of concerns
- Single source of truth for business logic
- Faster function execution
- More detailed error messages
- Easier maintenance

---

## UI Integration

### AddExpenseModal Component

The modal component integrates with the POST endpoint:

```typescript
const response = await axios.post(`/api/groups/${groupId}/expenses`, expenseData);
```

Features:
- Form validation
- Equal and exact split types
- Real-time split calculation
- Currency selection
- Member selection

### EditExpenseModal Component

The modal component integrates with the PUT endpoint:

```typescript
const response = await axios.put(`/api/groups/${groupId}/expenses`, {
  expense_id: expenseId,
  ...expenseData
});
```

Features:
- Pre-populates form with existing expense data
- Same validation as create
- Detects split type from existing data
- Updates expense and refreshes list

### ExpensesSection Component

The section component integrates with GET, PUT, and DELETE endpoints:

```typescript
// Fetch expenses
const response = await axios.get(`/api/groups/${groupId}/expenses`);

// Update expense (via EditExpenseModal)
await axios.put(`/api/groups/${groupId}/expenses`, expenseData);

// Delete expense
await axios.delete(`/api/groups/${groupId}/expenses?expense_id=${expenseId}`);
```

Features:
- Loading states
- Error handling
- Empty state
- Expense list with full details
- Edit button for each expense
- Delete functionality
- Auto-refresh after CRUD operations

---

## Future Enhancements

These helper functions are designed to be reusable for future features:

1. **Ad-hoc Expenses** (`/api/expenses`)
   - Use the same validation functions
   - Remove group_id requirement
   - Direct expense management without group context

2. **Batch Operations**
   - Use existing validators for multiple expenses
   - Extend to support bulk create/update/delete

3. **Expense Templates**
   - Reuse expense data structure
   - Add template-specific metadata

4. **Recurring Expenses**
   - Build on top of existing expense creation
   - Add scheduling logic

---

## Security

All endpoints:
- ✅ Require authentication (Supabase auth)
- ✅ Validate group membership
- ✅ Use service role client to bypass RLS (controlled by API)
- ✅ Validate all user IDs are group members
- ✅ Comprehensive input validation
- ✅ Error handling and logging

---

## Error Handling

The API implements comprehensive error handling:

1. **Authentication Errors** - Returns 401 with clear message
2. **Authorization Errors** - Returns 403 when user is not a group member
3. **Validation Errors** - Returns 400 with detailed error list
4. **Not Found Errors** - Returns 404 when expense doesn't exist
5. **Server Errors** - Returns 500 with error logging

All errors include descriptive messages to help with debugging.

