# FPL Stats Lab — YouTube Pipeline

AI-powered FPL YouTube content pipeline. Claude Code is the script writer — no API keys needed for content generation.

## How It Works

```
1. npm run fetch-stats     →  pulls stats from PocketBase → saves stats.json + prompt.txt
2. Claude Code             →  reads prompt.txt, writes script.md + narration.txt + metadata.json
3. Claude Code             →  commits content to youtube-pipeline/content/
4. npm run voice           →  (optional) generates narration.mp3 via ElevenLabs
5. npm run upload          →  (optional) uploads to YouTube
```

**Claude Code IS the script generator.** No Anthropic API key needed. Just run the fetch, then ask Claude Code to generate the script from the prompt.

## Setup

```bash
cd youtube-pipeline
npm install
cp .env.example .env
# Set PB_URL, PB_USER, PB_PASS (same as main app)
```

## Workflow

### Step 1: Fetch stats
```bash
GAMEWEEK=28 VIDEO_TYPE=gw-preview npm run fetch-stats
```

This pulls leaderboard data from PocketBase and saves:
- `output/gw-preview-gw28/stats.json` — raw stats data
- `output/gw-preview-gw28/prompt.txt` — ready-to-use prompt for Claude Code

### Step 2: Generate script (Claude Code)
Ask Claude Code:
> "Generate a video script from youtube-pipeline/output/gw-preview-gw28/prompt.txt"

Claude Code will:
1. Read the prompt with embedded stats
2. Write `content/gw-preview-gw28/script.md`
3. Write `content/gw-preview-gw28/narration.txt`
4. Write `content/gw-preview-gw28/metadata.json`
5. Commit the content

### Step 3: Voice generation (optional)
```bash
GAMEWEEK=28 VIDEO_TYPE=gw-preview npm run voice
```
Requires `ELEVENLABS_API_KEY` in `.env`.

### Step 4: Upload to YouTube (optional)
```bash
GAMEWEEK=28 VIDEO_TYPE=gw-preview npm run upload
```
Requires YouTube OAuth2 credentials in `.env`.

## Video Types

| Type | Schedule | Description |
|------|----------|-------------|
| `gw-preview` | Friday | Captain picks, differentials, players to avoid |
| `gw-review` | Tuesday | Overperformers vs underperformers, xG reality |
| `price-watch` | Wednesday | Price risers/fallers, transfer targets |
| `deep-dive` | Monthly | Full xG breakdown, clinical finishing analysis |

## Content Structure

Generated scripts are committed to `content/` for version history:

```
youtube-pipeline/content/
├── gw-preview-gw28/
│   ├── script.md        # Full script with metadata
│   ├── narration.txt    # Clean text for TTS
│   └── metadata.json    # Title, description, tags
├── gw-review-gw27/
│   └── ...
└── price-watch-gw28/
    └── ...
```

## Weekly Calendar

| Day | Video | Fetch Command |
|-----|-------|---------------|
| Friday | GW Preview | `VIDEO_TYPE=gw-preview GAMEWEEK=28 npm run fetch-stats` |
| Tuesday | GW Review | `VIDEO_TYPE=gw-review GAMEWEEK=27 npm run fetch-stats` |
| Wednesday | Price Watch | `VIDEO_TYPE=price-watch GAMEWEEK=28 npm run fetch-stats` |
| 1st Sunday | Deep Dive | `VIDEO_TYPE=deep-dive GAMEWEEK=28 npm run fetch-stats` |

## Cost

| Service | Cost | Required? |
|---------|------|-----------|
| Claude Code | Included | Yes (script generation) |
| PocketBase | Free (self-hosted) | Yes (stats data) |
| ElevenLabs | $5-22/mo | Optional (voice) |
| YouTube API | Free | Optional (auto-upload) |
