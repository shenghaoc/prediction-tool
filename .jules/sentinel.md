## 2024-05-24 - [Information Exposure in API Routes]
**Vulnerability:** The API route `app/api/prices/route.ts` was catching errors and directly returning `error.message` in the JSON response payload, exposing internal implementation details to clients.
**Learning:** Returning `error.message` directly from caught exceptions in API routes leaks implementation details and internal state, which is an information exposure vulnerability.
**Prevention:** Always log the full error internally (e.g., using `console.error`) and return a sanitized, generic error message (e.g., "Prediction service unavailable.") to the client.

## 2025-02-27 - [Security Headers]
**Vulnerability:** The application was missing defense-in-depth security headers like `Content-Security-Policy` and `Permissions-Policy`.
**Learning:** Next.js applications require explicit configuration in `next.config.js` to serve these headers globally to all routes.
**Prevention:** Include baseline CSP and Permissions-Policy in boilerplate Next.js setups to secure against XSS and excessive browser permissions.
