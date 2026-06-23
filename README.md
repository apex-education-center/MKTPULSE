# MarketPulse v10

A Bloomberg-inspired **financial intelligence terminal** — real-time markets, news, macro calendar, trading tools, and live TV. Built as a university project; all data is for **educational use**.

![Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?style=flat&logo=bootstrap&logoColor=white)

---

## Quick start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the server

```bash
uvicorn main:app --port 8000
```

### 3. Open the app

```
http://localhost:8000
```

Use **localhost** (not `file://`) so theme sync, API calls, and Google Sign-In work correctly.

---

## Screenshots & pages

| Page | URL | Highlights |
|------|-----|------------|
| **Terminal** | `/index.html` | Live prices, ticker tape, heatmap, fear & greed, AI analysis, **Live TV** |
| **Markets** | `/markets.html` | Crypto, stocks, commodities — sortable tables, sparklines, favorites |
| **News** | `/news.html` | Financial news by category and time range |
| **Videos** | `/youtube.html` | Finance & crypto YouTube search with topic chips |
| **Calendar** | `/calendar.html` | Economic events (Finnhub), fear & greed, macro alerts |
| **Tools** | `/tools.html` | Portfolio, alerts, DCA, risk calc, compound interest, exports |
| **Search** | `/search.html` | Global search across assets, news, and events |

---

## Features

### Market data
- Live watchlist: **BTC, ETH, BNB, XRP, SOL, ADA** + major stocks + commodities
- Status bar with world clocks, market sessions (NYSE, LSE, TSE, Crypto 24/7)
- Scrolling ticker tape on every page
- **Watchlist favorites** — star assets on Markets; they appear in the top bar and Tools leaderboard

### News & research
- NewsAPI-powered financial news with filters (crypto, stocks, macro, commodities, tech)
- Featured carousel on the Terminal
- AI market analysis & mood (DeepSeek / Anthropic when keys are set)

### Tools
- Currency converter (forex + BTC/ETH)
- Portfolio tracker with live P&L
- Position size / **risk calculator**
- **DCA simulator** (real historical prices)
- Compound interest calculator with chart
- Crypto dominance chart & market heatmap
- ETH gas tracker
- **Watchlist leaderboard** (24h / 7d)
- Fear & Greed index
- Trading notes
- CSV / Excel export + **daily PDF report**

### Alerts & calendar
- **Price alerts** — browser notifications + optional **Telegram** push
- **Macro calendar alerts** — notify ~1h before Fed, CPI, NFP (Telegram)
- Economic calendar with impact analysis

### User accounts
- **Google Sign-In** or email/password
- Cloud sync: favorites, portfolio, alerts, notes, theme, calendar settings
- Guest session restored on logout

### Other
- **Asset detail modal** — chart, news, calendar, videos per symbol
- **Compare mode** — side-by-side asset comparison on Markets
- Dark / light theme
- Mobile hamburger navigation
- Keyboard shortcuts (`?` help, `t` theme, `g` + letter for pages)

### Live TV (Terminal only)
Bloomberg, CNBC, Sky News, France 24, Al Jazeera, Al Arabiya — HLS streams proxied through the backend.

---

## Environment variables

Create a `.env` file in the project root (see `.gitignore` — never commit secrets):

```env
NEWSAPI_KEY=your_key
FINNHUB_KEY=your_key
DEEPSEEK_KEY=your_key          # optional — AI analysis
ANTHROPIC_KEY=your_key         # optional — AI analysis
TELEGRAM_BOT_TOKEN=your_token  # optional — phone alerts
GOOGLE_CLIENT_ID=your_client   # optional — overrides default
YOUTUBE_API_KEY=your_key       # set in assets/js/youtube.js or env if wired
```

| Variable | Purpose |
|----------|---------|
| `NEWSAPI_KEY` | News feed |
| `FINNHUB_KEY` | Economic calendar |
| `DEEPSEEK_KEY` / `ANTHROPIC_KEY` | AI market analysis |
| `TELEGRAM_BOT_TOKEN` | Price & calendar alerts to your phone |
| `GOOGLE_CLIENT_ID` | Google Sign-In OAuth client |

The app runs with **cached fallback data** when keys are missing or APIs are offline.

---

## Telegram alerts (optional)

1. Create a bot via [@BotFather](https://t.me/BotFather) → copy token → add to `.env`
2. Get your chat ID from [@userinfobot](https://t.me/userinfobot)
3. In **Tools → Price Alerts**, paste chat ID → **Save** → **Test**
4. Restart `uvicorn` after changing `.env`

Alerts fire once and remove themselves. Works while the backend is running.

---

## Google Sign-In setup

If you see **Error 400** or **Access blocked**:

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Web application** OAuth client
2. **Authorized JavaScript origins:**
   ```
   http://localhost:8000
   http://127.0.0.1:8000
   ```
3. OAuth consent screen → add your email under **Test users** if app is in Testing
4. Open the app at `http://localhost:8000` and hard-refresh (`Ctrl+F5`)

---

## API reference

| Endpoint | Description |
|----------|-------------|
| `GET /api/watchlist` | Crypto, stocks, commodities |
| `GET /api/quotes?symbols=` | Quote lookup for favorites |
| `GET /api/history/{symbol}?days=` | Historical prices (DCA) |
| `GET /api/news` | Financial news |
| `GET /api/calendar` | Economic events |
| `GET /api/forex` | Exchange rates |
| `GET /api/fear-greed` | Crypto Fear & Greed Index |
| `GET /api/gas` | Ethereum gas prices |
| `GET /api/mood` | Market sentiment |
| `GET /api/analysis` | AI market summary |
| `GET /api/stream/{id}/playlist.m3u8` | Live TV HLS proxy |
| `POST /api/auth/login` | Email login |
| `POST /api/auth/google` | Google Sign-In |
| `GET/PUT /api/user/data` | Cloud sync |
| `POST /api/alerts/sync` | Server-side alert monitor |
| `GET /health` | Health check |

Responses are cached in `cache/` (5–60 min TTL).

---

## Project structure

```
V10/
├── main.py              # FastAPI backend + static file server
├── requirements.txt
├── index.html           # Terminal (home)
├── markets.html
├── news.html
├── youtube.html
├── calendar.html
├── tools.html
├── search.html
├── assets/
│   ├── css/main.css     # Design system (dark/light)
│   └── js/              # app, markets, news, auth, alerts, …
└── cache/               # API response cache (auto-generated)
```

---

## Tech stack

- **Frontend:** HTML5, CSS3, Bootstrap 5, vanilla JavaScript
- **Backend:** FastAPI, httpx, uvicorn
- **Charts:** Chart.js, canvas sparklines
- **Video:** hls.js + backend HLS proxy
- **Storage:** localStorage (guest) + JSON files (accounts/cloud)
- **Fonts:** IBM Plex Sans & Mono

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 8000 in use | Stop the other process or use `--port 8001` |
| Empty markets / news | Start backend: `uvicorn main:app --port 8000` |
| Watchlist not showing | Star assets on **Markets** (BTC, ETH, NVDA, etc.) then `Ctrl+F5` |
| Google login blocked | Add `http://localhost:8000` to OAuth origins (see above) |
| Telegram not working | Set `TELEGRAM_BOT_TOKEN` in `.env` and restart server |

---

## License & disclaimer

University project — **not financial advice**. Market data from third-party APIs (CoinGecko, Yahoo Finance, NewsAPI, Finnhub, etc.). Use at your own risk.

---

**MarketPulse v10** — Financial Intelligence Terminal
