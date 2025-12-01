import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

const USER_POOL_ID = process.env.USER_POOL_ID as string
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
  throw new Error('USER_POOL_ID and USER_POOL_CLIENT_ID must be set')
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: USER_POOL_CLIENT_ID,
})

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export async function requireUser(event: APIGatewayProxyEventV2) {
  const header = event.headers?.authorization || event.headers?.Authorization

  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing Authorization header')
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = await verifier.verify(token)
    const email = typeof payload.email === 'string' ? payload.email : undefined
    if (!email) {
      throw new UnauthorizedError('Token missing email claim')
    }

    return {
      email,
      sub: payload.sub as string,
    }
  } catch (err: any) {
    console.error('token verification failed', err)
    throw new UnauthorizedError('Invalid token')
  }
}
