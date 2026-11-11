# API reference

The backend is a Django REST Framework API. The production base URL is
`https://eduspare-ai-api.onrender.com`; locally it is
`http://127.0.0.1:8000`. API routes are under `/api/`.

The API root (`/api/`) returns the available top-level links. The tables below
describe the routes registered by the project; actions and writable fields
depend on each endpoint's serializer and permissions.

## Authentication

The API uses JSON Web Tokens (JWT). Obtain a token by posting a username,
password, and—when needed—the school slug:

```http
POST /api/accounts/login/
Content-Type: application/json
```

```json
{
  "username": "school-admin",
  "password": "<your-password>",
  "school_slug": "example-school"
}
```

`school_slug` is optional for school-assigned users but can be supplied to
confirm the intended tenant. A successful response contains `access`,
`refresh`, and the authenticated `user` object. Never include a real password
or token in source control or shared logs.

Send the access token on authenticated requests:

```http
Authorization: Bearer <access-token>
```

When the access token expires, obtain a replacement:

```http
POST /api/accounts/refresh/
Content-Type: application/json
```

```json
{
  "refresh": "<refresh-token>"
}
```

Other account endpoints:

| Method | Path | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/api/accounts/me/` | Get the authenticated user | Authenticated |
| `GET` | `/api/accounts/schools/me/` | Get the current user's school | Authenticated school user |
| `GET` | `/api/accounts/schools/<slug>/public/` | Read public information for an active school | Public |
| `POST` | `/api/accounts/schools/onboard/` | Create a school and its initial school administrator | Platform administrator |
| `GET`, `POST` | `/api/accounts/users/` | List or create school users | School administrator |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/api/accounts/users/<id>/` | Retrieve or update a school user | School administrator |
| `GET`, `POST` | `/api/accounts/schools/` | List or create schools | Platform administrator |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/api/accounts/schools/<id>/` | Retrieve or update a school | Platform administrator |

School data endpoints are tenant-scoped: a user's school membership determines
which records are available. Permissions also depend on the operation and user
role. Do not rely on obscurity of record IDs as an access control mechanism.

## Resource routes

| Resource | Collection route | Detail route | Typical access |
| --- | --- | --- | --- |
| Students | `/api/students/` | `/api/students/<id>/` | School administrator |
| Teachers | `/api/teachers/` | `/api/teachers/<id>/` | School administrator |
| Attendance | `/api/attendance/` | `/api/attendance/<id>/` | Authenticated school staff |
| Timetable | `/api/timetable/` | `/api/timetable/<id>/` | Authenticated school staff for reads; administrator for writes |
| Exams | `/api/exams/` | `/api/exams/<id>/` | Authenticated school staff for reads; administrator for writes |
| Results | `/api/results/` | `/api/results/<id>/` | Authenticated school staff for reads; administrator for writes |
| Fees | `/api/fees/` | `/api/fees/<id>/` | School administrator |
| Books | `/api/books/` | `/api/books/<id>/` | Authenticated school staff for reads; administrator for writes |
| Book issues | `/api/book-issues/` | `/api/book-issues/<id>/` | Authenticated school staff for reads; administrator for writes |
| Vehicles | `/api/vehicles/` | `/api/vehicles/<id>/` | Authenticated school staff for reads; administrator for writes |
| Routes | `/api/routes/` | `/api/routes/<id>/` | Authenticated school staff for reads; administrator for writes |
| Student transport assignments | `/api/student-assignments/` | `/api/student-assignments/<id>/` | Authenticated school staff for reads; administrator for writes |
| Vehicle maintenance | `/api/maintenance/` | `/api/maintenance/<id>/` | Authenticated school staff for reads; administrator for writes |
| Dashboard summary | `/api/dashboard/` | — | The current view does not declare an explicit permission class; review before exposing school data |

Several resources expose additional actions, such as dashboard summaries,
exam rosters, marks, and class options. The API root and browsable API are the
source of truth for available routes. Consult the corresponding Django app's
URL configuration and view permissions when adding or consuming a custom
action.

## Responses and errors

- Send and accept JSON (`Content-Type: application/json`).
- A successful list/detail request normally returns HTTP `200`; creation
  normally returns `201`; deletion normally returns `204`.
- Invalid input returns HTTP `400` with field-level validation details.
- Missing or invalid authentication returns HTTP `401`.
- An authenticated user without the required role receives HTTP `403`.
- A missing or tenant-inaccessible record may return HTTP `404`.
- A server or database failure returns a `5xx` response; inspect provider logs
  without exposing credentials or sensitive student data.

The API does not publish account credentials. Provision a school account
through the authorized onboarding/admin workflow before testing protected
resources.
