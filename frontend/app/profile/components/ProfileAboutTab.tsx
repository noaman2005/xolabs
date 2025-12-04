'use client'

import React from 'react'

type Props = {
  bio: string
  onBioChange: (value: string) => void
  pronouns: string
  onPronounsChange: (value: string) => void
  timezone: string
  onTimezoneChange: (value: string) => void
  tzFallback: string
  github: string
  onGithubChange: (value: string) => void
  twitter: string
  onTwitterChange: (value: string) => void
  website: string
  onWebsiteChange: (value: string) => void
}

export function ProfileAboutTab({
  bio,
  onBioChange,
  pronouns,
  onPronounsChange,
  timezone,
  onTimezoneChange,
  tzFallback,
  github,
  onGithubChange,
  twitter,
  onTwitterChange,
  website,
  onWebsiteChange,
}: Props) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">About</h2>
        <textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Tell people who you are, what you&apos;re building, or what you&apos;re into."
          className="h-24 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Pronouns</label>
          <input
            type="text"
            value={pronouns}
            onChange={(e) => onPronounsChange(e.target.value)}
            placeholder="they/them"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            placeholder={tzFallback}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">GitHub</label>
          <input
            type="url"
            value={github}
            onChange={(e) => onGithubChange(e.target.value)}
            placeholder="https://github.com/username"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Twitter / X</label>
          <input
            type="url"
            value={twitter}
            onChange={(e) => onTwitterChange(e.target.value)}
            placeholder="https://twitter.com/username"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
            placeholder="https://your-site.com"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
