-- Tablas: practices, skills, user_skills, projects
-- ALTER: profiles.weekly_hours_capacity, tasks.project_id
-- Requiere: 01_profiles.sql, 02_teams.sql, 04_tasks.sql

-- ── Practices (catálogo de tipos de proyecto) ──────────────────────────────
CREATE TABLE practices (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Skills (catálogo de habilidades, cada una pertenece a una práctica) ────
CREATE TABLE skills (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── user_skills (usuario ↔ habilidades, muchos a muchos) ──────────────────
CREATE TABLE user_skills (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id   UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- ── Projects (contenedor de tareas con tipo de práctica) ──────────────────
CREATE TABLE projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  team_id     UUID REFERENCES teams(id) ON DELETE SET NULL,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── ALTER profiles: capacidad horaria semanal ─────────────────────────────
ALTER TABLE profiles
  ADD COLUMN weekly_hours_capacity INTEGER NOT NULL DEFAULT 40
  CONSTRAINT profiles_weekly_hours_capacity_check CHECK (weekly_hours_capacity BETWEEN 1 AND 80);

-- ── ALTER tasks: proyecto al que pertenece la tarea ───────────────────────
ALTER TABLE tasks
  ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- ── Seed: prácticas ───────────────────────────────────────────────────────
INSERT INTO practices (name, description) VALUES
  ('Mobile',     'Desarrollo de aplicaciones móviles iOS/Android'),
  ('E-commerce', 'Plataformas de comercio electrónico'),
  ('SMS',        'Soluciones de mensajería SMS y notificaciones'),
  ('Web',        'Desarrollo web frontend y backend'),
  ('Backend',    'APIs, microservicios y arquitectura de servidor'),
  ('DevOps',     'Infraestructura, CI/CD y despliegue');

-- ── Seed: skills básicas por práctica ────────────────────────────────────
INSERT INTO skills (name, practice_id) SELECT 'React Native',   id FROM practices WHERE name = 'Mobile';
INSERT INTO skills (name, practice_id) SELECT 'Flutter',        id FROM practices WHERE name = 'Mobile';
INSERT INTO skills (name, practice_id) SELECT 'Swift',          id FROM practices WHERE name = 'Mobile';
INSERT INTO skills (name, practice_id) SELECT 'Kotlin',         id FROM practices WHERE name = 'Mobile';
INSERT INTO skills (name, practice_id) SELECT 'WooCommerce',    id FROM practices WHERE name = 'E-commerce';
INSERT INTO skills (name, practice_id) SELECT 'Shopify',        id FROM practices WHERE name = 'E-commerce';
INSERT INTO skills (name, practice_id) SELECT 'Magento',        id FROM practices WHERE name = 'E-commerce';
INSERT INTO skills (name, practice_id) SELECT 'Twilio',         id FROM practices WHERE name = 'SMS';
INSERT INTO skills (name, practice_id) SELECT 'Firebase FCM',   id FROM practices WHERE name = 'SMS';
INSERT INTO skills (name, practice_id) SELECT 'React',          id FROM practices WHERE name = 'Web';
INSERT INTO skills (name, practice_id) SELECT 'Vue.js',         id FROM practices WHERE name = 'Web';
INSERT INTO skills (name, practice_id) SELECT 'Angular',        id FROM practices WHERE name = 'Web';
INSERT INTO skills (name, practice_id) SELECT 'Laravel',        id FROM practices WHERE name = 'Backend';
INSERT INTO skills (name, practice_id) SELECT 'Node.js',        id FROM practices WHERE name = 'Backend';
INSERT INTO skills (name, practice_id) SELECT 'Django',         id FROM practices WHERE name = 'Backend';
INSERT INTO skills (name, practice_id) SELECT 'Docker',         id FROM practices WHERE name = 'DevOps';
INSERT INTO skills (name, practice_id) SELECT 'Kubernetes',     id FROM practices WHERE name = 'DevOps';
INSERT INTO skills (name, practice_id) SELECT 'GitHub Actions', id FROM practices WHERE name = 'DevOps';
