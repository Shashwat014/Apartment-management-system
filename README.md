# Apartment Management System

A MERN apartment-management application for administrators, owners, and tenants. It uses MongoDB/Mongoose, Express, React/Vite, bcrypt password hashing, and HTTP-only JWT authentication cookies.

## Run locally

Prerequisites: Node.js 20+ and a running MongoDB instance.

1. Copy `server/.env.example` to `server/.env` and replace `JWT_SECRET` and the administrator credentials with secure local values.
2. Copy `client/.env.example` to `client/.env` if the API is not at `http://localhost:5000`.
3. Install dependencies (already committed lockfiles make installs reproducible):

   ```powershell
   cd server; npm install
   cd ../client; npm install
   ```

4. Seed the first administrator, then run both applications in separate terminals:

   ```powershell
   cd server; npm run seed:admin
   cd server; npm run dev
   cd client; npm run dev
   ```

Open the Vite address (normally `http://localhost:5173`). Use the seeded administrator account to create owners and tenants, then create properties, units, tenant assignments, rent records, maintenance requests, and notices.

## Checks

```powershell
cd server; npm run check
cd client; npm run build
```

## Security notes

- Do not commit either `.env` file; environment files are ignored by Git.
- Passwords are bcrypt-hashed and API access checks happen server-side.
- Authentication cookies are HTTP-only and use secure cross-site settings in production.
- Set `CLIENT_ORIGIN` to the deployed frontend origin and use a long, unique `JWT_SECRET` in production.
