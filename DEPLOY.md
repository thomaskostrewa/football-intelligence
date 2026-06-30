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
# → http://localhost:3000 → automatisch zu /de/match/ger-mex
```

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
5. Deploy klicken

### Option C – Subdomain verbinden
Im Vercel Dashboard → Project → Domains → `football.thomas-kostrewa.de` hinzufügen.
DNS: CNAME `football` → `cname.vercel-dns.com`

## Spieldaten aktualisieren
- Neue Matches: `data/matches.json` ergänzen
- Teamdaten (xG, Form) nach jedem Spieltag: `data/teams.json` aktualisieren
- Nach Update: `vercel --prod` oder Git-Push (Auto-Deploy)

## Struktur
```
football-intelligence/
├── data/          ← Spielplan + Teamdaten (manuell pflegen)
├── lib/           ← Prediction Engine, News, Reasoning, i18n
├── app/
│   ├── [lang]/match/[id]/page.tsx  ← Hauptseite
│   └── api/                         ← REST Endpoints
└── components/    ← Alle 9 UI-Komponenten
```

## Ohne API Key
Ohne `ANTHROPIC_API_KEY` greift ein deterministischer Fallback-Text für das Reasoning-Panel.
Alle anderen Features (Heatmap, Prediction, News) funktionieren vollständig ohne Key.
