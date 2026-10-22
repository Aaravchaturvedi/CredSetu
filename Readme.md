# MiniLedger

MiniLedger is a small mobile app for tracking money lent to friends. It uses a
phone-number + mock-OTP login, a PostgreSQL database, an Express/TypeScript API,
and an Expo React Native client.

> This project is being built in stages. Steps 1–2 (project setup, database
> schema, and backend API) are complete. The mobile client and automated tests
> follow in later steps.

## Repository layout

```text
CredSetu/
├── docker-compose.yml       # Local PostgreSQL 16
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Database models (single source of truth)
│   │   └── migrations/      # Versioned SQL migrations
│   ├── src/                 # Express API source
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
npm run dev            # Start the API with auto-reload
npm run db:studio      # Browse tables/data in Prisma Studio
npm run db:deploy      # Apply committed migrations (safe to repeat)
```

The API starts at `http://localhost:4000`. Health check:
`GET http://localhost:4000/health`.

## Database model

- **User** — one row per verified phone number.
- **Loan** — an amount lent to a friend, with a date-only due date, repayment
  flag, optional receipt URL, and a cascading foreign key to `User`.
- **OtpCode** — internal auth table for short-lived, hashed login OTPs. Kept
  separate because an OTP exists before the user is created.

Money is stored as `DECIMAL(12,2)`, not a float, so calculations stay exact.
Overdue means: `is_repaid = false AND due_date < today` (UTC date).

## API

```text
POST  /auth/login              Request a mock OTP (printed on the server)
POST  /auth/verify             Exchange phone + OTP for a JWT
POST  /uploads/receipt         Upload a receipt image (multipart)
POST  /loans                   Create a loan
GET   /loans                   List the signed-in user's loans
PATCH /loans/:id/repay         Mark one loan as repaid
GET   /loans/summary           Totals for lent / repaid / overdue
GET   /health                  Liveness check
```

All routes except `/auth/*`, `/health`, and static receipt files require:

```http
Authorization: Bearer <token>
```

Request examples:

```http
POST /auth/login
{ "phone": "+919876543210" }

POST /auth/verify
{ "phone": "+919876543210", "otp": "123456" }

POST /loans
{
  "friendName": "Rahul",
  "amount": 1500.50,
  "dueDate": "2026-10-31",
  "receiptImageUrl": "http://localhost:4000/uploads/<file>.jpg"
}
```

Receipt upload uses `multipart/form-data` with a file field named `receipt`
(max 5 MB; JPEG, PNG, or WebP). The response contains the URL to send when
creating a loan.

> When testing with Expo Go on a physical phone, set `PUBLIC_BASE_URL` in
> `backend/.env` to your computer's LAN IP (for example
> `http://192.168.1.20:4000`), otherwise uploaded image URLs point at the
> phone's own localhost.
