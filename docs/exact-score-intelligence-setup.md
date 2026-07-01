# Exact Score Intelligence Setup

## 1. API-Football

1. Create an API-Sports / API-Football account.
2. Choose the free plan if you only need MVP testing.
3. Copy the API key from the dashboard.
4. Add it locally in `.env.local`:

```bash
API_FOOTBALL_KEY=your_key_here
```

5. Add the same variable in Vercel:

```bash
API_FOOTBALL_KEY=your_key_here
```

Current MVP setup:

- Plan: API-Sports / API-Football Free
- Limit: 100 football requests per day
- Current 2026 access check: the Free plan can be active while still not allowing `season=2026`; in that case API-Football returns no fixtures and the app uses local fallback fixtures.
- Auth header used by the app: `x-apisports-key`
- Local variable: `API_FOOTBALL_KEY`
- Vercel variable: `API_FOOTBALL_KEY`
- Status endpoint: `https://v3.football.api-sports.io/status`
- The status endpoint can be used to verify the key and does not count against the daily quota.
- Fixture endpoint used by the matcher: `https://v3.football.api-sports.io/fixtures?league=1&season=2026`

The concrete key is intentionally stored only in `.env.local` locally and in Vercel environment variables for deployment. It should not be committed to the repository.

The app keeps running without this key, but confidence is lower and the model uses Elo plus local fallback strength data.

The matcher keeps local app URLs such as `/de/match/eng-cod`, but enriches the match with the numeric API-Football `fixtureId` once the API returns a team/date match. Predictions and lineups are only requested for matches that have an API-Football fixture ID, so SportMonks or local IDs are never sent to API-Football by mistake.

## 2. The Odds API

1. Create a The Odds API account.
2. Copy the API key.
3. Add it locally and in Vercel:

```bash
THE_ODDS_API_KEY=your_key_here
```

Odds are optional. When available, they become the strongest short-term signal. When missing, the model automatically reweights toward API-Football, Elo, form, and fallback data.

Current MVP setup:

- Plan: The Odds API Free
- Limit: 500 credits per month
- Local variable: `THE_ODDS_API_KEY`
- Vercel variable: `THE_ODDS_API_KEY`
- Sport key used by the app: `soccer_fifa_world_cup`
- Markets requested: `h2h`, `totals`, `spreads`
- Regions requested: `eu`, `uk`, `us`
- Current check: `soccer_fifa_world_cup` is active and returns World Cup match odds.

For the first checked match, odds moved the engine to `hasOdds: true`, increased confidence to `Hoch`, and became the strongest lambda source.

## 3. Test Endpoint

Start the app and call:

```bash
/api/match-intelligence/eng-cod
```

Use this when you want to bypass the 15 minute model cache:

```bash
/api/match-intelligence/eng-cod?refresh=true
```

## 4. Verify Fallbacks

1. Run without `API_FOOTBALL_KEY`.
2. Run without `THE_ODDS_API_KEY`.
3. Confirm the match page still renders.
4. Confirm the source panel marks missing data honestly.
5. Confirm the confidence score drops when only fallback data is available.

No secrets should appear in browser payloads. External football and odds calls are only made from server-side code.

## 5. API Health Notices

The match intelligence response includes `sourceHealth` for every source:

- `active`: source delivered usable data
- `missing-key`: env var is not configured
- `no-data`: API works, but has no matching data for this match
- `limited`: quota, credits, or rate limit is reached
- `blocked`: plan/subscription does not allow the requested data
- `error`: request failed unexpectedly
- `fallback`: source was skipped because a prerequisite is missing

The Source Transparency Panel shows these states in small text next to each source. If any external API is `limited`, `blocked`, or `error`, the panel shows a compact warning and the model continues with available sources instead of failing the page.
