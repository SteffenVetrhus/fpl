# FPL Stats Lab — YouTube Pipeline

AI-powered video content pipeline for FPL analytics. Pulls stats from PocketBase, generates scripts with Claude, creates voice narration with ElevenLabs, and assembles videos with FFmpeg.

## Pipeline Overview

```
PocketBase (stats) → Claude API (script) → ElevenLabs (voice) → FFmpeg (video) → YouTube
```

## Setup

```bash
cd youtube-pipeline
npm install
cp .env.example .env
# Edit .env with your API keys
```

### Required API Keys

| Service | Key | Cost | Purpose |
|---------|-----|------|---------|
| PocketBase | `PB_URL`, `PB_USER`, `PB_PASS` | Free (self-hosted) | Stats data |
| Claude API | `ANTHROPIC_API_KEY` | ~$0.10/script | Script generation |
| ElevenLabs | `ELEVENLABS_API_KEY` | $5-22/mo | Voice narration |
| YouTube | OAuth2 credentials | Free | Video upload |

## Usage

### Generate everything (script + voice + video)
```bash
GAMEWEEK=28 VIDEO_TYPE=gw-preview npm run generate
```

### Generate script only (no API keys needed for voice/video)
```bash
GAMEWEEK=28 VIDEO_TYPE=gw-review npm run script-only
```

### Upload to YouTube
```bash
GAMEWEEK=28 VIDEO_TYPE=gw-preview npm run upload
```

## Video Types

| Type | Schedule | Description |
|------|----------|-------------|
| `gw-preview` | Friday | Gameweek preview with captain picks, differentials |
| `gw-review` | Tuesday | Gameweek review: overperformers, underperformers |
| `price-watch` | Wednesday | Price risers/fallers with transfer advice |
| `deep-dive` | Monthly | Deep analytics: xG breakdown, clinical finishing |

## Output Structure

Each run creates a folder in `./output/{video-type}-gw{n}/`:

```
output/gw-preview-gw28/
├── script.md        # Full script with metadata
├── narration.txt    # Clean text for TTS (no visual cues)
├── metadata.json    # Title, description, tags, thumbnail prompt
├── narration.mp3    # Voice audio (if ElevenLabs configured)
├── video.mp4        # Final video (if FFmpeg available)
└── slides.html      # Slide deck fallback (if no FFmpeg)
```

## Weekly Content Calendar

| Day | Video | Command |
|-----|-------|---------|
| Friday | GW Preview | `VIDEO_TYPE=gw-preview GAMEWEEK=28 npm run generate` |
| Tuesday | GW Review | `VIDEO_TYPE=gw-review GAMEWEEK=27 npm run generate` |
| Wednesday | Price Watch | `VIDEO_TYPE=price-watch GAMEWEEK=28 npm run generate` |
| 1st Sunday | Deep Dive | `VIDEO_TYPE=deep-dive GAMEWEEK=28 npm run generate` |

## Upgrading Visuals

The pipeline starts with simple colored slides + text. To upgrade:

1. **Remotion** — Render your existing React Stat Corner components as video frames
2. **HeyGen/D-ID** — Add a talking AI avatar over the slides
3. **Canva/Figma** — Design custom thumbnail templates

## Monetization Path

1. **YouTube Partner Program** — 1,000 subs + 4,000 watch hours
2. **Affiliate links** — FPL tools, fantasy apps
3. **Patreon** — Early access to weekly picks
4. **Sponsorships** — FPL-adjacent brands at ~5K subs

## Cost Estimate

| Monthly | With Avatar | Without Avatar |
|---------|-------------|----------------|
| Claude API | ~$2 | ~$2 |
| ElevenLabs | $5-22 | $5-22 |
| HeyGen | $24 | $0 |
| **Total** | **$31-48** | **$7-24** |
