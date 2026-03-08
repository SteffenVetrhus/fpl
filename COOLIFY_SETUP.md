# Coolify Deployment Guide

Deploy each service as a **separate resource** in Coolify under the same project.
All 4 services must share a Docker network so they can communicate by container name.

## Shared Network

Create a custom Docker network that all services will join.
In each service's Coolify settings under **Advanced > Custom Docker Options**, add:

```
--network=fpl-network
```

Or create it manually on the server first:

```bash
docker network create fpl-network
```

## 1. PostgreSQL (Dockerfile)

- **Build Pack:** Dockerfile
- **Dockerfile Location:** `/Dockerfile.postgres`
- **Environment Variables:**
  - `POSTGRES_PASSWORD` = your-strong-password
- **Persistent Storage:** Add a volume mapping:
  - Source: `/data/coolify/fpl/pgdata`
  - Destination: `/var/lib/postgresql/data`
- **No domain needed** (internal only)
- **Container Name / Network Alias:** `fpl-postgres`

The schema is baked into the image — no volume mount for schema.sql needed.

## 2. Redis (Docker Image)

- **Build Pack:** Docker Image
- **Image:** `redis:7-alpine`
- **Persistent Storage:** Add a volume mapping:
  - Source: `/data/coolify/fpl/redisdata`
  - Destination: `/data`
- **No domain needed** (internal only)
- **Container Name / Network Alias:** `fpl-redis`

## 3. App (Dockerfile)

- **Build Pack:** Dockerfile
- **Dockerfile Location:** `/Dockerfile`
- **Domain:** `https://fpl.soyna.no`
- **Port:** 3000 (Coolify will detect from EXPOSE)
- **Environment Variables:**
  - `FPL_LEAGUE_ID` = your-league-id (**required**)
  - `DATABASE_URL` = `postgresql://fpl:your-strong-password@fpl-postgres:5432/fpl`
  - `REDIS_URL` = `redis://fpl-redis:6379`
  - `FPL_API_BASE_URL` = `https://fantasy.premierleague.com/api` (optional, this is the default)
  - `ENABLE_API_CACHE` = `true` (optional, default)
  - `API_CACHE_DURATION` = `300` (optional, default)
  - `FPL_MANAGER_ID` = your-manager-id (optional)
  - `ANTHROPIC_API_KEY` = your-key (optional, for AI advisor)

## 4. Cron (Dockerfile)

- **Build Pack:** Dockerfile
- **Dockerfile Location:** `/Dockerfile.cron`
- **No domain needed** (background worker)
- **Environment Variables:**
  - `FPL_LEAGUE_ID` = your-league-id
  - `DATABASE_URL` = `postgresql://fpl:your-strong-password@fpl-postgres:5432/fpl`
  - `REDIS_URL` = `redis://fpl-redis:6379`
  - `FPL_API_BASE_URL` = `https://fantasy.premierleague.com/api` (optional)

## Deployment Order

1. Create the shared network (`fpl-network`)
2. Deploy **PostgreSQL** first — wait until healthy
3. Deploy **Redis**
4. Deploy **App** and **Cron**

## Networking

The services find each other by container name over the shared `fpl-network`:

```
App  ──→  fpl-postgres:5432
     ──→  fpl-redis:6379
Cron ──→  fpl-postgres:5432
     ──→  fpl-redis:6379
```

Only the **App** service needs a public domain. PostgreSQL, Redis, and Cron are internal only.
