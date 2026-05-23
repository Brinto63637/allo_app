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
