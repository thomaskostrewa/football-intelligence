import { notFound } from 'next/navigation'
import { isValidLang, DEFAULT_LANG } from '@/lib/i18n'
import { getMatchViewModel } from '@/lib/match-view-model'
import Header from '@/components/Header'
import MatchNavigation from '@/components/MatchNavigation'
import MatchHeader from '@/components/MatchHeader'
import PredictionHeatmap from '@/components/PredictionHeatmap'
import ExplainabilityPanel from '@/components/ExplainabilityPanel'
import NewsFeed from '@/components/NewsFeed'
import TopResults from '@/components/TopResults'
import ConclusionCard from '@/components/ConclusionCard'
import SourceTransparencyPanel from '@/components/SourceTransparencyPanel'
import RecommendationCards from '@/components/RecommendationCards'
import MatchInsightSections from '@/components/MatchInsightSections'
import { TimezoneProvider } from '@/components/TimezonePreference'

type Params = { lang: string; id: string }

export const dynamic = 'force-dynamic'

export default async function MatchPage({ params }: { params: Params }) {
  const lang = isValidLang(params.lang) ? params.lang : DEFAULT_LANG
  const viewModel = await getMatchViewModel(params.id, lang)
  if (!viewModel) notFound()

  const {
    match,
    matches,
    teams,
    homeTeam,
    awayTeam,
    prediction,
    intelligence,
    factors,
    reasoning,
    news,
    fixtureSource,
  } = viewModel

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <TimezoneProvider>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside className="w-full lg:w-52 xl:w-60 flex-shrink-0 lg:border-r border-border lg:bg-card">
          <MatchNavigation
            matches={matches}
            teams={teams}
            activeId={params.id}
            lang={lang}
            fixtureSource={fixtureSource}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <MatchHeader match={match} homeTeam={homeTeam} awayTeam={awayTeam} lang={lang} />
            <MatchInsightSections
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              result={prediction.mostLikelyResult}
              intelligence={intelligence}
              news={news}
              lang={lang}
            />

            <PredictionHeatmap
              exactScores={intelligence.exactScores}
              restProbability={intelligence.restProbability}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              lang={lang}
            />

            <NewsFeed news={news} lang={lang} />
            <SourceTransparencyPanel intelligence={intelligence} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <TopResults topResults={intelligence.topScores} lang={lang} />
                <RecommendationCards intelligence={intelligence} />
                <ConclusionCard
                  result={prediction.mostLikelyResult}
                  reasoning={reasoning}
                  lang={lang}
                />
              </div>

              <div className="space-y-6">
                <ExplainabilityPanel
                  factors={factors}
                  result={prediction.mostLikelyResult}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      </TimezoneProvider>
    </div>
  )
}
