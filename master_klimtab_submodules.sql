-- SQL to create the submodules table for KLIMTAB modules in Supabase
CREATE TABLE master_klimtab_submodules (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES master_klimtab_modules(id) ON DELETE CASCADE,
  submodule_code TEXT NOT NULL,
  submodule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (module_id, submodule_code)
);

-- Insert submodules for CHEF MANAGEMENT module
-- Replace 2 with the actual id of CHEF MANAGEMENT in your database if different
INSERT INTO master_klimtab_submodules (module_id, submodule_code, submodule_name, description) VALUES
  (2, 'DASHBOARD', 'Dashboard', 'Dashboard for chef management.'),
  (2, 'RECIPES', 'Recipes', 'Recipes management.'),
  (2, 'RECIPES_DIRECTORY', 'Recipes Directory', 'Directory of all recipes.'),
  (2, 'FOOD_MENU', 'Food Menu', 'Food menu management.'),
  (2, 'FOOD_INVENTORY', 'Food Inventory', 'Inventory of food items.'),
  (2, 'INGREDIENT_COSTS', 'Ingredient Costs', 'Ingredient cost tracking.'),
  (2, 'FOOD_ORDERS', 'Food Orders', 'Management of food orders.'),
  (2, 'ORDERS_DIRECTORY', 'Orders Directory', 'Directory of all orders.'),
  (2, 'BOH_DIRECTORY', 'BOH Directory', 'Back of house directory.'),
  (2, 'BOH_PAYROLL', 'BOH Payroll', 'Back of house payroll management.');

-- Insert submodules for HR MANAGEMENT module
-- Replace 7 with the actual id of HR MANAGEMENT in your database if different
INSERT INTO master_klimtab_submodules (module_id, submodule_code, submodule_name, description) VALUES
  (5, 'QUICK_ONBOARDING', 'Quick Onboarding', 'Module for rapid employee onboarding.'),
  (5, 'HIRING_PROCESS', 'Hiring Process', 'Module for managing the hiring process.'),
  (5, 'TIME_ATTENDANCE', 'Time & Attendance', 'Module for tracking time and attendance.'),
  (5, 'GRATUITY_REPORT', 'Gratuity Report', 'Module for gratuity reporting.'),
  (5, 'PAYROLL_SUMMARY', 'Payroll Summary', 'Module for payroll summary and management.'),
  (5, 'PERFORMANCE_REPORT', 'Performance Report', 'Module for employee performance reporting.'),
  (5, 'STAFF_DIRECTORY', 'Staff Directory', 'Module for managing the staff directory.');
