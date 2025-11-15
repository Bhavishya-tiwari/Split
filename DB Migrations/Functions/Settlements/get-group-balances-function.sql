-- =====================================================
-- Function: get_user_balance
-- Description: Calculate balance details for a specific user in a group
-- Returns: user's balance, who they owe, and who owes them
-- Note: Only calculates for the logged-in user (more efficient)
-- Author: Split App Team
-- Created: 2025-01-XX
-- =====================================================

-- Drop function if exists (for clean re-runs)
DROP FUNCTION IF EXISTS public.get_user_balance(UUID, UUID);

-- =====================================================
-- Main Function: get_user_balance
-- Explicitly create in public schema
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_balance(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  user_id UUID,
  total_paid DECIMAL(10,2),
  total_owed DECIMAL(10,2),
  net_balance DECIMAL(10,2),
  owes_to JSONB,
  owed_by JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_paid DECIMAL(10,2) := 0;
  v_total_owed DECIMAL(10,2) := 0;
  v_net_balance DECIMAL(10,2) := 0;
  v_owes_to JSONB := '[]'::JSONB;
  v_owed_by JSONB := '[]'::JSONB;
BEGIN
  -- Step 1: Calculate total paid by user (from expenses)
  SELECT COALESCE(SUM(ep.amount), 0)::DECIMAL(10,2)
  INTO v_total_paid
  FROM expense_payers ep
  JOIN expenses e ON e.id = ep.expense_id
  WHERE e.group_id = p_group_id
    AND ep.paid_by = p_user_id;

  -- Step 2: Calculate total owed by user (from expense splits)
  SELECT COALESCE(SUM(es.amount), 0)::DECIMAL(10,2)
  INTO v_total_owed
  FROM expense_splits es
  JOIN expenses e ON e.id = es.expense_id
  WHERE e.group_id = p_group_id
    AND es.user_id = p_user_id;

  -- Step 3: Calculate net balance including payments
  -- Payments made by user (increases balance - they're paying someone)
  SELECT COALESCE(SUM(p.amount), 0)::DECIMAL(10,2)
  INTO v_net_balance
  FROM payments p
  WHERE p.group_id = p_group_id
    AND p.from_user_id = p_user_id;

  -- Payments received by user (decreases balance - they received payment)
  v_net_balance := v_net_balance - COALESCE((
    SELECT SUM(p.amount)
    FROM payments p
    WHERE p.group_id = p_group_id
      AND p.to_user_id = p_user_id
  ), 0);

  -- Calculate final net balance
  v_net_balance := v_total_paid + v_net_balance - v_total_owed;

  -- Step 4: Calculate who the user owes
  -- For expenses where user has a split, distribute their split amount proportionally to each payer
  -- If user also paid, they don't owe that portion to themselves
  WITH expense_debts AS (
    SELECT 
      ep.paid_by as creditor_id,
      SUM(
        -- User's split amount * (this payer's amount / total paid by all payers)
        es.amount * (ep.amount::DECIMAL / NULLIF(
          (SELECT SUM(ep2.amount) FROM expense_payers ep2 WHERE ep2.expense_id = e.id), 
          0
        ))
      ) as debt_amount
    FROM expense_splits es
    JOIN expenses e ON e.id = es.expense_id
    JOIN expense_payers ep ON ep.expense_id = e.id
    WHERE e.group_id = p_group_id
      AND es.user_id = p_user_id
      AND ep.paid_by != p_user_id  -- Don't owe to yourself
    GROUP BY ep.paid_by
  ),
  -- Subtract payments made to each creditor
  net_debts AS (
    SELECT 
      ed.creditor_id,
      (ed.debt_amount - COALESCE(pm.amount, 0))::DECIMAL(10,2) as final_debt
    FROM expense_debts ed
    LEFT JOIN (
      SELECT to_user_id, SUM(amount) as amount
      FROM payments
      WHERE group_id = p_group_id AND from_user_id = p_user_id
      GROUP BY to_user_id
    ) pm ON pm.to_user_id = ed.creditor_id
    WHERE (ed.debt_amount - COALESCE(pm.amount, 0)) > 0.01
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('user_id', creditor_id, 'amount', final_debt)
      ORDER BY final_debt DESC
    ),
    '[]'::JSONB
  )
  INTO v_owes_to
  FROM net_debts;

  -- Step 5: Calculate who owes the user
  -- For expenses where user paid, calculate how much each split member owes them
  -- Distribute each split amount proportionally based on how much the user paid
  WITH expense_credits AS (
    SELECT 
      es.user_id as debtor_id,
      SUM(
        -- Split amount * (user's payment / total paid by all payers)
        es.amount * (ep.amount::DECIMAL / NULLIF(
          (SELECT SUM(ep2.amount) FROM expense_payers ep2 WHERE ep2.expense_id = e.id), 
          0
        ))
      ) as credit_amount
    FROM expense_payers ep
    JOIN expenses e ON e.id = ep.expense_id
    JOIN expense_splits es ON es.expense_id = e.id
    WHERE e.group_id = p_group_id
      AND ep.paid_by = p_user_id  -- User paid for this expense
      AND es.user_id != p_user_id  -- Don't count user's own split
    GROUP BY es.user_id
  ),
  -- Subtract payments received from each debtor
  net_credits AS (
    SELECT 
      ec.debtor_id,
      (ec.credit_amount - COALESCE(pr.amount, 0))::DECIMAL(10,2) as final_credit
    FROM expense_credits ec
    LEFT JOIN (
      SELECT from_user_id, SUM(amount) as amount
      FROM payments
      WHERE group_id = p_group_id AND to_user_id = p_user_id
      GROUP BY from_user_id
    ) pr ON pr.from_user_id = ec.debtor_id
    WHERE (ec.credit_amount - COALESCE(pr.amount, 0)) > 0.01
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('user_id', debtor_id, 'amount', final_credit)
      ORDER BY final_credit DESC
    ),
    '[]'::JSONB
  )
  INTO v_owed_by
  FROM net_credits;

  -- Return single row with all information
  RETURN QUERY
  SELECT 
    p_user_id as user_id,
    v_total_paid as total_paid,
    v_total_owed as total_owed,
    v_net_balance as net_balance,
    v_owes_to as owes_to,
    v_owed_by as owed_by;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_balance(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_balance(UUID, UUID) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION public.get_user_balance IS 
'Calculates balance details for a specific user in a group. Returns user_id, total_paid, total_owed, net_balance, owes_to (JSONB array of users and amounts the user owes), and owed_by (JSONB array of users and amounts who owe the user). Only calculates for the specified user, making it more efficient than calculating all group balances.';

-- =====================================================
-- End of Function Definition
-- =====================================================
