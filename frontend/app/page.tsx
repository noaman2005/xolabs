import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">XO Labs</h1>
      <p className="text-sm text-gray-400">Discord-style realtime collab. Infra-first.</p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-soft transition-colors"
      >
        Go to dashboard
      </Link>
    </main>
  )
}
