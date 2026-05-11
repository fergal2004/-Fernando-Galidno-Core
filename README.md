# 📋 Task Manager — Sistema de Gestión de Tareas

## Descripción

Sistema web de gestión de tareas con asignación inteligente basada en carga de trabajo. Permite crear equipos, asignar tareas a miembros y visualizar quién está más ocupado para distribuir el trabajo equitativamente.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 |
| Backend | Laravel 13 (API REST) |
| Base de Datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth (JWT) |

---

## Arquitectura MVC

El proyecto sigue el patrón **Modelo–Vista–Controlador** adaptado a una arquitectura desacoplada:

- **Modelo:** Clases Eloquent ORM en Laravel (`Task`, `Profile`, `Team`, `TeamMember`) conectadas a la base de datos PostgreSQL alojada en Supabase.
- **Vista:** SPA en React que reemplaza las vistas Blade tradicionales de Laravel. El frontend consume la API REST y gestiona la interfaz de usuario de forma independiente.
- **Controlador:** Laravel Controllers (`TaskController`, `ProfileController`, `TeamController`, `WorkloadController`) que contienen la lógica de negocio, las validaciones y responden en JSON.

La seguridad se implementa en dos capas: rutas protegidas con `ProtectedRoute` en React y middleware `SupabaseAuth` en Laravel que valida el JWT en cada request.

---

## Estructura del Proyecto

```
task-manager/
├── backend/                        # API REST — Laravel 13
│   ├── app/
│   │   ├── Models/
│   │   │   ├── Task.php
│   │   │   ├── Profile.php
│   │   │   ├── Team.php
│   │   │   └── TeamMember.php
│   │   └── Http/
│   │       ├── Controllers/
│   │       │   ├── TaskController.php
│   │       │   ├── ProfileController.php
│   │       │   ├── TeamController.php
│   │       │   └── WorkloadController.php
│   │       └── Middleware/
│   │           └── SupabaseAuth.php
│   ├── routes/
│   │   └── api.php
│   ├── bootstrap/
│   │   └── app.php
│   ├── composer.json
│   └── .env.example
│
└── frontend/                       # SPA — React 19
    └── src/
        ├── supabaseClient.js
        ├── api.js
        ├── App.js
        ├── pages/
        │   ├── Login.js
        │   ├── Dashboard.js
        │   ├── Teams.js
        │   ├── Users.js
        │   └── Workload.js
        └── components/
            ├── ProtectedRoute.js
            └── Layout.js
```

---

## Requisitos Previos

- PHP 8+
- Composer
- Node.js 18+
- npm
- Cuenta en Supabase

---

## Instalación

### Backend

```bash
cd backend
composer install
cp .env.example .env
# Configurar variables de entorno (ver abajo)
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
# Configurar supabaseClient.js con tus credenciales
npm start
```

---

## Variables de Entorno

Configura `backend/.env` con las siguientes variables (sin valores reales):

```env
DB_CONNECTION=pgsql
DB_HOST=
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=
DB_PASSWORD=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

---

## Funcionalidades Principales

- Autenticación con email/contraseña (registro e inicio de sesión)
- CRUD de usuarios con validación de email único (backend)
- CRUD de equipos con gestión de miembros
- CRUD de tareas con dropdowns en cascada (equipo → miembros)
- Validación backend: usuario asignado debe pertenecer al equipo
- Validación backend: horas estimadas entre 0.5 y 40
- Dashboard de carga de trabajo por equipo y rango de fechas
- Sugerencia automática de asignación (miembro con menor carga)
- Indicadores visuales de carga: Baja (verde), Media (amarillo), Alta (rojo)
- Rutas protegidas: no se accede sin autenticación

---

## Validaciones Backend

- Email único al crear/editar usuarios
- Horas estimadas: min 0.5, max 40
- El usuario asignado debe ser miembro del equipo seleccionado
- Prioridad solo acepta: `low`, `medium`, `high`
- Status solo acepta: `pending`, `in_progress`, `completed`
- Todos los FKs validados con `exists`

---

## Autor

**Fernando Gallegos**
Proyecto desarrollado para la asignatura de Ingeniería Web.
