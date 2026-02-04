-- SQL para crear la tabla de apps de KLIMTAB en Supabase
CREATE TABLE master_klimtab_apps (
  id SERIAL PRIMARY KEY,
  app_code TEXT UNIQUE NOT NULL,
  app_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insertar las apps principales
INSERT INTO master_klimtab_apps (app_code, app_name, description) VALUES
  ('SHIFT', 'KLIMTAB SHIFT', 'App para paystubs, gratuity report, etc. (siempre asignada)'),
  ('CEO', 'KLIMTAB CEO', 'App para funciones ejecutivas'),
  ('CFO', 'KLIMTAB CFO', 'App para gestión financiera'),
  ('MANAGEMENT', 'KLIMTAB MANAGEMENT', 'App para gestión administrativa');
