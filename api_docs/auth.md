# Auth API

Base path: `/auth`

Host (used in rest_client_docs): `http://localhost:3000/api/v1`

## Signup

POST /auth/signup

Example (rest client):

POST {{host}}/auth/signup
Content-Type: application/json

```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!",
  "firstName": "John",
  "lastName": "Doe"
}
```

Request body:

- email (string, required)
- password (string, required, min 8)

Response: 201 Created — returns `Profile` object

## Signin

POST /auth/signin

Example (rest client):

POST {{host}}/auth/signin
Content-Type: application/json

```json
{
  "email": "user@example.com",
  "password": "P@ssw0rd!"
}
```

Request body:

- email (string, required)
- password (string, required)

Response: 200 OK — returns `AuthTokens`:

- accessToken
- refreshToken

Notes: The controller captures IP address and user-agent for signin.

## Refresh tokens

POST /auth/refresh

Example (rest client):

POST {{host}}/auth/refresh
Authorization: Bearer {{refreshToken}}

Protected by refresh-token guard. Returns new `AuthTokens` on success.

## Logout

POST /auth/logout

Example (rest client):

POST {{host}}/auth/logout
Authorization: Bearer {{accessToken}}

Requires Authorization: Bearer <accessToken>
Response: 200 OK — invalidates refresh token server-side

## Profile

GET /auth/profile

Example (rest client):

GET {{host}}/auth/profile
Authorization: Bearer {{accessToken}}

Requires Authorization: Bearer <accessToken>
Response: 200 OK — returns `Profile` object

## Change password

PATCH /auth/change-password

Example (rest client):

PATCH {{host}}/auth/change-password
Authorization: Bearer {{accessToken}}
Content-Type: application/json

```json
{
  "currentPassword": "P@ssw0rd!",
  "newPassword": "N3wP@ssw0rd!"
}
```

Requires Authorization: Bearer <accessToken>
Request body:

- currentPassword (string, required)
- newPassword (string, required, min 8)

Response: 200 OK

## Status

GET /auth/status

Example (rest client):

GET {{host}}/auth/status
Authorization: Bearer {{accessToken}}

Requires Authorization: Bearer <accessToken>
Response: 200 OK — returns authentication status and brief user info:

```
{
  "isAuthenticated": true,
  "user": {
    "userId": "...",
    "email": "...",
    "role": "..."
  }
}
```

Errors

- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden (as applicable)
