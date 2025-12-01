import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({})
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'email and password are required' }),
      }
    }

    const result = await client.send(
      new SignUpCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: 'email', Value: email }],
      }),
    )

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({
        userSub: result.UserSub,
        userConfirmed: result.UserConfirmed,
      }),
    }
  } catch (err: any) {
    console.error('signup error', err)
    const message = err?.message || 'Signup failed'
    return {
      statusCode: 400,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({ message }),
    }
  }
}
