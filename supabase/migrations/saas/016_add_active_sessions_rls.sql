-- Migration 016: Add RLS Policy for active_sessions
-- Fixes missing RLS policy on active_sessions table

-- Create policy for employees to view their own sessions
CREATE POLICY employees_own_sessions ON active_sessions
  FOR SELECT
  USING (
    employee_id = current_setting('app.current_employee_id', true)::UUID
  );

-- Create policy for employees to delete their own sessions (logout)
CREATE POLICY employees_delete_own_sessions ON active_sessions
  FOR DELETE
  USING (
    employee_id = current_setting('app.current_employee_id', true)::UUID
  );

-- Create policy for employees to insert their own sessions (login)
CREATE POLICY employees_insert_own_sessions ON active_sessions
  FOR INSERT
  WITH CHECK (
    employee_id = current_setting('app.current_employee_id', true)::UUID
  );

-- Admins can view all sessions for monitoring
CREATE POLICY admins_view_all_sessions ON active_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = current_setting('app.current_employee_id', true)::UUID
      AND role_name IN ('admin', 'owner')
    )
  );

COMMENT ON POLICY employees_own_sessions ON active_sessions IS 'Employees can only view their own sessions';
COMMENT ON POLICY admins_view_all_sessions ON active_sessions IS 'Admins can view all active sessions for monitoring';
