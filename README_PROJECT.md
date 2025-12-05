# token_prices — Quick README

A small Next.js app that fetches token prices (via Moralis), stores them in PostgreSQL, and sends email alerts when prices increase.

Quick setup

1) Install
```
npm install
```

2) Add environment variables
Create `.env.local` in the project root (do NOT commit it). Minimum example:
```
MORALIS_API_KEY=your_moralis_api_key
DATABASE_URL=postgres://alertuser:alertpass@localhost:5433/token_alerts

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Your Name <youremail@gmail.com>"
ALERT_RECIPIENT=recipient@example.com
```

3) Start Postgres with Docker (recommended)
```
docker rm -f postgres-db 2>/dev/null || true
docker run --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgrespwd -e POSTGRES_DB=postgres -p 5433:5432 -d postgres:16
# create app user and DB
docker exec postgres-db psql -U postgres -c "CREATE USER alertuser WITH PASSWORD 'alertpass';"
docker exec postgres-db psql -U postgres -c "CREATE DATABASE token_alerts OWNER alertuser;"
```

4) Run the app
```
npm run dev
```
Open http://localhost:3000

Email testing tips

- For Gmail: enable 2FA and create an App Password (put it in `EMAIL_PASS`).
- For dev, use Mailtrap or Ethereal to avoid Gmail auth issues.

Troubleshooting

- Nodemailer `EAUTH` → bad SMTP credentials or blocked by provider; use App Password or Mailtrap.
- Docker port conflict → run Postgres on 5433 and update `DATABASE_URL`.
- Check container logs: `docker logs -f postgres-db`

If you'd like, I can overwrite the existing `README.md` with this content or create a `.env.example`. Which do you prefer?

## Docker & Deployment (added)

This repository already includes `Dockerfile` and `docker-compose.yml`. Use the instructions below depending on whether you want to run just Postgres, the app, or both together with Docker Compose.

Prerequisites

- Docker (Engine) installed
- docker-compose (if using `docker-compose` command) or Docker Compose v2 plugin

1) Run only Postgres (recommended for local DB)

```bash
# remove any old container
docker rm -f postgres-db 2>/dev/null || true

# run Postgres container on host port 5433 (avoids conflicts)
docker run --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgrespwd -e POSTGRES_DB=postgres -p 5433:5432 -d postgres:16

# create app user and DB
docker exec postgres-db psql -U postgres -c "CREATE USER alertuser WITH PASSWORD 'alertpass';"
docker exec postgres-db psql -U postgres -c "CREATE DATABASE token_alerts OWNER alertuser;"
```

2) Build and run the Next.js app in Docker

Option A — Build image and run container directly:

```bash
# build local image
docker build -t token_prices:local .

# run container and pass env file
docker run --rm --name token_prices -p 3000:3000 --env-file .env.local token_prices:local
```

Option B — Use `docker-compose` (recommended if `docker-compose.yml` defines services)

```bash
# ensure .env or .env.local contains required variables
docker-compose up --build -d

# view logs
docker-compose logs -f

# stop services
docker-compose down
```

Notes about `.env` and Docker

- When using `docker run --env-file` or Docker Compose, ensure `DATABASE_URL` points to the Postgres host reachable by the container. If both services run in the same compose network, use the Postgres service name as host (for example `postgres:5432`) instead of `localhost`.
- Example `DATABASE_URL` for compose services:
```
DATABASE_URL=postgres://alertuser:alertpass@postgres:5432/token_alerts
```

How others should set up the project

1. Clone the repo.
2. Install Node dependencies (`npm install`) — optional if running via Docker image built from Dockerfile.
3. Copy `.env.example` or create `.env.local` with required keys (`MORALIS_API_KEY`, `DATABASE_URL`, email creds).
4. Start Postgres (docker run or docker-compose).
5. Start the app (local `npm run dev` or `docker-compose up --build`).

If you want, I can also add a `.env.example` file and update `docker-compose.yml` examples to include env placeholders. Mark this TODO as completed when ready.