# 📋 Task Manager

Aplicación web full-stack de **gestión de tareas** con autenticación de usuarios. Cada usuario puede crear, editar, completar y eliminar únicamente sus propias tareas, garantizando la privacidad mediante JWT y filtros a nivel de base de datos.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Laravel](https://img.shields.io/badge/Laravel_13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)

---

## 📑 Tabla de contenidos

- [Descripción](#-descripción)
- [Funcionalidades](#-funcionalidades)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Prerequisitos](#-prerequisitos)
- [Instalación](#-instalación)
- [Variables de entorno](#-variables-de-entorno)
- [Ejecución en desarrollo](#-ejecución-en-desarrollo)
- [Flujo de autenticación](#-flujo-de-autenticación)
- [Patrón MVC aplicado](#-patrón-mvc-aplicado)
- [Capturas de pantalla](#-capturas-de-pantalla)
- [Autor](#-autor)

---

## 📖 Descripción

**Task Manager** es una SPA (Single Page Application) que permite a los usuarios gestionar sus tareas personales de forma segura. Está construida como una aplicación full-stack desacoplada: un frontend en **React** que consume una **API REST** en **Laravel 13**, con **PostgreSQL** como base de datos (alojado en **Supabase**) y autenticación gestionada por **Supabase Auth** mediante tokens JWT.

El proyecto implementa el patrón **MVC** clásico de Laravel, donde las vistas Blade tradicionales son reemplazadas por una SPA de React, y aplica una **doble capa de seguridad**: rutas protegidas en el frontend y middleware de validación JWT en el backend.

---

## ✨ Funcionalidades

- 🔐 **Registro e inicio de sesión** con email y contraseña (Supabase Auth).
- ✅ **CRUD completo** de tareas: crear, leer, editar y eliminar.
- 🔄 **Cambio de estado** de tareas entre `pendiente` y `completada`.
- 📅 **Fecha de vencimiento** opcional para cada tarea.
- 🛡️ **Rutas protegidas**: no se puede acceder al CRUD sin autenticación.
- 🧍 **Aislamiento por usuario**: cada usuario solo ve sus propias tareas (filtro por `user_id`).
- 🔒 **Doble capa de seguridad**:
  - Frontend: componente `ProtectedRoute` bloquea rutas sin sesión activa.
  - Backend: middleware `SupabaseAuth` valida el JWT en cada request.

---

## 🏗️ Arquitectura

```
┌─────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│                 │  HTTP   │                     │   SQL   │                  │
│   React SPA     │ ──────► │   Laravel 13 API    │ ──────► │  Supabase        │
│   (frontend)    │  JWT    │   (backend)         │         │  PostgreSQL      │
│                 │ ◄────── │                     │ ◄────── │                  │
└─────────────────┘         └─────────────────────┘         └──────────────────┘
        │                            │
        │                            └── Middleware SupabaseAuth valida JWT
        │
        └── supabaseClient.js obtiene el JWT desde Supabase Auth
```

El patrón **MVC** se aplica en el backend:

- **Modelo (M):** `Task.php` — Eloquent ORM conectado a PostgreSQL (Supabase).
- **Vista (V):** `React SPA` — reemplaza las vistas Blade tradicionales de Laravel.
- **Controlador (C):** `TaskController.php` — contiene la lógica CRUD y filtra tareas por `user_id`.

---

## 🛠️ Tecnologías

### Frontend
- **React** (Create React App)
- **React Router DOM** — ruteo y rutas protegidas
- **Axios / Fetch API** — consumo de la API REST
- **@supabase/supabase-js** — cliente oficial de Supabase Auth

### Backend
- **Laravel 13** — framework PHP
- **Eloquent ORM** — capa de acceso a datos
- **firebase/php-jwt** — validación de tokens JWT emitidos por Supabase
- **Laravel Middleware** — validación de autenticación por request

### Base de datos & Auth
- **PostgreSQL** (alojado en Supabase)
- **Supabase Auth** — registro, login y emisión de JWT

---

## 📁 Estructura del proyecto

```
task-manager/
├── backend/                        # API REST en Laravel 13
│   ├── app/
│   │   ├── Models/
│   │   │   └── Task.php            # Modelo Eloquent (tabla tasks)
│   │   └── Http/
│   │       ├── Controllers/
│   │       │   └── TaskController.php   # Lógica CRUD
│   │       └── Middleware/
│   │           └── SupabaseAuth.php     # Valida JWT de Supabase
│   ├── routes/
│   │   └── api.php                 # Rutas protegidas del CRUD
│   ├── bootstrap/
│   │   └── app.php                 # Registro de middlewares
│   └── .env                        # Variables de entorno
│
└── frontend/                       # SPA en React
    └── src/
        ├── supabaseClient.js       # Cliente Supabase (auth)
        ├── api.js                  # Llamadas a la API de Laravel
        ├── App.js                  # Rutas principales
        ├── pages/
        │   ├── Login.js            # Pantalla de login/registro
        │   └── Dashboard.js        # CRUD de tareas
        └── components/
            └── ProtectedRoute.js   # HOC para proteger rutas
```

---

## 📦 Prerequisitos

Antes de instalar, asegúrate de tener instalado:

| Herramienta         | Versión mínima | Comprobación         |
| ------------------- | -------------- | -------------------- |
| **PHP**             | 8.2+           | `php -v`             |
| **Composer**        | 2.x            | `composer --version` |
| **Node.js**         | 18.x+          | `node -v`            |
| **npm**             | 9.x+           | `npm -v`             |
| **Cuenta Supabase** | Gratuita       | [supabase.com](https://supabase.com) |

Además, necesitarás un **proyecto en Supabase** con la tabla `tasks` creada y las credenciales de API (URL, `anon key`, `service_role key` y `JWT secret`).

---

## ⚙️ Instalación

Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd task-manager
```

### 🔧 Backend (Laravel)

```bash
cd backend

# Instalar dependencias de PHP
composer install

# Copiar el archivo de entorno
cp .env.example .env

# Generar la key de aplicación de Laravel
php artisan key:generate
```

Edita el archivo `.env` con tus credenciales de Supabase (ver sección [Variables de entorno](#-variables-de-entorno)).

### 🎨 Frontend (React)

```bash
cd ../frontend

# Instalar dependencias de Node
npm install
```

Crea un archivo `.env` en `frontend/` con:

```env
REACT_APP_SUPABASE_URL=https://<tu-proyecto>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<tu-anon-key>
REACT_APP_API_URL=http://localhost:8000/api
```

---

## 🔑 Variables de entorno

Configura el archivo `backend/.env` con los siguientes valores:

```env
APP_NAME=TaskManager
APP_ENV=local
APP_KEY=base64:...         # generada con php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

# Conexión a PostgreSQL (Supabase)
DB_CONNECTION=pgsql
DB_HOST=db.<tu-proyecto>.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<tu-password>

# Credenciales Supabase (para validar JWT)
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
SUPABASE_JWT_SECRET=<tu-jwt-secret>

# CORS (permitir al frontend en dev)
FRONTEND_URL=http://localhost:3000
```

> 💡 Puedes obtener estos valores en **Supabase Dashboard → Project Settings → API**.

---

## ▶️ Ejecución en desarrollo

Abre **dos terminales** (una para el backend y otra para el frontend):

### Terminal 1 — Backend (Laravel)

```bash
cd task-manager/backend
php artisan serve
```

El backend quedará disponible en `http://localhost:8000`.

### Terminal 2 — Frontend (React)

```bash
cd task-manager/frontend
npm start
```

El frontend abrirá automáticamente `http://localhost:3000` en el navegador.

---

## 🔐 Flujo de autenticación

```
┌──────────┐   1. signUp/signIn    ┌──────────────┐
│  React   │ ────────────────────► │  Supabase    │
│          │ ◄──────────────────── │  Auth        │
└──────────┘   2. devuelve JWT     └──────────────┘
      │
      │ 3. Authorization: Bearer <JWT>
      ▼
┌──────────────┐   4. valida JWT    ┌──────────────┐
│  Laravel API │ ─────────────────► │  Supabase    │
│  Middleware  │ ◄───────────────── │  (JWT secret)│
└──────────────┘                    └──────────────┘
      │
      │ 5. extrae user_id del JWT
      ▼
┌──────────────┐
│  CRUD tareas │  ── filtradas por user_id
└──────────────┘
```

1. El usuario se registra o inicia sesión en React usando **Supabase Auth**.
2. Supabase devuelve un **JWT** firmado.
3. React guarda el JWT y lo envía en el header `Authorization: Bearer <token>` en cada request a la API de Laravel.
4. El middleware `SupabaseAuth` de Laravel **valida el JWT** usando el `SUPABASE_JWT_SECRET`.
5. Si es válido, extrae el `user_id` del token y lo inyecta en el request, permitiendo al `TaskController` filtrar las tareas del usuario autenticado.

---

## 🏛️ Patrón MVC aplicado

Este proyecto implementa el patrón **Modelo-Vista-Controlador** adaptado a una arquitectura desacoplada:

### Modelo — `app/Models/Task.php`
Clase Eloquent que representa la tabla `tasks` en PostgreSQL. Define los atributos asignables, las reglas de validación y la relación con el usuario propietario (`user_id`).

**Entidad principal: `tasks`**

| Campo         | Tipo       | Descripción                         |
| ------------- | ---------- | ----------------------------------- |
| `id`          | UUID       | Identificador único                 |
| `title`       | string     | Título de la tarea                  |
| `description` | text       | Descripción detallada               |
| `status`      | enum       | `pending` o `completed`             |
| `due_date`    | date       | Fecha de vencimiento (opcional)     |
| `user_id`     | UUID       | FK al usuario propietario           |
| `created_at`  | timestamp  | Fecha de creación                   |
| `updated_at`  | timestamp  | Fecha de última actualización       |

### Vista — React SPA
En lugar de usar las vistas **Blade** tradicionales de Laravel, las vistas son componentes de React que consumen la API REST. Esto permite una experiencia de usuario moderna, reactiva y desacoplada del backend.

### Controlador — `app/Http/Controllers/TaskController.php`
Contiene los métodos CRUD (`index`, `store`, `show`, `update`, `destroy`) que responden a las rutas definidas en `routes/api.php`. Todas las operaciones **filtran por `user_id`** para garantizar que un usuario solo pueda acceder a sus propias tareas.

---

## 📸 Capturas de pantalla

> _Reemplaza las rutas de las imágenes cuando tengas las capturas._

### 🔐 Pantalla de login
![Login](docs/screenshots/login.png)

### 📋 Dashboard de tareas
![Dashboard](docs/screenshots/dashboard.png)

### ✏️ Edición de tarea
![Edit Task](docs/screenshots/edit-task.png)

---

## 👤 Autor

**Fernando Galarza**
Proyecto desarrollado para la asignatura de **Ingeniería Web**.

---

<p align="center">
  Hecho con ❤️ usando React + Laravel + Supabase
</p>
