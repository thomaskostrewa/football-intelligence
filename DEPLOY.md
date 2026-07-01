# Football Intelligence – Deployment Guide

## Voraussetzungen
- Node.js 18+ 
- npm oder pnpm
- Vercel Account
- Anthropic API Key (optional, für Reasoning-Texte)

## Lokale Entwicklung

```bash
# 1. Dependencies installieren
npm install

# 2. Env-Datei anlegen
cp .env.example .env.local
# → Anthropic API Key eintragen: ANTHROPIC_API_KEY=sk-ant-...

# 3. Dev-Server starten
npm run dev
# → http://localhost:3000 → automatisch zum ersten aufgeloesten Match
```

## Delivery Workflow

Vor jedem Review- oder Production-Release gilt der verbindliche Ablauf in [`WORKFLOW.md`](./WORKFLOW.md).
Kurzfassung:

- Preview erst als `Review` markieren, wenn Vercel `READY` ist und der Preview-Link geprueft wurde.
- Production erst als `Done` markieren, wenn `main` deployt, Vercel `READY` ist und die Production-URL geprueft wurde.
- Fallback-, Seed- oder Mock-Daten duerfen nie als echte Live-Daten kommuniziert werden.
- Fuer Daten-Stories muss `/api/matches` die Source-Metadaten sichtbar ausgeben.

## Deploy auf Vercel

### Option A – Vercel CLI (empfohlen)
```bash
npm install -g vercel
vercel --prod
```

### Option B – GitHub + Vercel Dashboard
1. Repo auf GitHub pushen
2. vercel.com → "Add New Project" → Repo auswählen
3. Framework: **Next.js** (automatisch erkannt)
4. Environment Variables hinzufügen:
   - `ANTHROPIC_API_KEY` → dein Key
   - `SPORTMONKS_API_TOKEN` → erforderlich fuer echte Fixture-Daten
   - `SPORTMONKS_WORLD_CUP_SEASON_ID` → erforderlich fuer echte WM-Fixtures
5. Deploy klicken

### Option C – Subdomain verbinden
Im Vercel Dashboard → Project → Domains → `football.thomas-kostrewa.de` hinzufügen.
DNS: CNAME `football` → `cname.vercel-dns.com`

## Spieldaten aktualisieren
- Primaere Quelle: SportMonks Fixture Provider ueber `lib/fixtures/provider.ts`
- Fallback fuer Review ohne Provider-Credentials: `data/remaining-matches.json`
- Teamdaten fuer Prediction-Kontext: `data/teams.json`
- Nach Update: Git-Push auf Branch fuer Preview oder Merge nach `main` fuer Production
- Wichtig: `source=seed-fallback` bedeutet nicht echte Live-Daten.

## Struktur
```
football-intelligence/
├── data/          ← Fallback-Fixtures + Teamdaten
├── lib/           ← Provider, Prediction Engine, News, Reasoning, i18n
├── app/
│   ├── [lang]/match/[id]/page.tsx  ← Hauptseite
│   └── api/                         ← REST Endpoints
└── components/    ← Alle 9 UI-Komponenten
```

## Ohne API Key
Ohne `ANTHROPIC_API_KEY` greift ein deterministischer Fallback-Text für das Reasoning-Panel.
Ohne `SPORTMONKS_API_TOKEN` und `SPORTMONKS_WORLD_CUP_SEASON_ID` greift die Fixture-Liste sichtbar auf `seed-fallback`.
