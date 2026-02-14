# Resist Events

A community event calendar built on Cloudflare Pages + D1. Vanilla JS frontend, no build step.

## Quick Start

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

> **Note**: `wrangler d1 execute` and `wrangler pages dev` use separate local D1 state directories.
> If the database appears empty after starting the dev server, stop it, delete `.wrangler/`, and re-run
> `npm run db:reset` followed by `npm run dev`.

Open [http://localhost:8788](http://localhost:8788). Pick a demo role (Guest/Organizer/Admin) to explore.

## Project Structure

```
public/              Static frontend (served by Cloudflare Pages)
  css/styles.css     Desert Dusk theme
  js/config.js       Config loader + demo session
  js/app.js          All rendering/nav/form logic
functions/api/       Cloudflare Pages Functions (API)
schema/schema.sql    D1 database schema
seed/seed-camelot.sql  Monty Python-themed demo data
```

## Demo Roles

- **Guest** — Browse events and organizations (read-only)
- **Organizer** — Create/edit events, message admins
- **Admin** — Full access to all events and messages

## Deploy to Cloudflare

```bash
# Create the D1 database
wrangler d1 create resist-events-db

# Update wrangler.toml with the database_id from above

# Deploy
npm run deploy

# Migrate and seed the remote database
npm run db:migrate:remote
npm run db:seed:remote
```

## Tech Stack

- **Frontend**: Vanilla JS SPA, no framework, no build step
- **Backend**: Cloudflare Pages Functions (file-based routing)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Auth**: Demo mode (cookie-based role selection)
