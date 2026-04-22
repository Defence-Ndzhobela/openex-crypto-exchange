# OpenEx: Simulated Crypto Exchange

OpenEx is a lightweight simulated crypto exchange focused on BTC/USD trading for learning Java and Spring Boot backend engineering.

It includes limit and market orders, simulated wallets, an order book, a matching engine, market data simulation, REST APIs, WebSocket streaming, and a React dashboard.

## Important Disclaimer

OpenEx is a simulation for education only.

- No real funds
- No real private keys
- No integration with real custody/wallet providers
- Not production-grade financial custody software

## Core Goals

- Teach Java 17+ and Spring Boot service design
- Build a simplified matching engine and ledger for simulated BTC trades
- Practice production-quality debugging, observability, and testing
- Run fully with open-source tools locally and in CI

## Tech Stack

- Backend: Java 17+, Spring Boot (Web, Data JPA, WebSocket, optional Security)
- Persistence: PostgreSQL (H2 for tests)
- Caching: Redis
- Messaging (optional): Kafka or RabbitMQ
- Frontend: React + Vite + Chart.js
- Containerization: Docker + Docker Compose
- Observability: Prometheus + Grafana + OpenTelemetry
- Testing: JUnit 5, Mockito, Testcontainers
- Build: Maven or Gradle
- Logging: SLF4J + Logback
- CI: GitHub Actions

## High-Level Architecture

- AuthService: signup/login with basic auth or JWT
- WalletService: simulated BTC/USD balances and ledger entries
- OrderService: place/cancel order APIs and persistence
- MatchingEngine: in-memory order book, match logic, trade event emission
- MarketSimulator: random walk or CSV replay tick generation
- StreamingGateway: WebSocket pushes for order book, trades, and ticks
- Frontend: user auth, wallet views, order placement, market visuals

For local simulation, services can run together via Docker Compose.

## MVP Features

- User signup/login
- Simulated USD faucet deposits
- Limit and market buy/sell orders
- Order book view (top N bids/asks)
- Real-time WebSocket updates
- Price-time priority matching with partial fills
- Transactional ledger/trade writes with idempotency support
- Audit APIs for trades, balances, and order history
- Admin controls for simulator speed and account seeding

## Stretch Features

- IOC/FOK orders
- Order book snapshotting and replay
- Simulated fees and fee accounting
- Simulated margin (advanced)
- Wallet reconciliation with double-entry accounting
- CSV exports and backtesting harness

## Sprint Plan (Month 5)

### Sprint 0: Requirements and Design

Deliverables:

- PRD and feature list
- ER diagrams (wallets, orders, trades)
- Order lifecycle sequence diagrams
- OpenAPI contract

Acceptance:

- API spec reviewed
- DB schema approved

### Sprint 1: Setup and Core Domain

Tasks:

- Initialize Spring Boot repo/modules
- Configure build, style, formatting
- Define domain models: Order, Trade, Wallet, LedgerEntry
- Add Flyway/Liquibase migrations
- Implement health and basic order CRUD endpoints

Deliverables:

- Running project skeleton
- DB migrations
- Basic tests

### Sprint 2: Matching Engine and Order Flow

Tasks:

- Implement in-memory order book and price-time matching
- Persist trades and ledger updates transactionally
- Add integration tests with Testcontainers (Postgres)

Deliverables:

- Integrated matching flow
- Demonstrable integration tests

### Sprint 3: Real-Time and Market Simulator

Tasks:

- Add Spring WebSocket endpoints for market streams
- Implement simulator (random walk or CSV playback)
- Add Redis snapshots/cache (optional)
- Add React UI skeleton for streams

Deliverables:

- End-to-end real-time market stream and UI

### Sprint 4: Observability, Security, and Testing

Tasks:

- Add logs, metrics, and tracing (Micrometer + OTel)
- Secure critical APIs with JWT
- Add unit, integration, and performance smoke tests
- Add CI pipeline for build and tests

Deliverables:

- Grafana dashboard and Prometheus metrics
- Secured endpoints
- Automated CI checks

### Sprint 5: Hardening and Demo

Tasks:

- Bug fixing and UX improvements
- Demo data preparation
- Documentation and runbook finalization

Deliverables:

- Final demo package
- README, evaluator checklist, and handoff docs

## Backend Learning Focus (Java/Spring)

- REST and WebSocket controller design
- DTO design and validation
- Spring Data JPA entities/repositories
- Transaction management for ledger consistency
- Matching algorithm performance and concurrency
- Testcontainers integration testing in CI
- Metrics and tracing instrumentation

## Debugging and Quality Practices

1. Local debugging with breakpoints and conditional breakpoints
2. Remote debugging in Docker using JDWP
3. Structured logging with traceId, userId, and orderId
4. Distributed tracing across REST, matching, and DB layers
5. Metrics-first diagnosis for latency and throughput issues
6. Reproducible test cases before attempting fixes
7. Concurrency-focused tests for race conditions and deadlocks
8. Transaction and isolation-level validation for wallet safety
9. Idempotency keys for order placement safety
10. Observability workflow: metrics -> traces -> logs -> reproducible test

## Testing and Acceptance Criteria

- 80%+ matching-engine unit test coverage
- Integration test for 100 concurrent orders with consistent ledger state
- Local WebSocket update latency target under 300ms in simple scenarios
- Prometheus scrape working and Grafana dashboard available

## Suggested Repository Deliverables

- Modular Spring Boot backend and React frontend
- Docker Compose for local full-stack simulation
- Passing CI with unit/integration tests
- OpenAPI spec, runbook, and debugging guide
- Observability dashboards and traces for critical workflows

## Quick Start Commands

```bash
# Build and run services
docker-compose up --build

# Run backend with remote debug enabled (example)
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"

# Run integration tests
mvn verify -P integration
```

Useful endpoints (example defaults):

- Metrics: http://localhost:8080/actuator/prometheus
- WebSocket: ws://localhost:8080/ws/market

## Demo Scenarios

- Two users place opposing limit orders to show partial fills and ledger writes
- Order flood (e.g., 50 clients) to demonstrate concurrency handling
- Observability-driven debug of a slow query using traces and logs

## Project Structure (Current Workspace)

```text
backend/
frontend/
```

## License

Use an open-source license (MIT/Apache-2.0 recommended) and include a LICENSE file for public distribution.
