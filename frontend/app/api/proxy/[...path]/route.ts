import { NextResponse } from 'next/server'

const UPSTREAM = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''

export async function GET(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, await context.params)
}
export async function POST(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, await context.params)
}
export async function PUT(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, await context.params)
}
export async function PATCH(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, await context.params)
}
export async function DELETE(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  return proxy(req, await context.params)
}
export async function OPTIONS(req: Request, context: { params: Promise<{ path?: string[] }> }) {
  // Pass-through preflight to upstream so we still get proper auth handling
  return proxy(req, await context.params)
}

async function proxy(req: Request, params: { path?: string[] }) {
  if (!UPSTREAM) {
    return NextResponse.json({ error: 'Upstream API URL not configured' }, { status: 500 })
  }

  const path = `/${(params.path || []).join('/')}`
  const url = new URL(req.url)
  const search = url.search ? url.search : ''
  const target = `${UPSTREAM}${path}${search}`

  const headers = new Headers(req.headers)
  // Ensure host is not forwarded
  headers.delete('host')
  headers.set('accept', headers.get('accept') || '*/*')

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await req.arrayBuffer()
    init.body = body
  }

  const upstreamRes = await fetch(target, init)
  const respHeaders = new Headers(upstreamRes.headers)
  // Allow browser to read response
  respHeaders.set('access-control-allow-origin', '*')

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: respHeaders,
  })
}
