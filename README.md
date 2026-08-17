# MaintFlow

SaaS GMAO multi-tenant (Django REST + Next.js) — MVP V1 per the DigiTech cahier des charges.

## Stack

- **Backend**: Django 6 + Django REST Framework, PostgreSQL, JWT auth (`djangorestframework-simplejwt`)
- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind v4)
- **Multi-tenancy**: shared schema, every business table has a `company` FK; `TenantModelViewSet` filters/stamps it automatically per request

## Project layout

```
backend/
  config/          settings, root urls
  core/            TenantModel/TimeStampedModel base classes, tenant-scoped viewset + permission
  accounts/        custom User (email login), roles, JWT endpoints, skills
  companies/       Company (tenant), Site, Location
  assets/          AssetCategory, Asset, AssetDocument, QR code generation/scan
  requests_app/    demandes d'intervention (nouvelle → ... → convertie en OT)
  failures/        pannes
  workorders/      OT + tasks (checklist) + photos, full lifecycle actions
  maintenance/     plans préventifs + checklist + `generate_preventive_work_orders` command
  notifications/   in-app notifications, triggered from the views above
  audit/           audit log + `log_action()` helper
  dashboard/       KPIs (MTTR, MTBF, disponibilité, backlog, taux préventif...)

frontend/
  src/lib/         API client (JWT + auto-refresh), auth context, shared types
  src/app/login     login page
  src/app/(app)/    protected area: dashboard, assets, work-orders, requests,
                    failures (+ quick "signaler une panne" form), notifications,
                    QR scan landing page
```

## Running locally

### Option A — Docker Compose (Postgres + backend + frontend)

```bash
docker compose up --build
```

- Backend: http://localhost:8000/api/
- Frontend: http://localhost:3000
- Postgres exposed on host port `5433` (mapped to avoid clashing with any local Postgres on 5432)

Override defaults with a `.env` file at the repo root (see the `environment:` blocks in `docker-compose.yml` for the variables it reads).

### Option B — Run each service directly

**Backend**

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # point DB_* at a local Postgres database
.venv/bin/python manage.py migrate
.venv/bin/python manage.py createsuperuser
.venv/bin/python manage.py runserver
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:8000/api
npm run dev
```

### Seeding a tenant

There's no public "create company" endpoint by design (tenant provisioning is a DigiTech-staff action, done via `/admin/`). To get a company + first admin user quickly:

```bash
.venv/bin/python manage.py shell -c "
from companies.models import Company
from accounts.models import User
c = Company.objects.create(name='Ma Société', country='Congo', currency='XAF')
User.objects.create_user(email='admin@example.com', password='ChangeMe123!', role=User.Role.ADMIN, company=c)
"
```

### Generating preventive work orders

Meant to run on a schedule (cron/Celery beat in production):

```bash
.venv/bin/python manage.py generate_preventive_work_orders
```

## What's implemented vs. stubbed (V1 scope)

Fully wired: auth (JWT, password reset, change password), multi-tenant isolation, companies/sites/locations,
assets + categories + documents + QR generation/scan, intervention requests (full accept/reject/convert
lifecycle), failures, work orders (full lifecycle: assign → start → hold/resume → submit → validate/reject →
close, with checklist tasks and before/after photos), preventive maintenance plans + checklist + generation
command, in-app notifications, audit log, dashboard KPIs.

Scaffolded on the backend but without a dedicated frontend screen yet: maintenance plan CRUD/checklist
builder UI, asset documents upload UI, PDF report exports, Excel/CSV asset import, full calendar view. The
API endpoints for these already exist and follow the same patterns as the built screens.
