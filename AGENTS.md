# Project Development Rules

## Scope and workflow

- Build this as a maintainable JavaScript MERN application: React/Vite client, Express API, MongoDB/Mongoose persistence.
- Keep features small and cohesive. Reuse components, validators and services instead of copying logic.
- Inspect the current worktree before editing. Preserve unrelated user changes.
- Do not add dependencies unless they directly serve the approved requirements; prefer platform/library capabilities already in use.
- Keep the API under `/api/v1` and use predictable JSON response/error conventions.
- Use `main` as the integration branch. Do not change the configured remote, force-push, or commit without reviewing the diff.

## Security rules

- Never commit `.env`, credentials, JWT secrets, tokens, passwords, private keys, or production data. Maintain `.env.example` with placeholders only.
- Passwords must use bcrypt/bcryptjs hashing. Never log, return, or store plaintext passwords.
- Authentication and authorization are backend responsibilities. Treat frontend role state only as presentation state.
- Verify JWTs, check active user status, and enforce role/ownership permissions in middleware and/or services for every protected action.
- Validate and sanitize request input. Use allow-lists for updates; reject unknown or unauthorized mutable fields.
- Use secure HTTP-only authentication cookies where adopted; configure CORS and cookie flags by environment.
- Return safe authentication errors and avoid exposing stack traces, internal identifiers, secrets or sensitive personal data.
- Record important administrative actions in audit logs without recording sensitive values.

## Data and API rules

- Use Mongoose references and indexes deliberately. Validate related document existence and ownership before writes.
- Owners may access only their own properties, units, tenants, rent records, maintenance requests and property notices unless an admin override applies.
- Tenants may access only their own assigned unit, rent history, maintenance requests, profile and applicable notices.
- Enforce unit occupancy and tenant assignment consistency; use transactions for multi-document critical operations when infrastructure supports them.
- Paginate and bound list queries. Do not expose unrestricted collection dumps.
- Put HTTP orchestration in controllers; put reusable business workflows and reporting calculations in services.

## Frontend rules

- Use React Router guards for experience, but never rely on them for authorization.
- Build mobile-first, keyboard-accessible interfaces with semantic controls and useful loading, empty, error and success states.
- Use shared form, table, dialog, badge and dashboard-card components.
- Confirm destructive user actions before calling the API.
- Centralize Axios configuration and handle expired/invalid sessions predictably.

## Quality and Git rules

- After each milestone, run the relevant tests/checks and the frontend production build once it exists. Fix known failures before moving on.
- Review `git diff` and `git status` before every commit. Keep commits focused, meaningful and free of generated artifacts or secrets.
- Commit only validated work; use descriptive imperative commit messages. Do not create empty or artificial commits.
- Push only after validation passes and report the resulting commit hash and push outcome.
- Document setup, environment variables, API behavior and deployment decisions as the project evolves.
