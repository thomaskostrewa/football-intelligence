export default function MatchLoading() {
  const rows = ['Fixture und Teams', 'API-Football Prediction', 'Marktquoten', 'Elo und Wetter', 'Exact-Score Matrix']

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="h-4 w-40 rounded bg-border animate-pulse" />
          <div className="hidden md:flex gap-4">
            <div className="h-3 w-16 rounded bg-border animate-pulse" />
            <div className="h-3 w-24 rounded bg-border animate-pulse" />
            <div className="h-3 w-20 rounded bg-border animate-pulse" />
          </div>
          <div className="h-3 w-20 rounded bg-border animate-pulse" />
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-5 md:p-6">
              <p className="text-xs font-semibold text-accent uppercase">Live-Berechnung</p>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary mt-2">
                Echte Matchdaten werden geladen
              </h1>
              <p className="text-sm text-text-muted mt-3 max-w-2xl leading-relaxed">
                Die Engine fragt verfuegbare Quellen an, prueft Fallbacks und berechnet daraus Lambdas,
                Exact Scores und Tippkorridore.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 md:p-6">
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: 36 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-md bg-border animate-pulse"
                    style={{ animationDelay: `${(index % 6) * 70}ms` }}
                  />
                ))}
              </div>
            </div>
          </section>

          <aside className="bg-card rounded-xl border border-border p-5 h-fit">
            <h2 className="text-sm font-semibold text-text-primary">Datenstatus</h2>
            <div className="mt-4 space-y-3">
              {rows.map((row, index) => (
                <div key={row} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-text-muted">{row}</span>
                  <span className="flex items-center gap-2 font-semibold text-positive">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse"
                      style={{ animationDelay: `${index * 120}ms` }}
                    />
                    laeuft
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-muted mt-5 leading-relaxed">
              Fehlende APIs brechen die Seite nicht. Sie senken die Confidence und werden im fertigen Panel markiert.
            </p>
          </aside>
        </div>
      </main>
    </div>
  )
}
