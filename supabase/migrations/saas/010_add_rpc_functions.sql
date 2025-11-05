-- ==========================================
-- Migration 010: Add RPC Functions for Multi-Tenant Context
-- Critical for Row-Level Security (RLS)
-- ==========================================

-- ==========================================
-- FUNCTION: Set Business Context
-- Used by middleware to set current business for RLS
-- ==========================================
CREATE OR REPLACE FUNCTION set_business_context(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Set configuration variable that RLS policies can read
  PERFORM set_config('app.current_business_id', p_business_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_business_context IS 'Sets the current business context for Row-Level Security policies';

-- ==========================================
-- FUNCTION: Set Employee Context
-- Used by middleware to set current employee for RLS
-- ==========================================
CREATE OR REPLACE FUNCTION set_employee_context(p_employee_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Set configuration variable that RLS policies can read
  PERFORM set_config('app.current_employee_id', p_employee_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_employee_context IS 'Sets the current employee context for Row-Level Security policies';

-- ==========================================
-- FUNCTION: Get Current Business ID
-- Helper to retrieve current business from context
-- ==========================================
CREATE OR REPLACE FUNCTION get_current_business_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_business_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- FUNCTION: Get Current Employee ID
-- Helper to retrieve current employee from context
-- ==========================================
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_employee_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- TEST: Verify functions work
-- ==========================================
DO $$
DECLARE
  test_business_id UUID := '00000000-0000-0000-0000-000000000000';
  test_employee_id UUID := '11111111-1111-1111-1111-111111111111';
  retrieved_business_id UUID;
  retrieved_employee_id UUID;
BEGIN
  -- Test business context
  PERFORM set_business_context(test_business_id);
  retrieved_business_id := get_current_business_id();

  IF retrieved_business_id != test_business_id THEN
    RAISE EXCEPTION 'Business context test failed';
  END IF;

  -- Test employee context
  PERFORM set_employee_context(test_employee_id);
  retrieved_employee_id := get_current_employee_id();

  IF retrieved_employee_id != test_employee_id THEN
    RAISE EXCEPTION 'Employee context test failed';
  END IF;

  RAISE NOTICE 'RPC functions test passed!';
END $$;

-- ==========================================
-- END OF MIGRATION 010
-- ==========================================
