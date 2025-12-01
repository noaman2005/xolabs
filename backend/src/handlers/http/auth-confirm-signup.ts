import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({})
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''

    if (!email || !code) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'email and code are required' }),
      }
    }

    await client.send(
      new ConfirmSignUpCommand({
        ClientId: USER_POOL_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      }),
    )

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({ success: true }),
    }
  } catch (err: any) {
    console.error('confirm signup error', err)
    const message = err?.message || 'Confirmation failed'
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
