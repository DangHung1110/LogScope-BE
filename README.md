# LogScope Backend

LogScope is a personal observability platform for collecting, processing, searching, and streaming application logs. This repository contains the independently runnable backend services, shared packages, database schema, and local infrastructure used by the LogScope web console.

## Features

- JWT access and refresh token authentication.
- Project, membership, role, and API key management.
- Single-event and batch log ingestion protected by `x-api-key`.
- Per-key usage tracking, revocation, and ingestion rate limiting.
- Kafka-based asynchronous raw log transport.
- Log validation, normalization, and recursive sensitive-field redaction.
- Elasticsearch indexing and filtered, cursor-based log search.
- Redis fan-out and authenticated GraphQL realtime subscriptions.
- Shared environment validation, HTTP bootstrap, request IDs, and infrastructure clients.

## Tech Stack

- NestJS and TypeScript
- pnpm workspaces
- Prisma 7 and PostgreSQL
- Kafka
- Elasticsearch
- Redis
- GraphQL over HTTP and WebSocket
- Jest and Supertest

## Architecture

LogScope is a modular monorepo with an event-driven log pipeline. Feature modules follow a pragmatic hexagonal dependency rule:

```text
presentation -> application -> ports <- infrastructure adapters
                         |
                       domain
```

The application layer owns orchestration and business use cases. It does not construct Kafka, Redis, Elasticsearch, or Prisma clients. Nest modules bind application ports to infrastructure adapters.

### Runtime Services

- `apps/api`: authenticated REST and GraphQL management/query API.
- `apps/ingestion-service`: API-key-protected public ingestion API.
- `apps/log-processor`: Kafka worker that validates, normalizes, redacts, indexes, and publishes realtime events.

### Shared Packages

- `@logscope/config`: environment contracts and startup validation.
- `@logscope/contracts`: versioned messages shared between producers and consumers.
- `@logscope/database`: Prisma lifecycle, database module, and readiness checks.
- `@logscope/elasticsearch`: Elasticsearch client, mappings, and log index operations.
- `@logscope/http`: shared HTTP bootstrap and request middleware.
- `@logscope/kafka`: Kafka client, producers, consumers, serialization, and topics.
- `@logscope/shared`: framework-independent security and utility functions.

### Dependency Rules

1. Applications may depend on shared packages; shared packages must not import applications.
2. Contracts contain transport-neutral data shapes and version identifiers.
3. Shared utilities remain framework-independent and reusable by multiple consumers.
4. Controllers, resolvers, guards, DTOs, and middleware handle presentation concerns only.
5. Application services depend on ports; infrastructure adapters implement those ports.
6. Port contracts live under `application/ports`, response/interface types under `types`, and explicit errors under `errors`.
7. Infrastructure clients are created once, participate in Nest lifecycle hooks, and close during shutdown.

## Log Pipeline

```text
Client application
  -> POST /v1/logs or /v1/logs/batch
  -> API key and rate-limit guards
  -> LogIngestionService
  -> KafkaLogProducerAdapter
  -> Kafka topic: logs.raw.v1
  -> KafkaLogConsumerService
  -> LogEventProcessorService
       |-> normalize and redact
       |-> ElasticsearchLogWriterService -> Elasticsearch
       `-> RealtimeLogPublisherService -> Redis
  -> Main API GraphQL query/subscription
  -> Web console
```

PostgreSQL is the system of record for users, projects, memberships, and API keys. Elasticsearch is the query store for processed logs. Kafka provides asynchronous transport, while Redis provides ephemeral realtime fan-out.

## Repository Layout

```text
apps/api/                 REST, GraphQL, auth, projects, API keys, log search
apps/ingestion-service/   Public log ingestion API
apps/log-processor/       Kafka consumer and log processing pipeline
packages/config/          Shared environment validation
packages/contracts/       Versioned log event contracts
packages/database/        Prisma lifecycle and database readiness
packages/elasticsearch/   Elasticsearch client, mappings, and search helpers
packages/http/            HTTP bootstrap and request middleware
packages/kafka/           Kafka clients, serializers, producers, and consumers
packages/shared/          Shared security and utility functions
prisma/                   Prisma schema, migrations, and seed
scripts/                  Local maintenance and readiness scripts
docker-compose.yml        Local infrastructure
```

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer
- Docker Desktop for the bundled local infrastructure
- PostgreSQL, either local or provided by Docker Compose

## Environment Configuration

Create `.env` from `.env.example`. A complete Docker-based local configuration uses:

```env
NODE_ENV=development
APP_NAME=LogScope
APP_VERSION=0.1.0

API_PORT=3000
INGESTION_PORT=3001
LOG_PROCESSOR_CONCURRENCY=4
LOG_PROCESSOR_GROUP_ID=logscope-log-processor-v1

DATABASE_URL=postgresql://logscope:logscope@localhost:15432/logscope?schema=public
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=logscope
KAFKA_SEND_TIMEOUT_MS=10000
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_LOGS_INDEX=syspulse-logs
REDIS_URL=redis://localhost:16379

CORS_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

If PostgreSQL runs directly on the host at its default port, use port `5432` instead of `15432`. Never commit the real `.env` or production secrets.

## Quick Start

Install dependencies:

```bash
pnpm install
```

Start all local infrastructure:

```bash
docker compose up -d
docker compose ps
```

For a lighter setup with host PostgreSQL, start only the log pipeline dependencies:

```bash
docker compose up -d redis kafka kafka-ui elasticsearch
```

Generate Prisma Client and apply migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

Run each service in a separate terminal:

```bash
pnpm dev:api
```

```bash
pnpm dev:ingestion
```

```bash
pnpm dev:processor
```

## Service URLs

| Service | URL |
| --- | --- |
| Main API | `http://localhost:3000` |
| REST API base | `http://localhost:3000/api/v1` |
| GraphQL HTTP/WS | `http://localhost:3000/api/graphql` |
| Ingestion API | `http://localhost:3001` |
| Kafka UI | `http://localhost:8080` |
| Elasticsearch | `http://localhost:9200` |
| PostgreSQL from Docker | `localhost:15432` |
| Redis from Docker | `localhost:16379` |

## Main API Surface

Authenticated REST requests use `Authorization: Bearer <accessToken>`.

| Area | Operations |
| --- | --- |
| Authentication | Register, sign in, refresh tokens, inspect current user |
| Projects | Create, list, inspect, update, and delete projects |
| Members | Add members, change roles, and remove members |
| API keys | Create, list, and revoke ingestion keys |
| Health | Inspect API process health and runtime metrics |
| Logs | Search through GraphQL and subscribe to realtime project events |

Project roles are `OWNER`, `ADMIN`, `DEVELOPER`, and `VIEWER`. Owners and admins can manage members and API keys. Developers and viewers have read access. The owner membership cannot be modified or removed, and deleting a project is owner-only.

## Log Ingestion

Create an API key from the web console or the authenticated project API. The complete key is returned only once and should be stored securely.

Send one event:

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

Send a batch of up to 500 events:

```bash
curl -X POST http://localhost:3001/v1/logs/batch \
  -H "Content-Type: application/json" \
  -H "x-api-key: sp_live_your_key" \
  -d '{
    "logs": [
      {
        "service": "checkout-api",
        "environment": "production",
        "level": "info",
        "message": "Order accepted"
      },
      {
        "service": "worker",
        "environment": "production",
        "level": "warn",
        "message": "Queue processing delayed"
      }
    ]
  }'
```

Accepted levels are `debug`, `info`, `warn`, `error`, and `fatal`. The server generates missing timestamps and event IDs. Service names are trimmed, environments and optional trace/span IDs are normalized, and sensitive attribute keys such as passwords, tokens, authorization headers, cookies, and credit card values are replaced with `[REDACTED]` before indexing.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev:api` | Run the main API in watch mode |
| `pnpm dev:ingestion` | Run the ingestion API in watch mode |
| `pnpm dev:processor` | Run the log processor |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Apply development migrations |
| `pnpm db:migrate:deploy` | Apply committed migrations non-interactively |
| `pnpm db:seed` | Seed local data |
| `pnpm db:check` | Check database readiness |
| `pnpm lint` | Run ESLint across workspaces |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run API end-to-end tests |
| `pnpm check` | Run lint, typecheck, and unit tests |
| `pnpm build` | Build all workspaces |

## Verification

Run the static and unit-test suite before pushing:

```bash
pnpm check
pnpm build
```

With the required infrastructure and test database available, also run:

```bash
pnpm test:e2e
```

For a manual end-to-end pipeline check:

1. Register a user and create a project.
2. Create and securely copy an ingestion API key.
3. Open the project Log Explorer with realtime mode enabled.
4. Send single and batch events to the ingestion service.
5. Verify realtime delivery, historical search, filtering, and redaction.
6. Refresh the API key list and verify `lastUsedAt` was updated.
7. Revoke a temporary key and confirm it no longer authenticates ingestion requests.

## Troubleshooting

- Run `docker compose ps` and wait for healthy infrastructure before starting services.
- If accepted logs do not appear, inspect the log processor terminal, Kafka UI, and Elasticsearch health.
- Historical search can lag ingestion briefly because events are transported and indexed asynchronously.
- Realtime subscriptions require both Redis and the Main API GraphQL WebSocket endpoint.
- If Prisma cannot connect, verify whether the configured PostgreSQL port is `15432` for Docker or `5432` for a host installation.
- Keep local `.env` files untracked and rotate any secret accidentally committed or shared.
