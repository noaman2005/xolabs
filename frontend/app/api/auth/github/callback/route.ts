import { NextResponse } from "next/server"

const clientId = process.env.GITHUB_CLIENT_ID
const clientSecret = process.env.GITHUB_CLIENT_SECRET
const callbackUrl = process.env.GITHUB_OAUTH_CALLBACK

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!clientId || !clientSecret || !callbackUrl) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 })
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 })
  }

  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
    }),
  })

  if (!tokenResp.ok) {
    return NextResponse.json({ error: "Failed to exchange code" }, { status: 500 })
  }

  const tokenJson = (await tokenResp.json()) as { access_token?: string; token_type?: string }
  const accessToken = tokenJson.access_token
  if (!accessToken) {
    return NextResponse.json({ error: "No access token returned" }, { status: 500 })
  }

  const res = NextResponse.redirect(new URL("/projects", request.url))
  res.cookies.set("GITHUB_TOKEN", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
