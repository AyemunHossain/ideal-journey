# Books API

Base path: `/books`

Host (used in rest_client_docs): `http://localhost:3000/api/v1`

## Create book

POST /books

Example (rest client):

POST {{host}}/books
Authorization: Bearer {{accessToken}}
Content-Type: application/json

```json
{
  "title": "The Old Man and the Sea",
  "isbn": "978-0684801223",
  "publishedDate": "1952-09-01",
  "genre": "Fiction",
  "authorId": "{{authorId}}"
}
```

Errors:

- 400 Bad Request if authorId does not exist
- 409 Conflict if ISBN already exists

## List books

GET /books

Example (rest client):

GET {{host}}/books?page=1&limit=10

Query params:

- page (string number, default '1')
- limit (string number, default '10')
- search (string)
- authorId (UUID) — filter by author

Response: 200 with paginated list: `data` and `meta`

## Get book

GET /books/{id}

Example (rest client):

GET {{host}}/books/{{bookId}}

Response: 200 with book (includes `author` object)

## Update book

PATCH /books/{id}

Example (rest client):

PATCH {{host}}/books/{{bookId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json

```json
{
  "title": "The Old Man and the Sea (Revised Edition)",
  "genre": "Classic Fiction"
}
```

Request body: partial `CreateBookDto` fields except `authorId` (omitted for update in DTO)

Response: 200 with updated book

## Delete book

DELETE /books/{id}

Example (rest client):

DELETE {{host}}/books/{{bookId}}
Authorization: Bearer {{accessToken}}

Response: 204 No Content
