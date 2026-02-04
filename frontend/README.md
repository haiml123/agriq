# AgriQ Frontend

Production-ready Next.js app for monitoring commodities, alerts, and operations.

**Requirements**
- Node.js 18+
- npm 9+

**Quick Start**
```bash
npm install
cp .env .env.local
npm run dev
```

**Environment**
Update `.env.local` with your values.
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-me
NEXT_PUBLIC_ENVIRONMENT=development
```

**Scripts**
```bash
# development
npm run dev

# build
npm run build
npm run start

# quality
npm run lint
npm run type-check
npm run format
```

**Project Structure**
```text
frontend/
├─ app/                 # Next.js App Router
├─ components/          # feature-based components
├─ hooks/               # API and shared hooks
├─ schemas/             # Zod schemas (source of truth)
├─ messages/            # i18n messages
├─ providers/           # context providers
└─ public/              # static assets
```

**Conventions**
- Types and enums are derived from Zod schemas.
- Feature folders keep UI, hooks, and utils together.
- Avoid hardcoded strings; use enums and translations.

**Production Checklist**
- Set `NEXTAUTH_SECRET` and any API keys in the environment.
- Use a stable `NEXT_PUBLIC_API_URL` for production.
- Run `npm run build` and verify the output.
