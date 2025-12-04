'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../lib/hooks/useApi'
import { useAuth } from '../../lib/hooks/useAuth'
import { RequireAuth } from '../components/require-auth'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProfileCustomizationTab } from './components/ProfileCustomizationTab'
import { ProfileOverviewTab } from './components/ProfileOverviewTab'
import { ProfileAboutTab } from './components/ProfileAboutTab'
import { ProfileWorkspacesTab } from './components/ProfileWorkspacesTab'
import { ProfileSecurityTab } from './components/ProfileSecurityTab'

type WorkspaceItem = {
  id: string
  name: string
  initials: string
  imageUrl: string | null
  isOwner: boolean
}

type TabId = 'overview' | 'about' | 'workspaces' | 'security' | 'customization'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { request } = useApi()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => request('/workspaces'),
  })

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => request('/profile'),
  })

  const workspaces: WorkspaceItem[] = useMemo(() => {
    if (!Array.isArray(workspacesData)) return []
    const email = user?.email

    return (
      workspacesData
        .map((ws: any) => {
          const id = ws.id ?? (typeof ws.SK === 'string' ? ws.SK.replace('WORKSPACE#', '') : undefined)
          if (!id) return null
          const name = (ws.name as string) ?? 'Untitled'
          const initials = name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
          const imageUrl = typeof ws.imageUrl === 'string' ? ws.imageUrl : null
          const ownerEmail = typeof ws.ownerEmail === 'string' ? ws.ownerEmail : null
          const isOwner = !!ownerEmail && !!email && ownerEmail === email
          return { id, name, initials, imageUrl, isOwner }
        })
        .filter(Boolean) as WorkspaceItem[]
    )
  }, [workspacesData, user?.email])

  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const email = (profileData && typeof profileData.email === 'string' ? profileData.email : user?.email) ||
    'guest@example.com'

  const defaultUsername = email.split('@')[0]
  const defaultInitials = (email || 'XO')
    .split('@')[0]
    .split('.')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const [bio, setBio] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [timezone, setTimezone] = useState('')
  const [github, setGithub] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState(defaultUsername)
  const [avatarInitials, setAvatarInitials] = useState(defaultInitials)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [presence, setPresence] = useState<'online' | 'idle' | 'dnd' | 'offline'>('online')
  const [themePreference, setThemePreference] = useState<'system' | 'light' | 'dark' | 'charcoal'>('system')

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  // Hydrate from profileData when it loads
  useMemo(() => {
    if (!profileData) return
    if (typeof profileData.displayName === 'string') setDisplayName(profileData.displayName)
    if (typeof profileData.username === 'string') setUsername(profileData.username)
    if (typeof profileData.bio === 'string') setBio(profileData.bio)
    if (typeof profileData.pronouns === 'string') setPronouns(profileData.pronouns)
    if (typeof profileData.timezone === 'string') setTimezone(profileData.timezone)
    if (typeof profileData.github === 'string') setGithub(profileData.github)
    if (typeof profileData.twitter === 'string') setTwitter(profileData.twitter)
    if (typeof profileData.website === 'string') setWebsite(profileData.website)
    if (typeof profileData.avatarUrl === 'string') setAvatarUrl(profileData.avatarUrl)
    if (typeof profileData.statusMessage === 'string') setStatusMessage(profileData.statusMessage)
    if (
      profileData.presence === 'online' ||
      profileData.presence === 'idle' ||
      profileData.presence === 'dnd' ||
      profileData.presence === 'offline'
    ) {
      setPresence(profileData.presence)
    }
    if (
      profileData.themePreference === 'system' ||
      profileData.themePreference === 'light' ||
      profileData.themePreference === 'dark' ||
      profileData.themePreference === 'charcoal'
    ) {
      setThemePreference(profileData.themePreference)
    }
  }, [profileData])

  const now = new Date()
  const localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  const saveProfile = useMutation({
    mutationFn: async () => {
      setSaving(true)
      const body = {
        username,
        displayName,
        avatarUrl,
        statusMessage,
        presence,
        themePreference,
        bio,
        pronouns,
        timezone,
        github,
        twitter,
        website,
      }
      const result = await request('/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      return result
    },
    onSuccess: () => {
      setUsernameError(null)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setSaving(false)
    },
    onError: (error: any) => {
      if (error && typeof error.message === 'string' && error.message.includes('Username is already taken')) {
        setUsernameError('That username is already taken.')
      }
      setSaving(false)
    },
  })

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i += 1) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = typeof btoa === 'function' ? btoa(binary) : ''
      const body = {
        fileName: file.name,
        contentType: file.type || 'image/png',
        data: base64,
      }
      return request('/profile/avatar', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    onSuccess: (data: any) => {
      if (data && typeof data.avatarUrl === 'string') {
        setAvatarUrl(data.avatarUrl)
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return (
    <RequireAuth>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-black via-neutral-950 to-black px-4 py-6 text-gray-100 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <button
              type="button"
              className="btn-glass px-3 py-1.5 text-gray-200"
              onClick={() => router.push('/')}
            >
              ← Back to XO Labs
            </button>
          </div>
          {/* Top hero card */}
          <section className="glass-panel overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-accent/60 via-accent-soft/70 to-purple-500/60" />
            <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="-mt-10 h-20 w-20 overflow-hidden rounded-3xl border border-white/20 bg-black/50 shadow-xl sm:h-24 sm:w-24">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white">
                        {avatarInitials}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-xl font-bold text-gray-50 sm:text-2xl">{displayName}</h1>
                    <p className="text-xs text-gray-400 sm:text-sm">@{displayName || defaultUsername}</p>
                    {statusMessage && (
                      <p className="text-[11px] text-gray-300">{statusMessage}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-300">
                      <PresencePill presence={presence} />
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-400">Local time: {localTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {savedAt && (
                    <span className="text-[10px] text-gray-500">Saved at {savedAt}</span>
                  )}
                  <button
                    type="button"
                    className="btn-glass px-3 py-1.5 text-gray-200 disabled:opacity-60"
                    disabled={saving}
                    onClick={() => saveProfile.mutate()}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className="btn-glass px-3 py-1.5 text-gray-200"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <section className="glass-panel p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap gap-2 border-b border-white/10 pb-2 text-xs sm:text-sm">
              <ProfileTabButton id="overview" label="Overview" activeTab={activeTab} onClick={setActiveTab} />
              <ProfileTabButton id="about" label="About" activeTab={activeTab} onClick={setActiveTab} />
              <ProfileTabButton id="workspaces" label="Workspaces" activeTab={activeTab} onClick={setActiveTab} />
              <ProfileTabButton id="security" label="Security" activeTab={activeTab} onClick={setActiveTab} />
              <ProfileTabButton
                id="customization"
                label="Customization"
                activeTab={activeTab}
                onClick={setActiveTab}
              />
            </div>

            {activeTab === 'overview' && (
              <ProfileOverviewTab email={email} timezone={timezone} tzFallback={tz} />
            )}

            {activeTab === 'about' && (
              <ProfileAboutTab
                bio={bio}
                onBioChange={setBio}
                pronouns={pronouns}
                onPronounsChange={setPronouns}
                timezone={timezone}
                onTimezoneChange={setTimezone}
                tzFallback={tz}
                github={github}
                onGithubChange={setGithub}
                twitter={twitter}
                onTwitterChange={setTwitter}
                website={website}
                onWebsiteChange={setWebsite}
              />
            )}

            {activeTab === 'workspaces' && (
              <ProfileWorkspacesTab workspaces={workspaces} />
            )}

            {activeTab === 'security' && (
              <ProfileSecurityTab email={email} onLogout={logout} />
            )}

            {activeTab === 'customization' && (
              <ProfileCustomizationTab
                displayName={displayName}
                onDisplayNameChange={setDisplayName}
                username={username}
                onUsernameChange={setUsername}
                usernameError={usernameError}
                onAvatarFileSelected={(file) => uploadAvatar.mutate(file)}
                statusMessage={statusMessage}
                onStatusMessageChange={setStatusMessage}
                presence={presence}
                onPresenceChange={setPresence}
                themePreference={themePreference}
                onThemePreferenceChange={setThemePreference}
                defaultUsername={defaultUsername}
              />
            )}
          </section>
        </div>
      </main>
    </RequireAuth>
  )
}

type ProfileTabButtonProps = {
  id: TabId
  label: string
  activeTab: TabId
  onClick: (id: TabId) => void
}

function ProfileTabButton({ id, label, activeTab, onClick }: ProfileTabButtonProps) {
  const active = activeTab === id
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`rounded-full px-3 py-1 text-xs font-medium smooth-transition ${
        active ? 'bg-accent text-white shadow-[0_0_18px_rgba(88,101,242,0.6)]' : 'bg-white/5 text-gray-300 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  )
}

type Presence = 'online' | 'idle' | 'dnd' | 'offline'

function PresencePill({ presence }: { presence: Presence }) {
  const config: Record<Presence, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
    online: {
      label: 'Online',
      dotClass: 'bg-emerald-400',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-300',
    },
    idle: {
      label: 'Idle',
      dotClass: 'bg-amber-400',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-300',
    },
    dnd: {
      label: 'Do Not Disturb',
      dotClass: 'bg-rose-400',
      bgClass: 'bg-rose-500/10',
      textClass: 'text-rose-300',
    },
    offline: {
      label: 'Offline',
      dotClass: 'bg-gray-500',
      bgClass: 'bg-gray-600/20',
      textClass: 'text-gray-300',
    },
  }

  const { label, dotClass, bgClass, textClass } = config[presence]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${bgClass} ${textClass}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  )
}

type PresenceOptionButtonProps = {
  label: string
  value: Presence
  current: Presence
  onChange: (value: Presence) => void
}

function PresenceOptionButton({ label, value, current, onChange }: PresenceOptionButtonProps) {
  const active = current === value
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-full px-3 py-1 smooth-transition ${
        active ? 'bg-accent text-white shadow-[0_0_18px_rgba(88,101,242,0.6)]' : 'bg-white/5 text-gray-300 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  )
}
