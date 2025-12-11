import "./globals.css"
import type { ReactNode } from "react"
import { AppProviders } from "./providers"
import { GlobalOverlays } from "./components/GlobalOverlays"
import { GlobalMobileNav } from "./components/GlobalMobileNav"

export const metadata = {
  title: 'XO Labs',
  description: 'Realtime collaboration platform',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 antialiased pb-20 lg:pb-0">
        <AppProviders>
          {children}
          <GlobalOverlays />
        </AppProviders>
        <GlobalMobileNav />
      </body>
    </html>
  )
}
