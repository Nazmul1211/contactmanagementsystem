# Contact Management API

A small REST API for managing contacts, built with Bun, Express, Prisma, and PostgreSQL.

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Ensure your `.env` file contains your PostgreSQL connection string:

```env
DATABASE_URL="postgres://user:password@localhost:5432/postgres?sslmode=require"
PORT=3000
```

### 3. Generate Prisma Client & Migrate

```bash
bun run db:generate
bun run db:migrate
```

### 4. Run the Application

```bash
# Development (with hot reloading)
bun run dev

# Production
bun run start
```

The API starts on `http://localhost:3000` by default.

---

## Data Model

Each contact in PostgreSQL (`model ContactList`):

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | UUID automatically generated |
| `name` | `String` | Contact name (required) |
| `email` | `String` | Contact email (required, unique) |
| `phone` | `String` | Contact phone number (required) |
| `createdAt` | `DateTime` | Creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

---

## API Endpoints

All endpoints are prefixed with `/api/contacts`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/contacts` | Create a new contact |
| `GET` | `/api/contacts` | Retrieve all contacts (ordered by newest first) |
| `GET` | `/api/contacts/:id` | Retrieve a single contact by ID |
| `PUT` | `/api/contacts/:id` | Update an existing contact by ID |
| `DELETE` | `/api/contacts/:id` | Delete a contact by ID |

---

## Example Requests

### 1. Create a Contact

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Freeman",
    "email": "alice.freeman@example.com",
    "phone": "+1-555-0101"
  }'
```

**Response (`201 Created`):**
```json
{
  "id": "1fba0a5f-c799-4ca2-8c17-8eb15e03cc50",
  "name": "Alice Freeman",
  "email": "alice.freeman@example.com",
  "phone": "+1-555-0101",
  "createdAt": "2026-10-26T08:38:05.254Z",
  "updatedAt": "2026-10-26T08:38:05.254Z"
}
```

### 2. Get All Contacts

```bash
curl http://localhost:3000/api/contacts
```

**Response (`200 OK`):**
```json
[
  {
    "id": "1fba0a5f-c799-4ca2-8c17-8eb15e03cc50",
    "name": "Alice Freeman",
    "email": "alice.freeman@example.com",
    "phone": "+1-555-0101",
    "createdAt": "2026-10-26T08:38:05.254Z",
    "updatedAt": "2026-10-26T08:38:05.254Z"
  }
]
```

### 3. Get Contact by ID

```bash
curl http://localhost:3000/api/contacts/1fba0a5f-c799-4ca2-8c17-8eb15e03cc50
```

### 4. Update a Contact

```bash
curl -X PUT http://localhost:3000/api/contacts/1fba0a5f-c799-4ca2-8c17-8eb15e03cc50 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Freeman-Smith",
    "email": "alice.smith@example.com",
    "phone": "+1-555-9999"
  }'
```

### 5. Delete a Contact

```bash
curl -X DELETE http://localhost:3000/api/contacts/1fba0a5f-c799-4ca2-8c17-8eb15e03cc50
```

**Response (`200 OK`):**
```json
{
  "message": "Contact deleted successfully"
}
```

---

## Error Handling

Standard JSON error format `{ "error": "description" }`:

| Status Code | Meaning |
| :--- | :--- |
| `400 Bad Request` | Missing required fields (`name`, `email`, or `phone`) |
| `404 Not Found` | Contact with specified ID not found |
| `409 Conflict` | Contact with this email address already exists |
| `500 Server Error`| Internal server or database error |

---

## Testing with Postman

A ready-to-use Postman collection is included in the project:
[`ContactManagementSystem.postman_collection.json`](./ContactManagementSystem.postman_collection.json)

### How to use:
1. Open **Postman** and click **Import**.
2. Select `ContactManagementSystem.postman_collection.json`.
3. Set the `baseUrl` variable (defaults to `http://localhost:3000`).
4. Execute the requests:
   - **Create Contact**: Automatically saves the created `contactId` variable.
   - **Get All Contacts**: Retrieves all records.
   - **Get Contact by ID**: Uses the saved `contactId`.
   - **Update Contact**: Updates the saved contact.
   - **Delete Contact**: Deletes the saved contact.
