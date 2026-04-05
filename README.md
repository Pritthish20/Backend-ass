# Finance Dashboard Backend

A local-only backend for managing financial records, enforcing role-based access control, and serving summary analytics for a dashboard.

This project was built as a backend assessment focused on API design, data modeling, business logic, validation, and access control. The goal was to keep the solution small enough to review quickly, but structured enough to demonstrate clear backend thinking.

Although the repository includes a local Docker PostgreSQL setup for convenience, the backend was also tested with a Neon PostgreSQL database by pointing `DATABASE_URL` to the Neon connection string.

## Overview

The system supports:

- user management with roles and active/inactive status
- JWT-based authentication
- role-based access control at the API layer
- financial record CRUD operations
- record filtering and pagination
- dashboard summary and trend endpoints
- validation and consistent error responses

The application is intentionally configured for **local development only**. By default it binds to `127.0.0.1`. PostgreSQL can be provided either by the included local Docker container or by a Neon PostgreSQL instance through `DATABASE_URL`.

## Tech Stack

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- Zod
- JWT
- Vitest
- Swagger UI

## Core Features

### 1. User and Role Management

The backend manages users with:

- `viewer`
- `analyst`
- `admin`

Each user also has a status:

- `active`
- `inactive`

Admins can create users, list users, and update user role or status.

### 2. Financial Records Management

Each financial record includes:

- `amount`
- `type` (`income` or `expense`)
- `category`
- `date`
- `notes`
- audit metadata such as creator and timestamps

Supported operations:

- create record
- list records
- update record
- delete record
- filter by type, category, date range, and search text

### 3. Dashboard Summary APIs

The dashboard endpoints provide:

- total income
- total expenses
- net balance
- category-wise totals
- recent activity
- monthly or weekly trends

### 4. Validation and Error Handling

The API uses Zod-based validation and returns structured error responses. Common status codes:

- `400` validation or invalid operation
- `401` authentication required / invalid credentials
- `403` insufficient role or inactive account
- `404` resource not found
- `409` unique constraint conflict

## Role Permissions

| Action | Viewer | Analyst | Admin |
| --- | --- | --- | --- |
| Login | Yes | Yes | Yes |
| View own profile | Yes | Yes | Yes |
| View dashboard summary/trends | Yes | Yes | Yes |
| List financial records | No | Yes | Yes |
| Create/update/delete records | No | No | Yes |
| List users | No | No | Yes |
| Create/update users | No | No | Yes |

## Project Structure

The codebase uses a feature-based Fastify structure rather than an Express-style controller/service split.

```text
src/
  app.ts                  # Fastify app setup, plugins, error handling
  server.ts               # server bootstrap
  config/
    env.ts                # environment validation
  plugins/
    prisma.ts             # Prisma/PostgreSQL connection
  lib/
    auth.ts               # auth + RBAC helpers
    analytics.ts          # dashboard aggregation helpers
    errors.ts             # application errors
    mappers.ts            # response mapping helpers
    password.ts           # bcrypt helpers
  shared/
    schemas.ts            # shared Zod schemas
  modules/
    auth/
    users/
    records/
    dashboard/
  routes/
    index.ts              # route registration

prisma/
  schema.prisma           # database schema
  seed.ts                 # demo seed data

tests/
  *.test.ts               # unit and API-level tests
```

## Architecture Notes

Some deliberate choices in this implementation:

- Fastify route modules keep the API behavior close to the validation schema.
- Access control is enforced in backend code through `authenticate()` and `authorize()` helpers.
- Prisma handles schema, type-safe queries, and migrations.
- Dashboard trends are calculated in TypeScript instead of raw SQL to keep the logic easier to understand in a review.
- The app is local-first and avoids any deployment-specific infrastructure.

## Database Model

Main entities:

- `User`
- `FinancialRecord`

Enums:

- `Role`
- `UserStatus`
- `RecordType`

Relationships:

- one user can create many financial records

## Local Setup

### Prerequisites

- Node.js installed
- Docker installed

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment file

```bash
copy .env.example .env
```

Default local values:

- host: `127.0.0.1`
- port: `3000`
- postgres host: `localhost`
- postgres port: `5432`
- postgres db: `finance_dashboard`
- postgres user: `postgres`
- postgres password: `postgres`

If using Neon instead of local Docker PostgreSQL, replace `DATABASE_URL` in `.env` with the Neon connection string.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

If you are using Neon, this step is not required.

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Run migration

```bash
npm run prisma:migrate -- --name init
```

### 6. Seed demo data

```bash
npm run db:seed
```

### 7. Start the API

```bash
npm run dev
```

API base URL:

```text
http://127.0.0.1:3000
```

Swagger docs:

```text
http://127.0.0.1:3000/docs
```

## Live Deployment

Live API:

```text
https://backend-ass-seven.vercel.app/
```

Hosted Swagger docs:

```text
https://backend-ass-seven.vercel.app/docs
```

## Seeded Demo Users

- Admin: `admin@finance.local` / `Admin@12345`
- Analyst: `analyst@finance.local` / `Analyst@12345`
- Viewer: `viewer@finance.local` / `Viewer@12345`

## Available Scripts

```bash
npm run dev
npm run build
npm test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:seed
```

## API Summary

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

## Record Filters

`GET /api/records` supports:

- `page`
- `limit`
- `type`
- `category`
- `from`
- `to`
- `search`

## Example Review Flow

If someone wants to verify the project quickly:

1. start Docker and run migrations
2. seed the database
3. login as admin
4. create a record
5. list records with filters
6. call dashboard summary
7. test role restrictions with analyst/viewer accounts

## Documentation and Testing

Swagger UI:

- `GET /docs`

Deployed API:

- `https://backend-ass-seven.vercel.app/`

Deployed Swagger UI:

- `https://backend-ass-seven.vercel.app/docs`

Postman collection included:

- `Finance Dashboard Backend.postman_collection.json`

Automated tests currently cover:

- analytics helpers
- password hashing and verification
- login success
- invalid credential handling
- RBAC protection on record listing
- dashboard summary for authorized users

Run tests:

```bash
npm test
```

## Logging

Logging is intentionally minimal and local-development oriented:

- Prisma/PostgreSQL connection lifecycle
- server startup
- failed requests
- unexpected errors

Successful request spam is intentionally disabled.

## PostgreSQL Provider

This backend targets standard PostgreSQL and was verified against Neon PostgreSQL during development. For local reviewer convenience, the repository also includes `docker-compose.yml` so the same API can be run without needing a hosted database.

In short:

- use the included Docker PostgreSQL setup for fully local execution
- or use Neon by setting `DATABASE_URL` to the Neon connection string
- Prisma schema and queries remain standard PostgreSQL in both cases

## Assumptions

- auth is simplified to email/password + JWT
- refresh tokens and session management are out of scope
- only admins can mutate records
- viewers can see dashboard summaries but not raw record listings
- self-deactivation is blocked for the current admin account

## Tradeoffs

- The domain model is intentionally small to keep the assignment focused.
- Route handlers contain some business logic because the project is optimized for clarity over heavy layering.
- Trend aggregation is done in application code instead of database-specific SQL for readability and portability.
- The project is local-only by default instead of deployment-ready infrastructure.

## What To Review First

If you are evaluating the project, the most relevant files are:

- `prisma/schema.prisma`
- `src/create-app.ts`
- `src/lib/auth.ts`
- `src/modules/users/routes.ts`
- `src/modules/records/routes.ts`
- `src/modules/dashboard/routes.ts`
- `tests/api.test.ts`

## Submission Note

This project is not intended to be production-complete. It is intended to demonstrate:

- clean backend structure
- sensible data modeling
- role-based access control
- dashboard-oriented aggregation logic
- validation and error handling
- maintainable local development workflow

## Vercel Deployment

This project can be deployed to Vercel using Neon PostgreSQL as the database.

### Deployment Notes

- Fastify is deployed on the Vercel Node.js runtime.
- Prisma uses the PostgreSQL driver adapter (`@prisma/adapter-pg`).
- Connection pooling is configured with `pg` and `@vercel/functions` for better behavior on Vercel Fluid compute.
- The repository includes `vercel.json` with a dedicated build command.

### Required Vercel Environment Variables

Set these in the Vercel project settings:

- `DATABASE_URL`
- `JWT_SECRET`

Recommended for Neon:

- use your Neon connection string in `DATABASE_URL`
- prefer `sslmode=verify-full`
- if Neon provides a pooled connection string, use that for runtime

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-NEON-HOST/neondb?sslmode=verify-full"
JWT_SECRET="your-long-random-secret"
```

### Build and Migration Behavior

The Vercel build uses:

```bash
npm run vercel-build
```

That script runs:

- `prisma generate`
- `prisma migrate deploy`

### Before Deploying

Make sure:

1. your Neon database is reachable
2. `DATABASE_URL` is set in Vercel
3. `JWT_SECRET` is set in Vercel
4. your migrations are committed in the repository

### Important Note

The app is still structured as a local-first assessment project. Vercel deployment is supported, but the repository defaults remain local for review convenience.
