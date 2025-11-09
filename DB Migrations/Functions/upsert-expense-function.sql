-- =====================================================
-- Function: upsert_expense_from_json
-- Description: Creates or updates an expense with payers and splits from JSON input
-- Author: Split App Team
-- Created: 2025-11-09
-- =====================================================

-- Drop function if exists (for clean re-runs)
DROP FUNCTION IF EXISTS upsert_expense_from_json(JSONB);

-- =====================================================
-- Main Function: upsert_expense_from_json
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
  v_total_split_amount NUMERIC(10, 2) := 0;
  v_current_timestamp TIMESTAMP WITH TIME ZONE := NOW();
  v_is_update BOOLEAN := FALSE;
  v_existing_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- =====================================================
  -- STEP 1: Extract and validate main expense fields
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
    
    -- Verify expense exists
    SELECT created_at, group_id INTO v_existing_created_at, v_group_id
    FROM public.expenses
    WHERE id = v_expense_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Expense with ID % does not exist', v_expense_id;
    END IF;
    
    -- For updates, preserve existing group_id if not provided in JSON
    IF expense_json->>'group_id' IS NULL THEN
      v_group_id := v_group_id;
    END IF;
  END IF;

  -- =====================================================
  -- STEP 3: Validate required fields
  -- =====================================================
  IF v_title IS NULL OR trim(v_title) = '' THEN
    RAISE EXCEPTION 'Expense title is required';
  END IF;

  IF v_created_by IS NULL THEN
    RAISE EXCEPTION 'Created by user ID is required';
  END IF;

  IF v_paid_by IS NULL THEN
    RAISE EXCEPTION 'Paid by user ID is required';
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(expense_json->'splits')) THEN
    RAISE EXCEPTION 'At least one split is required';
  END IF;

  -- =====================================================
  -- STEP 4: Validate group and membership (if group_id provided)
  -- =====================================================
  IF v_group_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = v_group_id) THEN
      RAISE EXCEPTION 'Group with ID % does not exist', v_group_id;
    END IF;

    -- Validate that the payer is a member of the group
    IF NOT EXISTS (
      SELECT 1 FROM public.user_group_mapping 
      WHERE group_id = v_group_id AND user_id = v_paid_by
    ) THEN
      RAISE EXCEPTION 'Payer is not a member of the group';
    END IF;
  END IF;

  -- =====================================================
  -- STEP 5: Handle CREATE or UPDATE
  -- =====================================================
  IF v_is_update THEN
    -- UPDATE existing expense
    UPDATE public.expenses
    SET
      title = trim(v_title),
      group_id = v_group_id,
      currency = v_currency,
      updated_at = v_current_timestamp
    WHERE id = v_expense_id;

    -- Delete existing payers and splits (we'll recreate them)
    DELETE FROM public.expense_payers WHERE expense_id = v_expense_id;
    DELETE FROM public.expense_splits WHERE expense_id = v_expense_id;

    RAISE NOTICE 'Updating expense %', v_expense_id;
  ELSE
    -- CREATE new expense
    v_expense_id := gen_random_uuid();
    
    INSERT INTO public.expenses (
      id,
      title,
      group_id,
      created_by,
      currency,
      created_at,
      updated_at
    ) VALUES (
      v_expense_id,
      trim(v_title),
      v_group_id,
      v_created_by,
      v_currency,
      v_current_timestamp,
      v_current_timestamp
    );

    RAISE NOTICE 'Creating new expense %', v_expense_id;
  END IF;

  -- =====================================================
  -- STEP 6: Create expense payer record
  -- =====================================================
  INSERT INTO public.expense_payers (
    id,
    expense_id,
    paid_by,
    amount,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_expense_id,
    v_paid_by,
    v_amount,
    v_current_timestamp,
    v_current_timestamp
  );

  -- =====================================================
  -- STEP 7: Create expense split records
  -- =====================================================
  FOR v_split IN SELECT * FROM jsonb_array_elements(expense_json->'splits')
  LOOP
    DECLARE
      v_split_user_id UUID;
      v_split_amount NUMERIC(10, 2);
      v_split_type TEXT;
    BEGIN
      v_split_user_id := (v_split->>'user_id')::UUID;
      v_split_amount := (v_split->>'amount')::NUMERIC(10, 2);
      v_split_type := COALESCE(v_split->>'split_type', 'equal');

      -- Validate split fields
      IF v_split_user_id IS NULL THEN
        RAISE EXCEPTION 'Split user_id is required';
      END IF;

      IF v_split_amount IS NULL OR v_split_amount < 0 THEN
        RAISE EXCEPTION 'Split amount must be greater than or equal to 0';
      END IF;

      -- Validate that split user is a member of the group (only if group_id is provided)
      IF v_group_id IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.user_group_mapping 
          WHERE group_id = v_group_id AND user_id = v_split_user_id
        ) THEN
          RAISE EXCEPTION 'Split user with ID % is not a member of the group', v_split_user_id;
        END IF;
      END IF;

      -- Validate split_type (only 'equal' and 'exact' are supported)
      IF v_split_type NOT IN ('equal', 'exact') THEN
        RAISE EXCEPTION 'Invalid split_type: %. Must be either ''equal'' or ''exact''', v_split_type;
      END IF;

      -- Insert split record
      INSERT INTO public.expense_splits (
        id,
        expense_id,
        user_id,
        amount,
        split_type,
        percentage,
        shares,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        v_expense_id,
        v_split_user_id,
        v_split_amount,
        v_split_type,
        NULL,  -- Not used for equal/exact splits
        NULL,  -- Not used for equal/exact splits
        v_current_timestamp,
        v_current_timestamp
      );

      -- Accumulate total split amount
      v_total_split_amount := v_total_split_amount + v_split_amount;
    END;
  END LOOP;

  -- =====================================================
  -- STEP 8: Validate total split amounts
  -- =====================================================
  IF ABS(v_total_split_amount - v_amount) > 0.01 THEN
    RAISE EXCEPTION 'Total split amounts (%) must equal the paid amount (%)', v_total_split_amount, v_amount;
  END IF;

  -- =====================================================
  -- STEP 9: Return the expense ID
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
If expense_id is provided in JSON, updates existing expense. Otherwise creates new expense.
Expected JSON format:
{
  "expense_id": "uuid" (optional - if provided, updates existing expense),
  "title": "Expense title",
  "group_id": "uuid" (optional - for group expenses, can be NULL for personal expenses),
  "created_by": "uuid" (required for new expenses),
  "currency": "INR" (optional, defaults to INR),
  "paid_by": "uuid",
  "amount": 100.00,
  "splits": [
    {
      "user_id": "uuid",
      "amount": 50.00,
      "split_type": "equal|exact" (optional, defaults to equal)
    }
  ]
}
Returns: UUID of the created or updated expense';

-- =====================================================
-- End of Function Definition
-- =====================================================

