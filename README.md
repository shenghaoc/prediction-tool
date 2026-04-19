# Prediction Tool

HDB resale price estimator built with Next.js App Router.

This project started as an EE4802 mini-project and was later refactored into a modern web app with:
- Ant Design UI for form and results surfaces
- Recharts for trend visualization
- `/api/prices` as a typed server proxy to the upstream prediction service
- English/Chinese UI support with i18next

## Model and Data Notes

Only regression models are used to avoid maintaining a separate Python model-serving backend.

Because of the one-hot encoding constraints used in the original project data flow, future price prediction is not supported here. The trend output is scoped to the historical window used by the dataset.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Ant Design 6
- Recharts
- TypeScript
- Bun test runner

## Chart Strategy

For the React variant, charts are implemented with `recharts` (`components/prediction/PriceTrendChart.tsx`).

This is intentional because `recharts` is React-native, declarative, and integrates cleanly with component-driven theming.

## Local Development

Install dependencies:

```bash
bun install
```

Run development server:

```bash
bun dev
```

Open `http://localhost:3000`.

## Scripts

```bash
bun dev      # Start dev server
bun build    # Production build
bun start    # Run production server
bun lint     # ESLint
bun test     # Unit tests
```

## Environment Variables

Optional:

```bash
PRICES_API_URL=https://ee4802-g20-tool.shenghaoc.workers.dev/api/prices
```

If unset, the app uses the default URL above.

## Deployment Notes (Cloudflare Pages)

This app is compatible with Cloudflare Pages via Next-on-Pages style builds, but non-static routes must use Edge runtime.

Current API route setup:
- `app/api/prices/route.ts` exports `runtime = 'edge'`

If new dynamic routes are added, make sure each one includes:

```ts
export const runtime = 'edge';
```

Otherwise Cloudflare Pages builds will fail with:
"The following routes were not configured to run with the Edge Runtime."

## Key Project Paths

- `app/page.tsx` route entry
- `components/prediction/*` prediction UI components
- `app/api/prices/route.ts` server route proxy
- `lib/prediction.ts` request normalization and response guards
