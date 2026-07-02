# MarketPulse: Financial Intelligence Terminal

**University Capstone Project · Faculté de Génie, Université Libanaise · Semester 8**
- Live deployment: [mktpulse.onrender.com](https://mktpulse-af14.onrender.com)
- Website Video Tutorial: https://youtu.be/hmJLQjt-k4M?si=3xU8_oIIoo98qAah
- Website Screenshots: https://drive.google.com/drive/folders/1LeIzoRSWIhBnN1B0ib0t54s-5aKDYzh-?usp=drive_link
  
| | |
|---|---|
| **Author** | Pierre EL Kassis |
| **Student ID** | 7469 |
| **Supervisor** | Elias Al Zaghrini |
| **Course** | Full Stack · Electrical Engineering, Year 4 |
| **Submitted** | July 2026 |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Pages & Features](#2-pages--features)
3. [Tech Stack](#3-tech-stack)
4. [API Integrations](#4-api-integrations)
5. [Installation & Local Setup](#5-installation--local-setup)
6. [Deployment](#6-deployment)
7. [Project Structure](#7-project-structure)
8. [AI-Use Appendix](#8-ai-use-appendix)

---

## 1. Project Overview

MarketPulse is a Bloomberg Terminal-inspired financial intelligence web application built as a full-stack university capstone. It aggregates live market data across crypto, equities, and commodities, displays financial news and YouTube content, and provides tools for portfolio tracking, risk management, and price alerts all in a dark-themed, monospace terminal aesthetic.

The application consists of a **FastAPI Python backend** (deployed on Render) that proxies and caches data from multiple financial APIs, and a **vanilla HTML/CSS/JS + Bootstrap 5 frontend** across 7 pages.

---

## 2. Pages & Features

### Terminal (`index.html`): Main Dashboard
- Live status bar with real-time prices for BTC, ETH, NVDA, Gold, and Oil
- Market session indicators (NYSE, LSE, TSE, Crypto 24/7) with open/closed status
- World clock (NY, London, Tokyo, Beirut)
- Watchlist panel with sparkline mini-charts and favorite toggling
- Fear & Greed Index widget (live from Alternative.me)
- IPTV-based live financial news streams via FastAPI proxy (resolves CORS / YouTube Error 153)
- Financial loading screen animation on page entry

### Markets (`markets.html`) : Price Tables
- Tabbed tables: Crypto / Stocks / Commodities
- Sortable columns (price, 24h%, 7d%, volume, market cap)
- 7-day sparkline chart per asset using Canvas API
- Asset detail modal with full chart, news tab, calendar tab, and videos tab
- **Separate Watchlist (⭐) and Compare (⇄) columns** each in its own table column, independently actionable
- Quick compare: select 2 assets side-by-side with chart overlay
- KPI strip (total assets, gainers, losers, BTC price, favorites count)
- Sidebar panels: crypto heatmap, favorites watchlist, top movers
- Financial trivia game displayed when live data feed is unavailable
- Three-tier crypto data fallback chain (live → last-known-good snapshot → trivia placeholder)
- Excel/CSV export via SheetJS

### News (`news.html`): Live News Feed
- **Breaking News Carousel** (Bootstrap 5 `data-bs-ride="carousel"`) top 5 stories with background image, directional gradient overlay, and category tags (BRKNG / CRYPTO / MACRO / STOCKS / TECH)
- Progress bar indicators per slide + scannable article list panel below carousel
- Article grid with category chips (All / Crypto / Stocks / Macro / Commodities / Technology)
- Time filters: All Time / Today / This Week / This Month (with live article counts per period)
- Search with 400ms debounce
- Pagination with load-more

### Videos (`youtube.html`): Financial Videos
- YouTube Data API v3 integration: live video search + metadata (duration, views, channel)
- Category filter chips (Crypto / Stocks / Macro / Trading / Education)
- Suggested topic pills (Bitcoin, Ethereum, Fed Rates, NVIDIA, DeFi, Forex, etc.)
- Curated fallback video list when API quota is exhausted
- Duration badges, view counts, and channel attribution on each card
- Infinite scroll via load-more with YouTube `nextPageToken` pagination

### Calendar (`calendar.html`): Economic Events
- Macro economic event calendar sourced from Finnhub
- Filterable by importance (HIGH / MEDIUM / LOW) and country
- Color-coded rows by impact level
- Export to Excel with proper date column formatting (SheetJS)
- Proactive Telegram calendar alerts backend sends push notifications ~1 hour before major FOMC, CPI, NFP, and GDP events

### Tools (`tools.html`): Financial Calculators
- **Currency Converter** live rates between crypto, fiat, and commodities
- **Portfolio Tracker** add positions, track P&L against live prices
- **Heatmap** visual grid of 24h price changes per asset class
- **Price Alerts** browser push notifications + Telegram bot integration
- **Risk Calculator** position sizing, stop-loss, risk/reward ratio
- **DCA Calculator** dollar-cost averaging projections
- **Compound Interest Calculator**
- **Fear & Greed Index** live widget from Alternative.me API
- **Leaderboard** top performers by 24h change
- **Excel/CSV Export** download watchlist or calendar data as `.xlsx` or `.csv`
- **AI Chat tab** DeepSeek-powered `/api/chat` endpoint for market Q&A

### Search (`search.html`): Global Asset Search
- Real-time search across crypto, stocks, and commodities
- Click result to open full asset detail modal

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6 classes) |
| CSS Framework | Bootstrap 5.3.2 |
| Icons | Bootstrap Icons 1.11.3 |
| Typography | IBM Plex Mono + IBM Plex Sans (Google Fonts) |
| Charts | Chart.js (sparklines + asset detail charts) |
| Excel Export | SheetJS (xlsx) |
| PDF Export | jsPDF |
| Backend | FastAPI (Python 3.11) |
| Deployment | Render (backend + static frontend) |
| Auth | Google Identity Services (OAuth 2.0 / JWT) + email/password fallback |

---

## 4. API Integrations

| API | Used For | Route |
|---|---|---|
| CoinGecko | Crypto prices, sparklines, market cap | `/api/watchlist` (proxied) |
| Yahoo Finance (`yfinance`) | Stock + commodity prices, 7-day history | `/api/watchlist`, `/api/history/{symbol}` |
| NewsAPI | Financial news articles (6 category query groups) | `/api/news` |
| YouTube Data API v3 | Financial video search + metadata | Direct from frontend (`youtube.js`) |
| Finnhub | Economic calendar events | `/api/calendar` |
| Alternative.me | Fear & Greed Index | `/api/fear-greed` |
| DeepSeek API | AI chat endpoint for market Q&A | `/api/chat` |
| Telegram Bot API | Price alert + calendar event push notifications | `/api/telegram/notify`, `/api/telegram/test` |
| IPTV-org | Live financial TV streams (M3U/HLS proxy) | `/api/iptv-proxy` |
| Google OAuth | User authentication + cloud sync | Google Identity Services |

All third-party API calls that require keys or encounter CORS restrictions are proxied through the FastAPI backend. The frontend only calls `/api/*` endpoints on the deployed backend. API responses are cached in-memory with per-route TTLs (2–360 minutes) to minimize quota consumption.

---

## 5. Installation & Local Setup

### Prerequisites
- Python 3.11+
- A NewsAPI key (free tier at newsapi.org)
- A YouTube Data API v3 key (Google Cloud Console)
- Optionally: a Telegram Bot token for push alerts

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/marketpulse.git
cd marketpulse

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Fill in: NEWSAPI_KEY, DEEPSEEK_KEY, FINNHUB_KEY, TELEGRAM_BOT_TOKEN, GOOGLE_CLIENT_ID
```

### Environment Variables (`.env`)

```
NEWSAPI_KEY=your_newsapi_key_here
DEEPSEEK_KEY=your_deepseek_key_here
FINNHUB_KEY=your_finnhub_key_here
TELEGRAM_BOT_TOKEN=your_telegram_token_here   # optional for push alerts
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### Run the Backend

```bash
uvicorn main:app --reload --port 8000
```

### Run the Frontend

Open `index.html` directly in a browser, or serve via a local HTTP server:

```bash
# Python simple server from the project root
python -m http.server 5500
```

Then open [http://localhost:5500](http://localhost:5500).

> **Note:** `app.js` auto-detects the origin. When served via `http://`, it points API calls to `window.location.origin`. When opened as a file, it falls back to `http://localhost:8000`.

---

## 6. Deployment

The application is deployed on **Render** as a single Web Service:

- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- The FastAPI backend serves both the `/api/*` routes and the static frontend files (HTML/CSS/JS) via `StaticFiles` mounts at `/assets` and `/`.

**Live URL:** [https://mktpulse.onrender.com](https://mktpulse.onrender.com)

A `/health` endpoint is pinged every 10 minutes via [cron-job.org](https://cron-job.org) to prevent Render's free tier from spinning down.

---

## 7. Project Structure

```
marketpulse/
├── main.py                  # FastAPI backend all /api/* routes + static serving
├── requirements.txt
├── .env.example
├── index.html               # Terminal (main dashboard)
├── markets.html             # Price tables + charts
├── news.html                # News feed + breaking news carousel
├── youtube.html             # Financial videos
├── calendar.html            # Economic calendar
├── tools.html               # Financial calculators & tools
├── search.html              # Global asset search
├── assets/
│   ├── css/
│   │   └── main.css         # All global styles + CSS design system variables
│   └── js/
│       ├── app.js           # Core: APIClient, ThemeManager, Sparkline, StatusBar, FavoritesManager
│       ├── auth.js          # Google OAuth + email auth, user modal, cloud sync
│       ├── news.js          # NewsManager fetch, filter, render, period counts
│       ├── markets.js       # MarketsPage sortable table, KPI strip, sidebar panels, trivia fallback
│       ├── youtube.js       # YouTubeManager live search, category filter, curated fallback
│       ├── calendar.js      # Calendar fetch + render + Excel export
│       ├── features.js      # Keyboard shortcuts, price flash, quick compare, scroll animator, etc.
│       ├── alerts.js        # PriceAlertManager browser push + Telegram notifications
│       ├── asset-detail.js  # AssetDetailModal chart, news, calendar, videos tabs
│       ├── cursor-fx.js     # Terminal crosshair cursor + BUY/SELL click particles
│       ├── export.js        # Excel/CSV export helpers (SheetJS wrapper)
│       ├── pdf-report.js    # Daily PDF market summary (jsPDF)
│       └── theme-boot.js    # Synchronous theme restore (runs in <head> before paint)
└── README.md
```

---

## 8. AI-Use Appendix

As required by the course rubric: honest and specific disclosure of all AI tool usage, prompts used, errors encountered, and fixes applied.

### Tools Used

| Tool | Purpose |
|---|---|
| Claude (Anthropic) | Primary assistant code generation, debugging, UI/UX design, document writing |
| ChatGPT (OpenAI) | Secondary occasional second opinion on backend route design |

### Specific Prompts Used

The following are representative actual prompts submitted to Claude during development:

> *"Act as a Senior Lead Product Designer and Frontend Engineer specializing in FinTech SaaS. Audit my `news.html` and propose the top 5 high-impact upgrades to move it from a functional prototype to a production-ready professional interface."*

> *"Rewrite the breaking news carousel in `news.html`. Keep the Bootstrap carousel markup intact for rubric compliance. Add: progress bar indicators per slide, a scannable article list panel below the carousel showing all 5 articles, semantic category tags (BRKNG/CRYPTO/MACRO/STOCKS/TECH), and a directional gradient on the background image instead of flat opacity. Patch `news.js`'s `_buildCarousel` method via a script block at the bottom of the HTML without modifying `news.js` itself."*

> *"My `news.js` fetches articles and renders a Bootstrap carousel into `#breakingInner`. The time filter chips show `—` instead of article counts. Debug: the `_loadPeriodCounts()` function is called before `allArticles` is populated. Fix without modifying the API call structure."*

> *"The SIGN IN button in the navbar is not responding to clicks. The button has `onclick=window.openSignIn(event)` but clicking does nothing. Diagnose: a `pointer-events: none` overlay element (the cursor FX canvas `#mp-svg-layer` at z-index 999990) is intercepting all click events. Fix `cursor-fx.js` so the SVG layer never blocks underlying clicks."*

> *"In my `markets.html` and `markets.js`, the watchlist star button (⭐) and compare button (⇄) are crammed into the same `<td>`. Separate them into two independent columns with their own `<th>` headers. Update all `colspan` references, `nth-child` CSS rules, and the row rendering template accordingly."*

> *"Build a three-tier crypto data fallback chain in the FastAPI `/api/watchlist` route: (1) try CoinGecko live; (2) on failure, load the last successful snapshot from `watchlist_crypto_last_good.json` and flag items with `stale: true`; (3) if neither exists, return an empty array so the frontend's trivia game triggers."*

> *"Write me a professional `README.md` for my MarketPulse capstone project that matches exactly what my professor's rubric requires for the AI-use appendix: list each AI tool, include representative prompts, describe specific things the AI got wrong and how I fixed each one."*

### Things AI Got Wrong and How I Fixed Them

**1. The carousel upgrade broke Bootstrap's slide event sync**

Claude's initial `_buildCarousel()` patch built a custom `bkGoTo()` function for the article list panel below the carousel. However, when the user clicked the native Bootstrap prev/next arrows, Bootstrap advanced its internal slide index but the custom `bkCurrent` variable stayed at 0. The progress indicators and article list below no longer matched the visible slide.

*Fix I applied:* Added a `slid.bs.carousel` event listener on `#breakingCarousel` that reads `e.to` (Bootstrap's new index) and calls `bkSetIndicators(e.to)` and `bkSetList(e.to)`. This keeps both systems in sync regardless of how the slide advances auto-timer, arrow click, or article list click.

**2. AI suggested modifying `news.js` directly wrong approach for rubric compliance**
In an early iteration, Claude rewrote `_buildCarousel()` inside `news.js`. This would have broken the Git diff clarity and made it harder to prove which code was mine vs AI-generated. More importantly, the professor checks that Bootstrap's `data-bs-ride="carousel"` attribute is present and functional rewriting the method risked removing Bootstrap's own initialization.

*Fix I applied:* Rejected the direct modification approach. Instead, I used a monkey-patch pattern: the upgrade script waits for `window.newsManager` to exist (polling every 50ms), then wraps `_buildCarousel` to call the original first, then enhances the resulting DOM. Bootstrap's carousel is never touched only the visual layer around it is upgraded.

**3. The IPTV live streams returned YouTube Error 153 on iframe embeds**

My original Terminal page used YouTube `<iframe>` embeds for live financial news channels (CNBC, Bloomberg TV). These returned YouTube Error 153 (embedding disabled by the channel). Claude's first suggestion was to try different YouTube channel IDs these also failed because major financial channels block iframe embedding site-wide.

*Fix I applied:* Replaced the YouTube iframe approach entirely with an IPTV-org proxy architecture. The FastAPI backend fetches the M3U playlist from `iptv-org/iptv` on GitHub, filters for financial/news channels, and serves the stream URLs through a `/api/iptv-proxy` endpoint. The frontend uses an HTML5 `<video>` tag with HLS.js to play the `.m3u8` stream directly. This resolved Error 153 completely and added real live TV streams.

**4. AI separated the watchlist and compare buttons but missed the colspan cascade**

When asked to split the watchlist star (⭐) and compare button (⇄) into separate table columns, Claude correctly updated the `<th>` header and the row `<td>` rendering in `markets.js`. However, it missed updating the `colspan="9"` attributes in two other places: the trivia game's unavailable-state row and the "NO ASSETS FOUND" empty-state row both still used the old column count and caused the table layout to break.

*Fix I applied:* Manually audited all `colspan` occurrences across both `markets.html` and `markets.js` with `grep -n "colspan"` and updated every instance from `9` to `10`. Also added the matching `th:nth-child(10)` and `td:nth-child(10)` CSS alignment rules that Claude had omitted.

---

*This appendix documents genuine AI assistance used throughout development. All code was reviewed, tested, debugged, and integrated manually. AI-generated code that failed was corrected and is documented above. The project's Git history reflects the actual development timeline.*
