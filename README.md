# LogScope Backend

LogScope is a personal observability platform for collecting, processing, searching, and streaming application logs. This repository contains the backend services, shared packages, database schema, and local infrastructure configuration used by the LogScope frontend.

## What It Does

- Authenticates users with JWT access and refresh tokens.
- Manages projects, project members, roles, and API keys.
- Accepts log events through an ingestion API protected by `x-api-key`.
- Sends raw logs through Kafka for asynchronous processing.
- Normalizes and redacts sensitive log attributes before indexing.
- Stores searchable logs in Elasticsearch.
- Publishes realtime log events through Redis and GraphQL subscriptions.
- Exposes REST and GraphQL APIs for the frontend console.

## Tech Stack

- NestJS, TypeScript, pnpm workspaces
- Prisma 7 and PostgreSQL
- Kafka for raw log transport
- Elasticsearch for log search
- Redis for realtime fan-out
- GraphQL over HTTP and WebSocket

## Repository Layout

```text
apps/api/                 REST, GraphQL, auth, projects, API keys, log search
apps/ingestion-service/   Public log ingestion API
apps/log-processor/       Kafka consumer, redaction, indexing, realtime publish
packages/config/          Shared environment validation
packages/contracts/       Versioned log event contracts
packages/elasticsearch/   Elasticsearch client, mappings, search helpers
packages/kafka/           Kafka client, topics, serializers
packages/shared/          Shared utilities
prisma/                   Prisma schema, migrations, seed
```

## Requirements

- Node.js 22+
- pnpm 10+
- PostgreSQL, either local or Docker
- Docker Desktop for Redis, Kafka, Elasticsearch, and Kafka UI

For a lighter personal setup, keep PostgreSQL local and run only Redis, Kafka, and Elasticsearch in Docker.

## Environment

Create `LogScope-BE/.env` from `.env.example`.

Common local setup with PostgreSQL running outside Docker:

```env
DATABASE_URL=postgresql://logscope:logscope@localhost:5432/logscope?schema=public
API_PORT=3000
INGESTION_PORT=3001
KAFKA_BROKERS=localhost:9092
REDIS_URL=redis://localhost:16379
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_LOGS_INDEX=syspulse-logs
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

If PostgreSQL is also started from this repository's `docker-compose.yml`, use port `15432` instead:

```env
DATABASE_URL=postgresql://logscope:logscope@localhost:15432/logscope?schema=public
```

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start the infrastructure needed for the full log pipeline:

```bash
docker compose up -d redis kafka kafka-ui elasticsearch
```

If you want Docker PostgreSQL too:

```bash
docker compose up -d postgres
```

Prepare the database:

```bash
pnpm db:generate
pnpm db:migrate
```

Run the services in separate terminals:

```bash
pnpm dev:api
pnpm dev:ingestion
pnpm dev:processor
```

Service URLs:

- API: `http://localhost:3000`
- Ingestion API: `http://localhost:3001`
- GraphQL: `http://localhost:3000/api/graphql`
- Kafka UI: `http://localhost:8080`
- Elasticsearch: `http://localhost:9200`

## Example Log Ingestion

```bash
curl -X POST http://localhost:3001/v1/logs \
  -H "Content-Type: application/json" \
  -H "x-api-key: sp_live_your_key" \
  -d '{
    "service": "checkout-api",
    "environment": "production",
    "level": "error",
    "message": "Payment provider timeout",
    "traceId": "trace-001",
    "attributes": {
      "orderId": "ord_123"
    }
  }'
```

## Scripts

```bash
pnpm dev:api             # Run the main API
pnpm dev:ingestion       # Run the ingestion service
pnpm dev:processor       # Run the log processor
pnpm db:generate         # Generate Prisma client
pnpm db:migrate          # Apply development migrations
pnpm db:migrate:deploy   # Apply production migrations
pnpm db:seed             # Seed local data
pnpm lint                # Run ESLint
pnpm typecheck           # Run TypeScript checks
pnpm test                # Run unit tests
pnpm test:e2e            # Run API e2e tests
pnpm check               # Lint, typecheck, and unit test
pnpm build               # Build all workspaces
```

## Development Notes

- Keep `.env` local and never commit secrets.
- PostgreSQL data is not part of the application image; use a local DB or a separate Docker volume.
- Elasticsearch and Kafka are heavier than PostgreSQL. Start them only when testing log search, ingestion, or realtime streaming.
- Before pushing backend changes, run `pnpm check` and `pnpm test:e2e` when the required services are available.
