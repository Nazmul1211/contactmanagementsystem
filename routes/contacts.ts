import { Router, type Request } from "express";
import catchAsync from "../catchAsync";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";

const router = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactFields = {
  name: string;
  email: string;
  phone: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${field} is required`);
  }

  return value.trim();
}

function readEmail(value: unknown): string {
  const email = readString(value, "Email").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new HttpError(400, "Email must be a valid email address");
  }

  return email;
}

function parseContact(body: unknown): ContactFields {
  if (!isObject(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  return {
    name: readString(body.name, "Name"),
    email: readEmail(body.email),
    phone: readString(body.phone, "Phone"),
  };
}

function parseContactUpdate(body: unknown): Partial<ContactFields> {
  if (!isObject(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  const data: Partial<ContactFields> = {};

  if (body.name !== undefined) data.name = readString(body.name, "Name");
  if (body.email !== undefined) data.email = readEmail(body.email);
  if (body.phone !== undefined) data.phone = readString(body.phone, "Phone");

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "Provide at least one of name, email, or phone");
  }

  return data;
}

async function findContact(id: string) {
  const contact = await prisma.contactList.findUnique({ where: { id } });

  if (!contact) {
    throw new HttpError(404, "Contact not found");
  }

  return contact;
}

function readContactId(req: Request): string {
  const { id } = req.params;

  if (typeof id !== "string" || id === "") {
    throw new HttpError(400, "Invalid contact id");
  }

  return id;
}

// GET /api/contacts
router.get(
  "/",
  catchAsync(async (_req, res) => {
    const contacts = await prisma.contactList.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(contacts);
  }),
);

// GET /api/contacts/:id
router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const contact = await findContact(readContactId(req));
    res.json(contact);
  }),
);

// POST /api/contacts
router.post(
  "/",
  catchAsync(async (req, res) => {
    const contact = await prisma.contactList.create({
      data: parseContact(req.body),
    });

    res.status(201).json(contact);
  }),
);

// PUT /api/contacts/:id (PATCH is supported too)
const updateContact = catchAsync(async (req, res) => {
  const contact = await findContact(readContactId(req));
  const updated = await prisma.contactList.update({
    where: { id: contact.id },
    data: parseContactUpdate(req.body),
  });

  res.json(updated);
});

router.put("/:id", updateContact);
router.patch("/:id", updateContact);



// DELETE /api/contacts/:id
router.delete(
  "/:id",
  catchAsync(async (req, res) => {
    const contact = await findContact(readContactId(req));

    await prisma.contactList.delete({ where: { id: contact.id } });

    res.status(204).send();
  }),
);


export default router;
