-- Tabla: team_members
-- Relación muchos-a-muchos entre teams y profiles.
-- Requiere que 01_profiles.sql y 02_teams.sql ya estén ejecutados.

CREATE TABLE team_members (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);
