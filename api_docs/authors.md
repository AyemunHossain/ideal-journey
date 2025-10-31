# Authors API

Base path: `/authors`

Host (used in rest_client_docs): `http://localhost:3000/api/v1`

## Create author

POST /authors

Example (rest client):

POST {{host}}/authors
Authorization: Bearer {{accessToken}}
Content-Type: application/json

```json
{
  "firstName": "Ernest",
  "lastName": "Hemingway",
  "bio": "American novelist and short-story writer.",
  "birthDate": "1899-07-21"
}
```

## List authors

GET /authors

Example (rest client):

GET {{host}}/authors?page=1&limit=10

Query params:

- page (string number, default '1')
- limit (string number, default '10')
- search (string)

Response: 200

```json
{
  "data": [
    /* array of authors */
  ],
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
}
```

## Get author

GET /authors/{id}

Example (rest client):

GET {{host}}/authors/{{authorId}}

Response: 200 with author object including `books` array

## Update author

PATCH /authors/{id}

Example (rest client):

PATCH {{host}}/authors/{{authorId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json

```json
{
  "bio": "Updated bio text"
}
```

Request body: partial `CreateAuthorDto` fields

Response: 200 with updated author

## Delete author

DELETE /authors/{id}

Example (rest client):

DELETE {{host}}/authors/{{authorId}}
Authorization: Bearer {{accessToken}}

Responses:

- 204 No Content on success
- 409 Conflict if author has associated books
- 404 Not Found if id doesn't exist
