"use client"

import React, { useState } from "react"

export type WorkspaceImageModalProps = {
  onClose: () => void
  initialImageUrl: string | null
  workspaceName: string
  onSave: (file: File | null) => void
  isSubmitting?: boolean
}

export function WorkspaceImageModal({
  onClose,
  initialImageUrl,
  workspaceName,
  onSave,
  isSubmitting,
}: WorkspaceImageModalProps) {
  const [file, setFile] = useState<File | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 px-6 py-6 text-sm text-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Workspace image</h3>
            <p className="text-xs text-gray-500">Upload an image to use as the icon for "{workspaceName}". Leave empty to use initials.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Image file
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files && e.target.files[0] ? e.target.files[0] : null
                setFile(f)
              }}
              className="block w-full text-xs text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-100 hover:file:bg-white/20"
            />
            {initialImageUrl && (
              <p className="text-[11px] text-gray-500">
                A workspace image is already set. Uploading a new file will replace it.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(file)}
              disabled={isSubmitting}
              className="btn-accent px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
