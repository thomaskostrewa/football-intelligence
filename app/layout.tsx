import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Football Intelligence – WM 2026',
  description: 'Understand the game before the market does. AI-powered World Cup 2026 match analysis.',
  openGraph: {
    title: 'Football Intelligence',
    description: 'Understand the game before the market does.',
    url: 'https://football.thomas-kostrewa.de',
    siteName: 'Football Intelligence',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background text-text-primary">
        {children}
      </body>
    </html>
  )
}
