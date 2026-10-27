# Smart Task & Project Management System

A full-stack task and project management application developed for the Bright Mind Ltd. technical recruitment assessment.

The application helps teams organize projects, assign tasks, monitor progress, and identify overdue work through a dashboard and notification interface.

## Features

- User registration, login, and logout.
- Protected frontend pages and backend API endpoints.
- Project creation, listing, editing, and deletion.
- Task creation, listing, editing, and deletion.
- Task assignment to projects and team members.
- Task statuses: To Do, In Progress, and Completed.
- Task priorities: Low, Medium, and High.
- Task deadlines and overdue-task notifications.
- Dashboard metrics for projects, tasks, completed tasks, pending tasks, and overdue tasks.
- Filtering and role-based access control.
- PostgreSQL database persistence.
- Input validation and parameterized SQL queries.

## Technology Stack

**Frontend**
- React
- JavaScript
- Vite
- React Router
- Recharts
- SweetAlert2

**Backend**
- Node.js
- Express.js
- PostgreSQL
- `pg`
- JSON Web Tokens (JWT)
- `bcrypt`

## Project Structure

```text
smart-task-manager/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   │   ├── 001_create_initial_schema.sql
│   │   └── 002_add_role_based_permissions.sql
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- PostgreSQL
- Git
- A code editor, such as Visual Studio Code

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/akibuddin111/smart-task-manager.git
cd smart-task-manager
```

### 2. Configure PostgreSQL

Create a PostgreSQL database named `smart_task_manager`.

Apply the SQL migration files in the following order using pgAdmin or another PostgreSQL client:

1. `backend/migrations/001_create_initial_schema.sql`
2. `backend/migrations/002_add_role_based_permissions.sql`

Run each migration only once on a database that does not already contain its changes. If the database has already been initialized, check its current schema before applying migrations again.

### 3. Configure the backend

Open a terminal in the backend directory:

```bash
cd backend
npm install
```

Configure `backend/.env` using your local PostgreSQL credentials and the environment-variable names required by the backend configuration.

Keep database passwords and authentication secrets private. Never commit `.env` files to Git.

### 4. Start the backend

From `smart-task-manager/backend`, run:

```bash
npm run dev
```

For normal execution, use:

```bash
npm start
```

### 5. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Configure `frontend/.env` with the API base URL expected by the frontend. For local development, the API base URL is expected to point to the backend at `http://localhost:5000/api`, unless your configuration specifies otherwise.

Start Vite:

```bash
npm run dev
```

Open the local URL printed in the terminal.

## Environment Variables

### Backend

Create `backend/.env` and configure the following variables:

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `smart_task_manager` |
| `DB_USER` | PostgreSQL username | Your local database username |
| `DB_PASSWORD` | PostgreSQL password | Your local database password |
| `JWT_SECRET` | Secret used to sign authentication tokens | Generate a strong, private random secret |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

Use your actual local PostgreSQL credentials. Never commit `backend/.env` or share its secrets.

### Frontend

The frontend optionally supports `VITE_API_URL` in `frontend/.env`.

For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

If this variable is omitted, the frontend uses `http://localhost:5000/api` by default.

Only expose non-secret configuration through frontend environment variables. Variables prefixed with `VITE_` are included in the client-side application and must not contain passwords or private secrets.


## Database Migrations

Database schema changes are maintained in SQL migration files under `backend/migrations/`. Apply migrations in numerical order and retain them in source control so the database structure can be reproduced.

## API Documentation

The backend exposes REST API routes for authentication, projects, tasks, and dashboard data. Refer to the API endpoint documentation in this repository once finalized.

## Security

- Passwords are hashed using `bcrypt`.
- JWT-based authentication protects private endpoints.
- SQL queries should use parameterized inputs.
- Access to projects and tasks is restricted according to the application's authorization rules.
- Environment files and dependency directories are excluded from Git.

## Development Commands

| Directory | Command | Purpose |
|---|---|---|
| `backend/` | `npm run dev` | Start backend in watch mode |
| `backend/` | `npm start` | Start backend normally |
| `frontend/` | `npm run dev` | Start Vite development server |
| `frontend/` | `npm run build` | Build frontend for production |
| `frontend/` | `npm run lint` | Run ESLint |

## Project Status

This project was developed as a technical recruitment assessment. Setup instructions, API documentation, and testing evidence should be checked against the final repository before submission.
