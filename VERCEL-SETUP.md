# Connect the Vercel frontend and backend

The browser calls `/api/...` on the frontend. Its server forwards every API method to the backend and passes application session cookies back to the browser. Keep the browser API base URL empty; no cross-origin cookie or CORS configuration is needed for this flow.

## Frontend project

- Root Directory: `Frontend`; framework: Next.js; build: `npm run build`.
- Set `BACKEND_API_URL` in Production and the applicable Preview environments to the backend's HTTPS origin, with no `/api` suffix. Prefer the backend's stable production domain over an individual deployment URL.
- Confirmed frontend project: `people-pay360`, domain `https://people-pay360-mu.vercel.app`. Confirmed backend project: `people-pay360-l4d1`, domain `https://people-pay360-l4d1.vercel.app`. The first originally supplied URL was the backend; the second was the frontend.
- Production `BACKEND_API_URL=https://people-pay360-l4d1.vercel.app` was saved and applied by redeploying the frontend on 2026-09-09.
- The individual deployment URLs require Vercel SSO, but the stable production domains are publicly reachable. No protection settings were changed and no bypass secret is needed for the current production connection. If the backend is later protected, the local proxy supports its automation secret as `BACKEND_VERCEL_BYPASS_SECRET` on the frontend server. Never use a `NEXT_PUBLIC_` prefix.
- Redeploy the frontend after saving variables and these code changes. Existing deployment URLs do not update in place.

Vercel documents the supported server header in [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

## Backend project

- Root Directory: `Backend`; framework: Next.js.
- Enable inclusion of source files outside the Root Directory because the Prisma schema is in `Database/prisma/schema.prisma`.
- Build command: `npm run db:generate && npm run build`. Generate Prisma on Vercel so the client matches the deployed runtime and schema.
- Set `DATABASE_URL` to a reachable hosted MySQL database, and `JWT_SECRET` to a long random secret. A database on `127.0.0.1` on your PC is unavailable to Vercel. Set `JWT_EXPIRES_IN=8h` if desired.
- Apply the repository migrations to the intended hosted database as a separately reviewed database operation. Do not seed demo users into a production payroll database.

## Verification after deployment

1. Open the frontend's current production domain. If it is protected, sign in to Vercel first.
2. Request `/api/auth/me` before application login. Expect JSON with HTTP 401, not Vercel HTML, a redirect, or HTTP 502/503.
3. Sign in with an existing application account. Confirm a secure HttpOnly `peoplepay_token` cookie is set on the frontend domain.
4. Refresh, open the employee list and dashboard, and verify the session persists. Exercise a permitted update on a test record, then log out and confirm protected API requests return 401.
5. Test payslip downloads and email separately if used; PDF browser dependencies and SMTP credentials are additional backend services.

Local verification: run `npm test` and `npm run build` from `Frontend`. For local development copy `.env.example` to `.env.local` and start the backend on port 4000.

## Verified deployment status (2026-09-09)

- The connector returned unknown-tool errors after reconnecting, so configuration was performed through the signed-in Vercel browser dashboard.
- Frontend production deployment `4skNai3B8Urqgy9M7EFaEYstQ7eg` completed successfully with the new backend origin. It uses existing commit `5df7fb8`; the local proxy code improvements and tests have not been pushed or deployed.
- Before the change, frontend `/api/auth/me` returned HTTP 404 with `DNS_HOSTNAME_RESOLVED_PRIVATE`. After redeployment it returns backend JSON with HTTP 401 and `Authentication is required`, confirming the production frontend-to-backend connection works.
- The backend build command was saved as `npm run db:generate && npm run build`; it applies on the next backend deployment. Root Directory is `Backend` and inclusion of outside files was already enabled.
- Backend environment variables were empty. `DATABASE_URL` and `JWT_SECRET` still need configuration, followed by database schema setup and backend redeployment. The local database host is `127.0.0.1`; it cannot serve the Vercel backend.
- Login, database operations, and payroll workflows remain unverified until a hosted database is configured. No database data or account credentials were changed.
