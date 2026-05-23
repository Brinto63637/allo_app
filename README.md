# Inventory Reservation System

Initial database and app structure for an inventory reservation system.

## Folder Structure

```text
.
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── env.ts
│   └── prisma.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env.example
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Install

```bash
npm install
```

## Environment

Copy `.env.example` to `.env` and set the PostgreSQL connection strings from Supabase or Neon.

```bash
cp .env.example .env
```

## Prisma Commands

Generate the Prisma client:

```bash
npm run prisma:generate
```

Create and apply the initial migration:

```bash
npm run prisma:migrate -- --name init
```

Seed sample data:

```bash
npm run prisma:seed
```

## Models

- `Product`
- `Warehouse`
- `Inventory`
- `Reservation`

Reservation statuses:

- `pending`
- `confirmed`
- `released`

## API Endpoints

List products with warehouse inventory and available stock:

```http
GET /api/products
```

List warehouses with product inventory and available stock:

```http
GET /api/warehouses
```

Create a pending reservation:

```http
POST /api/reservations
Content-Type: application/json

{
  "productId": "product_id",
  "warehouseId": "warehouse_id",
  "quantity": 1,
  "expiresAt": "2026-05-23T12:30:00.000Z"
}
```

If available stock is insufficient, the endpoint returns `409 Conflict`.

Confirm a pending reservation:

```http
POST /api/reservations/:id/confirm
```

If the reservation has expired, the endpoint releases it and returns `410 Gone`.

Release a pending reservation:

```http
POST /api/reservations/:id/release
```

Release expired pending reservations from a scheduled job:

```http
POST /api/jobs/reservations/release-expired
Authorization: Bearer <CRON_SECRET>
```

Configure a production scheduler such as Vercel Cron, Supabase Scheduler, GitHub Actions, or another trusted worker to call this endpoint regularly.

## Frontend

Product listing and checkout are available at:

```http
GET /
```

The page uses a Server Component to load products and warehouse stock, then a client checkout component handles:

- reserve one unit
- live reservation countdown
- confirm purchase
- cancel reservation
- automatic UI refresh after reservation actions
- `409 Conflict` insufficient stock messages
- `410 Gone` expired reservation messages
