"use client"

export type Repo = {
  id: number
  name: string
  full_name: string
  html_url: string
  private: boolean
  stargazers_count: number
  language: string | null
  updated_at: string
}

export type RepoDetail = {
  full_name: string
  default_branch: string
  open_issues_count: number
  watchers_count: number
  forks_count: number
  stargazers_count: number
  languages: Record<string, number>
  languages_total: number
  approx_loc: number
  commits: {
    message: string
    author: string
    date: string | null
    url?: string
  }[]
  topics: string[]
  readme_html: string | null
}

export type ProjectLink = {
  label: string
  url: string
}

export type Project = {
  id: string
  title: string
  description: string
  tags: string[]
  techStack: string[]
  projectUrl: string
  githubUrl?: string
  createdAt: string
  updatedAt: string
  coverImage?: string
  screenshots?: string[]
  status?: "In progress" | "Completed" | "Planned"
  features?: string[]
  links?: ProjectLink[]
  notes?: string
  progress?: number
  category?: string
  pinned?: boolean
}
