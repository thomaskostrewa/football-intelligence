import type { Lang } from '@/lib/i18n'
import type { NewsItem } from '@/lib/news'
import type { ScoreProbability } from '@/lib/prediction'
import type { MatchIntelligenceResponse } from '@/lib/model/matchIntelligence'

type LocalizedText = { de: string; en: string; pt: string }

type Team = {
  flag: string
  name: LocalizedText
  xgAvg: number
  goalsAgainstAvg: number
}

type Props = {
  homeTeam: Team
  awayTeam: Team
  result: ScoreProbability
  intelligence: MatchIntelligenceResponse
  news: NewsItem[]
  lang: Lang
}

const copy = {
  de: {
    mostLikely: 'Wahrscheinlichstes Ergebnis',
    directDuels: 'Letzte direkte Duelle',
    directUnavailable: 'Keine dynamische H2H-Quelle angebunden',
    directUnavailableBody: 'Direkte Duelle werden erst angezeigt, sobald sie aus einer Live- oder Provider-Quelle kommen. Bis dahin wird hier kein historischer Fakt behauptet.',
    offensive: 'Offensive Bewertung',
    offensiveSubtitle: 'Dynamische Signale aus Modell, Quellengewichtung und Match-News.',
    defensive: 'Defensive Bewertung',
    defensiveSubtitle: 'Dynamische Signale aus Gegentorprofil, Modellwerten und Quellenstatus.',
    expectedGoals: 'Erwartete Tore',
    teamProfile: 'Teamprofil',
    sourceWeight: 'Quellengewicht',
    newsSignals: 'News-Signale',
    noNewsSignals: 'Keine dynamisch passenden News-Signale gefunden.',
    dataSource: 'Datenquelle',
    modelSignal: 'Modellsignal',
  },
  en: {
    mostLikely: 'Most likely outcome',
    directDuels: 'Recent head-to-head',
    directUnavailable: 'No dynamic H2H source connected',
    directUnavailableBody: 'Direct meetings are only shown once they come from a live or provider source. Until then, no historical fact is asserted here.',
    offensive: 'Offensive evaluation',
    offensiveSubtitle: 'Dynamic signals from model output, source weighting and match news.',
    defensive: 'Defensive evaluation',
    defensiveSubtitle: 'Dynamic signals from goals-against profile, model values and source status.',
    expectedGoals: 'Expected goals',
    teamProfile: 'Team profile',
    sourceWeight: 'Source weight',
    newsSignals: 'News signals',
    noNewsSignals: 'No dynamically matched news signals found.',
    dataSource: 'Data source',
    modelSignal: 'Model signal',
  },
  pt: {
    mostLikely: 'Resultado mais provavel',
    directDuels: 'Confrontos diretos recentes',
    directUnavailable: 'Nenhuma fonte H2H dinamica ligada',
    directUnavailableBody: 'Confrontos diretos so aparecem quando vierem de uma fonte live ou provider. Ate la, nenhum facto historico e afirmado aqui.',
    offensive: 'Avaliacao ofensiva',
    offensiveSubtitle: 'Sinais dinamicos do modelo, ponderacao de fontes e noticias do jogo.',
    defensive: 'Avaliacao defensiva',
    defensiveSubtitle: 'Sinais dinamicos do perfil defensivo, valores do modelo e estado das fontes.',
    expectedGoals: 'Golos esperados',
    teamProfile: 'Perfil da equipa',
    sourceWeight: 'Peso da fonte',
    newsSignals: 'Sinais de noticias',
    noNewsSignals: 'Nenhum sinal de noticia dinamicamente associado encontrado.',
    dataSource: 'Fonte de dados',
    modelSignal: 'Sinal do modelo',
  },
} as const

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function resultTitle(homeTeam: Team, awayTeam: Team, result: ScoreProbability, lang: Lang) {
  if (result.home === result.away) {
    return {
      de: `Enges Remis zwischen ${homeTeam.name.de} und ${awayTeam.name.de}`,
      en: `${homeTeam.name.en} and ${awayTeam.name.en} draw a close match`,
      pt: `${homeTeam.name.pt} e ${awayTeam.name.pt} empatam num jogo equilibrado`,
    }[lang]
  }

  const winner = result.home > result.away ? homeTeam : awayTeam
  const close = Math.abs(result.home - result.away) === 1

  return {
    de: `${winner.name.de} ${close ? 'gewinnt knapp' : 'gewinnt klar'}`,
    en: `${winner.name.en} ${close ? 'wins a close match' : 'wins clearly'}`,
    pt: `${winner.name.pt} ${close ? 'vence por margem curta' : 'vence claramente'}`,
  }[lang]
}

function teamNews(news: NewsItem[], team: Team, lang: Lang) {
  const items = news ?? []
  const name = team.name[lang].toLowerCase()
  const englishName = team.name.en.toLowerCase()

  return items
    .filter(item => {
      const title = item.title.toLowerCase()
      return title.includes(name) || title.includes(englishName) || item.matchedKeywords?.some(keyword => keyword.toLowerCase() === name || keyword.toLowerCase() === englishName)
    })
    .slice(0, 2)
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2 text-xs last:border-b-0">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  )
}

function DynamicTeamCard({
  team,
  expectedGoals,
  profileValue,
  sourceWeight,
  newsItems,
  mode,
  lang,
}: {
  team: Team
  expectedGoals: number
  profileValue: number
  sourceWeight: number
  newsItems: NewsItem[]
  mode: 'offense' | 'defense'
  lang: Lang
}) {
  const tr = copy[lang]

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{team.flag} {team.name[lang]}</h3>
          <p className="mt-1 text-xs text-text-muted">{tr.modelSignal}</p>
        </div>
        <span className="rounded-full bg-background px-2 py-1 text-[10px] font-semibold text-text-muted">
          {mode === 'offense' ? tr.offensive : tr.defensive}
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background p-3">
        <SignalRow label={tr.expectedGoals} value={expectedGoals.toFixed(2)} />
        <SignalRow label={tr.teamProfile} value={profileValue.toFixed(2)} />
        <SignalRow label={tr.sourceWeight} value={percent(sourceWeight)} />
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{tr.newsSignals}</p>
        {newsItems.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {newsItems.map(item => (
              <li key={`${item.source}-${item.title}`} className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-semibold leading-snug text-text-primary">{item.title}</p>
                <p className="mt-1 text-[10px] text-text-muted">{item.source} · {item.timeAgo}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 rounded-lg border border-border bg-background p-3 text-xs text-text-muted">
            {tr.noNewsSignals}
          </p>
        )}
      </div>
    </div>
  )
}

export default function MatchInsightSections({ homeTeam, awayTeam, result, intelligence, news = [], lang }: Props) {
  const tr = copy[lang]
  const homeNews = teamNews(news, homeTeam, lang)
  const awayNews = teamNews(news, awayTeam, lang)

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-text-primary p-5 text-card md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-card/65">{tr.mostLikely}</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold leading-tight md:text-3xl">{resultTitle(homeTeam, awayTeam, result, lang)}</h2>
            <p className="mt-2 text-sm text-card/75">
              {tr.dataSource}: Exact-Score-Matrix, Lambdas {intelligence.lambdaHome.toFixed(2)} / {intelligence.lambdaAway.toFixed(2)}, Confidence {intelligence.confidence.score}/100.
            </p>
          </div>
          <p className="shrink-0 text-5xl font-bold leading-none md:text-6xl">{result.home}:{result.away}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-text-primary">{tr.directDuels}</h2>
        <div className="mt-4 rounded-lg border border-[#E5CFA8] bg-[#FFF8EA] p-4">
          <p className="text-xs font-semibold text-[#7A5A24]">{tr.directUnavailable}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#7A5A24]">{tr.directUnavailableBody}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-background">
          <div className="border-b border-border p-5">
            <h2 className="text-base font-semibold text-text-primary">{tr.offensive}</h2>
            <p className="mt-1 text-xs text-text-muted">{tr.offensiveSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-5">
            <DynamicTeamCard
              team={homeTeam}
              expectedGoals={intelligence.lambdaHome}
              profileValue={homeTeam.xgAvg}
              sourceWeight={intelligence.sourceWeights.form + intelligence.sourceWeights.elo + intelligence.sourceWeights.odds}
              newsItems={homeNews}
              mode="offense"
              lang={lang}
            />
            <DynamicTeamCard
              team={awayTeam}
              expectedGoals={intelligence.lambdaAway}
              profileValue={awayTeam.xgAvg}
              sourceWeight={intelligence.sourceWeights.form + intelligence.sourceWeights.elo + intelligence.sourceWeights.odds}
              newsItems={awayNews}
              mode="offense"
              lang={lang}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background">
          <div className="border-b border-border p-5">
            <h2 className="text-base font-semibold text-text-primary">{tr.defensive}</h2>
            <p className="mt-1 text-xs text-text-muted">{tr.defensiveSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-5">
            <DynamicTeamCard
              team={homeTeam}
              expectedGoals={intelligence.lambdaAway}
              profileValue={homeTeam.goalsAgainstAvg}
              sourceWeight={intelligence.sourceWeights.apiFootball + intelligence.sourceWeights.elo + intelligence.sourceWeights.weather}
              newsItems={homeNews}
              mode="defense"
              lang={lang}
            />
            <DynamicTeamCard
              team={awayTeam}
              expectedGoals={intelligence.lambdaHome}
              profileValue={awayTeam.goalsAgainstAvg}
              sourceWeight={intelligence.sourceWeights.apiFootball + intelligence.sourceWeights.elo + intelligence.sourceWeights.weather}
              newsItems={awayNews}
              mode="defense"
              lang={lang}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
