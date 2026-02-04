# AgriQ Backend

Production-ready NestJS API for alerts, gateways, triggers, and commodity workflows.

**Requirements**
- Node.js 18+
- npm 9+
- PostgreSQL (or the configured DB in `.env`)

**Quick Start**
```bash
npm install
cp .env .env.local
npm run build
npm run start:prod
```

**Environment**
Create `.env.local` or update `.env` (used by default). Key variables vary by environment, but typically include:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/agriq
PORT=8000
JWT_SECRET=replace-me
```

**Scripts**
```bash
# development
npm run start
npm run start:dev

# build
npm run build
npm run start:prod

# tests
npm run test
npm run test:cov
npm run test:e2e

# lint/format
npm run lint
npm run format
```

**Project Structure**
```text
backend/
├─ src/                 # application source
├─ prisma/              # schema and migrations
├─ scripts/             # maintenance scripts
├─ test/                # e2e tests
└─ Dockerfile           # container build
```

**Notes**
- Prisma client is generated during `npm run build`.
- If you run locally with Docker, ensure DB connectivity matches `DATABASE_URL`.

**Production Checklist**
- Set strong secrets in environment variables.
- Configure database backups and migrations.
- Enable logs/metrics collection.
