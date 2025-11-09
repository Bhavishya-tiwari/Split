-- =====================================================
-- Function: upsert_expense_from_json (SIMPLIFIED)
-- Description: Creates or updates an expense with payers and splits from JSON input
-- Note: API layer handles all validations, this function focuses on data mutation
-- Author: Split App Team
-- Created: 2025-11-09
-- Updated: 2025-11-09 (Simplified - validation moved to API layer)
-- =====================================================

-- Drop function if exists (for clean re-runs)
DROP FUNCTION IF EXISTS upsert_expense_from_json(JSONB);

-- =====================================================
-- Main Function: upsert_expense_from_json (Simplified)
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_expense_from_json(expense_json JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expense_id UUID;
  v_title TEXT;
  v_group_id UUID;
  v_created_by UUID;
  v_currency TEXT;
  v_paid_by UUID;
  v_amount NUMERIC(10, 2);
  v_split JSONB;
  v_is_update BOOLEAN := FALSE;
BEGIN
  -- =====================================================
  -- STEP 1: Extract expense fields (API has already validated)
  -- =====================================================
  v_expense_id := (expense_json->>'expense_id')::UUID;
  v_title := expense_json->>'title';
  v_group_id := (expense_json->>'group_id')::UUID;
  v_created_by := (expense_json->>'created_by')::UUID;
  v_currency := COALESCE(expense_json->>'currency', 'INR');
  v_paid_by := (expense_json->>'paid_by')::UUID;
  v_amount := (expense_json->>'amount')::NUMERIC(10, 2);

  -- =====================================================
  -- STEP 2: Check if this is an update operation
  -- =====================================================
  IF v_expense_id IS NOT NULL THEN
    v_is_update := TRUE;
    
    -- Verify expense exists and get group_id if not provided
    SELECT group_id INTO v_group_id
    FROM public.expenses
    WHERE id = v_expense_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Expense with ID % does not exist', v_expense_id;
    END IF;
  END IF;

  -- =====================================================
  -- STEP 3: Handle CREATE or UPDATE
  -- =====================================================
  IF v_is_update THEN
    -- UPDATE existing expense (updated_at handled by trigger)
    UPDATE public.expenses
    SET
      title = trim(v_title),
      group_id = v_group_id,
      currency = v_currency
    WHERE id = v_expense_id;

    -- Delete existing payers and splits (we'll recreate them)
    DELETE FROM public.expense_payers WHERE expense_id = v_expense_id;
    DELETE FROM public.expense_splits WHERE expense_id = v_expense_id;

    RAISE NOTICE 'Updating expense %', v_expense_id;
  ELSE
    -- CREATE new expense (created_at and updated_at use table defaults)
    v_expense_id := gen_random_uuid();
    
    INSERT INTO public.expenses (
      id,
      title,
      group_id,
      created_by,
      currency
    ) VALUES (
      v_expense_id,
      trim(v_title),
      v_group_id,
      v_created_by,
      v_currency
    );

    RAISE NOTICE 'Creating new expense %', v_expense_id;
  END IF;

  -- =====================================================
  -- STEP 4: Create expense payer record
  -- =====================================================
  INSERT INTO public.expense_payers (
    id,
    expense_id,
    paid_by,
    amount
  ) VALUES (
    gen_random_uuid(),
    v_expense_id,
    v_paid_by,
    v_amount
  );

  -- =====================================================
  -- STEP 5: Create expense split records
  -- =====================================================
  FOR v_split IN SELECT * FROM jsonb_array_elements(expense_json->'splits')
  LOOP
    INSERT INTO public.expense_splits (
      id,
      expense_id,
      user_id,
      amount,
      split_type,
      percentage,
      shares
    ) VALUES (
      gen_random_uuid(),
      v_expense_id,
      (v_split->>'user_id')::UUID,
      (v_split->>'amount')::NUMERIC(10, 2),
      COALESCE(v_split->>'split_type', 'equal'),
      (v_split->>'percentage')::NUMERIC(5, 2),
      (v_split->>'shares')::INTEGER
    );
  END LOOP;

  -- =====================================================
  -- STEP 6: Return the expense ID
  -- =====================================================
  RETURN v_expense_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception to rollback the transaction
    RAISE;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION upsert_expense_from_json IS 
'Creates or updates an expense with payers and splits from JSON input. 
ALL VALIDATIONS ARE HANDLED BY THE API LAYER.
This function focuses on data mutation only.
Expected JSON format:
{
  "expense_id": "uuid" (optional - if provided, updates existing expense),
  "title": "Expense title",
  "group_id": "uuid" (optional - for group expenses),
  "created_by": "uuid" (required for new expenses),
  "currency": "INR" (optional, defaults to INR),
  "paid_by": "uuid",
  "amount": 100.00,
  "splits": [
    {
      "user_id": "uuid",
      "amount": 50.00,
      "split_type": "equal|exact" (optional, defaults to equal),
      "percentage": null,
      "shares": null
    }
  ]
}
Returns: UUID of the created or updated expense';

-- =====================================================
-- End of Function Definition
-- =====================================================

