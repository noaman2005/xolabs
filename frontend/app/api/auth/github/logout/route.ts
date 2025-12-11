import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("GITHUB_TOKEN", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  return res
}
