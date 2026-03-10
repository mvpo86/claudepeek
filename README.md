# claudepeek

A local dashboard for visualising your Claude Code token usage and estimated costs.

```bash
npx claudepeek
```

> **Note:** All cost figures are estimates calculated from token counts × Anthropic list prices. They are not your actual invoice. For billing, check [console.anthropic.com](https://console.anthropic.com).

## Requirements

- [Node.js](https://nodejs.org) v18 or later
- [Claude Code](https://claude.ai/code) installed and used at least once (so local usage files exist)

## Usage

**No install — run directly:**
```bash
npx claudepeek
```

**Or install globally:**
```bash
npm install -g claudepeek
claudepeek
```

Opens [http://localhost:3737](http://localhost:3737) automatically.

**Options:**
```
--port <number>   Use a different port (default: 3737)
--no-open         Don't open the browser automatically
```

## What it shows

| Tab | What you see |
|---|---|
| **Overview** | Summary cards, daily spend chart (stacked by model), model cost breakdown, top 10 most expensive days |
| **Daily** | Full day-by-day breakdown with token type columns |
| **Sessions** | All-time cost per project folder (not date-filtered) |
| **Monthly** | Month-by-month summary cards and chart |
| **Budget** | Progress against a monthly budget, burn rate, projections, and scenarios |
| **About** | Explanation of how the tool works and what the numbers mean |

## Filtering by date

Use the preset buttons in the header (Today, Last 7 days, This month, etc.) or enter a custom date range. The filter applies to Overview, Daily, and Monthly. Sessions always show all-time totals.

## Budget

Set your monthly budget amount and reset day in the Budget tab. Settings are saved in your browser's `localStorage` and persist across visits.

## How it works

Reads `~/.claude/projects/**/*.jsonl` — the conversation files Claude Code writes locally — via `npx ccusage`. A tiny Node.js server (no dependencies) serves the data as a local JSON API. Nothing leaves your machine.

## Running from source

```bash
git clone https://github.com/martinpenabad/claudepeek
cd claudepeek
node server.js
```

Or double-click `start.command` (macOS) / `start.bat` (Windows).

---

> This project was built with [Claude Code](https://claude.ai/code) (AI-generated). The source code was written through a conversation with Claude and reviewed by a human.
