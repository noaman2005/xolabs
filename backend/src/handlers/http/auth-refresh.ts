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
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : ''

    if (!refreshToken) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'refreshToken is required' }),
      }
    }

    const result = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: USER_POOL_CLIENT_ID,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
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
        body: JSON.stringify({ message: 'Refresh failed' }),
      }
    }

    const { AccessToken, IdToken, ExpiresIn, TokenType } = result.AuthenticationResult

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({
        accessToken: AccessToken,
        idToken: IdToken,
        expiresIn: ExpiresIn,
        tokenType: TokenType,
      }),
    }
  } catch (err: any) {
    console.error('refresh error', err)
    const message = err?.message || 'Refresh failed'
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
