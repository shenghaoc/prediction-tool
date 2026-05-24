## 2024-05-24 - [Information Exposure in API Routes]
**Vulnerability:** The API route `app/api/prices/route.ts` was catching errors and directly returning `error.message` in the JSON response payload. This exposed internal details such as database schema issues (e.g., "Database field intercept_map is not a finite number") directly to the user.
**Learning:** Returning `error.message` directly from caught exceptions in API routes leaks implementation details and internal state, which is an information exposure vulnerability.
**Prevention:** Always log the full error internally (e.g., using `console.error`) and return a sanitized, generic error message (e.g., "Prediction service unavailable.") to the client.
