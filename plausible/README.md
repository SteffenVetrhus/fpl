# Plausible CE — Self-Hosted Analytics

Free, open-source, privacy-friendly web analytics for the FPL League Tracker.
No cookies, no personal data collection, GDPR-compliant out of the box.

## Quick Start

### 1. Generate secrets

```bash
# Generate the required secret key
openssl rand -base64 48
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Edit `.env` and set:

- `BASE_URL` — the public URL where Plausible will be accessible (e.g. `http://localhost:8000` for local, or `https://analytics.your-domain.com` for production)
- `SECRET_KEY_BASE` — paste the output from step 1

### 3. Start the services

```bash
docker compose up -d
```

This starts three containers:

| Service | Purpose |
|---|---|
| `plausible` | Analytics web UI + API |
| `plausible_db` | PostgreSQL for user/site data |
| `plausible_events_db` | ClickHouse for event data |

### 4. Create your account

Open `http://localhost:8000` (or your `BASE_URL`) and register your admin account.
Registration is set to `invite_only` by default — only the first account can be created freely.

### 5. Add your site

In the Plausible dashboard, add a new site with your FPL app's domain.

### 6. Connect to the FPL app

In your FPL app's `.env`, set:

```bash
PLAUSIBLE_DOMAIN=your-fpl-app.com
PLAUSIBLE_SCRIPT_URL=http://localhost:8000/js/script.js
```

Replace `localhost:8000` with your Plausible instance URL in production.

## What You Get

- **Page views** across all routes — tracked automatically
- **Unique visitors**, bounce rate, visit duration
- **Referral sources** — where users come from
- **Device / browser / OS** breakdown
- **Geographic location** (without IP storage)
- **Custom events** — via the [Plausible events API](https://plausible.io/docs/custom-event-goals)

## Production Notes

- Put a reverse proxy (nginx, Caddy, Traefik) in front for HTTPS
- Update `BASE_URL` to your public HTTPS URL
- Set `TOTP_VAULT_KEY` for 2FA support: `openssl rand -base64 32`
- Data is persisted in Docker volumes (`db-data`, `event-data`, `plausible-data`)

## Stopping / Restarting

```bash
# Stop
docker compose down

# Stop and remove all data
docker compose down -v

# View logs
docker compose logs -f plausible
```

## Resources

- [Plausible CE Wiki](https://github.com/plausible/community-edition/wiki)
- [Configuration options](https://github.com/plausible/community-edition/wiki/configuration)
- [Plausible docs](https://plausible.io/docs)
