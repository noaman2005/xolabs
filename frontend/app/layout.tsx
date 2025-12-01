import './globals.css'
import type { ReactNode } from 'react'
import { AppProviders } from './providers'

export const metadata = {
  title: 'XO Labs',
  description: 'Realtime collaboration platform',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
