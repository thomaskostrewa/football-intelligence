import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import type { NewsItem } from '@/lib/news'

interface Props {
  news: NewsItem[]
  lang: Lang
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-text-muted">
      <path d="M7 1h4v4M11 1L5.5 6.5M4 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function NewsFeed({ news, lang }: Props) {
  const tr = t[lang]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">{tr.news_title}</h2>

      {news.length === 0 ? (
        <p className="text-xs text-text-muted">{tr.error_news}</p>
      ) : (
        <ul className="space-y-0 divide-y divide-border">
          {news.map((item, i) => (
            <li key={i}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 py-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-text-muted tracking-wide">
                        {item.timeAgo}
                      </span>
                      <p className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug mt-0.5 line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {lang === 'de' ? 'Quelle' : lang === 'pt' ? 'Fonte' : 'Source'}: {item.source}
                      </p>
                    </div>
                    <ExternalIcon />
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {news.length > 0 && (
        <button className="mt-3 text-xs text-accent hover:text-text-primary transition-colors flex items-center gap-1">
          {tr.all_news}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}
