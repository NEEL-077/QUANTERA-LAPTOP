# Quantera Laptop Store

Local development and start instructions for the project.

Prerequisites
- Node.js 18+ (tested with Node 24)
- npm
- MongoDB connection string (Atlas or local)

Quick start

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file at the project root (copy from `.env.example` if present) and set values such as:

```
PORT=3000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH=your_refresh_secret
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

3. Run in development (auto-restarts on changes):

```bash
npm run dev
```

4. Run production:

```bash
npm start
```

Notes
- The project already includes a `dev` script that uses Node's `--watch` to restart on file changes.
- If you prefer `nodemon`, install it globally or add it to `devDependencies` and update the `dev` script.
- If the server cannot start due to missing modules, run `npm install` first.

If you'd like, I can add a `.env.example` file or switch the `dev` script to use `nodemon`. Which would you prefer?