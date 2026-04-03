# Finance Dashboard Backend

A backend assignment implementation for finance data processing, role-based access control, and dashboard analytics.

This project is configured for local development only. It binds to `127.0.0.1` by default and is not intended for public or cloud deployment.

## Stack

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- Zod
- JWT authentication
- Vitest
- Swagger UI at `/docs`

## What This Project Covers

- User management with roles and active/inactive status
- JWT-based login
- Role-based access control at the backend layer
- Financial record CRUD with filtering and pagination
- Dashboard summary and trend APIs
- Input validation and centralized error handling
- Seed data for quick local review

## Roles

- `viewer`: can access dashboard summary and trends
- `analyst`: viewer permissions plus record listing access
- `admin`: full access to users and financial records

## Assumptions

- Authentication is email/password based and returns a JWT.
- Only admins can create, update, or delete financial records.
- Viewers do not access raw record listings.
- User self-deactivation is blocked to avoid locking out the active admin session.
- Trend aggregation is done in application code for portability across environments.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

Use Docker:

```bash
docker compose up -d
```

### 3. Configure environment

`.env` is already gitignored. A default local development version can be created from:

```bash
copy .env.example .env
```

Default values expect PostgreSQL on `localhost:5432` with database `finance_dashboard`.
The API binds only to `127.0.0.1:3000` unless you intentionally change `HOST`.

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Run migrations

```bash
npm run prisma:migrate -- --name init
```

### 6. Seed demo data

```bash
npm run db:seed
```

### 7. Start the server

```bash
npm run dev
```

The API will run at `http://127.0.0.1:3000`.

## Default Seeded Users

- Admin: `admin@finance.local` / `Admin@12345`
- Analyst: `analyst@finance.local` / `Analyst@12345`
- Viewer: `viewer@finance.local` / `Viewer@12345`

## Scripts

```bash
npm run dev
npm run build
npm test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:seed
```

## Main Endpoints

### Health

- `GET /health`

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `POST /api/users`
- `GET /api/users`
- `PATCH /api/users/:id`

### Records

- `POST /api/records`
- `GET /api/records`
- `PATCH /api/records/:id`
- `DELETE /api/records/:id`

### Dashboard

- `GET /api/dashboard/summary`
- `GET /api/dashboard/trends`

## Filtering Support

`GET /api/records` supports:

- `page`
- `limit`
- `type`
- `category`
- `from`
- `to`
- `search`

## Dashboard Output

### `/api/dashboard/summary`

Returns:

- total income
- total expenses
- net balance
- category-wise totals
- recent activity
- monthly trend data

### `/api/dashboard/trends`

Supports:

- `granularity=monthly`
- `granularity=weekly`
- optional `from` and `to` range filters

## Validation and Error Handling

- Zod-based request validation
- consistent JSON error responses
- `401` for auth failures
- `403` for role or inactive-account restrictions
- `404` for missing resources
- `409` for unique constraint conflicts

## Documentation

Swagger UI is available at:

- `GET /docs`

A Postman collection is included at:

- `Finance Dashboard Backend.postman_collection.json`

## Tests

Current automated coverage includes:

- analytics aggregation helpers
- password hashing and verification helpers
- login success and invalid credential handling
- RBAC enforcement for record access
- dashboard summary response for authorized users

Run with:

```bash
npm test
```

## Tradeoffs

- I kept the domain model intentionally small to optimize clarity over breadth.
- Trends are computed in TypeScript instead of database-specific SQL to keep the implementation portable and readable.
- Authentication is lightweight JWT auth rather than a full refresh-token/session design because this is an assessment backend, not a production auth system.

## Submission Notes

This project is designed to emphasize backend structure, business logic clarity, access control, and data handling rather than production infrastructure.
It is intentionally configured for local execution only.
