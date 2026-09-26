# Apartment Management System — Delivery Plan

## Scope and approach

This project will be a JavaScript MERN application with a Vite/React single-page frontend and a Node.js/Express API backed by MongoDB/Mongoose. The initial release will prioritize secure role-based workflows for admins, owners, and tenants over optional integrations such as real payment gateways or file storage providers.

Authentication will use short-lived JWT access tokens in secure, HTTP-only cookies (with `SameSite` and `Secure` settings appropriate to the environment). The API, not the client, will determine the authenticated user and authorize every protected operation. Passwords will be hashed with bcryptjs and never returned in API responses.

## Planned repository structure

```text
apartment-management/
├── client/                         # React + Vite application
│   └── src/
│       ├── api/                    # Axios client and endpoint modules
│       ├── components/              # Reusable UI, layout, feedback components
│       ├── context/                 # Auth and application contexts
│       ├── hooks/                   # Shared React hooks
│       ├── pages/                   # Route-level views by feature/role
│       ├── routes/                  # Public, protected, and role route guards
│       ├── styles/                  # Tokens, global CSS, responsive utilities
│       └── utils/                   # Presentation helpers
├── server/                         # Express API
│   └── src/
│       ├── config/                  # Environment, DB, cookie configuration
│       ├── controllers/             # HTTP request orchestration
│       ├── middleware/              # Auth, RBAC, validation, errors, auditing
│       ├── models/                  # Mongoose schemas and indexes
│       ├── routes/                  # Versioned REST route definitions
│       ├── services/                # Business/reporting and audit operations
│       ├── utils/                   # API errors, async wrapper, sanitizers
│       └── validators/              # Request validation schemas
├── docs/                            # API and deployment documentation
├── .gitignore
├── AGENTS.md
└── PLAN.md
```

## Data model and ownership rules

| Model | Core relationships and responsibility |
| --- | --- |
| `User` | Identity, bcrypt password hash, role (`admin`, `owner`, `tenant`), profile, status and refresh/session metadata if required. |
| `Property` | Owned by one `User` with owner role; contains address and property details. |
| `Unit` | Belongs to one property; stores rent/deposit details, occupancy state, and current tenant reference. |
| `RentRecord` | References property, unit, owner, tenant; records billing period, due date, amount, payment state and payment metadata. |
| `MaintenanceRequest` | References property, unit, tenant and owner; tracks category, priority, status, assignment and timeline. |
| `Notice` | References author and optionally a property; includes role/property targeting and expiry. |
| `Document` | Metadata and authorized ownership links only; storage implementation will be selected before upload support is enabled. |
| `AuditLog` | Immutable administrative/security-relevant activity record with actor, action, target, metadata, and timestamps. |

All cross-entity write operations will validate that referenced resources exist and are within the caller's permitted ownership scope. Tenant assignment and unit availability will be updated transactionally where MongoDB deployment support permits it.

## API design

Routes will be versioned under `/api/v1` and use consistent JSON response and error shapes. Main route groups will be:

- `/auth`: registration, login, logout, current session.
- `/users` and `/admin`: admin-controlled users, activation, roles, settings, audit and global reports.
- `/properties` and `/units`: property and unit CRUD with ownership-scoped access.
- `/rent`: rent records, payment recording and summaries.
- `/maintenance`: complaint creation, status transitions and request lists.
- `/notices`: targeted notices and visible feed.
- `/documents`: authorized document metadata/upload workflows when storage is implemented.
- `/dashboard` and `/reports`: role-scoped aggregate data.

Controllers will remain thin; validation, ownership checks, reporting calculations, audit writes, and reusable workflows will live in middleware/services. Pagination, filtering, stable sorting and bounded query parameters will be used for list endpoints.

## Frontend architecture

React Router will provide public authentication routes and protected role-aware application routes. A single authenticated app shell will contain a responsive sidebar, top navigation, notification area and page outlet. An Axios instance will send cookies with requests and centrally handle safe authentication failures.

Feature pages will use reusable forms, confirmation dialogs, tables, status badges, summary cards, empty states and loading/error states. Dashboards will consume role-specific summary APIs rather than duplicating reporting calculations in the browser. CSS will use shared tokens and mobile-first responsive layouts without a component library unless a demonstrated need arises.

## Security baseline

- Environment-only configuration with a committed `.env.example`, never `.env`.
- bcryptjs hashing and comparison; no plaintext password persistence, logging, or serialization.
- HTTP-only authentication cookies, strict CORS origin allow-list, and production cookie security settings.
- JWT verification, account-active checks and backend RBAC middleware on every protected route.
- Request validation and sanitization; explicit allow-lists for mutable fields.
- Generic login failures, centralized error handling and no stack traces in production responses.
- Rate limiting for authentication endpoints and secure HTTP headers where compatible with the deployment.
- Audit logs for sensitive admin activity; no secrets, tokens or sensitive personal data in logs.

## Milestones

Each milestone ends with targeted checks, frontend build/backend validation as applicable, a reviewed diff, and one meaningful commit. Pushes happen only after successful validation. No secrets will be committed.

1. Initial project architecture: repository rules, delivery plan, ignores and documentation foundation.
2. Frontend and backend setup: Vite React client, Express server, scripts and baseline app shell.
3. MongoDB/Mongoose setup: environment validation, connection lifecycle and model foundation.
4. User model and authentication: secure user schema, registration/login/logout/current-user endpoints.
5. JWT authentication middleware: cookie/token handling and protected request identity.
6. Role-based authorization: backend RBAC and client route guards/navigation visibility.
7. Admin user management: safe user CRUD, activation, role assignment and audit records.
8. Property management: property model/API and owner/admin property workflows.
9. Unit management: unit CRUD, availability and tenant-assignment constraints.
10. Owner dashboard: owner summaries, rent/property indicators and owner UI.
11. Tenant management: authorized tenant assignment and owner/admin tenant views.
12. Tenant dashboard: unit, landlord, rent and notice overview.
13. Rent management: monthly records, due/overdue status and payment recording.
14. Payment history/reporting: filtering, owner/admin summaries and historical views.
15. Maintenance request system: tenant filing, owner/admin workflow and status tracking.
16. Notice system: authoring, targeting, expiry and role-relevant feeds.
17. Documents/profile features: profile updates and a storage-safe document workflow if selected.
18. UI/UX refinement: responsive behavior, accessibility, shared feedback states and polish.
19. Testing, validation, security cleanup: automated coverage, validation review and production safeguards.
20. Final documentation and production readiness: setup/deployment/API guidance and final verification.

## Definition of done

The release is ready when all role workflows are enforced server-side; builds and relevant automated checks pass; environment/secrets guidance is complete; destructive actions require confirmation in the UI; documentation supports local setup and deployment; and Git history contains meaningful, validated milestone commits.
