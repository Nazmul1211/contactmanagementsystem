import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { server } from "./app";

const port = Number(process.env.PORT) || 3000;
const baseUrl = `http://localhost:${port}`;

describe("Contact Management System CRUD API", () => {
  let createdContactId: string;
  const uniqueId = Date.now();
  const testEmail = `bun_test_${uniqueId}@example.com`;
  const updatedEmail = `bun_updated_${uniqueId}@example.com`;

  afterAll(() => {
    server.close();
  });

  test("GET / returns API overview", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Contact Management API is running");
  });

  test("POST /contacts creates a new contact", async () => {
    const res = await fetch(`${baseUrl}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Contact",
        email: testEmail,
        phone: "+1-555-4321",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.contact).toBeDefined();
    expect(body.contact.name).toBe("Test Contact");
    expect(body.contact.email).toBe(testEmail);
    expect(body.contact.phone).toBe("+1-555-4321");
    createdContactId = body.contact.id;
  });

  test("POST /contacts rejects duplicate email with 409", async () => {
    const res = await fetch(`${baseUrl}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Contact",
        email: testEmail,
        phone: "+1-555-0000",
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already exists");
  });

  test("GET /contacts returns all contacts including the created one", async () => {
    const res = await fetch(`${baseUrl}/contacts`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.contacts)).toBe(true);
    const exists = body.contacts.some((c: any) => c.id === createdContactId);
    expect(exists).toBe(true);
  });

  test("GET /contacts/:id retrieves single contact", async () => {
    const res = await fetch(`${baseUrl}/contacts/${createdContactId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdContactId);
    expect(body.email).toBe(testEmail);
  });

  test("PUT /contacts/:id updates contact info", async () => {
    const res = await fetch(`${baseUrl}/contacts/${createdContactId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Name",
        email: updatedEmail,
        phone: "+1-555-8888",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contact.name).toBe("Updated Name");
    expect(body.contact.email).toBe(updatedEmail);
  });

  test("DELETE /contacts/:id deletes contact", async () => {
    const res = await fetch(`${baseUrl}/contacts/${createdContactId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("deleted successfully");
  });

  test("GET /contacts/:id returns 404 after deletion", async () => {
    const res = await fetch(`${baseUrl}/contacts/${createdContactId}`);
    expect(res.status).toBe(404);
  });
});
