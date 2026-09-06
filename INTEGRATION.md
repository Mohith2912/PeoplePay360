# PeoplePay360 integrated demo

The React/Next.js frontend, REST backend, Prisma schema, and MySQL database are integrated for the evaluation demo.

## Demo accounts

Run `npm run demo:seed` in `Backend` once. All accounts use password `password123`.

| Role | Email |
| --- | --- |
| Admin | `admin@peoplepay360.com` |
| HR Payroll Manager | `payroll_manager@peoplepay360.com` |
| HR Payroll User | `payroll_user@peoplepay360.com` |
| HR Manager | `hr_manager@peoplepay360.com` |
| Employee | `employee@peoplepay360.com` |

## Start the demo on this computer

Run `powershell -ExecutionPolicy Bypass -File scripts/start-demo.ps1` from the repository root, then open <http://localhost:3000>.

The script uses the untracked local MySQL installation in `.local-runtime`, `Backend/.env`, backend port 4000, and frontend port 3000. Credentials remain outside Git.

For a new computer, install MySQL 8, copy `Backend/.env.example` to `Backend/.env`, set `DATABASE_URL` and `JWT_SECRET`, then run the database generation, migration, and demo seed scripts from `Backend`.

## Verified workflow

- JWT cookie login and backend RBAC for all five roles.
- Employee List/Kanban, profiles, contracts, schedules, attendance corrections, and the complete leave allocation/approval flow.
- Ordered salary rules, period contract selection, two-step payrun creation, computation, warnings, version checks, validation, payment, paid history, and employee-owned payslips.
- Live dashboard/report aggregation from MySQL and Puppeteer payslip PDF generation.
- Nodemailer individual and bulk delivery with per-recipient results. Set real `SMTP_*` values in `Backend/.env` for external delivery.

## Verification

Run `npm test`, `npm run build`, and `node --env-file=.env tests/live-workflow.js` in `Backend`; run `npm run build` in `Frontend`.
