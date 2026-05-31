## 2024-05-24 - [Information Exposure in API Routes]
**Vulnerability:** The API route `app/api/prices/route.ts` was catching errors and directly returning `error.message` in the JSON response payload, exposing internal implementation details to clients.
**Learning:** Returning `error.message` directly from caught exceptions in API routes leaks implementation details and internal state, which is an information exposure vulnerability.
**Prevention:** Always log the full error internally (e.g., using `console.error`) and return a sanitized, generic error message (e.g., "Prediction service unavailable.") to the client.

## 2025-02-27 - [Security Headers]
**Vulnerability:** The application was missing defense-in-depth security headers like `Content-Security-Policy` and `Permissions-Policy`.
**Learning:** Next.js applications require explicit configuration in `next.config.js` to serve these headers globally to all routes.
**Prevention:** Include baseline CSP and Permissions-Policy in boilerplate Next.js setups to secure against XSS and excessive browser permissions.

## 2026-05-29 - Prevent DoS via Input Size Limits on API Endpoints
**Vulnerability:** The API `/api/prices` parsed JSON directly from incoming requests (`await request.json()`) without restricting the request body size. This exposed the application to Denial-of-Service (DoS) and memory exhaustion attacks from maliciously large payloads.
**Learning:** Next.js Route Handlers (`app/api/`) deployed to edge networks (e.g. Cloudflare) inherit stream limits but don't strictly enforce pre-parse string limits. Without a length check before parsing, large strings could crash the isolated process or exceed edge limits abruptly.
**Prevention:** Always read the raw text (`await request.text()`) and enforce a safe maximum length constraint before invoking `JSON.parse()`.

## 2026-06-03 - Prevent Simple Request CSRF via Content-Type Validation
**Vulnerability:** The API `/api/prices` parsed request bodies as JSON regardless of the `Content-Type` header. This allowed "Simple Requests" (e.g., `text/plain`, `application/x-www-form-urlencoded` submitted via standard HTML forms) to bypass CORS preflight checks and submit data to the API, exposing the application to simple CSRF and MIME confusion attacks.
**Learning:** Next.js Route Handlers do not automatically validate `Content-Type` headers before reading request payloads. Without explicit validation, cross-origin HTML forms can POST data to the endpoint.
**Prevention:** Always explicitly validate that the `Content-Type` header matches the expected media type (e.g., `application/json`) before parsing request bodies, returning a `415 Unsupported Media Type` if the validation fails.
