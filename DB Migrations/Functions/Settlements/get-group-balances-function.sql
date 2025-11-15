-- =====================================================
-- Function: get_group_balances
-- Description: Calculate balances for all members in a group
-- Returns: user_id, total_paid, total_owed, balance
-- Note: Includes manual payments in balance calculation
-- Author: Split App Team
-- Created: 2025-11-10
-- =====================================================

-- Drop function if exists (for clean re-runs)
DROP FUNCTION IF EXISTS get_group_balances(UUID);

-- =====================================================
-- Main Function: get_group_balances
-- =====================================================
CREATE OR REPLACE FUNCTION get_group_balances(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  total_paid DECIMAL(10,2),
  total_owed DECIMAL(10,2),
  balance DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Step 1: Calculate total paid by each member (from expenses)
  user_paid_expenses AS (
    SELECT 
      ep.paid_by as user_id,
      SUM(ep.amount) as paid
    FROM expense_payers ep
    JOIN expenses e ON e.id = ep.expense_id
    WHERE e.group_id = p_group_id
    GROUP BY ep.paid_by
  ),
  
  -- Step 2: Calculate total owed by each member (from expense splits)
  user_owed AS (
    SELECT 
      es.user_id,
      SUM(es.amount) as owed
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    WHERE e.group_id = p_group_id
    GROUP BY es.user_id
  ),
  
  -- Step 3: Calculate payments made (from_user_id pays, so their balance increases)
  user_payments_made AS (
    SELECT 
      p.from_user_id as user_id,
      SUM(p.amount) as payments_made
    FROM payments p
    WHERE p.group_id = p_group_id
    GROUP BY p.from_user_id
  ),
  
  -- Step 4: Calculate payments received (to_user_id receives, so their balance decreases)
  user_payments_received AS (
    SELECT 
      p.to_user_id as user_id,
      SUM(p.amount) as payments_received
    FROM payments p
    WHERE p.group_id = p_group_id
    GROUP BY p.to_user_id
  ),
  
  -- Step 5: Get all group members (including those with no expenses)
  all_users AS (
    SELECT DISTINCT user_id
    FROM user_group_mapping
    WHERE group_id = p_group_id
  )
  
  -- Step 6: Combine everything with LEFT JOINs
  -- Balance = (paid from expenses) + (payments made) - (owed from splits) - (payments received)
  -- Note: total_paid and total_owed only reflect expenses, not manual payments
  -- Manual payments are only reflected in the balance calculation
  SELECT 
    au.user_id,
    COALESCE(paid_exp.paid, 0) as total_paid,
    COALESCE(owed.owed, 0) as total_owed,
    COALESCE(paid_exp.paid, 0) + COALESCE(paid_made.payments_made, 0) 
      - COALESCE(owed.owed, 0) 
      - COALESCE(paid_rec.payments_received, 0) as balance
  FROM all_users au
  LEFT JOIN user_paid_expenses paid_exp ON paid_exp.user_id = au.user_id
  LEFT JOIN user_owed owed ON owed.user_id = au.user_id
  LEFT JOIN user_payments_made paid_made ON paid_made.user_id = au.user_id
  LEFT JOIN user_payments_received paid_rec ON paid_rec.user_id = au.user_id;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION get_group_balances IS 
'Calculates balances for all members in a group.

Returns:
- user_id: UUID of the group member
- total_paid: Total amount paid by this user for expenses (does NOT include manual payments)
- total_owed: Total amount owed by this user from expense splits (does NOT include payments received)
- balance: Net balance = (expense_payments + payments_made) - (expense_splits + payments_received)

The balance field accounts for:
1. Money paid for expenses (increases balance)
2. Money owed from expense splits (decreases balance)
3. Manual payments made to settle debts (increases balance)
4. Manual payments received (decreases balance)

Example usage:
SELECT * FROM get_group_balances('your-group-uuid-here');

Performance:
- Uses indexes on group_id, expense_id, from_user_id, to_user_id
- Aggregates in database (single round-trip)
- Efficient for groups with up to 100k expenses';

-- =====================================================
-- End of Function Definition
-- =====================================================

