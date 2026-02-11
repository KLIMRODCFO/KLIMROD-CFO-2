-- This command adds a UNIQUE constraint to the 'klimtab_employees_security' table.
-- This is necessary for the 'upsert' operation to correctly identify conflicts
-- based on a combination of the employee and their business unit.
-- Run this command in your Supabase SQL Editor to fix the error.

ALTER TABLE public.klimtab_employees_security
ADD CONSTRAINT klimtab_employees_security_employee_id_business_unit_id_key
UNIQUE (employee_id, business_unit_id);
