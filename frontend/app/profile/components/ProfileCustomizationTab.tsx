"use client"

import React from "react"

type Presence = "online" | "idle" | "dnd" | "offline"

type Props = {
  displayName: string
  onDisplayNameChange: (value: string) => void
  username: string
  onUsernameChange: (value: string) => void
  usernameError: string | null
  onAvatarFileSelected: (file: File) => void
  statusMessage: string
  onStatusMessageChange: (value: string) => void
  presence: Presence
  onPresenceChange: (value: Presence) => void
  themePreference: "system" | "light" | "dark" | "charcoal"
  onThemePreferenceChange: (value: "system" | "light" | "dark" | "charcoal") => void
  defaultUsername: string
}

export function ProfileCustomizationTab({
  displayName,
  onDisplayNameChange,
  username,
  onUsernameChange,
  usernameError,
  onAvatarFileSelected,
  statusMessage,
  onStatusMessageChange,
  presence,
  onPresenceChange,
  themePreference,
  onThemePreferenceChange,
  defaultUsername,
}: Props) {
  return (
    <div className="space-y-4 text-sm">
      {/* Identity */}
      <div className="rounded-xl bg-white/[0.03] p-3">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Identity</h2>
        <p className="mb-2 text-xs text-gray-500">
          Change how your name and avatar appear across XO Labs. This updates the profile header instantly.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              placeholder={defaultUsername}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/\s+/g, "")
                onUsernameChange(value)
              }}
              placeholder={defaultUsername.toLowerCase()}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
            />
            {usernameError && <p className="mt-1 text-[10px] text-rose-400">{usernameError}</p>}
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-400">Avatar</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              className="text-[11px] text-gray-400"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onAvatarFileSelected(file)
              }}
            />
          </div>
          <p className="mt-1 text-[10px] text-gray-500">Upload an image to use as your avatar.</p>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-xl bg-white/[0.03] p-3">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</h2>
        <p className="mb-2 text-xs text-gray-500">
          Set a custom status message to show under your name. This is local-only for now.
        </p>
        <input
          type="text"
          value={statusMessage}
          onChange={(e) => onStatusMessageChange(e.target.value)}
          placeholder="Building cool things in XO Labs 🚀"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
        />
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-gray-400">Presence</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <PresenceOptionButton label="Online" value="online" current={presence} onChange={onPresenceChange} />
            <PresenceOptionButton label="Idle" value="idle" current={presence} onChange={onPresenceChange} />
            <PresenceOptionButton label="Do Not Disturb" value="dnd" current={presence} onChange={onPresenceChange} />
            <PresenceOptionButton label="Offline" value="offline" current={presence} onChange={onPresenceChange} />
          </div>
        </div>
      </div>

      {/* Theme & Badges */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/[0.03] p-3">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Theme</h2>
          <p className="mb-2 text-xs text-gray-500">
            Choose how XO Labs should look on your device. This doesn&apos;t change the app theme yet.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <ThemeOptionButton
              label="System"
              value="system"
              current={themePreference}
              onChange={onThemePreferenceChange}
            />
            <ThemeOptionButton
              label="Light"
              value="light"
              current={themePreference}
              onChange={onThemePreferenceChange}
            />
            <ThemeOptionButton
              label="Dark"
              value="dark"
              current={themePreference}
              onChange={onThemePreferenceChange}
            />
            <ThemeOptionButton
              label="Charcoal"
              value="charcoal"
              current={themePreference}
              onChange={onThemePreferenceChange}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] p-3">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Badges</h2>
          <p className="mb-2 text-xs text-gray-500">
            Preview how profile badges could look. We&apos;ll hook this up to real achievements later.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              Early member
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Pro workspace owner
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Active contributor
            </span>
          </div>
        </div>
      </div>
    </div>
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

type ThemeValue = "system" | "light" | "dark" | "charcoal"

type ThemeOptionButtonProps = {
  label: string
  value: ThemeValue
  current: ThemeValue
  onChange: (value: ThemeValue) => void
}

function ThemeOptionButton({ label, value, current, onChange }: ThemeOptionButtonProps) {
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
