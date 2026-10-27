# API Endpoint Reference

**Project:** Smart Task & Project Management System  
**Backend:** Node.js, Express.js, PostgreSQL  
**Base URL (local):** `http://localhost:5000/api`

## Authentication

Protected endpoints require a valid JWT in the request header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register a user | Public |
| POST | `/auth/login` | Authenticate a user | Public |
| GET | `/auth/me` | Retrieve the current user | Authenticated |
| GET | `/auth/users` | Retrieve users | Authenticated |
| GET | `/auth/team-members` | Retrieve team members for administration | Admin |

## Projects

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/projects` | Create a project | Authenticated |
| GET | `/projects` | List accessible projects | Authenticated |
| GET | `/projects/:id` | Retrieve a project | Authenticated |
| PUT | `/projects/:id` | Update a project | Authenticated |
| DELETE | `/projects/:id` | Delete a project | Authenticated |
| GET | `/projects/:id/members` | List project members | Admin |
| POST | `/projects/:id/members` | Add a project member | Admin |
| DELETE | `/projects/:id/members/:userId` | Remove a project member | Admin |

Project and membership access is also subject to the authorization rules implemented by the backend controllers.

## Tasks

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/tasks` | Create a task | Authenticated |
| GET | `/tasks` | List accessible tasks | Authenticated |
| GET | `/tasks/:id` | Retrieve a task | Authenticated |
| PUT | `/tasks/:id` | Update a task | Authenticated |
| DELETE | `/tasks/:id` | Delete a task | Authenticated |

Tasks are associated with a project and an assignee. Supported statuses are `To Do`, `In Progress`, and `Completed`. Supported priorities are `Low`, `Medium`, and `High`.

## Dashboard

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/dashboard/metrics` | Retrieve dashboard metrics | Authenticated |
| GET | `/dashboard/overdue-tasks` | Retrieve overdue tasks | Authenticated |

The dashboard includes project and task metrics, including completed, pending, and overdue tasks.

## Health Check

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/health/db` | Check database connectivity | Verify implementation in `server.js` |

The complete local health-check URL is `http://localhost:5000/api/health/db`.

## Common Request and Security Notes

- Send JSON request bodies for operations that create or update records, using `Content-Type: application/json`.
- Include a bearer token when calling protected endpoints.
- Use the correct project and task IDs in URL parameters.
- The backend should validate input and enforce authorization independently of frontend visibility.
- See the backend controllers and middleware for request validation, response formats, and detailed permission rules.

## Error Handling

Clients should handle unsuccessful HTTP responses and display the error message returned by the API when available. Exact status codes and response schemas should be confirmed against the implementation and API tests.
