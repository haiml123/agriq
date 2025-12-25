# 🌾 AgriQ Frontend

> **Enterprise-grade agricultural commodity management platform** built with Next.js 16, TypeScript, and Zod.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Zod](https://img.shields.io/badge/Zod-Schema-3E67B1?logo=zod)](https://zod.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development Guide](#-development-guide)
- [Feature-Based Pattern](#-feature-based-pattern)
- [Zod Schema Best Practices](#-zod-schema-best-practices)
- [Creating New Features](#-creating-new-features)
- [Scripts](#-scripts)
- [Code Quality](#-code-quality)

---

## 🎯 Overview

AgriQ is a comprehensive platform for managing agricultural commodities, monitoring storage conditions, and tracking alerts across multiple sites. The application provides real-time insights into temperature, humidity, and commodity movements with advanced analytics and alerting capabilities.

### Key Features

- 🏢 **Multi-Organization Support** - Manage multiple organizations and sites
- 📊 **Real-time Monitoring** - Track temperature, humidity, and EMC levels
- 🔔 **Intelligent Alerts** - Configurable triggers and severity-based notifications
- 📦 **Commodity Management** - Track inventory, trades, and transfers
- 👥 **Role-Based Access** - Super Admin, Admin, and Operator roles
- 🌍 **Internationalization** - Multi-language support with next-intl
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS

---

## 🛠 Tech Stack

### Core

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[React 19](https://react.dev/)** - UI library
- **[Zod](https://zod.dev/)** - Schema validation and type inference

### Styling & UI

- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality component library
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI primitives
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon set

### Data & State

- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[date-fns](https://date-fns.org/)** - Modern date utility library
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

### Developer Experience

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[next-intl](https://next-intl-docs.vercel.app/)** - Internationalization

---

## 🏗 Architecture

AgriQ follows a **feature-based architecture** with strict separation of concerns and Zod schema-driven development.

### Core Principles

1. **Single Source of Truth** - All types derived from Zod schemas
2. **Feature Isolation** - Each feature is self-contained
3. **Type Safety** - No hardcoded strings, enum-based constants
4. **Composition Over Inheritance** - Reusable, composable components
5. **Convention Over Configuration** - Consistent patterns across codebase

### Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                    App Router                       │
│              (Routing & Layouts)                    │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Feature Components                     │
│        (Business Logic & Presentation)              │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  Custom Hooks                       │
│          (State Management & Data)                  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  API Layer                          │
│            (HTTP Requests & Cache)                  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                 Zod Schemas                         │
│          (Validation & Type Inference)              │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   └── [locale]/                # Internationalized routes
│       ├── (auth)/              # Auth layout group
│       └── (dashboard)/         # Dashboard layout group
│           ├── sites/           # → components/sites
│           ├── alerts/          # → components/alerts
│           ├── dashboard/       # → components/dashboard
│           └── admin/           # Admin routes
│               ├── organizations/
│               ├── commodities/
│               ├── triggers/
│               └── lookup-tables/
│
├── components/                   # Feature-based components
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Layout components
│   ├── modals/                  # Modal dialogs
│   │
│   ├── sites/                   # Sites feature ✅
│   │   ├── index.ts            # Public API
│   │   ├── types.ts            # Re-exports from schemas
│   │   ├── sites-page.tsx      # Main container
│   │   ├── hooks/              # Business logic
│   │   │   ├── use-sites-data.ts
│   │   │   ├── use-sites-filters.ts
│   │   │   └── use-cell-chart-data.ts
│   │   ├── utils/              # Pure functions
│   │   │   ├── chart-utils.ts
│   │   │   └── date-utils.ts
│   │   ├── charts/             # Chart components
│   │   ├── cards/              # Info cards
│   │   └── skeletons/          # Loading states
│   │
│   ├── alerts/                  # Alerts feature ✅
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── components/
│   │
│   ├── dashboard/               # Dashboard feature ✅
│   │   ├── hooks/
│   │   └── sections/
│   │
│   └── admin/                   # Admin features ✅
│       ├── organizations/
│       ├── commodities/
│       ├── triggers/
│       └── lookup-tables/
│
├── schemas/                     # Zod schemas (Single Source of Truth)
│   ├── common.schema.ts        # Shared enums & types
│   ├── sites.schema.ts         # Sites, cells, compounds
│   ├── alert.schema.ts         # Alerts
│   ├── trade.schema.ts         # Trades
│   ├── commodity.schema.ts     # Commodities
│   └── organization.schema.ts  # Organizations
│
├── hooks/                       # Global hooks
│   ├── use-api.ts              # Base API hook
│   ├── use-site-api.ts         # Sites API
│   ├── use-alert-api.ts        # Alerts API
│   └── use-trade-api.ts        # Trades API
│
├── lib/                         # Utilities
│   ├── utils.ts                # Helper functions
│   └── local-storage.ts        # Storage helpers
│
├── providers/                   # Context providers
│   ├── app-provider.tsx        # App state
│   └── modal-provider.tsx      # Modal management
│
└── public/                      # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Environment variables** (see `.env.example`)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1

# Auth (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Optional
NEXT_PUBLIC_ENVIRONMENT=development
```

---

## 💻 Development Guide

### Folder Conventions

- **`_folder/`** - Private, not routed (Next.js convention)
- **`(group)/`** - Route group, affects layout but not URL
- **`[param]/`** - Dynamic route segment

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `SitesPage.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `chart-utils.ts`)
- **Hooks**: `use-feature-name.ts` (e.g., `use-sites-data.ts`)
- **Types**: `types.ts` or `*.schema.ts`

### Import Order

```typescript
// 1. External libraries
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// 2. Internal components
import { Button } from '@/components/ui/button';
import { SitesHeader } from './sites-header';

// 3. Hooks
import { useSitesData } from './hooks/use-sites-data';

// 4. Types & utils
import type { Site } from './types';
import { formatDate } from '@/lib/utils';
```

---

## 🎨 Feature-Based Pattern

Every feature follows this consistent structure:

```
components/[feature]/
├── index.ts                    # Public exports
├── types.ts                    # Re-export from Zod schemas
├── [feature]-page.tsx          # Main container (thin)
├── hooks/                      # Business logic
│   ├── use-[feature]-data.ts  # Data fetching
│   └── use-[feature]-filters.ts # State management
├── utils/                      # Pure functions
│   └── [feature]-utils.ts
└── components/                 # UI components
    ├── [feature]-header.tsx
    ├── [feature]-table.tsx
    └── [feature]-filters.tsx
```

### Example: Sites Feature

```typescript
// app/[locale]/(dashboard)/sites/page.tsx
// ✅ Just 3 lines - clean and simple
import { SitesPage } from '@/components/sites';
export default SitesPage;
```

```typescript
// components/sites/sites-page.tsx
// ✅ Thin container - composes smaller components
export function SitesPage() {
  const filters = useSitesFilters(sites);
  const { cellsDetails, loading } = useCellsDetails(
    filters.selectedCellIds,
    filters.dateRange,
    filters.customStartDate,
    filters.customEndDate
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <SitesHeader onAddCommodity={...} />
      <SitesFilters {...filters} />
      {loading ? <CellSectionSkeleton /> : <CellSections data={cellsDetails} />}
    </div>
  );
}
```

### Benefits

✅ **Testability** - Easy to unit test hooks and utils
✅ **Reusability** - Components can be shared across features
✅ **Maintainability** - Changes are isolated to specific files
✅ **Scalability** - Pattern scales to any size project
✅ **Developer Experience** - Easy to find and understand code

---

## 🔒 Zod Schema Best Practices

### 1. Define Schema with Enum

```typescript
// schemas/common.schema.ts
import { z } from 'zod';

// ✅ Define enum schema
export const severitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

// ✅ Export enum for runtime use
export const SeverityEnum = severitySchema.enum;

// ✅ Export type for TypeScript
export type Severity = z.infer<typeof severitySchema>;
```

### 2. Re-export in Feature Types

```typescript
// components/sites/types.ts
// ✅ Re-export types from schemas (DRY principle)
export type { SensorReading, CellTrade } from '@/schemas/sites.schema';
export { DateRangeEnum, SeverityEnum } from '@/schemas/common.schema';
```

### 3. Use Enums in Code

```typescript
// components/sites/utils/chart-utils.ts
import { DateRangeEnum } from '../types';

// ❌ BAD: Hardcoded strings
export function getDateFormat(dateRange: DateRange): string {
  switch (dateRange) {
    case '7days': return 'MMM dd';  // ❌ Magic string
    case 'month': return 'MMM dd';   // ❌ Magic string
  }
}

// ✅ GOOD: Type-safe enums
export function getDateFormat(dateRange: DateRange): string {
  switch (dateRange) {
    case DateRangeEnum['7days']: return 'MMM dd';  // ✅ Type-safe
    case DateRangeEnum.month: return 'MMM dd';     // ✅ Type-safe
  }
}
```

### 4. Enum-Based Styling

```typescript
// ✅ GOOD: Enum keys ensure type safety
import { SeverityEnum } from './types';

const severityStyles = {
  [SeverityEnum.LOW]: 'bg-blue-500',
  [SeverityEnum.MEDIUM]: 'bg-yellow-500',
  [SeverityEnum.HIGH]: 'bg-orange-500',
  [SeverityEnum.CRITICAL]: 'bg-red-500',
};

// Usage
<Badge className={severityStyles[alert.severity]} />
```

---

## 🆕 Creating New Features

### Step 1: Create Schema

```typescript
// schemas/my-feature.schema.ts
import { z } from 'zod';

export const myFeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export const MyFeatureStatusEnum = myFeatureSchema.shape.status.enum;
export type MyFeature = z.infer<typeof myFeatureSchema>;
```

### Step 2: Create Feature Folder

```bash
mkdir -p components/my-feature/{hooks,utils,components}
```

### Step 3: Create Files

```typescript
// components/my-feature/types.ts
export type { MyFeature } from '@/schemas/my-feature.schema';
export { MyFeatureStatusEnum } from '@/schemas/my-feature.schema';

// components/my-feature/hooks/use-my-feature-data.ts
export function useMyFeatureData() {
  // Data fetching logic
}

// components/my-feature/my-feature-page.tsx
export function MyFeaturePage() {
  // Component logic
}

// components/my-feature/index.ts
export { MyFeaturePage } from './my-feature-page';
```

### Step 4: Create Route

```typescript
// app/[locale]/(dashboard)/my-feature/page.tsx
import { MyFeaturePage } from '@/components/my-feature';
export default MyFeaturePage;
```

Done! ✅

---

## 📜 Scripts

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript check

# Code Quality
npm run format           # Format with Prettier
npm run lint:fix         # Fix linting issues
```

---

## ✅ Code Quality

### Type Safety Rules

1. ✅ **All types from Zod schemas** - No duplicate definitions
2. ✅ **No `any` types** - Strict TypeScript
3. ✅ **Enum-based constants** - No magic strings
4. ✅ **Explicit return types** - Document function contracts

### Component Guidelines

1. ✅ **Single Responsibility** - One component, one job
2. ✅ **Composition** - Build complex UIs from simple parts
3. ✅ **Props Interface** - Always define prop types
4. ✅ **Extract Logic** - Keep components thin, use hooks

### Best Practices

```typescript
// ✅ GOOD
export function MyComponent({ data }: MyComponentProps) {
  const { processedData } = useMyData(data);
  return <div>{processedData}</div>;
}

// ❌ BAD
export function MyComponent({ data }: any) {
  const processedData = data.map(...) // Logic in component
  return <div>{processedData}</div>;
}
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Zod Documentation](https://zod.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📝 License

Proprietary - All Rights Reserved

---

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

---

**Built with ❤️ by the AgriQ Team**
