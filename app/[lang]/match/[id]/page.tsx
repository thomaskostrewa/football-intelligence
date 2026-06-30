import { notFound } from 'next/navigation'
import matchesData from '@/data/matches.json'
import teamsData from '@/data/teams.json'
import { computePrediction, computeFactors } from '@/lib/prediction'
import { generateReasoning } from '@/lib/reasoning'
import { fetchNews } from '@/lib/news'
import { isValidLang, DEFAULT_LANG } from '@/lib/i18n'
import Header from '@/components/Header'
import MatchNavigation from '@/components/MatchNavigation'
import MatchHeader from '@/components/MatchHeader'
import ContextCards from '@/components/ContextCards'
import PredictionHeatmap from '@/components/PredictionHeatmap'
import ExplainabilityPanel from '@/components/ExplainabilityPanel'
import NewsFeed from '@/components/NewsFeed'
import TopResults from '@/components/TopResults'
import ConclusionCard from '@/components/ConclusionCard'

type Params = { lang: string; id: string }

type MatchData = {
  id: string
  homeTeam: string
  awayTeam: string
  round: { de: string; en: string; pt: string }
  date: string
  venue: { de: string; en: string; pt: string }
  weather: { icon: string; temp: number; desc: { de: string; en: string; pt: string } }
  importance: { de: string; en: string; pt: string }
}

type TeamData = {
  id: string; code: string; flag: string
  name: { de: string; en: string; pt: string }
  xgAvg: number; goalsAgainstAvg: number; form: string[]
  newsKeywords: string[]
}

export async function generateStaticParams() {
  const langs = ['de', 'en', 'pt']
  const matches = matchesData as MatchData[]
  return langs.flatMap(lang => matches.map(m => ({ lang, id: m.id })))
}

export default async function MatchPage({ params }: { params: Params }) {
  const lang = isValidLang(params.lang) ? params.lang : DEFAULT_LANG
  const matches = matchesData as MatchData[]
  const teams = teamsData as Record<string, TeamData>

  const match = matches.find(m => m.id === params.id)
  if (!match) notFound()

  const homeTeam = teams[match.homeTeam]
  const awayTeam = teams[match.awayTeam]
  if (!homeTeam || !awayTeam) notFound()

  const prediction = computePrediction(homeTeam.xgAvg, awayTeam.xgAvg)
  const factors = computeFactors(homeTeam, awayTeam, prediction, match.weather)

  // Parallel fetch – reasoning + news
  const [reasoning, newsResult] = await Promise.allSettled([
    generateReasoning({
      homeTeam, awayTeam,
      prediction: prediction.mostLikelyResult,
      homeWinProb: prediction.homeWinProb,
      drawProb: prediction.drawProb,
      awayWinProb: prediction.awayWinProb,
      weather: match.weather,
      lang,
    }),
    fetchNews([...homeTeam.newsKeywords, ...awayTeam.newsKeywords, 'World Cup', 'WM 2026']),
  ])

  const reasoningText = reasoning.status === 'fulfilled' ? reasoning.value : ''
  const news = newsResult.status === 'fulfilled' ? newsResult.value : []

  return (
    <div className="min-h-screen bg-background">
      <Header lang={lang} matchId={params.id} />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className="w-full lg:w-52 xl:w-60 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card">
          <MatchNavigation
            matches={matches}
            teams={teams}
            activeId={params.id}
            lang={lang}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <MatchHeader match={match} homeTeam={homeTeam} awayTeam={awayTeam} lang={lang} />
            <ContextCards match={match} homeTeam={homeTeam} awayTeam={awayTeam} lang={lang} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Heatmap + Top10 + Conclusion (2/3 width) */}
              <div className="xl:col-span-2 space-y-6">
                <PredictionHeatmap
                  matrix={prediction.matrix}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  lang={lang}
                />
                <TopResults topResults={prediction.topResults} lang={lang} />
                <ConclusionCard
                  result={prediction.mostLikelyResult}
                  reasoning={reasoningText}
                  lang={lang}
                />
              </div>

              {/* Explainability + News (1/3 width) */}
              <div className="space-y-6">
                <ExplainabilityPanel
                  factors={factors}
                  result={prediction.mostLikelyResult}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  lang={lang}
                />
                <NewsFeed news={news} lang={lang} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
