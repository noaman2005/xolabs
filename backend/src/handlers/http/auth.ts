import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // TODO: validate Cognito access token from Authorization header
  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
    },
    body: JSON.stringify({ ok: true }),
  }
}
