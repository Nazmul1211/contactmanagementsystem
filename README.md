# Contact Management API

A small REST API for managing contacts, built with Bun, Express, Prisma, and PostgreSQL.

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Add your PostgreSQL connection string to `.env`:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/contacts"
   ```

3. Apply the database migrations and generate the Prisma client:

   ```bash
   bun run db:migrate
   bun run db:generate
   ```

4. Start the API:

   ```bash
   bun run dev
   ```

The API runs at `http://localhost:3000` by default. Set `PORT` to change it.

## Data model

Each contact has:

| Field       | Type     | Notes                        |
| ----------- | -------- | ---------------------------- |
| `id`        | `string` | UUID generated automatically |
| `name`      | `string` | Required                     |
| `email`     | `string` | Required, unique             |
| `phone`     | `string` | Required                     |
| `createdAt` | `Date`   | Set automatically            |
| `updatedAt` | `Date`   | Updated automatically        |

## Endpoints

| Method   | Endpoint            | Description                              |
| -------- | ------------------- | ---------------------------------------- |
| `POST`   | `/api/contacts`     | Create a new contact                     |
| `GET`    | `/api/contacts`     | Retrieve all contacts                    |
| `GET`    | `/api/contacts/:id` | Retrieve a single contact                |
| `PUT`    | `/api/contacts/:id` | Update a contact (partial updates allowed) |
| `PATCH`  | `/api/contacts/:id` | Same as `PUT`                            |
| `DELETE` | `/api/contacts/:id` | Delete a contact                         |

### Create a contact

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Doe","email":"alice@example.com","phone":"+1 555 0100"}'
```

`201 Created`:

```json
{
  "id": "b5398f07-106f-4699-9282-af91d9ee2312",
  "name": "Alice Doe",
  "email": "alice@example.com",
  "phone": "+1 555 0100",
  "createdAt": "2026-10-26T06:49:26.668Z",
  "updatedAt": "2026-10-26T06:49:26.668Z"
}
```

### Update a contact

Send only the fields that need to change:

```bash
curl -X PUT http://localhost:3000/api/contacts/<id> \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1 555 0199"}'
```

### Delete a contact

```bash
curl -X DELETE http://localhost:3000/api/contacts/<id>
```

Returns `204 No Content`.

### Errors

Errors use an `error` field with an appropriate status code:

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| `400`  | Missing or invalid required fields, or invalid JSON        |
| `404`  | Contact not found                                          |
| `409`  | A contact with the same email address already exists       |
| `500`  | Unexpected server error                                    |

## Connecting a Next.js frontend

The API enables CORS so a Next.js app can call it directly. In the frontend's
`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Then fetch the contacts from a server component:

```tsx
async function getContacts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load contacts");

  return res.json();
}
```

If both apps need port `3000`, start the API on another port and allow the
frontend origin:

```bash
PORT=3001 CORS_ORIGIN=http://localhost:3000 bun run dev
```
# contactmanagementsystem
