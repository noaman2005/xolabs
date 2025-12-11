"use client"

import { motion } from "framer-motion"
import { ExternalLink, FolderGit2, ArrowRight, Star, Pencil, Trash2 } from "lucide-react"
import { Project } from "../types"

type Props = {
  project: Project
  index: number
  onClick: () => void
  onTogglePin?: (p: Project) => void
  onEdit?: (p: Project) => void
  onDelete?: (p: Project) => void
}

export function ProjectCard({ project, index, onClick, onTogglePin, onEdit, onDelete }: Props) {
  return (
    <motion.div
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm transition hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      viewport={{ once: true }}
      onClick={onClick}
      whileHover={{ y: -6 }}
    >
      <div className="relative aspect-[4/2] overflow-hidden">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin?.(project)
          }}
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-gray-100 transition hover:bg-black/80"
        >
          <Star className={`h-3.5 w-3.5 ${project.pinned ? "text-amber-300" : "text-gray-400"}`} />
          {project.pinned ? "Pinned" : "Pin"}
        </button>
        {project.coverImage ? (
          <div
            className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${project.coverImage})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.02] text-[11px] text-gray-500">
            No cover
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <motion.div
          className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] text-white"
          initial={{ y: 12, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          View details <ArrowRight className="h-3 w-3" />
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 text-xs text-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-sm font-semibold text-gray-100 group-hover:text-accent transition">
              {project.title}
            </h3>
            <p className="line-clamp-2 text-[11px] text-gray-400">{project.description}</p>
            {project.category ? (
              <span className="inline-flex rounded-full bg-white/10 px-2 py-1 text-[10px] text-gray-100">{project.category}</span>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            {project.status ? (
              <span
                className={`rounded-full px-2 py-1 text-[10px] ${
                  project.status === "Completed" ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-100"
                }`}
              >
                {project.status}
              </span>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(project)
                }}
                className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] text-gray-100 hover:bg-white/10"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(project)
                }}
                className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.techStack?.slice(0, 4).map((tech: string) => (
            <span key={tech} className="rounded-full bg-accent/15 px-2 py-1 text-[10px] text-accent-foreground">
              {tech}
            </span>
          ))}
          {project.tags?.slice(0, 3).map((tag: string) => (
            <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-gray-100">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 text-[11px] text-accent">
          {project.projectUrl ? (
            <span className="inline-flex items-center gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> Live
            </span>
          ) : null}
          {project.githubUrl ? (
            <span className="inline-flex items-center gap-1">
              <FolderGit2 className="h-3.5 w-3.5" /> GitHub
            </span>
          ) : null}
          {typeof project.progress === "number" ? (
            <span className="flex items-center gap-1 text-[10px] text-gray-400">Progress {project.progress}%</span>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
