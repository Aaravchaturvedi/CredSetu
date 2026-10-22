# MiniLedger

MiniLedger is a small mobile app for tracking money lent to friends. It uses a
phone-number + mock-OTP login, a PostgreSQL database, an Express/TypeScript API,
and an Expo React Native client.

> This project is being built in stages. Step 1 (project setup + database schema)
> is complete. The API, mobile client, and tests follow in later steps.

## Repository layout

```text
CredSetu/
├── docker-compose.yml       # Local PostgreSQL 16
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database models (single source of truth)
│   │   └── migrations/      # Versioned SQL migrations
│   ├── src/                 # API source (added in Step 2)
│   ├── tests/               # Jest tests (added in Step 4)
│   ├── .env.example
│   ├── jest.config.js
│   ├── package.json
│   ├── tsconfig.json        # Production build config
│   └── tsconfig.test.json   # Type-checking config for src + tests
└── mobile/                  # Expo app (added in Step 3)
```

## Prerequisites

- Node.js 20 or newer
- Docker Desktop / Docker Engine with Compose
- npm

## Step 1 — run the backend foundation

From the repository root:

```bash
# 1. Start PostgreSQL (keeps data in a named Docker volume).
docker compose up -d

# 2. Install API dependencies and create the local environment file.
cd backend
cp .env.example .env
npm install

# 3. Apply the committed migration and generate Prisma Client.
npm run db:migrate
```

> **Working directory matters:** `docker compose` commands run from the
> repository root. Every `npm` command must run from `backend/`, because that is
> where `package.json` is located.

Useful commands:

```bash
# From the repository root:
docker compose ps      # Check PostgreSQL health
docker compose down    # Stop PostgreSQL (data is preserved)
docker compose down -v # Stop PostgreSQL and delete its data

# From backend/:
cd backend
npm run db:studio      # Browse tables/data in Prisma Studio
npm run db:deploy      # Apply committed migrations (safe to repeat)
```

## Database model

- **User** — one row per verified phone number.
- **Loan** — an amount lent to a friend, with a date-only due date, repayment
  flag, optional receipt URL, and a cascading foreign key to `User`.
- **OtpCode** — internal auth table for short-lived, hashed login OTPs. Kept
  separate because an OTP exists before the user is created.

Money is stored as `DECIMAL(12,2)`, not a float, so calculations stay exact.
Overdue means: `is_repaid = false AND due_date < today` (UTC date).

## Planned API

```text
POST  /auth/login          Request a mock OTP (printed on the server)
POST  /auth/verify         Exchange phone + OTP for a JWT
POST  /loans               Create a loan
GET   /loans               List the signed-in user's loans
PATCH /loans/:id/repay     Mark one loan as repaid
GET   /loans/summary       Totals for lent / repaid / overdue
```
