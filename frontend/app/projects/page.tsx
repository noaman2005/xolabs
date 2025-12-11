"use client"

import { Plus } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Project, ProjectLink } from "./types"
import { ProjectCard } from "./components/ProjectCard"
import { ProjectViewModal } from "./components/ProjectViewModal"
import { ProjectFormModal } from "./components/ProjectFormModal"
import { CommandPalette } from "../components/CommandPalette"
import { useActivity } from "../components/ActivityProvider"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingProject, setViewingProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState<Project>({
    id: "",
    title: "",
    description: "",
    tags: [],
    techStack: [],
    projectUrl: "",
    githubUrl: "",
    createdAt: "",
    updatedAt: "",
    coverImage: "",
    screenshots: [],
    status: "In progress",
    features: [],
    links: [],
    notes: "",
    progress: 0,
    category: "",
    pinned: false,
  })
  const [tagsInput, setTagsInput] = useState("")
  const [techInput, setTechInput] = useState("")
  const [featuresInput, setFeaturesInput] = useState("")
  const [screensInput, setScreensInput] = useState("")
  const [linksInput, setLinksInput] = useState("")
  const [coverPreview, setCoverPreview] = useState<string>("")
  const [coverDataUrl, setCoverDataUrl] = useState<string>("")
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([])
  const [screenshotDataUrls, setScreenshotDataUrls] = useState<string[]>([])
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"In progress" | "Completed" | "Planned" | "">("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [techFilter, setTechFilter] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "za">("newest")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const categories = ["Web", "Mobile", "AI", "School", "Backend", "UI/UX"]
  const persistKey = "projects_filters_v1"
  const queryClient = useQueryClient()
  const { push } = useActivity()

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === "undefined") return {}
    const token = window.localStorage.getItem("idToken")
    if (token) return { Authorization: `Bearer ${token}` }

    const cookie = document.cookie || ""
    const map = Object.fromEntries(
      cookie
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const [k, ...rest] = c.split("=")
          return [k, rest.join("=")]
        })
    )
    const session = map["__Secure-next-auth.session-token"] || map["next-auth.session-token"]
    if (session) return { Authorization: `Bearer ${decodeURIComponent(session)}` }
    const gh = map["GITHUB_TOKEN"]
    if (gh) return { Authorization: `Bearer ${decodeURIComponent(gh)}` }
    return {}
  }

  const fetchProjects = useCallback(async () => {
    const resp = await fetch("/api/projects", {
      cache: "no-store",
      headers: getAuthHeaders(),
      credentials: "include",
    })
    if (!resp.ok) {
      throw new Error("Failed to load projects")
    }
    const data = await resp.json()
    return Array.isArray(data) ? data : []
  }, [])

  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsErrorObj,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })

  useEffect(() => {
    if (projectsData) setProjects(projectsData)
    setProjectsError(projectsErrorObj ? "Could not load projects" : null)
  }, [projectsData, projectsErrorObj])

  // Load persisted filters/sort
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(persistKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        setSearch(parsed.search ?? "")
        setStatusFilter(parsed.statusFilter ?? "")
        setCategoryFilter(parsed.categoryFilter ?? "")
        setTechFilter(parsed.techFilter ?? "")
        setTagFilter(parsed.tagFilter ?? "")
        setSortBy(parsed.sortBy ?? "newest")
        setDateFrom(parsed.dateFrom ?? "")
        setDateTo(parsed.dateTo ?? "")
      }
    } catch (e) {
      // ignore bad storage
    }
  }, [])

  // Persist filters/sort
  useEffect(() => {
    if (typeof window === "undefined") return
    const payload = {
      search,
      statusFilter,
      categoryFilter,
      techFilter,
      tagFilter,
      sortBy,
      dateFrom,
      dateTo,
    }
    window.localStorage.setItem(persistKey, JSON.stringify(payload))
  }, [search, statusFilter, categoryFilter, techFilter, tagFilter, sortBy, dateFrom, dateTo])

  const resetProjectForm = () =>
    setNewProject({
      id: "",
      title: "",
      description: "",
      tags: [],
      techStack: [],
      projectUrl: "",
      githubUrl: "",
      createdAt: "",
      updatedAt: "",
      coverImage: "",
      screenshots: [],
      status: "In progress",
      features: [],
      links: [],
      notes: "",
      progress: 0,
      category: "",
      pinned: false,
    })

  const resetInputs = () => {
    setTagsInput("")
    setTechInput("")
    setFeaturesInput("")
    setScreensInput("")
    setLinksInput("")
    setCoverPreview("")
    setCoverDataUrl("")
    setScreenshotPreviews([])
    setScreenshotDataUrls([])
  }

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "")
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleSaveProject = async () => {
    const errs: string[] = []
    const isUrl = (val: string) => /^https?:\/\//i.test(val.trim())
    if (!newProject.title.trim()) errs.push("Title is required.")
    if (!newProject.description.trim()) errs.push("Description is required.")
    if (!newProject.projectUrl.trim()) errs.push("Project URL is required.")
    if (newProject.projectUrl.trim() && !isUrl(newProject.projectUrl)) errs.push("Project URL must start with http(s).")
    if (newProject.githubUrl && newProject.githubUrl.trim() && !isUrl(newProject.githubUrl))
      errs.push("GitHub URL must start with http(s).")
    if (errs.length) {
      setFormErrors(errs)
      return
    }
    setFormErrors([])
    const now = new Date().toISOString()
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const techStack = techInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const features = featuresInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const screenshots = screensInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    const links = linksInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, url] = line.split("|").map((x) => x.trim())
        return label && url ? { label, url } : null
      })
      .filter(Boolean) as ProjectLink[]

    const project: Project = {
      ...newProject,
      id: editingId || `p-${Date.now()}`,
      createdAt: editingId ? newProject.createdAt || now : now,
      updatedAt: now,
      tags,
      techStack,
      features,
      links,
      screenshots: screenshotDataUrls.length > 0 ? screenshotDataUrls : screenshots,
      coverImage: coverDataUrl || newProject.coverImage,
      progress: Math.min(100, Math.max(0, newProject.progress || 0)),
    }

    try {
      setSaving(true)
      const resp = await fetch(`/api/projects${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "content-type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(project),
        credentials: "include",
      })
      if (!resp.ok) {
        throw new Error("Failed to save project")
      }
      const saved = (await resp.json()) as Project
      setProjects((prev) => {
        if (editingId) {
          return prev.map((p) => (p.id === editingId ? saved : p))
        }
        return [saved, ...prev]
      })
      resetProjectForm()
      resetInputs()
      setEditingId(null)
      setShowProjectModal(false)
    } catch (e) {
      setProjectsError("Could not save project")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingId(project.id)
    setViewingProject(null)
    setNewProject({
      ...project,
    })
    setTagsInput((project.tags || []).join(", "))
    setTechInput((project.techStack || []).join(", "))
    setFeaturesInput((project.features || []).join(", "))
    setScreensInput((project.screenshots || []).join(", "))
    setLinksInput(
      (project.links || [])
        .map((l) => (l.label && l.url ? `${l.label}|${l.url}` : ""))
        .filter(Boolean)
        .join("\n")
    )
    setCoverPreview(project.coverImage || "")
    setCoverDataUrl(project.coverImage || "")
    setScreenshotPreviews(project.screenshots || [])
    setScreenshotDataUrls(project.screenshots || [])
    setShowProjectModal(true)
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = typeof window !== "undefined" ? window.confirm("Delete this project?") : true
    if (!confirmDelete) return
    try {
      setProjects((prev) => prev.filter((p) => p.id !== id))
      const resp = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
        credentials: "include",
      })
      if (!resp.ok) {
        throw new Error("Failed to delete")
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      push("Project deleted")
    } catch (e) {
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
      setProjectsError("Could not delete project")
    }
  }

  const togglePinned = async (project: Project) => {
    const nextPinned = !project.pinned
    const updated = { ...project, pinned: nextPinned, updatedAt: new Date().toISOString() }
    try {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)))
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updated),
        credentials: "include",
      })
    } catch (e) {
      // rollback
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)))
    }
  }

  const analytics = {
    total: projects.length,
    completed: projects.filter((p) => p.status === "Completed").length,
    inProgress: projects.filter((p) => p.status === "In progress").length,
  }

  const filtered = projects
    .filter((p) => {
      const q = search.toLowerCase()
      if (q) {
        const hay = `${p.title} ${p.tags?.join(" ")} ${p.techStack?.join(" ")}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (statusFilter && p.status !== statusFilter) return false
      if (categoryFilter && p.category !== categoryFilter) return false
      if (techFilter && !p.techStack.some((t) => t.toLowerCase().includes(techFilter.toLowerCase()))) return false
      if (tagFilter && !p.tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) return false
      if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false
      if (dateTo && new Date(p.createdAt) > new Date(dateTo)) return false
      return true
    })

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sortBy === "az") return a.title.localeCompare(b.title)
    if (sortBy === "za") return b.title.localeCompare(a.title)
    return 0
  })


  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-6 text-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Projects</h1>
          <p className="text-sm text-gray-500">Curate your projects.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              resetProjectForm()
              resetInputs()
              setEditingId(null)
              setShowProjectModal(true)
            }}
            className="smooth-transition inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white/90"
          >
            <Plus className="h-4 w-4" /> Add project
          </button>
        </div>
      </header>

      <section className="glass-panel rounded-2xl border border-white/10 bg-black/70 p-4">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {[analytics.total, analytics.completed, analytics.inProgress].map((val, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-100"
            >
              <p className="text-[11px] text-gray-400">
                {idx === 0 ? "Total projects" : idx === 1 ? "Completed" : "In progress"}
              </p>
              <p className={`text-2xl font-semibold ${idx === 1 ? "text-emerald-300" : idx === 2 ? "text-amber-200" : ""}`}>
                {projectsLoading ? "—" : val}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, tags, tech..."
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
          >
            <option value="">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="In progress">In progress</option>
            <option value="Planned">Planned</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
          <input
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            placeholder="Filter by tech"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
          />
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Filter by tag"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent"
          />
        </div>

        {projectsLoading && <p className="text-xs text-gray-500">Loading projects...</p>}
        {projectsError && <p className="text-xs text-rose-400">{projectsError}</p>}
        {!projectsLoading && !projectsError && projects.length === 0 ? (
          <p className="text-xs text-gray-400">No projects yet. Add your first project to start the library.</p>
        ) : null}
        {projectsLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm animate-pulse space-y-3"
              >
                <div className="h-32 w-full rounded-xl bg-white/5" />
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-white/10" />
                  <div className="h-6 w-12 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : !projectsError && sorted.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sorted.map((project, idx) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={idx}
                onClick={() => setViewingProject(project)}
                onTogglePin={togglePinned}
                onEdit={handleEdit}
                onDelete={(p) => handleDelete(p.id)}
              />
            ))}
          </div>
        ) : null}
      </section>

      <ProjectFormModal
        open={showProjectModal}
        editingId={editingId}
        newProject={newProject}
        setNewProject={setNewProject}
        tagsInput={tagsInput}
        setTagsInput={setTagsInput}
        techInput={techInput}
        setTechInput={setTechInput}
        featuresInput={featuresInput}
        setFeaturesInput={setFeaturesInput}
        screensInput={screensInput}
        setScreensInput={setScreensInput}
        linksInput={linksInput}
        setLinksInput={setLinksInput}
        coverPreview={coverPreview}
        setCoverPreview={setCoverPreview}
        setCoverDataUrl={setCoverDataUrl}
        screenshotPreviews={screenshotPreviews}
        setScreenshotPreviews={setScreenshotPreviews}
        setScreenshotDataUrls={setScreenshotDataUrls}
        fileToDataUrl={fileToDataUrl}
        handleSaveProject={handleSaveProject}
        setShowProjectModal={setShowProjectModal}
        saving={saving}
        categories={categories}
        setPinned={(val: boolean) => setNewProject((p) => ({ ...p, pinned: val }))}
        formErrors={formErrors}
      />

      {/* View project modal (read-only) */}
      <ProjectViewModal project={viewingProject} onClose={() => setViewingProject(null)} />
    </main>
  )
}
