import Link from 'next/link'

const NAV_ITEMS = [
  { label: 'Home', href: 'https://thomas-kostrewa.de' },
  { label: 'Rutekart', href: 'https://rutekart.thomas-kostrewa.de' },
  { label: 'Contact', href: 'https://thomas-kostrewa.de/contact' },
]

export default function Header() {
  return (
    <header className="relative z-40 border-b border-border bg-white text-text-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <Link
          href="https://thomas-kostrewa.de"
          className="shrink-0 text-sm font-bold uppercase tracking-[0.24em] text-[#0f766e] transition-colors hover:text-text-primary"
        >
          Thomas Kostrewa
        </Link>

        <nav aria-label="Main navigation">
          <ul className="flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-[#0f766e]/10 hover:text-text-primary"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
