"use client"

import Image from "next/image"

type BrandCardProps = {
  title?: string
  description?: string
  logoSrc?: string
}

export function BrandCard({
  title = "XO Labs Social",
  description = "Your social page inside XO Labs.",
  logoSrc = "/logo.png",
}: BrandCardProps) {
  return (
    <div className="glass-panel flex items-center gap-5 rounded-2xl border border-white/10 bg-black/80 px-5 py-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.12]">
        <Image src={logoSrc} alt={title} width={48} height={48} className="h-10 w-10 object-contain" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-gray-100">{title}</p>
        <p className="truncate text-[13px] text-gray-300">{description}</p>
      </div>
    </div>
  )
}
