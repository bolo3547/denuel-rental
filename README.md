# DENUEL App Rental

Zambia-first rental marketplace inspired by Zillow — built with Next.js (App Router), Prisma, PostgreSQL, Tailwind CSS and Mapbox.

## Getting started (local)

1. Copy `.env.example` → `.env` and fill values (S3, REDIS_URL, SMTP if using saved-search emails).
2. Start Postgres and local dev stack:

   docker-compose up -d db

   # optionally start redis for worker
   docker run -d -p 6379:6379 --name denuel-redis redis:7

3. Install dependencies:

   npm install

4. Generate Prisma client and run migrations:

   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed

5. Start dev server:

   npm run dev

6. Start worker (if using REDIS_URL):

   REDIS_URL=redis://localhost:6379 npm run worker

7. (Optional) Deploy image processor lambda via Serverless Framework:

   npm run serverless:deploy -- --stage production



## Project structure

- /app — Next.js App Router pages
- /components — UI components
- /lib — utilities (auth, prisma client, map helpers)
- /prisma — Prisma schema and seed script
- /public — static assets
- /styles — global styles

## Roadmap

Phase 1: core search, map view, auth, landlord dashboard, admin moderation.
Phase 2: AI pricing, WhatsApp integration, mobile apps, payments.

---

For full implementation steps, run the task list in the project doc (in repo root).