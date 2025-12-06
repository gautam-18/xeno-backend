# Xeno Shopify Data Ingestion Service

Multi-tenant Shopify Data Ingestion backend built with:

- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT-based email/password authentication
- Multi-tenant isolation with `Tenant` model

## 1. Prerequisites

- Node.js >= 18
- PostgreSQL running locally (or a cloud instance)
- Shopify development store with:
  - Store domain, e.g. `my-example-store.myshopify.com`
  - Admin API access token (private app or custom app)

## 2. Setup

```bash
git clone <this-repo-url>
cd xeno-shopify-data-ingestion-service

# Install deps
npm install
```
