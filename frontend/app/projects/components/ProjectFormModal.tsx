"use client"

import { ChangeEvent } from "react"
import { Project } from "../types"

type Props = {
  open: boolean
  editingId: string | null
  newProject: Project
  setNewProject: React.Dispatch<React.SetStateAction<Project>>
  tagsInput: string
  setTagsInput: (v: string) => void
  techInput: string
  setTechInput: (v: string) => void
  featuresInput: string
  setFeaturesInput: (v: string) => void
  screensInput: string
  setScreensInput: (v: string) => void
  linksInput: string
  setLinksInput: (v: string) => void
  coverPreview: string
  setCoverPreview: (v: string) => void
  setCoverDataUrl: (v: string) => void
  screenshotPreviews: string[]
  setScreenshotPreviews: (v: string[]) => void
  setScreenshotDataUrls: (v: string[]) => void
  fileToDataUrl: (file: File) => Promise<string>
  handleSaveProject: () => void | Promise<void>
  setShowProjectModal: (v: boolean) => void
  saving: boolean
  categories: string[]
  setPinned: (v: boolean) => void
  formErrors?: string[]
}

export function ProjectFormModal({
  open,
  editingId,
  newProject,
  setNewProject,
  tagsInput,
  setTagsInput,
  techInput,
  setTechInput,
  featuresInput,
  setFeaturesInput,
  screensInput,
  setScreensInput,
  linksInput,
  setLinksInput,
  coverPreview,
  setCoverPreview,
  setCoverDataUrl,
  screenshotPreviews,
  setScreenshotPreviews,
  setScreenshotDataUrls,
  fileToDataUrl,
  handleSaveProject,
  setShowProjectModal,
  saving,
  categories,
  setPinned,
  formErrors = [],
}: Props) {
  if (!open) return null

  const onCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverPreview(url)
      fileToDataUrl(file).then((dataUrl) => setCoverDataUrl(dataUrl))
    }
  }

  const onScreensChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const urls = files.map((f) => URL.createObjectURL(f))
    setScreenshotPreviews(urls)
    Promise.all(files.map((f) => fileToDataUrl(f))).then((dataUrls) => setScreenshotDataUrls(dataUrls))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-2xl max-h-[82vh] overflow-hidden rounded-2xl border border-white/10 bg-black/85 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{editingId ? "Edit Project" : "Add Project"}</h3>
            <p className="text-xs text-gray-500">Required: title, description, project URL.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowProjectModal(false)}
            className="rounded-full px-3 py-1 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="grid max-h-[60vh] gap-3 overflow-y-auto px-4 py-4 sm:grid-cols-2">
          {formErrors.length > 0 ? (
            <div className="sm:col-span-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              <ul className="list-disc pl-4 space-y-1">
                {formErrors.map((err, idx) => (
                  <li key={`${err}-${idx}`}>{err}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Title*</label>
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={newProject.title}
              onChange={(e) => setNewProject((p) => ({ ...p, title: e.target.value }))}
              placeholder="Project title"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Status</label>
            <select
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={newProject.status}
              onChange={(e) => setNewProject((p) => ({ ...p, status: e.target.value as Project["status"] }))}
            >
              <option value="In progress">In progress</option>
              <option value="Completed">Completed</option>
              <option value="Planned">Planned</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Category</label>
            <select
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={newProject.category || ""}
              onChange={(e) => setNewProject((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-[11px] text-gray-400">Description*</label>
            <textarea
              className="h-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={newProject.description}
              onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
              placeholder="What is this project about?"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Project URL*</label>
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={newProject.projectUrl}
              onChange={(e) => setNewProject((p) => ({ ...p, projectUrl: e.target.value }))}
              placeholder="https://"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">GitHub URL</label>
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={newProject.githubUrl}
              onChange={(e) => setNewProject((p) => ({ ...p, githubUrl: e.target.value }))}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Tags (comma separated)</label>
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="social, backend"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Tech stack (comma separated)</label>
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="Next.js, Tailwind, DynamoDB"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Features (comma separated)</label>
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="Auth, Chat, Uploads"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-gray-400">Cover image</label>
            <input
              type="file"
              accept="image/*"
              className="text-[11px] text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
              onChange={onCoverChange}
            />
            {coverPreview ? (
              <div className="h-24 w-full overflow-hidden rounded-lg border border-white/10">
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${coverPreview})` }} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-gray-400">Screenshots (upload)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="text-[11px] text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-white/20"
              onChange={onScreensChange}
            />
            {screenshotPreviews.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {screenshotPreviews.map((src, idx) => (
                  <div key={`${src}-${idx}`} className="h-16 w-24 overflow-hidden rounded-lg border border-white/10">
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${src})` }} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-[11px] text-gray-400">Links (one per line as Label|URL)</label>
            <textarea
              className="h-16 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={linksInput}
              onChange={(e) => setLinksInput(e.target.value)}
              placeholder={`Docs|https://docs.example.com\nDemo|https://demo.example.com`}
            />
          </div>
          {/* Cover URL field intentionally removed to keep form minimal; upload or keep existing preview */}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400">Progress (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
              value={newProject.progress ?? 0}
              onChange={(e) => setNewProject((p) => ({ ...p, progress: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="pinned"
            type="checkbox"
            checked={newProject.pinned || false}
            onChange={(e) => setPinned(e.target.checked)}
            className="h-4 w-4 accent-white"
          />
          <label htmlFor="pinned" className="text-[11px] text-gray-300">
            Pin this project
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowProjectModal(false)}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-gray-200 hover:border-rose-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveProject}
            disabled={saving}
            className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update project" : "Save project"}
          </button>
        </div>
      </div>
    </div>
  )
}
