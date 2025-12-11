import { NextResponse } from "next/server"

const clientId = process.env.GITHUB_CLIENT_ID
const callbackUrl = process.env.GITHUB_OAUTH_CALLBACK
const scope = "read:user repo"

export async function GET() {
  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope,
  })

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}
