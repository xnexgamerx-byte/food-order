# منصة الطلب - Food Ordering Platform

## Overview

A professional Arabic food ordering platform for Salah al-Din, Iraq — modeled after apps like Talabat and HungerStation. Full-stack with React + Vite frontend and Express backend, RTL Arabic UI.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, Cairo font, RTL layout
- **Routing**: wouter

## Architecture

- `artifacts/food-order` — React + Vite frontend (Arabic RTL, runs at `/`)
- `artifacts/api-server` — Express API server (runs at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react` — Generated React Query hooks
- `lib/api-zod` — Generated Zod schemas
- `lib/db` — Drizzle ORM schema + connection

## Features

- Home page with category filter (Talabat-style circular icons)
- Restaurant grid cards with images, ratings, delivery time
- Restaurant detail page with tabbed menu categories
- Cart with item quantity management
- Checkout with customer info + neighborhood selector (Salah al-Din areas)
- Order confirmation generates WhatsApp message to restaurant
- Persistent cart via localStorage
- Floating cart button

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm run render:build` — build for Render deployment (frontend + api-server)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Deployment

Production hosted on **Render.com** (free plan). Configured via `render.yaml` blueprint.
Express server serves the built React frontend as static files in production (see `app.ts`).
Required env vars on Render: `DATABASE_URL`, `SESSION_SECRET`.

## Database Schema

Tables: `categories`, `restaurants`, `menu_items`, `orders`, `reviews`

`reviews`: one row per order (unique on `order_id`); rating 1-5; `message` required if rating < 3. Submitting a review recomputes `restaurants.rating` as the AVG of its reviews.

## Delivery Fee by Distance

Restaurants have `lat`, `lng` (coordinates), `pricePerKm` (IQD/km), and `deliveryFee` (minimum base).
At checkout, selecting a neighborhood calculates Haversine distance → fee = max(deliveryFee, distance × pricePerKm) rounded up to nearest 250 IQD.
Neighborhoods with coordinates: `artifacts/food-order/src/lib/neighborhoods.ts`.
If `pricePerKm = 0` or restaurant has no coordinates, falls back to fixed `deliveryFee`.

## WhatsApp Flow

When order is confirmed:
1. POST `/api/orders` with order data
2. Server builds WhatsApp message with full order details
3. Returns `whatsappUrl` (wa.me link with pre-filled message)
4. User taps green button to open WhatsApp and send to restaurant

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
