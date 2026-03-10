# FPL League Tracker

A web application for tracking Fantasy Premier League league performance, gameweek winners, member transfers, historical standings, and advanced player statistics.

Built with React Router v7, TypeScript, Tailwind CSS v4, and PocketBase.

## Features

- League dashboard with live standings and gameweek winners
- Gameweek history with player filtering
- Historical league standings across seasons
- Transfer activity tracking
- Stat Corner with 12 advanced metric leaderboards (xG, xA, CBIT, chances created, duels, dribbles, and more)
- Player comparison tool with head-to-head metrics
- Data powered by FPL API, Understat, and [FPL-Core-Insights](https://github.com/olbauday/FPL-Core-Insights)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Data Scrapers

The app uses three Python scrapers that write to PocketBase:

| Scraper | Source | Data |
|---------|--------|------|
| `scraper-fplcore/` | [FPL-Core-Insights](https://github.com/olbauday/FPL-Core-Insights) CSVs | Match stats: chances created, duels, dribbles, recoveries, aerial duels, GK stats |
| `scraper-understat/` | Understat API | xG, npxG, xA per gameweek |
| `scraper-fpl/` | Official FPL API | Player roster, prices, ownership, FPL points |

Each scraper has its own `Dockerfile` and `requirements.txt`. Run with:

```bash
cd scraper-fplcore && pip install -r requirements.txt && python -m src.main
```

## Tech Stack

- React Router v7 (SSR)
- TypeScript 5.9 (strict)
- Tailwind CSS v4
- Vite 7
- Vitest + Testing Library + Playwright
- PocketBase (auth + data storage)
- Node.js 20
