"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Code, ExternalLink, Github, X } from "lucide-react"
import Link from "next/link"
import { Project, ProjectLink } from "../types"

type Props = { project: Project | null; onClose: () => void }

export function ProjectViewModal({ project, onClose }: Props) {
  if (!project) return null
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-black/85 shadow-2xl backdrop-blur-xl"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-64 md:h-80">
            {project.coverImage ? (
              <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/[0.04] text-gray-400">No cover</div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6 p-6 text-sm text-gray-200">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold text-gray-100">{project.title}</h3>
                {project.status ? (
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] ${
                      project.status === "Completed"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-amber-500/20 text-amber-100"
                    }`}
                  >
                    {project.status}
                  </span>
                ) : null}
              </div>
              <p className="text-gray-400">{project.description}</p>
            </div>

            {project.features?.length ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15">
                    <ArrowRight className="h-4 w-4 text-accent-foreground" />
                  </span>
                  Key Features
                </div>
                <ul className="grid gap-2 md:grid-cols-2">
                  {project.features.map((feature: string, idx: number) => (
                    <motion.li
                      key={`${feature}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-2 text-gray-300"
                    >
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            ) : null}

            {project.techStack?.length ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15">
                    <Code className="h-4 w-4 text-accent-foreground" />
                  </span>
                  Technology Stack
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech: string, idx: number) => (
                    <motion.span
                      key={`${tech}-${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="rounded-lg bg-white/5 px-3 py-1.5 text-[12px] text-gray-100"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4 text-[13px]">
              {project.githubUrl ? (
                <Link
                  href={project.githubUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-md bg-white/5 px-4 py-2 text-gray-100 transition hover:bg-white/10"
                >
                  <Github className="h-4 w-4" />
                  GitHub Repo
                </Link>
              ) : null}
              {project.projectUrl ? (
                <Link
                  href={project.projectUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-black transition hover:bg-accent/90"
                >
                  <ExternalLink className="h-4 w-4" />
                  Live Demo
                </Link>
              ) : null}
              {project.links?.map((link: ProjectLink, idx: number) => (
                <Link
                  key={`${link.url}-${idx}`}
                  href={link.url}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-md bg-white/5 px-4 py-2 text-gray-100 transition hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
