# FounderRank

**AI-powered dealflow triage for Slush.** An autonomous, MCP-native pipeline that filters inbound founder meeting requests against a fund thesis, enriches pedigree from LinkedIn, scores the match with Gemini, and lets an investor act from a live dashboard, Telegram, or Cursor.

Built for **Prodeko 60 / Junction**.

---

## Why it exists

At Slush, a partner’s inbox is a firehose: email, LinkedIn, and matchmaking all dump meeting requests into the same 48 hours. Most of that volume is off-mandate (wrong stage, geography, or sector). The few founders worth a 15-minute slot get buried.

FounderRank is the associate that never sleeps: hard-filter first, scrape only what passed, score against *this* fund’s thesis, then surface **Must Meet** leads where the investor already works.

---

## What it does

1. **Thesis pre-gate** — Auto-decline geography and stage mismatches *before* calling Apify or Gemini.
2. **Pedigree enrichment** — Use Apify to look through LinkedIn (headline, summary, recent roles, education)
3. **Structured scoring** — Gemini returns `score` (0–100), `verdict`, and a short `reasoning` string.
4. **Live investor UI** — Next.js dashboard over Supabase Realtime: ranked queue, accept/decline, thesis modal.
5. **One-click calendar** — Accepting a lead opens a Google Calendar template (Slush, Messukeskus, 15 min).
6. **Telegram alerts** — Score ≥ 80 or verdict `Must Meet` pings the investor immediately.
7. **MCP tool** — `get_top_founders` so Cursor (or Claude Desktop) can query the same ranked queue.

---

## Architecture

```text
Inbound Slush applications
            │
            ▼
    ┌───────────────┐
    │    Supabase   │  profiles + investor_settings
    │  (Postgres +  │  Realtime publication
    │   Realtime)   │
    └───────┬───────┘
            │
     ┌──────┼──────────────────────────┐
     ▼      ▼                          ▼
 Worker   Next.js UI              MCP server (stdio)
     │    (accept / decline /     get_top_founders
     │     thesis modal / GCal)
     │
     ├─► thesisGate (region + stage)
     ├─► Apify LinkedIn
     ├─► Gemini score / verdict / reasoning
     └─► Telegram if score ≥ 80
```

| Path | Role |
| --- | --- |
| `web/` | Investor dashboard (Next.js App Router, Tailwind, Lucide) |
| `worker/` | Poll every 10s, gate, look through linkedin, score, alert |
| `mcp-server/` | MCP over stdio for Cursor / Claude |
| `supabase/setup.sql` | Tables, Realtime, seed founders |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Lucide |
| Data | Supabase Postgres + Realtime (RLS disabled for hackathon demo) |
| Worker | Node.js + `tsx`, Apify client, `@google/genai` (`gemini-3.1-flash-lite`) |
| Agents | MCP SDK (`get_top_founders`: `minScore`, `limit`) |
| Notify / book | Telegram Bot API, Google Calendar template URLs |

---

## Environment

Create `worker/.env`, `mcp-server/.env`, and `web/.env.local`.

**`web/.env.local`**

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**`worker/.env` and `mcp-server/.env`**

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APIFY_API_TOKEN=apify_api_xxx
GEMINI_API_KEY=your-gemini-key
TELEGRAM_BOT_TOKEN=123456789:ABCxxx
TELEGRAM_CHAT_ID=123456789
```

Telegram is optional; skip those two keys if you do not want alerts. Cursor MCP config should inject `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` the same way (see `.cursor/mcp.json`).

---

## Quickstart

### 1. Database

Run `supabase/setup.sql` in the Supabase SQL editor. That creates `profiles` and `investor_settings`, enables Realtime, and seeds sample inbound founders.

### 2. Worker

```bash
cd worker
npm install
npx tsx src/index.ts
```

Polls unscored `pending` rows, drops off-thesis candidates, scrapes LinkedIn, writes Gemini results, alerts on high scores.

### 3. Web app

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure thesis filters, watch scores land in realtime, Accept (calendar) or Decline.

### 4. MCP (Cursor)

```bash
cd mcp-server
npm install
```

Project MCP is already wired in `.cursor/mcp.json`. After reload, ask:

> List founders with a score over 80. Who is the top candidate and why?

Tool: `get_top_founders` with `minScore` (required) and optional `limit`.

For Claude Desktop or another client:

```json
{
  "mcpServers": {
    "FounderRank": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mcp-server/src/index.ts"],
      "env": {
        "SUPABASE_URL": "https://YOUR_PROJECT.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## License

See [LICENSE](LICENSE).
