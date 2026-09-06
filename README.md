# PeoplePay360

PeoplePay360 is an integrated HR and payroll application built with a Next.js/React frontend, a separate Next.js REST backend, and a MySQL database accessed through Prisma. It connects employee records, working schedules, contracts, attendance, leave, salary rules, payruns, payslips, notifications, and reporting.

**Status:** Hackathon/demo application in development. This README describes the current implementation and its integration requirements. The broader product brief in [Frontend/README.md](Frontend/README.md) includes proposed capabilities; it is not a checklist of completed features.

## Contents

- [Architecture and framework](#architecture-and-framework)
- [Repository map](#repository-map)
- [Installation and configuration](#installation-and-configuration)
- [Authentication and permissions](#authentication-and-permissions)
- [Frontend integration](#frontend-integration)
- [Detailed module integration](#detailed-module-integration)
- [API contract](#api-contract)
- [Employee-to-payslip workflow](#employee-to-payslip-workflow)
- [Testing and verification](#testing-and-verification)
- [Deployment considerations](#deployment-considerations)
- [Troubleshooting and current limitations](#troubleshooting-and-current-limitations)
- [Extending the project](#extending-the-project)

## Architecture and framework

```mermaid
flowchart LR
    Browser[Browser: React pages] --> State[Local React state / Zustand stores]
    State --> Client[Services / shared Axios client]
    Client --> Frontend[Frontend Next.js server: port 3000]
    Frontend -->|Rewrite /api/*| Backend[Backend Next.js routes: port 4000]
    Backend --> Auth[Authentication / roles / ownership / validation]
    Auth --> Domain[Integration modules and calculations]
    Domain --> Prisma[Prisma client]
    Prisma --> DB[(MySQL)]
    Domain --> PDF[Puppeteer PDF generation]
    PDF --> SMTP[Nodemailer / configured SMTP server]
```

The browser sends relative requests such as `/api/employees` to the frontend origin. The frontend forwards these to the backend. The backend validates access and input, performs business operations, and returns JSON or a PDF. React updates the displayed state from that response. The browser does not connect directly to MySQL.

| Layer | Technologies and responsibility |
| --- | --- |
| Frontend framework | Next.js 16 and React 19, App Router, JavaScript/JSX |
| UI | Tailwind CSS 4, shared CSS classes, Lucide icons, Recharts |
| Client state | Zustand for core modules; React state for directly connected screens |
| HTTP | Axios with cookies, timeout, and a shared response interceptor |
| Forms | Shared controlled `IntegrationForm`; some forms use React Hook Form and Zod |
| Backend | Next.js route handlers running on Node.js; no separate Express server |
| Validation/security | Zod, bcryptjs password hashing, jose JWT signing and verification |
| Persistence | Prisma 6 and MySQL; transactions for connected business changes |
| Documents/delivery | Puppeteer and Nodemailer |
| Tests | Node.js test runner and a separate live API workflow script |

Use each package's lockfile for reproducible installation. The repository contains separate packages, not a root npm workspace. Although TypeScript dependencies and database TypeScript scripts exist, most application code is JavaScript.

## Repository map

```text
PeoplePay360/
├── Frontend/
│   ├── src/app/                 Pages, layouts, and small API proxy routes
│   ├── src/components/          Shared UI and feature components
│   ├── src/store/               Zustand state and asynchronous actions
│   ├── src/services/            API endpoint wrappers
│   ├── src/lib/                 Axios, permissions, formatting, proxy helper
│   ├── next.config.js           Backend API rewrite
│   └── package.json
├── Backend/
│   ├── src/app/api/             HTTP route entry points
│   ├── src/modules/integration/ Active integrated HR/payroll workflows
│   ├── src/modules/payroll/     Additional payroll implementation files
│   ├── src/lib/                 Auth, Prisma, errors, shared helpers
│   ├── scripts/                Demo seed and admin bootstrap
│   ├── tests/                  Calculation tests and live workflow exercise
│   ├── prisma/                 Additional schema/seed files; see schema note
│   └── package.json
├── Database/
│   ├── prisma/schema.prisma     Shared schema used by backend integration scripts
│   ├── prisma/migrations/       Versioned database migrations
│   ├── prisma/seed.ts           Separate database seed workflow
│   └── package.json
├── scripts/start-demo.ps1       Machine-specific Windows demo launcher
└── INTEGRATION.md               Short demo notes
```

### Main files to read first

| File | What it controls |
| --- | --- |
| `Frontend/src/app/layout.jsx` | Global CSS, metadata, root document |
| `Frontend/src/app/page.jsx` | Session restoration and initial redirect |
| `Frontend/src/app/(auth)/login/page.jsx` | Login form and demo role shortcuts |
| `Frontend/src/app/(dashboard)/layout.jsx` | Session gate, sidebar, navbar, mobile navigation |
| `Frontend/src/lib/api.js` | Shared Axios client and error parsing |
| `Frontend/next.config.js` | `/api/:path*` forwarding to the backend |
| `Frontend/src/store/authStore.js` | User/session state, login, logout, restoration |
| `Frontend/src/components/ui/IntegrationForm.jsx` | Controlled fields, submit state, error display |
| `Frontend/src/components/operations/OperationsPage.jsx` | Attendance, leave requests, types, allocations |
| `Frontend/src/components/dashboard/LiveDashboard.jsx` | Live dashboard and reports presentation |
| `Backend/src/lib/auth.js` | Password hashing, JWTs, authenticated user lookup, role helpers |
| `Backend/src/modules/integration/http.js` | Route wrapper, origin check, errors, pagination, ownership scope |
| `Backend/src/modules/integration/serializers.js` | Database-to-frontend field mapping |
| `Backend/src/modules/integration/hr.js` | Employees, schedules, contracts |
| `Backend/src/modules/integration/operations.js` | Attendance and leave operations |
| `Backend/src/modules/integration/structures.js` | Salary structure/rule normalization and preview |
| `Backend/src/modules/integration/calculations.js` | Formula interpreter, totals, contracts, working dates |
| `Backend/src/modules/integration/payroll.js` | Eligibility, payrun lifecycle, payslip serialization |
| `Backend/src/modules/integration/documents.js` | PDF rendering and individual/bulk email |
| `Backend/src/modules/integration/reporting.js` | Dashboard aggregation |

Many backend routes re-export handlers from `modules/integration`. Follow the route's import to find the active implementation rather than assuming similarly named files under `modules/payroll` handle that endpoint.

## Installation and configuration

### Prerequisites

- Git and a working Node.js/npm installation. The current local application was started with Node.js 24.12.0.
- A running MySQL server; the local demo uses MySQL 8.4.
- A database and MySQL user with permissions to apply the project's migrations.
- Network access during dependency installation, including Puppeteer's browser download when enabled.
- An SMTP server only if you need actual email delivery.

### 1. Obtain the project and install packages

```sh
git clone https://github.com/Mohith2912/PeoplePay360.git
cd PeoplePay360
git switch Frontend-doc
cd Backend
npm ci
cd ../Frontend
npm ci
cd ..
```

The application runtime needs the Backend and Frontend packages. Install the Database package separately with `npm ci` in `Database` only when using its TypeScript utilities or its separate seed workflow. Its postinstall also generates a Prisma client into the backend; install Backend first.

### 2. Configure the backend

Copy `Backend/.env.example` to `Backend/.env` and replace the placeholder values:

```dotenv
DATABASE_URL="mysql://APP_USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/peoplepay360"
JWT_SECRET="REPLACE_WITH_A_LONG_RANDOM_SECRET"
JWT_EXPIRES_IN="8h"
APP_URL="http://localhost:3000"

# Optional: required for external email delivery
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="PeoplePay360 <no-reply@example.com>"
SMTP_SECURE="false"

# Optional: used when payroll snapshots are created
COMPANY_NAME="PeoplePay360"
COMPANY_ADDRESS=""
COMPANY_TAX_ID=""
```

Use the actual MySQL port: the machine-specific demo launcher uses **3307**, while the example above uses **3306**. URL-encode special characters in database credentials. `APP_URL` should identify the browser-facing application origin; the example file currently uses port 4000, so adjust it for the frontend deployment. The integration wrapper compares mutation request origins against the forwarded host or this value.

Do not place `DATABASE_URL`, `JWT_SECRET`, or SMTP credentials in browser-exposed `NEXT_PUBLIC_*` variables. Local `.env` files are ignored by Git; committed `.env.example` files must contain placeholders only.

### 3. Configure the frontend

Create `Frontend/.env.local`:

```dotenv
BACKEND_API_URL="http://127.0.0.1:4000"
```

This is a server-side setting used by the rewrite. Restart the frontend after changing it. Browser code should continue using `/api/...`; do not replace those URLs with a hardcoded backend origin.

### 4. Generate the client and apply migrations

From `Backend`, after creating the MySQL database and configuring `.env`:

```sh
npm run db:generate
npm run db:migrate
```

Both commands explicitly use `../Database/prisma/schema.prisma`. That schema generates the client into `Backend/node_modules/.prisma/client`, which the backend imports through `@prisma/client`.

**Schema integration rule:** use `Database/prisma/schema.prisma` and its migration directory for this integrated setup. `Backend/prisma/schema.prisma` also exists. The backend `db:push` script does not specify the shared schema, so do not substitute it for the documented migration workflow. Schema changes must include migrations and regenerated client code; do not hand-edit generated files.

If using Database's separate utilities, copy `Database/.env.example` to `Database/.env` and point it at the same intended database. Avoid conflicting database URLs across the two packages.

### 5. Seed a demo environment

From `Backend`:

```sh
npm run demo:seed
```

This creates or updates representative schedules, salary structures, employee data, leave types, and the following accounts. It also resets the listed demo account passwords when rerun. Use it only on a demo database.

| Role | Demo email |
| --- | --- |
| Admin | `admin@peoplepay360.com` |
| HR Payroll Manager | `payroll_manager@peoplepay360.com` |
| HR Payroll User | `payroll_user@peoplepay360.com` |
| HR Manager | `hr_manager@peoplepay360.com` |
| Employee | `employee@peoplepay360.com` |

The demo password is `password123`. These are intentionally public demo credentials; never reuse these accounts/passwords in a production deployment. Frontend role buttons fill credentials; the backend still authenticates the account and determines its role.

### 6. Start both applications

Backend terminal, working directory `Backend`:

```sh
npm run dev
```

Frontend terminal, working directory `Frontend`:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Backend APIs run on port 4000. MySQL must already be running.

If the npm launcher on Windows is broken but dependencies are installed, the equivalent commands are:

```sh
# From Backend
node node_modules/next/dist/bin/next dev -p 4000
# From Frontend, in a separate terminal
node node_modules/next/dist/bin/next dev -p 3000
```

`scripts/start-demo.ps1` is an optional launcher for the original Windows machine. It expects an untracked MySQL installation under `.local-runtime/mysql/mysql-8.4.11-winx64`, an initialized data directory, port 3307, and npm at a fixed Windows path. It is not a portable database installer or first-time setup script.

## Authentication and permissions

1. The root page calls `fetchCurrentUser()` from `authStore`.
2. `authService.getMe()` requests `GET /api/auth/me` through the frontend rewrite.
3. The backend verifies the JWT and reads the corresponding user and linked employee from MySQL.
4. A valid session opens `/dashboard`; an invalid session opens `/login`. The dashboard layout shows a session-check screen until this resolves.
5. Login sends `{ email, password }` to `POST /api/auth/login`. The backend verifies the password and sets the `peoplepay_token` HttpOnly cookie, with `SameSite=Lax` and `Secure` in production.
6. Zustand stores user information in memory. Refreshing restores authentication from the cookie, rather than a JWT saved in localStorage.
7. Axios sends credentials and redirects to `/login` on HTTP 401 outside the login page.
8. Logout calls `POST /api/auth/logout`, clears the frontend session state, and navigates to login.

The auth store shares an in-flight restoration promise to avoid duplicate simultaneous session checks. The backend also accepts a Bearer token for non-browser clients; normal frontend integration uses the cookie.

| Capability | Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Personal records, attendance, leave | Own records | HR scope | HR scope | HR scope | Full scope |
| Manage employees, schedules, contracts, leave | No | Yes | Yes | Yes | Yes |
| Read payroll / create and compute payruns | No | No | Yes | Yes | Yes |
| Manage salary structures and preview rules | No | No | No | Yes | Yes |
| Validate, mark paid, cancel, send payslips | No | No | No | Yes | Yes |
| View issued personal payslips | Own paid slips | No payroll role | Payroll scope | Payroll scope | Payroll scope |
| User administration and audit UI | No | No | No | No | Yes |

Frontend permission helpers control visibility. Backend role checks and employee ownership checks enforce access even if someone calls an API directly. Employees only receive their own **PAID** payslips through the integrated payslip endpoints.

## Frontend integration

### Request and response lifecycle

```text
Page loads or user submits a form
  -> React handler
  -> Zustand action + service, or direct apiClient call
  -> frontend /api endpoint
  -> Next.js rewrite to backend
  -> authentication, roles, ownership, validation
  -> business logic + Prisma transaction/query
  -> serialized JSON response
  -> store/local state update
  -> React re-render, success feedback, or error feedback
```

`apiClient` has an empty base URL, `withCredentials: true`, and a 60-second timeout. `next.config.js` defines a `beforeFiles` rewrite for all `/api/:path*` requests. Small frontend auth/dashboard route files and `backendProxy.js` also exist, but the rewrite is the primary forwarding configuration. Do not implement database business logic in these frontend proxy files.

### State patterns

- Employees, contracts, schedules, salary structures, payruns, and payslips use service wrappers and Zustand stores. Stores track records, active details, loading/submitting states, errors, and action results.
- Attendance and time-off screens share `OperationsPage`, which calls Axios directly and keeps rows/form state locally.
- The active dashboard and reports use `LiveDashboard` directly. `dashboardService` and `dashboardStore` exist but are not the active page's request path.
- Admin and navbar notifications also use direct Axios calls.
- Stores generally update after a successful server response. Some pages then refetch the list. Notifications mark a row read locally even when the mark-read request fails.

### Forms and field conversion

`IntegrationForm` initializes controlled values from `initialData`, defaults, or empty strings. It renders inputs/selects, uses HTML required/type/min validation, calls an async submit handler, disables submission while saving, and displays a returned error message. Input values are generally strings; feature handlers or backend schemas perform conversion.

The public `EmployeeForm`, `ContractForm`, and `PayrunCreateModal` files re-export the corresponding `ConnectedEmployeeForm`, `ConnectedContractForm`, and `ConnectedPayrunWizard` implementations. Read those connected files when changing fields or requests.

The employee form loads schedules from the API. The contract form loads employees, contract salary-structure options, and schedules; it converts wage to a number and empty optional values to null. Operations forms convert boolean selections and append `Z` to attendance date-times, treating those entries as UTC.

### Database field mapping

The frontend's form model differs from the database model. Backend serializers and save handlers bridge them:

| Frontend field | Database representation |
| --- | --- |
| `name` | `firstName` + `lastName`; input name is split when saved |
| `jobPosition` | `designation` |
| `employmentStatus` | `status` |
| `scheduleId` | `workingScheduleId` on Employee |
| `panNumber` / `uanNumber` / `ifscCode` | `pan` / `uan` / `bankIFSC` |
| Contract `structureId` | `salaryStructureId` |
| Schedule `lines` | `scheduleDays` with day/time/break values |
| Payrun `startDate` / `endDate` | `periodStart` / `periodEnd` |

IDs are backend-generated strings, not sequential numeric IDs. Employee display codes such as `PP001` are separate from primary keys. Monetary values used by the UI are serialized to numbers where needed.

## Detailed module integration

This section traces each major module from its screen to its stored data and explains the response handling and side effects.

| Module | Frontend entry | Client/store path | Backend implementation | Main persisted models |
| --- | --- | --- | --- | --- |
| Authentication | Login page and dashboard layout | `authStore` → `authService` | `api/auth/*` + `lib/auth.js` | `User`, linked `Employee` |
| Employees | Directory and employee detail | `employeeStore` → `employeeService` | `integration/hr.js` | `Employee`, `AuditLog`, allocation/notification records |
| Contracts | Contract list and employee Contracts tab | `contractStore` → `contractService` | `integration/hr.js` | `Contract`, `AuditLog` |
| Schedules | Schedule page and employee/contract option forms | `scheduleStore` → `scheduleService` | `integration/hr.js` | `WorkingSchedule`, `ScheduleDay` |
| Attendance | Shared operations page | direct `apiClient` | `integration/operations.js` | `AttendanceRecord`, `AuditLog` |
| Time off | Requests, types, allocations pages | direct `apiClient` | `integration/operations.js` | `TimeOffType`, `TimeOffAllocation`, `TimeOffRequest` |
| Salary structures | Salary-structure page and editor | `salaryStructureStore` → service | `integration/structures.js` | `SalaryStructure`, `SalaryRule` |
| Payruns | Payrun list, wizard, detail page | `payrunStore` → `payrunService` | `integration/payroll.js` | `Payrun`, assignments, `Payslip`, `PayslipLine`, `Payment` |
| Payslips | Global/personal list and detail | `payslipStore` → `payslipService` | payroll and documents modules | `Payslip`, lines, snapshots, delivery timestamps |
| Dashboard/reports | `LiveDashboard` | direct `apiClient` | `integration/reporting.js` | Read-only aggregation across operational models |
| Notifications | Navbar dropdown | direct `apiClient` | `integration/notifications.js` | `Notification` |
| Administration | Admin page | direct `apiClient` | admin API routes | `User`, `AuditLog` |

### Employee integration, from form to response

The directory waits 300 ms after search/filter changes, then calls `fetchEmployees({ search, department, status, page, limit: 50 })`. The service turns that object into query parameters. On success, the store replaces `employees` and `total`; on failure it stores a parsed error and ends the loading state. A confirmed `404` plus `EMPLOYEE_NOT_FOUND` is handled separately on the detail page.

For creation, the form first loads schedule options. `employeeService.createEmployee()` strips any accidental `id` before POSTing. The backend:

1. validates the JSON with Zod;
2. splits `name` into first and last names and maps UI field names to database fields;
3. requires a schedule for a new employee;
4. generates the next display code such as `PP001`;
5. creates the employee in a serializable transaction;
6. writes an audit event and ensures the initial annual-leave allocation;
7. serializes the stored row back into frontend field names; and
8. returns HTTP 201 with `{ data: employee }`.

The store appends that returned employee and increments the total. Update replaces the matching list/detail object. Remove calls `DELETE /api/employees/:id`; the backend clears manager references, removes the linked login account, marks the employee `TERMINATED` and archived, and preserves connected HR/payroll history. The store removes the returned ID from the visible list.

### Schedule and contract integration

Schedule input lines use short frontend day names and `HH:MM` strings. The backend normalizes them into `ScheduleDay` rows, time values, break minutes, and calculated weekly hours. Employees can retrieve only their assigned schedule; HR roles can manage schedules.

Contract forms load three dependencies in parallel: employees, contract options (salary structures), and schedules. When submitted, the form converts wage to a number and normalizes blank values. The backend validates the employee, period, wage, and salary structure; it prevents conflicting active/applicable contracts. Contracts retain dated wage/structure history instead of overwriting employee salary fields. At payroll time, `resolveContract()` requires one contract to cover the whole payrun period.

### Attendance and leave integration

`OperationsPage` is configuration-driven: the selected module supplies its endpoint, columns, and form fields. On page load it optionally reads `employeeId` from the URL and fetches rows. It also fetches employee and leave-type options in parallel. Employee users do not choose another employee; the frontend supplies their linked `employeeId`, while the backend ownership scope independently enforces it.

Attendance date-times are converted to UTC-style ISO input before submission. A new record is POSTed; a correction is PUT with a required reason. The backend derives worked hours/status, records correction/audit context, and returns the updated row. The page reloads its list after success.

Leave follows this data flow:

```mermaid
sequenceDiagram
    participant UI as Time-off UI
    participant API as Backend API
    participant DB as MySQL transaction
    participant N as Notification
    UI->>API: POST request (type, dates, reason)
    API->>API: Resolve owner + working schedule
    API->>API: Calculate working-day/hour duration
    API->>DB: Create PENDING request
    DB-->>UI: 201 request data
    UI->>API: PUT decision APPROVED/REJECTED
    API->>DB: Check pending state and overlaps
    API->>DB: Atomically decrement balance if required
    API->>DB: Update decision + audit event
    API->>N: Create employee notification
    API-->>UI: 200 updated request
```

Allocation approval requires an active allocation covering the entire request. `updateMany` with `remainingAmount >= duration` makes the balance check atomic, preventing two approvals from consuming the same balance. Rejected requests do not consume allocation. Approved paid/unpaid leave becomes an input when payroll is computed.

### Salary structure integration

The salary editor loads structures and their ordered rules through the salary service/store. Save requests normalize UI calculation names into backend computation types. A preview request sends rules plus a sample wage; the backend runs the same arithmetic calculation function used by payroll and returns calculated lines/totals. Preview results live only in store state and are not a payslip.

The calculator sorts active rules by sequence. Each completed rule is added to the values map, allowing later rules to reference its code. The server rounds monetary results to two decimal places. Validation belongs on the backend because the same structure can be called outside the React UI.

### Payrun request/response chain

The complete successful browser sequence is:

```text
GET /api/salary-structures?status=ACTIVE
  -> choose structure and period
GET /api/payruns/eligible-employees?...scope
  -> render eligible rows and selected IDs
POST /api/payruns
  -> 201 DRAFT payrun with version
POST /api/payruns/:id/compute { expectedVersion }
  -> COMPUTED payrun, payslips, totals, next version
POST /api/payruns/:id/validate { expectedVersion, acknowledgeWarnings: false }
  -> VALIDATED payrun, or 422 warning/error response
POST /api/payruns/:id/validate { expectedVersion, acknowledgeWarnings: true }
  -> VALIDATED after explicit warning review
POST /api/payruns/:id/pay { expectedVersion }
  -> PAID payrun, payment records, employee notifications
GET /api/payslips/:id
  -> serialized payslip and ordered calculation lines
GET /api/payslips/:id/pdf
  -> private, no-store PDF response
```

Eligibility requires an active, non-archived employee, an assigned schedule, exactly one full-period contract, and a contract structure matching the wizard selection. Department and employee-type filters narrow this population. Specific selection is revalidated during creation, so stale UI eligibility cannot bypass backend rules.

Every payrun action obtains the current run inside a serializable transaction, verifies state/version, claims the next version using an atomic update, applies the action, and writes an audit record. The store distinguishes normal validation errors, acknowledgement-required warnings, and concurrent modification. A 409 causes a detail refresh so subsequent actions use the new version.

### Payslip, PDF, email, dashboard, and notification integration

Payroll computation upserts one payslip per payrun/employee and recreates its ordered lines. The snapshot records employee/company/pay context used for auditability while deliberately excluding unrelated employee relations. The serializer builds frontend-friendly earnings, deductions, reimbursements, gross, net, and identity fields.

The PDF endpoint repeats backend authorization/ownership before rendering; it never trusts a visible frontend button as permission. The browser receives binary data rather than JSON. Email creates the same PDF and sends it as an attachment. Individual and bulk delivery update `emailedAt` only after a successful send and audit the operation.

The dashboard is a read aggregation. Filters travel as query parameters and the backend scopes employee users to their records. Recharts receives already aggregated arrays; the browser does not calculate authoritative payroll totals. Notifications are created by backend business actions, fetched in the navbar, and marked read with `PUT /api/notifications/:id`; a notification link routes the user to its related screen.

### Where each responsibility belongs

| Responsibility | Correct layer |
| --- | --- |
| Field interaction, modals, tables, charts | React components |
| Shared client loading/error/data state | Zustand stores |
| Endpoint URL and response extraction | Frontend services |
| Cookie forwarding and 401 redirect | Shared Axios/client and frontend rewrite |
| Authentication, role, ownership, origin validation | Backend |
| Contract/leave/payroll rules and concurrency | Backend domain modules |
| Atomic multi-record changes and history | Prisma transactions and audit logs |
| Database schema and relationships | Shared Prisma schema and migrations |
| PDFs and SMTP credentials | Backend only |

Do not calculate authoritative salary, approve leave, enforce ownership, or connect to MySQL from a client component. Client-side checks improve the interface; server-side checks determine whether an operation is allowed.

## API contract

### Response formats

Most integrated list endpoints return:

```json
{ "data": [], "total": 0, "page": 1, "limit": 20 }
```

The shared list helper defaults to 20 records and caps `limit` at **50**. A request for `limit=200` still returns at most 50 records on those endpoints. Consumers requiring every record must paginate.

Single-record and mutation endpoints normally return `{ "data": { ... } }`; successful creates normally use HTTP 201. Authentication uses a different envelope:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "name": "Example User",
      "role": "EMPLOYEE",
      "employeeId": "employee-id"
    }
  }
}
```

`GET /api/auth/me` puts the user directly in `data`, not `data.user`. Consequently, login reads Axios `response.data.data.user`, while session restoration reads `response.data.data`. These examples show response structure, not real record identifiers.

Integrated validation errors can return:

```json
{
  "message": "Check the highlighted fields",
  "code": "VALIDATION_FAILED",
  "fieldErrors": [{ "field": "email", "message": "Invalid email" }]
}
```

Authentication errors use the auth helper's `success/message/errors` format instead. Do not assume all endpoints share exactly the same error envelope.

| Status | Frontend meaning |
| --- | --- |
| 400 | Invalid input or action not allowed in current state |
| 401 | Missing, invalid, or expired session; shared redirect to login |
| 403 | Role, ownership, or request-origin restriction |
| 404 | Missing resource or route; inspect the error code/message |
| 409 | Conflict, duplicate record, or stale payrun version |
| 422 | Business-rule failure or payroll warnings requiring acknowledgement |
| 500 | Backend failure; inspect backend logs |
| 502 | Proxy/backend connectivity failure |
| 503 | Dependency unavailable, including unconfigured SMTP |

`parseApiError()` prioritizes the backend message, then provides HTTP/network fallbacks. Stores preserve loading/retry state and sometimes structured field errors. The shared `IntegrationForm` currently displays a general error rather than rendering `fieldErrors` beside each field.

### Main endpoint groups

All paths below are relative to the frontend origin. Access remains subject to backend role and ownership checks.

| Area | Main requests |
| --- | --- |
| Authentication | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Employees | `GET/POST /api/employees`, `GET/PUT/DELETE /api/employees/:id` |
| Related employee records | `GET /api/employees/:id/contracts`, `/attendance`, `/timeoff`, `/allocations` |
| Schedules | `GET/POST /api/schedules`, `GET/PUT /api/schedules/:id`, `GET /api/schedules/me` |
| Contracts | `GET/POST /api/contracts`, `GET/PUT /api/contracts/:id`, `GET /api/contract-options` |
| Attendance | `GET/POST /api/attendance`, `PUT /api/attendance/:id` |
| Leave types | `GET/POST /api/timeoff/types` |
| Allocations | `GET/POST /api/timeoff/allocations` |
| Leave requests | `GET/POST /api/timeoff/requests`, `PUT /api/timeoff/requests/:id` |
| Salary structures | `GET/POST /api/salary-structures`, `GET/PUT /api/salary-structures/:id`, `POST /api/salary-structures/preview` |
| Payrun selection | `GET /api/payruns/eligible-employees` |
| Payruns | `GET/POST /api/payruns`, `GET /api/payruns/:id` |
| Payrun actions | `POST /api/payruns/:id/compute`, `/validate`, `/pay`, `/cancel`, `/send-payslips` |
| Payslips | `GET /api/payslips`, `GET /api/payslips/me`, `GET /api/payslips/:id` |
| PDF/email | `GET /api/payslips/:id/pdf`, `POST /api/payslips/:id/email` |
| Reporting | `GET /api/dashboard` |
| Notifications | `GET /api/notifications`, `PUT /api/notifications/:id` |
| Administration | `GET/POST /api/admin/users`, `GET /api/admin/audit` |

This table lists the primary integrated requests, not an exhaustive OpenAPI specification. Check the route file before adding an action or relying on an alias.

## Employee-to-payslip workflow

### 1. Configure working time and salary rules

Create a working schedule with weekly lines, start/end times, and breaks. The backend calculates working hours and uses the schedule to identify working dates. Create a salary structure with ordered rules before linking a contract.

Rules support fixed amounts, percentages of a named base, and arithmetic formulas. The integrated interpreter supports numbers, named variables, parentheses, and `+ - * /`; it does not execute arbitrary JavaScript. Variables include `wage`, `workingDays`, `workedDays`, `payableDays`, `unpaidLeaveDays`, `overtimeHours`, and earlier rule codes. Duplicate/reserved codes, duplicate sequences, unknown dependencies, and division by zero fail calculation.

```text
Gross earnings = BASIC + ALLOWANCE category totals
Net pay = gross earnings - DEDUCTION category total
Net transfer = net pay + REIMBURSEMENT category total
```

`GROSS` and `NET` category lines are summaries and are not counted again as earnings. Attendance affects salary only through the configured rules and supplied calculation context; changing attendance does not imply an unconditional hardcoded salary deduction.

### 2. Create the employee and contract

The employee form submits identity, employment, schedule, and optional bank/statutory fields. The backend creates a generated ID/display code and audit event; new employee creation also ensures the implemented annual leave allocation. Creating an employee profile does not automatically create a login account: an admin links an account to the employee separately.

Create a contract linking the employee, wage, dates, and salary structure. The integrated schedule context comes from the employee's assigned schedule. Payroll requires exactly one applicable non-cancelled contract covering the complete selected period. If a contract changes during that period, split the payroll period; overlapping or partial coverage is rejected.

### 3. Record attendance and leave

Employees submit their own attendance/leave; HR can manage records in its scope. Attendance corrections require a reason and preserve audit information. Leave requests start as `PENDING`; HR decisions use `APPROVED` or `REJECTED`. Allocations are created as `ACTIVE` in the integrated flow. Approved leave and its paid/unpaid treatment feed payroll; balances are checked and updated by backend logic.

### 4. Create and compute a payrun

The two-step wizard first collects name, structure, period, optional payment date, and department filter. It asks the backend for eligible employees, displays their contract/schedule context, and initially selects all returned employees. The user can change that selection.

Illustrative create payload:

```json
{
  "name": "September payroll",
  "salaryStructureId": "structure-id",
  "startDate": "2026-09-01",
  "endDate": "2026-09-30",
  "employeeIds": ["employee-id"],
  "selectionMode": "SPECIFIC_EMPLOYEES"
}
```

The frontend store makes **two sequential requests**: create the draft, then compute it using the returned ID and version. `ALL_ELIGIBLE` instructs the backend to recompute the eligible population at creation time. Thus, all-eligible selection can reflect changes since the wizard loaded.

Computation reads contracts, employee schedules, period attendance, approved leave, and salary rules. It detects overlapping payslips in another non-cancelled run, computes ordered lines, and saves payslip snapshots/totals in a transaction. Missing attendance is surfaced as pending input/warnings. Recomputing a permitted run updates its existing slips and replaces their calculation lines.

Creation and computation are separate transactions: if computation fails, the draft may still exist. Refresh the payrun list and inspect that draft before submitting another create request.

### 5. Validate, acknowledge warnings, and record payment

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> COMPUTED: Compute
    COMPUTED --> COMPUTED: Recompute
    COMPUTED --> VALIDATED: Validate / acknowledge warnings
    VALIDATED --> PAID: Mark paid
    DRAFT --> CANCELLED: Cancel
    COMPUTED --> CANCELLED: Cancel
    VALIDATED --> CANCELLED: Cancel
```

Lifecycle requests carry `{ "expectedVersion": 1 }`, using the version most recently returned by the backend. The backend checks and increments this version transactionally. A stale version returns HTTP 409 with `CONCURRENT_MODIFICATION` and `currentVersion`; the frontend reloads the run and asks the user to review the latest state.

Validation can return HTTP 422 with `WARNINGS_REQUIRE_ACKNOWLEDGMENT` and a warnings array, including incomplete attendance, bank details, or PAN. The frontend opens the validation review modal. Confirmation resubmits with `acknowledgeWarnings: true`. Blocking errors such as negative net pay must be resolved rather than acknowledged away.

Marking a validated run paid updates payslip status, creates payment records and employee notifications, and records audit events. **This records payment completion; it does not initiate a bank transfer.** The lifecycle does not allow recomputing or cancelling paid runs.

### 6. Issue documents and refresh reporting

Employees can view their own paid payslips. The PDF endpoint renders a server-side document from payslip data/snapshots using Puppeteer. Axios requests a blob; the frontend creates a temporary object URL, clicks a download link, and revokes the URL.

Individual email is a manager/admin operation. Bulk delivery selects paid slips, attempts each recipient, and returns `sent`, `failed`, and per-slip `results`; a successful HTTP response can still contain individual delivery failures. SMTP must be configured for real delivery.

Dashboard/report views request live aggregates with period, department, and employee-type filters. They show role-appropriate workforce, attendance, leave, payroll, chart, and warning data. They refresh on page/filter changes or manual refresh; there is no WebSocket/push subscription in the current frontend. Navbar notifications reload on user/path changes.

## Testing and verification

Run calculation tests from `Backend`:

```sh
npm test
```

Check each application builds, from its own directory:

```sh
npm run build
```

These are verification commands, not a claim that every feature has automated coverage. Both packages currently define `lint` as `next lint`; verify its compatibility before relying on it as a CI gate.

### Live workflow exercise

`Backend/tests/live-workflow.js` calls real APIs and creates review records. Use a dedicated demo database with both servers running. It expects an ignored file at `.local-runtime/demo-login.json`, relative to the repository root, containing a privileged demo login:

```json
{ "email": "admin@peoplepay360.com", "password": "password123" }
```

From `Backend`:

```sh
node --env-file=.env tests/live-workflow.js
```

The default target is `http://localhost:3000`; `TEST_APP_URL` overrides it. This is a mutating integration exercise, not a read-only health check, and is not suitable for a production database.

### Manual integration checklist

1. Restore a session and log in under each relevant role.
2. Create an employee with a schedule; create a full-period contract and salary structure.
3. Record attendance and submit/approve leave; verify the resulting balance.
4. Create/compute a payrun; inspect totals and individual payslip lines.
5. Exercise warning acknowledgement and stale-version handling.
6. Mark paid; verify employee-owned access and PDF download.
7. Test email only with an explicitly configured test mailbox/SMTP environment.
8. Refresh the dashboard and inspect audit events/notifications.

## Deployment considerations

- Deploy both Next.js applications and provision MySQL. This application needs server execution; a frontend-only static export does not supply API rewriting, authentication, payroll, or PDF generation.
- Configure frontend `BACKEND_API_URL` for a reachable backend. Keep browser API traffic on the frontend origin unless deliberately redesigning CORS/cookie handling.
- Configure backend database/JWT/SMTP/company variables and the correct public `APP_URL`. Use HTTPS so production Secure cookies work.
- Generate the backend Prisma client and apply versioned migrations as a controlled deployment step. Back up existing databases before schema changes.
- Provide a working Puppeteer browser and its runtime dependencies. Review the current `--no-sandbox` PDF launch configuration for the target host's isolation model.
- Match infrastructure request timeouts to payroll computation and document/email workloads. Axios and payroll transactions currently use 60-second limits; bulk email is synchronous and may take longer.
- Replace demo accounts/shortcuts, set a strong JWT secret, and review authorization, origin checks, logging, backup/recovery, and sensitive HR-data handling before real use. The development JWT fallback must not be used in production.
- `JWT_EXPIRES_IN` is configurable, but the login cookie lifetime is currently hardcoded to eight hours. Keep these aligned or update both implementations deliberately.

After builds, run `npm run start` separately in Backend and Frontend. The backend start script binds port 4000; the frontend defaults to port 3000.

## Troubleshooting and current limitations

| Symptom | Check |
| --- | --- |
| `npm-cli.js` cannot be found | Repair npm or use the installed Next.js CLI commands shown above |
| UI loads but API fails | Backend process, `BACKEND_API_URL`, rewrite configuration, backend logs |
| Database/client errors | MySQL port/credentials, shared-schema generation, applied migrations |
| Login loops or 401 | Cookie, matching JWT secret, account existence, expiry, HTTPS in production |
| Mutations return 403 | Role/ownership and Origin versus forwarded host / `APP_URL` |
| Dropdown omits records | Several forms request 200 records, but shared list endpoints cap at 50; implement pagination |
| New run fails after creation | A draft may already exist because auto-compute is a separate request |
| Payroll cannot find a contract | Full-period coverage, cancellation, overlap, structure, assigned employee schedule |
| PDF fails | Puppeteer browser installation, OS dependencies, runtime permissions |
| Email returns 503 | `SMTP_HOST`, `SMTP_FROM`, and required authentication configuration |
| Dashboard appears unchanged | Manually refresh or revisit; data is not pushed in real time |

Additional implementation boundaries:

- `/reports` currently reuses `LiveDashboard`; it is not a separate report builder/export suite.
- The existing product brief describes PayTrust draft previews and structured payroll queries; these should not be presented as implemented employee features. Current employee payslip access is paid-only.
- The employee profile's Time Off shortcut currently points to `/time-off/requests`, while the implemented requests page is `/time-off`. Use the sidebar's Time Off route until that link is corrected.
- Not every list implements full pagination, not every backend filter is wired to a UI, and some option-loading failures are silently caught.
- Some stores retain structured field errors, but shared connected forms do not yet display them per field.
- Salary preview supplies zero attendance/day context. A rule dividing by `workingDays` can fail preview even though a real payroll period provides working days.
- Removing an employee archives/terminates the profile and preserves HR/payroll history, but also deletes linked login accounts. It is more than hiding a row from the directory.
- Formula support is arithmetic, not arbitrary scripting. This project does not establish statutory payroll compliance for every jurisdiction.

## Extending the project

For a new feature, follow the existing integration boundaries:

1. Define the request fields, response shape, permitted roles, employee ownership, and failure cases.
2. Add shared Prisma schema/migration changes only if persistence requires them; regenerate the backend client.
3. Add backend domain logic and a route handler. Use transactions for related mutations and record relevant audit events.
4. Serialize database fields into the agreed frontend model rather than exposing accidental model differences.
5. Add a service/store for a core stateful module, or follow an existing direct Axios pattern for a simple screen.
6. Implement loading, empty, success, failure, and retry states. Frontend visibility does not replace backend authorization.
7. Verify business rules, ownership, response decoding, and the full UI-to-database flow. Update this README when contracts or setup requirements change.

Keep `.env` files, private credentials, `.local-runtime`, dependency directories, `.next`, generated Prisma code, and logs outside Git. Commit source, lockfiles, safe environment examples, migrations, tests, and documentation.
