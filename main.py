from fastapi import FastAPI, HTTPException, Query, Request, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx, json, os, asyncio, hashlib, secrets, re
from datetime import datetime, timedelta

def _load_dotenv():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

_load_dotenv()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

NEWSAPI_KEY   = os.getenv("NEWSAPI_KEY",   "c8afc01eee3e4050b94a8cd6badd434f")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_KEY", "")
DEEPSEEK_KEY  = os.getenv("DEEPSEEK_KEY",  "sk-e19a2ff283a74ae1a8ed8eea3b0baef5")
FINNHUB_KEY   = os.getenv("FINNHUB_KEY",   "cvqsat9r01qhup2eveigcvqsat9r01qhup2eveih")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "175986550586-rgsis4asdfi9ol9p30t7sv26nltc6qsp.apps.googleusercontent.com",
)
ALERTS_SYNC_FILE = f"{CACHE_DIR}/synced_alerts.json"
USERS_FILE = f"{CACHE_DIR}/users.json"
USER_DATA_DIR = f"{CACHE_DIR}/user_data"
CALENDAR_ALERTS_SENT = f"{CACHE_DIR}/calendar_alerts_sent.json"
os.makedirs(USER_DATA_DIR, exist_ok=True)

FINANCIAL_DOMAINS = (
    "bloomberg.com,reuters.com,cnbc.com,ft.com,wsj.com,forbes.com,"
    "businessinsider.com,marketwatch.com,investing.com,coindesk.com,"
    "cointelegraph.com,decrypt.co,theblock.co,seekingalpha.com,"
    "barrons.com,economist.com,finance.yahoo.com"
)

CATEGORY_QUERIES = {
    "all":         [
        '(bitcoin OR ethereum OR crypto) AND (price OR market OR trading)',
        '(stock market OR nasdaq OR S&P500) AND (trading OR earnings OR rally)',
        '(federal reserve OR Fed) AND (rate OR inflation OR monetary)',
        '(gold OR crude oil) AND (price OR market OR commodity)',
    ],
    "crypto":      ['(bitcoin OR ethereum OR solana OR crypto) AND (price OR market OR defi)'],
    "stocks":      ['(stock market OR nasdaq OR S&P500 OR earnings) AND (trading OR investor OR rally)'],
    "macro":       ['(federal reserve OR ECB OR interest rate OR inflation OR GDP OR CPI)'],
    "commodities": ['(gold price OR crude oil OR silver OR natural gas) AND (commodity OR market)'],
    "tech":        ['(nvidia OR artificial intelligence OR semiconductor OR tech stocks) AND (market OR earnings)'],
}

def cache_valid(path, minutes=15):
    if not os.path.exists(path): return False
    return (datetime.now().timestamp() - os.path.getmtime(path)) / 60 < minutes

def read_cache(path):
    with open(path) as f: return json.load(f)

def write_cache(path, data):
    with open(path, "w") as f: json.dump(data, f)

# ── WATCHLIST ────────────────────────────────────────────
@app.get("/api/watchlist")
async def get_watchlist():
    path = f"{CACHE_DIR}/watchlist.json"
    if cache_valid(path, 5): return read_cache(path)
    result = {"crypto": [], "stocks": [], "commodities": []}
    crypto_ok = False
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get("https://api.coingecko.com/api/v3/coins/markets", params={
                "vs_currency": "usd",
                "ids": "bitcoin,ethereum,solana,cardano,ripple,binancecoin",
                "sparkline": True, "price_change_percentage": "24h,7d"
            })
            for c in r.json():
                result["crypto"].append({
                    "symbol": c["symbol"].upper(), "name": c["name"],
                    "price": c["current_price"], "market_cap": c["market_cap"],
                    "change_24h": round(c.get("price_change_percentage_24h") or 0, 2),
                    "change_7d":  round(c.get("price_change_percentage_7d_in_currency") or 0, 2),
                    "volume": c["total_volume"], "image": c["image"],
                    "sparkline": (c.get("sparkline_in_7d") or {}).get("price", [])
                })
            if result["crypto"]:
                crypto_ok = True
        except Exception as e: print(f"Crypto error: {e}")

        if not crypto_ok:
            # Live fetch failed (or returned nothing) — fall back to the last
            # successfully fetched crypto snapshot instead of showing blanks.
            last_good_path = f"{CACHE_DIR}/watchlist_crypto_last_good.json"
            if os.path.exists(last_good_path):
                try:
                    stale = read_cache(last_good_path)
                    for item in stale:
                        item["stale"] = True   # flag so frontend can show "last known" badge
                    result["crypto"] = stale
                    print("Crypto: using last known good data (live fetch failed)")
                except Exception as e:
                    print(f"Crypto fallback read error: {e}")
        else:
            # Successful fetch — update the last-known-good snapshot
            try:
                write_cache(f"{CACHE_DIR}/watchlist_crypto_last_good.json", result["crypto"])
            except Exception as e:
                print(f"Crypto fallback write error: {e}")

        for sym in ["AAPL","TSLA","MSFT","NVDA","AMZN","GOOGL"]:
            try:
                r = await client.get(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}",
                    params={"interval":"1d","range":"7d"}, headers={"User-Agent":"Mozilla/5.0"})
                d = r.json(); meta = d["chart"]["result"][0]["meta"]
                closes = [x for x in d["chart"]["result"][0]["indicators"]["quote"][0]["close"] if x]
                result["stocks"].append({
                    "symbol": sym, "name": meta.get("shortName", sym),
                    "price": round(meta["regularMarketPrice"], 2),
                    "change_24h": round(((closes[-1]-closes[-2])/closes[-2])*100,2) if len(closes)>=2 else 0,
                    "change_7d":  round(((closes[-1]-closes[0])/closes[0])*100,2)  if len(closes)>=2 else 0,
                    "volume": meta.get("regularMarketVolume",0), "market_cap":0, "sparkline": closes
                })
            except Exception as e: print(f"Stock error {sym}: {e}")
        for sym, name in {"GC=F":"Gold","SI=F":"Silver","CL=F":"Crude Oil","NG=F":"Natural Gas","ZW=F":"Wheat"}.items():
            try:
                r = await client.get(f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}",
                    params={"interval":"1d","range":"7d"}, headers={"User-Agent":"Mozilla/5.0"})
                d = r.json(); meta = d["chart"]["result"][0]["meta"]
                closes = [x for x in d["chart"]["result"][0]["indicators"]["quote"][0]["close"] if x]
                result["commodities"].append({
                    "symbol": sym.replace("=F",""), "name": name,
                    "price": round(meta["regularMarketPrice"],2),
                    "change_24h": round(((closes[-1]-closes[-2])/closes[-2])*100,2) if len(closes)>=2 else 0,
                    "change_7d":  round(((closes[-1]-closes[0])/closes[0])*100,2)  if len(closes)>=2 else 0,
                    "volume": meta.get("regularMarketVolume",0), "market_cap":0, "sparkline": closes
                })
            except Exception as e: print(f"Commodity error {sym}: {e}")
    write_cache(path, result)
    return result

_CRYPTO_IDS = {
    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana", "ADA": "cardano",
    "XRP": "ripple", "BNB": "binancecoin", "DOGE": "dogecoin", "DOT": "polkadot",
    "AVAX": "avalanche-2", "LINK": "chainlink", "MATIC": "matic-network",
}
_STOCK_LIST = ["AAPL", "TSLA", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "AMD", "NFLX", "JPM"]
_COMMODITY_YF = {
    "GC": "GC=F", "XAU": "GC=F", "GOLD": "GC=F", "SI": "SI=F", "SILVER": "SI=F",
    "CL": "CL=F", "OIL": "CL=F", "NG": "NG=F", "ZW": "ZW=F", "WHEAT": "ZW=F",
}

async def _yahoo_asset(client, yf_sym, symbol, name=None):
    try:
        r = await client.get(
            f"https://query1.finance.yahoo.com/v8/finance/chart/{yf_sym}",
            params={"interval": "1d", "range": "7d"},
            headers={"User-Agent": "Mozilla/5.0"},
        )
        d = r.json()
        meta = d["chart"]["result"][0]["meta"]
        closes = [x for x in d["chart"]["result"][0]["indicators"]["quote"][0]["close"] if x]
        return {
            "symbol": symbol,
            "name": name or meta.get("shortName", symbol),
            "price": round(meta["regularMarketPrice"], 2),
            "change_24h": round(((closes[-1] - closes[-2]) / closes[-2]) * 100, 2) if len(closes) >= 2 else 0,
            "change_7d": round(((closes[-1] - closes[0]) / closes[0]) * 100, 2) if len(closes) >= 2 else 0,
            "volume": meta.get("regularMarketVolume", 0),
            "market_cap": 0,
            "sparkline": closes,
        }
    except Exception:
        return None

async def _fetch_single_quote(client, sym):
    sym = sym.upper()
    if sym in _CRYPTO_IDS:
        try:
            r = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={"vs_currency": "usd", "ids": _CRYPTO_IDS[sym], "sparkline": "true",
                        "price_change_percentage": "24h,7d"},
            )
            for c in r.json():
                return {
                    "symbol": c["symbol"].upper(), "name": c["name"],
                    "price": c["current_price"],
                    "change_24h": round(c.get("price_change_percentage_24h") or 0, 2),
                    "change_7d": round(c.get("price_change_percentage_7d_in_currency") or 0, 2),
                    "volume": c["total_volume"], "market_cap": c["market_cap"],
                    "sparkline": (c.get("sparkline_in_7d") or {}).get("price", []),
                }
        except Exception:
            pass
    if sym in _STOCK_LIST:
        return await _yahoo_asset(client, sym, sym)
    if sym in _COMMODITY_YF:
        a = await _yahoo_asset(client, _COMMODITY_YF[sym], sym)
        if a:
            return a
    return None

@app.get("/api/quotes")
async def get_quotes(symbols: str = ""):
    syms = list(dict.fromkeys(s.strip().upper() for s in symbols.split(",") if s.strip()))
    if not syms:
        return []
    cache_key = f"{CACHE_DIR}/quotes_{hash(tuple(syms))}.json"
    if cache_valid(cache_key, 2):
        return read_cache(cache_key)
    wl = await get_watchlist()
    by_sym = {a["symbol"]: a for cat in ("crypto", "stocks", "commodities") for a in wl.get(cat, [])}
    result, missing = [], []
    for s in syms:
        if s in by_sym:
            result.append(by_sym[s])
        else:
            missing.append(s)
    if missing:
        async with httpx.AsyncClient(timeout=15) as client:
            for s in missing:
                q = await _fetch_single_quote(client, s)
                if q:
                    result.append(q)
    write_cache(cache_key, result)
    return result

@app.get("/api/history/{symbol}")
async def get_history(symbol: str, days: int = 365):
    symbol = symbol.upper()
    days = max(30, min(1825, days))
    path = f"{CACHE_DIR}/hist_{symbol}_{days}.json"
    if cache_valid(path, 60):
        return read_cache(path)
    prices = []
    async with httpx.AsyncClient(timeout=25) as client:
        if symbol in _CRYPTO_IDS:
            cg_days = min(days, 365 * 2)
            for attempt, d in enumerate([str(cg_days), "365", "180", "90"]):
                try:
                    r = await client.get(
                        f"https://api.coingecko.com/api/v3/coins/{_CRYPTO_IDS[symbol]}/market_chart",
                        params={"vs_currency": "usd", "days": d},
                    )
                    if r.status_code != 200:
                        continue
                    raw = r.json().get("prices", [])
                    if not raw:
                        continue
                    # downsample to ~1 point per day for long ranges
                    step = max(1, len(raw) // min(days, len(raw)))
                    for i in range(0, len(raw), step):
                        ts, p = raw[i]
                        prices.append({"date": datetime.fromtimestamp(ts / 1000).strftime("%Y-%m-%d"), "price": round(p, 4)})
                    if prices:
                        break
                except Exception as e:
                    print(f"CG history {symbol} attempt {attempt}: {e}")
        if not prices:
            try:
                yf = symbol if symbol in _STOCK_LIST else _COMMODITY_YF.get(symbol, symbol)
                rng = "5y" if days > 730 else ("2y" if days > 365 else "1y")
                r = await client.get(
                    f"https://query1.finance.yahoo.com/v8/finance/chart/{yf}",
                    params={"interval": "1d", "range": rng},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                res = r.json()["chart"]["result"][0]
                ts_list = res.get("timestamp") or []
                closes = res["indicators"]["quote"][0]["close"]
                for ts, p in zip(ts_list, closes):
                    if p is not None:
                        prices.append({"date": datetime.fromtimestamp(ts).strftime("%Y-%m-%d"), "price": round(p, 4)})
                if days < len(prices):
                    prices = prices[-days:]
            except Exception as e:
                print(f"Yahoo history {symbol}: {e}")
    out = {"symbol": symbol, "prices": prices}
    if prices:
        write_cache(path, out)
    return out

def _parse_published(iso: str):
    if not iso:
        return None
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None

# ── NEWS ─────────────────────────────────────────────────
@app.get("/api/news")
async def get_news(q: str = "", category: str = "all", period: str = "all"):
    if period not in ("today", "week", "month", "all"):
        period = "all"
    safe_q = q[:30].replace(' ', '_').replace('/', '').replace('\\', '')
    today  = datetime.now().strftime("%Y-%m-%d")
    cache_key = f"{CACHE_DIR}/news_{category}_{safe_q}_{period}_{today}.json"
    cache_mins = 120 if period == "today" else 360
    if cache_valid(cache_key, cache_mins):
        return read_cache(cache_key)

    now = datetime.now()
    if period == "today":
        # Wider API window — NewsAPI "from=today" alone often returns 0 for domain filters
        from_date = (now - timedelta(days=2)).strftime("%Y-%m-%d")
    elif period == "week":
        from_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    else:
        # month + all — NewsAPI free tier max 30 days lookback
        from_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")

    queries = [q] if q else CATEGORY_QUERIES.get(category, CATEGORY_QUERIES["all"])
    articles, seen = [], set()
    pages     = 2 if period in ("all", "month") else 1
    page_size = 100

    async with httpx.AsyncClient(timeout=25) as client:
        for query in queries[:4]:
            for page in range(1, pages + 1):
                try:
                    params = {
                        "q": query, "language": "en", "sortBy": "publishedAt",
                        "pageSize": page_size, "page": page, "apiKey": NEWSAPI_KEY,
                        "from": from_date,
                    }
                    if not q:
                        params["domains"] = FINANCIAL_DOMAINS
                    r = await client.get("https://newsapi.org/v2/everything", params=params)
                    data = r.json()
                    if data.get("status") != "ok":
                        print(f"NewsAPI: {data.get('message')}")
                        break
                    batch = data.get("articles", [])
                    if not batch:
                        break
                    for a in batch:
                        title = a.get("title", "")
                        url   = a.get("url", "")
                        if not url or not title or "[Removed]" in title or url in seen:
                            continue
                        seen.add(url)
                        articles.append({
                            "title": title,
                            "description": a.get("description", "") or "",
                            "url": url,
                            "image": a.get("urlToImage"),
                            "source": a.get("source", {}).get("name", "Unknown"),
                            "published_at": a.get("publishedAt", ""),
                        })
                except Exception as e:
                    print(f"News error: {e}")
                    break

    if period == "today":
        # Last 48h — financial feeds often lag; strict "today" returns 0 too often
        start = now - timedelta(hours=48)
        articles = [a for a in articles if (p := _parse_published(a.get("published_at"))) and p >= start]
    elif period == "week":
        start = now - timedelta(days=7)
        articles = [a for a in articles if (p := _parse_published(a.get("published_at"))) and p >= start]
        articles.sort(key=lambda x: x.get("published_at", ""), reverse=True)
        result = articles[:80]
        if result:
            write_cache(cache_key, result)
        return result
    elif period == "month":
        start = now - timedelta(days=30)
        articles = [a for a in articles if (p := _parse_published(a.get("published_at"))) and p >= start]
        articles.sort(key=lambda x: x.get("published_at", ""), reverse=True)
        week_start = now - timedelta(days=7)
        recent = [a for a in articles if (p := _parse_published(a.get("published_at"))) and p >= week_start]
        older  = [a for a in articles if (p := _parse_published(a.get("published_at"))) and p < week_start]
        # Mix: latest week + older stories so month ≠ week
        result = (recent[:70] + older[:30])[:100]
        result.sort(key=lambda x: x.get("published_at", ""), reverse=True)
        if result:
            write_cache(cache_key, result)
        return result

    articles.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    result = articles[:100]
    if (result or period == "today"):
        write_cache(cache_key, result)
    return result

# ── REAL ECONOMIC CALENDAR (Finnhub) ─────────────────────
@app.get("/api/calendar")
async def get_calendar(from_date: str = "", to_date: str = ""):
    # Default: past 30 days + next 90 days for full context
    if not from_date:
        from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not to_date:
        to_date = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")

    cache_key = f"{CACHE_DIR}/calendar_{from_date}_{to_date}.json"
    if cache_valid(cache_key, 60): return read_cache(cache_key)

    events = []
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get("https://finnhub.io/api/v1/calendar/economic", params={
                "from": from_date, "to": to_date, "token": FINNHUB_KEY
            })
            data = r.json()
            raw = data.get("economicCalendar", [])

            # Map Finnhub importance (1=low,2=medium,3=high) and add market impact
            impact_map = {
                "GDP": ("high","🇺🇸","Measures total economic output. Strong GDP → bullish stocks, bearish bonds."),
                "CPI": ("high","🇺🇸","Inflation indicator. High CPI → Fed rate hikes → bearish stocks/crypto."),
                "NFP": ("high","🇺🇸","Non-Farm Payrolls. Strong jobs → risk-on assets rally."),
                "FOMC": ("high","🇺🇸","Fed rate decision. Rate cuts → bullish crypto/stocks. Hikes → bearish."),
                "PMI": ("medium","🇺🇸","Business activity index. Above 50 = expansion → bullish."),
                "PPI": ("medium","🇺🇸","Producer prices. Leading indicator for CPI inflation."),
                "Retail": ("medium","🇺🇸","Consumer spending. Strong retail → GDP growth signal."),
                "Unemployment": ("high","🇺🇸","Jobs data. Low unemployment → Fed keeps rates higher."),
                "Interest Rate": ("high","","Central bank rate decision — highest market impact."),
                "Trade Balance": ("low","🇺🇸","Export/import balance. Deficit widens → USD pressure."),
            }

            region_map = {"United States":"🇺🇸","EU":"🇪🇺","Euro Zone":"🇪🇺",
                          "United Kingdom":"🇬🇧","Japan":"🇯🇵","China":"🇨🇳",
                          "Germany":"🇩🇪","France":"🇫🇷","Canada":"🇨🇦"}

            imp_num = {1:"low", 2:"medium", 3:"high"}

            for e in raw[:50]:
                name   = e.get("event","") or ""
                country = e.get("country","") or ""
                imp    = imp_num.get(e.get("impact",1), "low")
                region = region_map.get(country, "🌍")

                # Find matching impact description
                impact_detail = "Monitor for market volatility around release time."
                for keyword, (_, _, detail) in impact_map.items():
                    if keyword.lower() in name.lower():
                        impact_detail = detail
                        break

                raw_time = e.get("time") or e.get("date") or ""
                event_date = raw_time[:10] if raw_time else ""
                event_dt = raw_time.replace(" ", "T") if len(raw_time) > 10 else f"{event_date}T13:30:00"

                events.append({
                    "date":       event_date,
                    "datetime":   event_dt,
                    "event":      name,
                    "importance": imp,
                    "region":     region,
                    "country":    country,
                    "actual":     e.get("actual",""),
                    "estimate":   e.get("estimate",""),
                    "previous":   e.get("previous",""),
                    "detail":     impact_detail,
                    "unit":       e.get("unit",""),
                })
        except Exception as e:
            print(f"Finnhub calendar error: {e}")

    # Fallback if Finnhub fails
    if not events:
        events = _fallback_calendar()

    events.sort(key=lambda x: x.get("date",""))
    write_cache(cache_key, events)
    return events

def _fallback_calendar():
    """Hardcoded fallback with real upcoming events if API fails"""
    rows = [
        ("2026-06-25T14:00:00","2026-06-25","Bank of England Rate Decision","medium","🇬🇧","United Kingdom","5.0%","5.25%","BoE rate path affects GBP and European market sentiment."),
        ("2026-07-01T14:45:00","2026-07-01","US ISM Manufacturing PMI","medium","🇺🇸","United States","48.5","49.2","Above 50 = expansion, below = contraction."),
        ("2026-07-10T12:30:00","2026-07-10","US PPI Producer Prices","medium","🇺🇸","United States","0.2%","0.3%","Leading indicator for CPI inflation."),
        ("2026-07-15T02:00:00","2026-07-15","China GDP Q2 2026","high","🇨🇳","China","4.8%","5.3%","China growth drives global commodity demand."),
        ("2026-07-28T18:00:00","2026-07-28","FOMC Interest Rate Decision","high","🇺🇸","United States","5.0%","5.25%","Fed rate decision — high market impact."),
        ("2026-08-05T03:00:00","2026-08-05","Bank of Japan Policy Meeting","medium","🇯🇵","Japan","0.1%","0.1%","BoJ policy shifts affect global carry trades."),
        ("2026-09-10T12:45:00","2026-09-10","ECB Policy Decision","high","🇪🇺","Euro Zone","3.50%","3.75%","ECB rate cuts → Euro weakness, equity bullish."),
        ("2026-09-20T18:00:00","2026-09-20","FOMC Interest Rate Decision","high","🇺🇸","United States","4.75%","5.0%","Pivotal for year-end crypto and equity outlook."),
    ]
    return [{
        "datetime": dt, "date": d, "event": ev, "importance": imp, "region": reg, "country": ctry,
        "estimate": est, "previous": prev, "actual": "", "detail": det, "unit": "%",
    } for dt, d, ev, imp, reg, ctry, est, prev, det in rows]

# ── FOREX RATES ───────────────────────────────────────────
# Returns a flat USD-base rate table: {"EUR":1.0842,"GBP":1.2701,...}
# All rates = how many USD per 1 unit of that currency
# So EUR=1.0842 means 1 EUR = 1.0842 USD
@app.get("/api/forex")
async def get_forex():
    path = f"{CACHE_DIR}/forex.json"
    if cache_valid(path, 60): return read_cache(path)

    # Fetch all rates with USD as base from Finnhub
    # This gives us USD/XXX rates directly
    rates_usd_base = {}
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(
                f"https://finnhub.io/api/v1/forex/rates?base=USD&token={FINNHUB_KEY}")
            data = r.json()
            quotes = data.get("quote", {})
            # quotes["EUR"] = 0.9223 means 1 USD = 0.9223 EUR
            # We want: 1 EUR = ? USD → invert
            for currency, rate_per_usd in quotes.items():
                if rate_per_usd and rate_per_usd > 0:
                    # rate_per_usd = units of currency per 1 USD
                    # So 1 unit of currency = 1/rate_per_usd USD
                    rates_usd_base[currency] = round(1 / rate_per_usd, 6)
            rates_usd_base["USD"] = 1.0
        except Exception as e:
            print(f"Finnhub forex error: {e}")

    # Also fetch crypto rates via CoinGecko
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids":"bitcoin,ethereum","vs_currencies":"usd"})
            cdata = r.json()
            if cdata.get("bitcoin"):
                rates_usd_base["BTC"] = cdata["bitcoin"]["usd"]
            if cdata.get("ethereum"):
                rates_usd_base["ETH"] = cdata["ethereum"]["usd"]
    except: pass

    # Fallback if API failed
    if len(rates_usd_base) < 3:
        rates_usd_base = {
            "USD": 1.0,
            "EUR": 1.0842,
            "GBP": 1.2701,
            "JPY": 0.00636,
            "CHF": 1.1092,
            "AUD": 0.6612,
            "CAD": 0.7312,
            "CHF": 1.1092,
            "LBP": 0.0000112,
            "BTC": 67500.0,
            "ETH": 3500.0,
        }

    write_cache(path, rates_usd_base)
    return rates_usd_base

# ── FEAR & GREED INDEX ────────────────────────────────────
@app.get("/api/fear-greed")
async def get_fear_greed():
    path = f"{CACHE_DIR}/feargreed.json"
    if cache_valid(path, 60): return read_cache(path)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://api.alternative.me/fng/?limit=7")
            data = r.json()
            result = {
                "current": data["data"][0],
                "history": data["data"][:7]
            }
            write_cache(path, result)
            return result
    except:
        return {"current":{"value":"52","value_classification":"Neutral","timestamp":str(int(datetime.now().timestamp()))}, "history":[]}

# ── CRYPTO GAS (ETH) ──────────────────────────────────────
@app.get("/api/gas")
async def get_gas():
    path = f"{CACHE_DIR}/gas.json"
    if cache_valid(path, 2): return read_cache(path)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken")
            data = r.json()
            result = data.get("result",{})
            out = {
                "slow":   result.get("SafeGasPrice","—"),
                "normal": result.get("ProposeGasPrice","—"),
                "fast":   result.get("FastGasPrice","—"),
            }
            write_cache(path, out)
            return out
    except:
        return {"slow":"12","normal":"15","fast":"22"}

# ── AI MARKET MOOD ────────────────────────────────────────
@app.get("/api/mood")
async def get_mood():
    path = f"{CACHE_DIR}/mood.json"
    if cache_valid(path, 120): return read_cache(path)
    # Use DeepSeek if available, fall back to Anthropic
    ai_key = DEEPSEEK_KEY or ANTHROPIC_KEY
    if not ai_key:
        return {"sentiment":"Mixed","analysis":"AI analysis requires DeepSeek or Anthropic API key.","generated_at":datetime.now().isoformat()}
    try:
        watchlist = await get_watchlist()
        news      = await get_news()
        crypto_s    = ", ".join([f"{c['symbol']} {'+' if c['change_24h']>0 else ''}{c['change_24h']}%" for c in watchlist.get("crypto",[])])
        stocks_s    = ", ".join([f"{s['symbol']} {'+' if s['change_24h']>0 else ''}{s['change_24h']}%" for s in watchlist.get("stocks",[])])
        commodity_s = ", ".join([f"{c['name']} {'+' if c['change_24h']>0 else ''}{c['change_24h']}%" for c in watchlist.get("commodities",[])])
        headlines   = " | ".join([a["title"] for a in news[:5]])
        prompt = f"""You are a professional market analyst. Analyze:
Crypto (24h): {crypto_s}
Stocks (24h): {stocks_s}
Commodities (24h): {commodity_s}
Headlines: {headlines}

Respond:
Line 1: One word only — Bullish, Bearish, Neutral, or Mixed
Lines 2-4: 2-3 sentences of specific professional analysis."""
        async with httpx.AsyncClient(timeout=30) as client:
            if DEEPSEEK_KEY:
                r = await client.post("https://api.deepseek.com/chat/completions",
                    headers={"Authorization":f"Bearer {DEEPSEEK_KEY}","Content-Type":"application/json"},
                    json={"model":"deepseek-chat","max_tokens":250,"temperature":0.3,
                          "messages":[{"role":"system","content":"You are a professional market analyst. Be concise and data-driven."},
                                      {"role":"user","content":prompt}]})
                text = r.json()["choices"][0]["message"]["content"].strip()
            else:
                r = await client.post("https://api.anthropic.com/v1/messages",
                    headers={"x-api-key":ANTHROPIC_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},
                    json={"model":"claude-haiku-4-5-20251001","max_tokens":250,"messages":[{"role":"user","content":prompt}]})
                text  = r.json()["content"][0]["text"].strip()
            lines = [l for l in text.split("\n") if l.strip()]
            sentiment = "Mixed"
            for w in ["Bullish","Bearish","Neutral","Mixed"]:
                if w.lower() in lines[0].lower(): sentiment = w; break
            analysis = " ".join(lines[1:]).strip() or text
        result = {"sentiment":sentiment,"analysis":analysis,"generated_at":datetime.now().isoformat()}
        write_cache(path, result)
        return result
    except Exception as e:
        return {"sentiment":"Mixed","analysis":f"AI analysis error: {e}","generated_at":datetime.now().isoformat()}

# ── MARKET ANALYSIS ──────────────────────────────────────
@app.get("/api/analysis")
async def get_analysis():
    """Algorithmic market analysis — works without AI key"""
    path = f"{CACHE_DIR}/analysis.json"
    if cache_valid(path, 30): return read_cache(path)

    try:
        watchlist = await get_watchlist()
        fear_greed_data = {"value": 50, "label": "Neutral"}
        try:
            fg = await get_fear_greed()
            fear_greed_data = {"value": int(fg["current"].get("value",50)), "label": fg["current"].get("value_classification","Neutral")}
        except: pass

        crypto = watchlist.get("crypto", [])
        stocks = watchlist.get("stocks", [])
        commodities = watchlist.get("commodities", [])
        all_assets = crypto + stocks + commodities

        # ── Algorithmic analysis ─────────────────────────────
        gainers = [a for a in all_assets if a["change_24h"] > 0]
        losers  = [a for a in all_assets if a["change_24h"] < 0]
        top_gainer = max(all_assets, key=lambda x: x["change_24h"], default=None)
        top_loser  = min(all_assets, key=lambda x: x["change_24h"], default=None)
        btc = next((c for c in crypto if c["symbol"]=="BTC"), None)
        eth = next((c for c in crypto if c["symbol"]=="ETH"), None)
        gold = next((c for c in commodities if "Gold" in c["name"]), None)
        oil  = next((c for c in commodities if "Crude" in c["name"]), None)
        nvda = next((s for s in stocks if s["symbol"]=="NVDA"), None)

        # Determine overall market mood algorithmically
        avg_crypto_change = sum(c["change_24h"] for c in crypto) / len(crypto) if crypto else 0
        avg_stock_change  = sum(s["change_24h"] for s in stocks) / len(stocks) if stocks else 0
        fg_val = fear_greed_data["value"]

        # Score: positive = bullish signal
        score = 0
        score += 2 if avg_crypto_change > 1 else (1 if avg_crypto_change > 0 else (-1 if avg_crypto_change < -1 else 0))
        score += 2 if avg_stock_change > 0.5 else (1 if avg_stock_change > 0 else (-1 if avg_stock_change < -0.5 else 0))
        score += 1 if fg_val > 60 else (-1 if fg_val < 40 else 0)
        score += 1 if btc and btc["change_24h"] > 0 else (-1 if btc and btc["change_24h"] < -2 else 0)

        if score >= 4:    overall = "BULLISH"
        elif score >= 1:  overall = "MILDLY BULLISH"
        elif score == 0:  overall = "NEUTRAL"
        elif score >= -2: overall = "MILDLY BEARISH"
        else:             overall = "BEARISH"

        # Key insights
        insights = []

        if btc and abs(btc["change_24h"]) > 2:
            direction = "surging" if btc["change_24h"] > 0 else "declining"
            insights.append(f"Bitcoin is {direction} {abs(btc['change_24h']):.1f}% — expect correlated crypto moves")

        if gold and gold["change_24h"] > 1:
            insights.append(f"Gold rising {gold['change_24h']:.1f}% signals safe-haven demand — watch for risk-off rotation")
        elif gold and gold["change_24h"] < -1:
            insights.append(f"Gold down {abs(gold['change_24h']):.1f}% suggests risk appetite improving")

        if oil and abs(oil["change_24h"]) > 2:
            direction = "rising" if oil["change_24h"] > 0 else "falling"
            insights.append(f"Crude oil {direction} {abs(oil['change_24h']):.1f}% — inflation and geopolitical risk factor")

        if nvda and nvda["change_24h"] > 2:
            insights.append(f"NVDA up {nvda['change_24h']:.1f}% — AI sector momentum positive, risk assets favored")

        if fg_val < 30:
            insights.append(f"Fear & Greed at {fg_val} (Extreme Fear) — historically a buying opportunity")
        elif fg_val > 75:
            insights.append(f"Fear & Greed at {fg_val} (Extreme Greed) — market may be overextended, caution warranted")

        if len(gainers) > len(losers) * 2:
            insights.append(f"Broad market rally: {len(gainers)}/{len(all_assets)} assets gaining — strong risk-on sentiment")
        elif len(losers) > len(gainers) * 2:
            insights.append(f"Broad selloff: {len(losers)}/{len(all_assets)} assets declining — risk-off environment")

        # Cross-asset correlation signal
        if btc and gold:
            if btc["change_24h"] > 1 and gold["change_24h"] > 1:
                insights.append("BTC and Gold both rising — dual safe-haven + risk-on signal, unusual divergence")
            elif btc["change_24h"] < -1 and gold["change_24h"] > 1:
                insights.append("BTC falling while Gold rises — classic risk-off rotation, watch USD strength")

        # Price alerts
        alerts = []
        if btc and btc["price"] > 70000:
            alerts.append(f"BTC above $70K — key psychological resistance level")
        if btc and btc["price"] < 50000:
            alerts.append(f"BTC below $50K — watch for support at this level")

        result = {
            "overall": overall,
            "score": score,
            "fear_greed": fear_greed_data,
            "insights": insights[:5],
            "alerts": alerts[:3],
            "top_gainer": {"symbol": top_gainer["symbol"], "change": top_gainer["change_24h"]} if top_gainer else None,
            "top_loser":  {"symbol": top_loser["symbol"],  "change": top_loser["change_24h"]}  if top_loser  else None,
            "avg_crypto_change": round(avg_crypto_change, 2),
            "avg_stock_change":  round(avg_stock_change, 2),
            "gainers": len(gainers),
            "losers":  len(losers),
            "generated_at": datetime.now().isoformat(),
        }

        # DeepSeek AI analysis (primary) — fallback to Anthropic
        ai_key_used = None
        if DEEPSEEK_KEY:
            ai_key_used = "deepseek"
        elif ANTHROPIC_KEY:
            ai_key_used = "anthropic"

        if ai_key_used:
            try:
                summary_prompt = f"""You are a Bloomberg terminal senior market analyst. Give a sharp, data-driven market summary.

LIVE DATA:
- Overall signal: {overall} (score: {score}/6)
- Crypto avg 24h: {avg_crypto_change:+.2f}%
- Stocks avg 24h: {avg_stock_change:+.2f}%
- Fear & Greed: {fg_val}/100 ({fear_greed_data['label']})
- Top gainer: {top_gainer['symbol'] if top_gainer else 'N/A'} ({top_gainer['change_24h'] if top_gainer else 0:+.1f}%)
- Top loser: {top_loser['symbol'] if top_loser else 'N/A'} ({top_loser['change_24h'] if top_loser else 0:+.1f}%)
- BTC: {btc['price'] if btc else 'N/A'} ({btc['change_24h'] if btc else 0:+.1f}%)
- Key insight: {insights[0] if insights else 'Markets mixed'}

Write exactly 3 sentences:
1. Overall market direction with specific numbers
2. Key driver or risk factor
3. One actionable observation for traders

Be direct, professional, use real numbers. No fluff."""

                if ai_key_used == "deepseek":
                    async with httpx.AsyncClient(timeout=20) as client:
                        r = await client.post(
                            "https://api.deepseek.com/chat/completions",
                            headers={"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"},
                            json={
                                "model": "deepseek-chat",
                                "messages": [
                                    {"role": "system", "content": "You are a professional Bloomberg terminal market analyst. Be concise, precise, data-driven."},
                                    {"role": "user", "content": summary_prompt}
                                ],
                                "max_tokens": 200,
                                "temperature": 0.3,
                            })
                        resp = r.json()
                        ai_text = resp["choices"][0]["message"]["content"].strip()
                        result["ai_summary"] = ai_text
                        result["ai_provider"] = "DeepSeek"
                else:
                    async with httpx.AsyncClient(timeout=15) as client:
                        r = await client.post("https://api.anthropic.com/v1/messages",
                            headers={"x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                            json={"model": "claude-haiku-4-5-20251001", "max_tokens": 200,
                                  "messages": [{"role": "user", "content": summary_prompt}]})
                        ai_text = r.json()["content"][0]["text"].strip()
                        result["ai_summary"] = ai_text
                        result["ai_provider"] = "Claude"
            except Exception as e:
                print(f"AI analysis error: {e}")

        write_cache(path, result)
        return result

    except Exception as e:
        return {"overall":"N/A","score":0,"insights":[f"Analysis error: {str(e)}"],"generated_at":datetime.now().isoformat()}


# ── LIVE TV STREAM PROXY ─────────────────────────────────
# Browsers can't fetch HLS streams directly (CORS + Referer blocks).
# This proxy fetches M3U8 manifests and TS segments server-side,
# then rewrites URLs so the browser can fetch subsequent segments
# through this same proxy.

from fastapi import Request as FastAPIRequest
from fastapi.responses import Response as FastAPIResponse, StreamingResponse
import httpx

# Map channel ID -> stream URL + required referer
LIVE_STREAMS = {
    "aljazeera": {
        "url": "https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8",
        "referer": "https://www.aljazeera.com/",
        "name": "Al Jazeera English"
    },
    "france24": {
        "url": "https://live.france24.com/hls/live/2037218-b/F24_EN_HI_HLS/master_5000.m3u8",
        "referer": "https://www.france24.com/",
        "name": "France 24 English"
    },
    "alarabiya": {
        "url": "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8",
        "referer": "https://www.alarabiya.net/",
        "name": "Al Arabiya"
    },
}

PROXY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}

import base64
import urllib.parse
import re

@app.get("/api/stream/{channel_id}/playlist.m3u8")
async def stream_playlist(channel_id: str, request: Request):
    """Proxy the M3U8 playlist for a live channel — rewrites segment and nested track URLs"""
    if channel_id not in LIVE_STREAMS:
        raise HTTPException(404, f"Channel {channel_id} not found")
    
    ch = LIVE_STREAMS[channel_id]
    headers = {**PROXY_HEADERS, "Referer": ch["referer"], "Origin": ch["referer"].rstrip("/")}
    
    try:
        async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=True) as client:
            r = await client.get(ch["url"], headers=headers)
            if r.status_code != 200:
                raise HTTPException(r.status_code, "Stream unavailable")
            
            content = r.text
            current_url = str(r.url) # Resolves any upstream redirects cleanly
            
            lines = content.split("\n")
            rewritten = []
            
            # Regex to find URI="xyz" inside metadata tags (e.g., #EXT-X-MEDIA)
            uri_regex = re.compile(r'(URI=["\'])([^"\']+)((["\']))')

            for line in lines:
                line_str = line.strip()
                if not line_str:
                    continue

                # Case A: Embedded URI target found inside structural HLS metadata
                if line_str.startswith("#") and 'URI=' in line_str:
                    def replace_uri(match):
                        prefix, rel_url, suffix = match.group(1), match.group(2), match.group(3)
                        abs_url = urllib.parse.urljoin(current_url, rel_url)
                        encoded = base64.urlsafe_b64encode(abs_url.encode()).decode()
                        return f'{prefix}/api/stream/{channel_id}/segment?url={encoded}{suffix}'
                    
                    rewritten.append(uri_regex.sub(replace_uri, line_str))

                # Case B: Standard exposed segment or sub-playlist file path
                elif not line_str.startswith("#"):
                    abs_url = urllib.parse.urljoin(current_url, line_str)
                    encoded = base64.urlsafe_b64encode(abs_url.encode()).decode()
                    rewritten.append(f"/api/stream/{channel_id}/segment?url={encoded}")
                
                # Case C: Standard descriptive comments
                else:
                    rewritten.append(line_str)
            
            return Response(
                content="\n".join(rewritten),
                media_type="application/vnd.apple.mpegurl",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache",
                }
            )
    except httpx.RequestError as e:
        raise HTTPException(503, f"Stream connection error: {e}")

@app.get("/api/stream/{channel_id}/segment")
async def stream_segment(channel_id: str, url: str):
    """Proxy individual HLS segments/sub-playlists"""
    try:
        actual_url = base64.urlsafe_b64decode(url.encode()).decode()
    except Exception:
        raise HTTPException(400, "Invalid URL encoding")
    
    if channel_id not in LIVE_STREAMS:
        raise HTTPException(404, "Channel not found")
    
    ch = LIVE_STREAMS[channel_id]
    headers = {**PROXY_HEADERS, "Referer": ch["referer"], "Origin": ch["referer"].rstrip("/")}
    
    try:
        async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as client:
            r = await client.get(actual_url, headers=headers)
            
            ct = r.headers.get("content-type", "")
            # If the proxied segment is an underlying adaptive variant manifest, rewrite it too
            if "mpegurl" in ct or actual_url.endswith(".m3u8"):
                content = r.text
                current_url = str(r.url)
                lines = content.split("\n")
                rewritten = []
                uri_regex = re.compile(r'(URI=["\'])([^"\']+)((["\']))')

                for line in lines:
                    line_str = line.strip()
                    if not line_str:
                        continue
                    
                    if line_str.startswith("#") and 'URI=' in line_str:
                        def replace_uri(match):
                            prefix, rel_url, suffix = match.group(1), match.group(2), match.group(3)
                            abs_url = urllib.parse.urljoin(current_url, rel_url)
                            enc = base64.urlsafe_b64encode(abs_url.encode()).decode()
                            return f'{prefix}/api/stream/{channel_id}/segment?url={enc}{suffix}'
                        rewritten.append(uri_regex.sub(replace_uri, line_str))
                        
                    elif not line_str.startswith("#"):
                        abs_url = urllib.parse.urljoin(current_url, line_str)
                        enc = base64.urlsafe_b64encode(abs_url.encode()).decode()
                        rewritten.append(f"/api/stream/{channel_id}/segment?url={enc}")
                    else:
                        rewritten.append(line_str)
                        
                return Response(
                    content="\n".join(rewritten),
                    media_type="application/vnd.apple.mpegurl",
                    headers={"Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache"}
                )
            
            return Response(
                content=r.content,
                media_type=ct or "video/MP2T",
                headers={"Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache, max-age=0"}
            )
    except Exception as e:
        raise HTTPException(503, f"Segment error: {e}")

            


@app.get("/api/stream/{channel_id}/status")
async def stream_status(channel_id: str):
    """Check if a channel stream is reachable."""
    ch = LIVE_STREAMS.get(channel_id)
    if not ch:
        return {"ok": False, "error": "Unknown channel"}
    headers = {**PROXY_HEADERS, "Referer": ch["referer"], "Origin": ch["referer"].rstrip("/")}
    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
            r = await client.get(ch["url"], headers=headers)
            return {"ok": r.status_code == 200, "status": r.status_code, "name": ch["name"]}
    except Exception as e:
        return {"ok": False, "error": str(e), "name": ch["name"]}

@app.get("/api/streams")
async def list_streams():
    """List all available channels."""
    return [{"id": k, "name": v["name"]} for k, v in LIVE_STREAMS.items()]


# ── LIVE TV STREAM PROXY ──────────────────────────────────────────
# HLS streams need a server-side proxy because:
# 1. Many streams block direct browser fetch (CORS)  
# 2. Some require specific Referer headers
# We proxy both the playlist (.m3u8) AND the segments (.ts) to avoid CORS

from fastapi.responses import StreamingResponse, Response
import httpx

# Verified working streams with their required referer headers
LIVE_STREAMS = {
    "bloomberg":  {"url": "https://66e4bbba.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/TEctZ2JfQmxvb21iZXJnVFZQbHVzX0hMUw/playlist.m3u8", "referer": "https://www.wurl.com/", "name": "Bloomberg TV"},
    "aljazeera":  {"url": "https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8",  "referer": "https://www.aljazeera.com/", "name": "Al Jazeera English"},
    "alarabiya":  {"url": "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8", "referer": "https://www.alarabiya.net/", "name": "Al Arabiya"},
    "france24":   {"url": "https://live.france24.com/hls/live/2037218-b/F24_EN_HI_HLS/master_5000.m3u8", "referer": "https://www.france24.com/", "name": "France 24"},
    "cnbc":       {"url": "https://cnbc-live.akamaized.net/cnbc/master.m3u8", "referer": "https://www.cnbc.com/", "name": "CNBC"},
}

PROXY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}

@app.get("/api/stream/{channel_id}/playlist.m3u8")
async def stream_playlist(channel_id: str, request: Request):
    """Proxy the M3U8 playlist for a live channel — rewrites segment URLs to go through our proxy"""
    if channel_id not in LIVE_STREAMS:
        raise HTTPException(404, f"Channel {channel_id} not found")
    
    ch = LIVE_STREAMS[channel_id]
    headers = {**PROXY_HEADERS, "Referer": ch["referer"], "Origin": ch["referer"].rstrip("/")}
    
    try:
        async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=True) as client:
            r = await client.get(ch["url"], headers=headers)
            if r.status_code != 200:
                raise HTTPException(r.status_code, "Stream unavailable")
            
            content = r.text
            base_url = ch["url"].rsplit("/", 1)[0] + "/"
            
            # Rewrite relative URLs in the M3U8 to point through our proxy
            lines = content.split("\n")
            rewritten = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith("#"):
                    # This is a segment or sub-playlist URL
                    if line.startswith("http"):
                        # Absolute URL — proxy it
                        import base64
                        encoded = base64.urlsafe_b64encode(line.encode()).decode()
                        rewritten.append(f"/api/stream/{channel_id}/segment?url={encoded}")
                    else:
                        # Relative URL — make absolute then proxy
                        abs_url = base_url + line
                        import base64
                        encoded = base64.urlsafe_b64encode(abs_url.encode()).decode()
                        rewritten.append(f"/api/stream/{channel_id}/segment?url={encoded}")
                else:
                    rewritten.append(line)
            
            return Response(
                content="\n".join(rewritten),
                media_type="application/vnd.apple.mpegurl",
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache",
                }
            )
    except httpx.RequestError as e:
        raise HTTPException(503, f"Stream connection error: {e}")

@app.get("/api/stream/{channel_id}/segment")
async def stream_segment(channel_id: str, url: str):
    """Proxy individual HLS segments/sub-playlists"""
    import base64
    try:
        actual_url = base64.urlsafe_b64decode(url.encode()).decode()
    except Exception:
        raise HTTPException(400, "Invalid URL encoding")
    
    if channel_id not in LIVE_STREAMS:
        raise HTTPException(404, "Channel not found")
    
    ch = LIVE_STREAMS[channel_id]
    headers = {**PROXY_HEADERS, "Referer": ch["referer"], "Origin": ch["referer"].rstrip("/")}
    
    try:
        async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as client:
            r = await client.get(actual_url, headers=headers)
            
            # If it's a sub-playlist (m3u8), rewrite its URLs too
            ct = r.headers.get("content-type", "")
            if "mpegurl" in ct or actual_url.endswith(".m3u8"):
                content = r.text
                base = actual_url.rsplit("/", 1)[0] + "/"
                lines = content.split("\n")
                rewritten = []
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        abs_url = line if line.startswith("http") else base + line
                        import base64 as b64
                        enc = b64.urlsafe_b64encode(abs_url.encode()).decode()
                        rewritten.append(f"/api/stream/{channel_id}/segment?url={enc}")
                    else:
                        rewritten.append(line)
                return Response(
                    content="\n".join(rewritten),
                    media_type="application/vnd.apple.mpegurl",
                    headers={"Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache"}
                )
            
            return Response(
                content=r.content,
                media_type=ct or "video/MP2T",
                headers={"Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache, max-age=0"}
            )
    except Exception as e:
        raise HTTPException(503, f"Segment error: {e}")

@app.get("/api/stream/channels")
async def get_stream_channels():
    """Return list of available channels"""
    return [{"id": k, "name": k.replace("_"," ").title(), "playlist": f"/api/stream/{k}/playlist.m3u8"} 
            for k in LIVE_STREAMS.keys()]

@app.get("/api/clear-cache")
async def clear_cache():
    import glob
    files = glob.glob(f"{CACHE_DIR}/*.json")
    for f in files:
        try: os.remove(f)
        except: pass
    return {"cleared": len(files)}

@app.get("/health")
async def health():
    return {"status":"ok","time":datetime.now().isoformat()}

# ── PRICE ALERTS + TELEGRAM (free) ───────────────────────
async def send_telegram(chat_id: str, text: str) -> tuple[bool, str]:
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        return False, "TELEGRAM_BOT_TOKEN or chat_id missing"
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            r = await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            )
            data = r.json() if r.content else {}
            if r.status_code == 200 and data.get("ok"):
                return True, ""
            err = data.get("description") or f"HTTP {r.status_code}"
            print(f"Telegram error: {err}")
            return False, err
    except Exception as e:
        print(f"Telegram error: {e}")
        return False, str(e)

class AlertSyncBody(BaseModel):
    alerts: list = []
    telegram_chat_id: str = ""

class TelegramBody(BaseModel):
    chat_id: str
    message: str = ""

@app.post("/api/alerts/sync")
async def sync_alerts(body: AlertSyncBody):
    data = {
        "alerts": body.alerts,
        "telegram_chat_id": body.telegram_chat_id,
        "updated_at": datetime.now().isoformat(),
    }
    write_cache(ALERTS_SYNC_FILE, data)
    return {"ok": True, "count": len(body.alerts)}

@app.get("/api/telegram/status")
async def telegram_status():
    bot = None
    if TELEGRAM_BOT_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                r = await client.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe")
                data = r.json()
                if data.get("ok"):
                    bot = data.get("result", {}).get("username")
        except Exception:
            pass
    return {"configured": bool(TELEGRAM_BOT_TOKEN), "bot_username": bot}

@app.post("/api/telegram/notify")
async def telegram_notify(body: TelegramBody):
    if not body.chat_id:
        raise HTTPException(400, "chat_id required")
    ok, err = await send_telegram(body.chat_id, body.message or "MarketPulse alert")
    if not ok:
        raise HTTPException(400, err or "Telegram send failed — set TELEGRAM_BOT_TOKEN and verify chat ID")
    return {"ok": True}

@app.post("/api/telegram/test")
async def telegram_test(body: TelegramBody):
    if not body.chat_id:
        raise HTTPException(400, "chat_id required")
    ok, err = await send_telegram(body.chat_id, "✅ <b>MarketPulse</b> alerts connected!")
    return {"ok": ok, "configured": bool(TELEGRAM_BOT_TOKEN), "error": err or None}

async def _alert_monitor_loop():
    """Server-side monitor — Telegram alerts when browser is closed."""
    await asyncio.sleep(10)
    while True:
        try:
            if not os.path.exists(ALERTS_SYNC_FILE):
                await asyncio.sleep(60)
                continue
            data = read_cache(ALERTS_SYNC_FILE)
            chat_id = (data.get("telegram_chat_id") or "").strip()
            alerts  = data.get("alerts") or []
            if not chat_id or not alerts:
                await asyncio.sleep(60)
                continue
            wl = await get_watchlist()
            prices = {}
            for cat in ("crypto", "stocks", "commodities"):
                for a in wl.get(cat, []):
                    prices[a["symbol"].upper()] = a["price"]
            remaining = []
            for alert in alerts:
                sym = (alert.get("sym") or "").upper()
                price = alert.get("price")
                direction = alert.get("dir", "above")
                current = prices.get(sym)
                if current is None or price is None:
                    remaining.append(alert)
                    continue
                hit = current >= price if direction == "above" else current <= price
                if hit:
                    await send_telegram(
                        chat_id,
                        f"🔔 <b>{sym}</b> went {direction} <b>${price:,.2f}</b>\n"
                        f"Current: <b>${current:,.2f}</b>",
                    )
                else:
                    remaining.append(alert)
            if len(remaining) != len(alerts):
                data["alerts"] = remaining
                data["updated_at"] = datetime.now().isoformat()
                write_cache(ALERTS_SYNC_FILE, data)
        except Exception as e:
            print(f"Alert monitor: {e}")
        await asyncio.sleep(60)

@app.on_event("startup")
async def _start_alert_monitor():
    asyncio.create_task(_alert_monitor_loop())
    asyncio.create_task(_calendar_alert_loop())

# ── USER ACCOUNTS + CLOUD SYNC ───────────────────────────
def _hash_pw(password: str, salt: str = None) -> str:
    salt = salt or secrets.token_hex(16)
    return f"{salt}${hashlib.sha256(f'{salt}:{password}'.encode()).hexdigest()}"

def _verify_pw(password: str, stored: str) -> bool:
    salt, digest = stored.split("$", 1)
    return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest() == digest

def _load_users():
    return read_cache(USERS_FILE) if os.path.exists(USERS_FILE) else {}

def _save_users(users):
    write_cache(USERS_FILE, users)

DEFAULT_USER_DATA = {
    "favorites": {},
    "portfolio": [],
    "notes": [],
    "alerts": [],
    "alert_settings": {},
    "theme": "dark",
    "calendar_alerts": {
        "enabled": False,
        "keywords": ["FOMC", "CPI", "NFP", "Fed", "ECB"],
        "minutes_before": 60,
    },
}

def _user_from_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    for email, u in _load_users().items():
        if u.get("token") == token:
            return {"email": email, **u}
    return None

def _require_user(authorization: str = Header(None)):
    user = _user_from_token(authorization)
    if not user:
        raise HTTPException(401, "Login required")
    return user

class AuthBody(BaseModel):
    email: str
    password: str

class GoogleAuthBody(BaseModel):
    token: str

@app.get("/api/auth/google/config")
async def google_auth_config():
    return {"client_id": GOOGLE_CLIENT_ID}

@app.post("/api/auth/google")
async def auth_google(body: GoogleAuthBody):
    if not body.token:
        raise HTTPException(400, "Google ID token required")
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(503, "Google Sign-In not configured on server")
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(
            body.token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(401, f"Invalid Google token: {e}")
    except Exception as e:
        raise HTTPException(401, f"Google token verification failed: {e}")

    email = (idinfo.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(400, "Google account has no email")
    if not idinfo.get("email_verified"):
        raise HTTPException(400, "Google email not verified")

    google_id = idinfo.get("sub", "")
    name = idinfo.get("name") or email.split("@")[0]
    picture = idinfo.get("picture") or ""

    users = _load_users()
    u = users.get(email, {})
    session_token = secrets.token_hex(32)
    u.update({
        "token": session_token,
        "google_id": google_id,
        "name": name,
        "picture": picture,
        "auth_provider": "google",
        "updated_at": datetime.now().isoformat(),
    })
    if "password" not in u:
        u["created_at"] = u.get("created_at") or datetime.now().isoformat()
    users[email] = u
    _save_users(users)

    data_path = f"{USER_DATA_DIR}/{email}.json"
    if not os.path.exists(data_path):
        write_cache(data_path, {**DEFAULT_USER_DATA, "updated_at": datetime.now().isoformat()})

    return {
        "token": session_token,
        "email": email,
        "name": name,
        "picture": picture,
        "google_id": google_id,
    }

@app.post("/api/auth/register")
async def auth_register(body: AuthBody):
    email = body.email.strip().lower()
    if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
        raise HTTPException(400, "Invalid email")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    users = _load_users()
    if email in users:
        raise HTTPException(400, "Email already registered")
    token = secrets.token_hex(32)
    users[email] = {"password": _hash_pw(body.password), "token": token, "created_at": datetime.now().isoformat()}
    _save_users(users)
    write_cache(f"{USER_DATA_DIR}/{email}.json", {**DEFAULT_USER_DATA, "updated_at": datetime.now().isoformat()})
    return {"token": token, "email": email}

@app.post("/api/auth/login")
async def auth_login(body: AuthBody):
    email = body.email.strip().lower()
    users = _load_users()
    u = users.get(email)
    if not u or not _verify_pw(body.password, u["password"]):
        raise HTTPException(401, "Invalid email or password")
    token = secrets.token_hex(32)
    u["token"] = token
    users[email] = u
    _save_users(users)
    return {"token": token, "email": email}

@app.get("/api/auth/me")
async def auth_me(user=Depends(_require_user)):
    return {
        "email": user["email"],
        "name": user.get("name"),
        "picture": user.get("picture"),
        "google_id": user.get("google_id"),
        "auth_provider": user.get("auth_provider"),
    }

@app.get("/api/user/data")
async def get_user_data(user=Depends(_require_user)):
    path = f"{USER_DATA_DIR}/{user['email']}.json"
    if not os.path.exists(path):
        write_cache(path, {**DEFAULT_USER_DATA, "updated_at": datetime.now().isoformat()})
    return read_cache(path)

@app.put("/api/user/data")
async def put_user_data(body: dict, user=Depends(_require_user)):
    path = f"{USER_DATA_DIR}/{user['email']}.json"
    data = read_cache(path) if os.path.exists(path) else DEFAULT_USER_DATA.copy()
    for key in DEFAULT_USER_DATA:
        if key in body:
            data[key] = body[key]
    data["updated_at"] = datetime.now().isoformat()
    write_cache(path, data)
    alerts = data.get("alerts") or []
    chat_id = (data.get("alert_settings") or {}).get("telegramChatId", "")
    if alerts or chat_id:
        write_cache(ALERTS_SYNC_FILE, {
            "alerts": alerts,
            "telegram_chat_id": chat_id,
            "user_email": user["email"],
            "updated_at": datetime.now().isoformat(),
        })
    return {"ok": True}

CALENDAR_ALERT_KEYWORDS = ("FOMC", "CPI", "NFP", "FED", "ECB", "NON-FARM", "PAYROLL", "GDP")

async def _calendar_alert_loop():
    """Notify users ~1h before major macro events (Telegram)."""
    await asyncio.sleep(20)
    while True:
        try:
            sent = read_cache(CALENDAR_ALERTS_SENT) if os.path.exists(CALENDAR_ALERTS_SENT) else {}
            now = datetime.now()
            from_d = now.strftime("%Y-%m-%d")
            to_d = (now + timedelta(days=2)).strftime("%Y-%m-%d")
            events = await get_calendar(from_d, to_d)
            for fname in os.listdir(USER_DATA_DIR):
                if not fname.endswith(".json"):
                    continue
                udata = read_cache(f"{USER_DATA_DIR}/{fname}")
                cal = udata.get("calendar_alerts") or {}
                if not cal.get("enabled"):
                    continue
                keywords = tuple(k.upper() for k in (cal.get("keywords") or CALENDAR_ALERT_KEYWORDS))
                minutes_before = int(cal.get("minutes_before") or 60)
                chat_id = (udata.get("alert_settings") or {}).get("telegramChatId", "")
                email = fname[:-5]
                for e in events:
                    name = (e.get("event") or "").upper()
                    if not any(k in name for k in keywords):
                        continue
                    ds = (e.get("date") or "")[:10]
                    if not ds:
                        continue
                    event_dt = datetime.fromisoformat(f"{ds}T13:30:00")
                    mins_left = (event_dt - now).total_seconds() / 60
                    key = f"{email}:{ds}:{e.get('event', '')}"
                    if key in sent or mins_left <= 0 or mins_left > minutes_before:
                        continue
                    msg = (
                        f"📅 <b>{e.get('event')}</b> in ~{int(mins_left)} min\n"
                        f"Date: {ds} · {e.get('country') or 'Global'} · {e.get('importance', 'medium').upper()}"
                    )
                    if chat_id:
                        ok, _ = await send_telegram(chat_id, msg)
                        if ok:
                            sent[key] = now.isoformat()
            write_cache(CALENDAR_ALERTS_SENT, sent)
        except Exception as e:
            print(f"Calendar alerts: {e}")
        await asyncio.sleep(300)

@app.get("/health")
async def health():
    """Keep-alive endpoint — ping every 10 min via cron-job.org to prevent Render spin-down."""
    return {"status": "ok", "time": datetime.now().isoformat()}

# Static frontend (HTML, CSS, JS) — mount after API routes
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/assets", StaticFiles(directory=os.path.join(ROOT_DIR, "assets")), name="assets")
app.mount("/", StaticFiles(directory=ROOT_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)