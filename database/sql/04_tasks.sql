-- Tabla: tasks
-- Tarea asignable a un miembro de un equipo.
-- Requiere que 01_profiles.sql, 02_teams.sql ya estén ejecutados.

CREATE TABLE tasks (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date        DATE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_hours DECIMAL NOT NULL,
  assigned_to     UUID REFERENCES profiles(id),
  created_by      UUID REFERENCES profiles(id),
  team_id         UUID REFERENCES teams(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
