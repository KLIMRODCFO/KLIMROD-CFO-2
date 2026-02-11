-- Add platform_id column to klimtab_employees_security table referencing master_platforms(id)

ALTER TABLE klimtab_employees_security
ADD COLUMN platform_id INTEGER REFERENCES master_platforms(id);
