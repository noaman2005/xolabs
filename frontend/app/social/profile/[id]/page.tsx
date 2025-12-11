"use client"

import { use } from "react"

import { ProfileView } from "../ProfileView"

type Props = {
  params: Promise<{ id: string }>
}

export default function SocialProfileByIdPage({ params }: Props) {
  const { id } = use(params)
  const targetId = decodeURIComponent(id || "me")
  return <ProfileView targetId={targetId} />
}
