import { redirect } from 'next/navigation'
import { getBaseTeams, getAllTeams, isResolvedMatch } from '@/lib/match-view-model'
import { getFixtureFeed } from '@/lib/fixtures/provider'

export default async function RootPage() {
  const baseTeams = getBaseTeams()
  const feed = await getFixtureFeed(baseTeams)
  const teams = getAllTeams(feed.teams)
  const firstResolvedMatch = feed.matches.find(match => isResolvedMatch(match, teams))

  redirect(`/de/match/${firstResolvedMatch?.id ?? 'eng-cod'}`)
}
