-- SQL to create the modules table for KLIMTAB apps in Supabase
CREATE TABLE master_klimtab_modules (
  id SERIAL PRIMARY KEY,
  app_id INTEGER REFERENCES master_klimtab_apps(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (app_id, module_code)
);

-- Insert modules for KLIMTAB MANAGEMENT app
-- Replace 4 with the actual id of KLIMTAB MANAGEMENT in your database if different
INSERT INTO master_klimtab_modules (app_id, module_code, module_name, description) VALUES
  (4, 'OPERATIONAL', 'Operational Management', 'Module for operational management tasks.'),
  (4, 'CHEF', 'Chef Management', 'Module for kitchen and chef management.'),
  (4, 'BAR', 'Bar Management', 'Module for bar operations and management.'),
  (4, 'SOMMELIER', 'Sommelier Management', 'Module for sommelier and wine management.'),
  (4, 'HR', 'HR Management', 'Module for human resources management.');
