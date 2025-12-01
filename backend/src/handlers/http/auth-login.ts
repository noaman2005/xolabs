import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
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
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: USER_POOL_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }),
    )

    if (!result.AuthenticationResult) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Authentication failed' }),
      }
    }

    const { AccessToken, IdToken, RefreshToken, ExpiresIn, TokenType } =
      result.AuthenticationResult

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
        expiresIn: ExpiresIn,
        tokenType: TokenType,
        email,
      }),
    }
  } catch (err: any) {
    console.error('login error', err)
    const message = err?.message || 'Login failed'
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
