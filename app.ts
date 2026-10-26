import express, { type Request, type Response, type NextFunction } from "express";
import { prisma } from "./lib/prisma";

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Helper function to extract and normalize route parameter id
const getId = (req: Request): string => {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : (id ?? "");
};

// Helper function to validate email
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Root endpoint: API overview
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Contact Management API is running",
    endpoints: {
      "GET /contacts": "Get all contacts",
      "GET /contacts/:id": "Get a contact by ID",
      "POST /contacts": "Create a new contact (requires name, email, phone)",
      "PUT /contacts/:id": "Update a contact by ID",
      "PATCH /contacts/:id": "Partially update a contact by ID",
      "DELETE /contacts/:id": "Delete a contact by ID",
    },
  });
});

// ==========================================
// CRUD Operations
// ==========================================

// 1. CREATE: POST /contacts (and /api/contacts)
const handleCreateContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone } = req.body ?? {};

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    if (!email || typeof email !== "string" || email.trim() === "") {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }
    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      res.status(400).json({ error: "Phone is required" });
      return;
    }

    // Check if email already exists
    const existing = await prisma.contactList.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      res.status(409).json({ error: "A contact with this email already exists" });
      return;
    }

    const contact = await prisma.contactList.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
      },
    });

    res.status(201).json({
      message: "Contact created successfully",
      contact,
    });
  } catch (error) {
    next(error);
  }
};

app.post("/contacts", handleCreateContact);
app.post("/api/contacts", handleCreateContact);

// 2. READ ALL: GET /contacts (and /api/contacts)
const handleGetAllContacts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const contacts = await prisma.contactList.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    next(error);
  }
};

app.get("/contacts", handleGetAllContacts);
app.get("/api/contacts", handleGetAllContacts);

// 3. READ ONE: GET /contacts/:id (and /api/contacts/:id)
const handleGetContactById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getId(req);
    const contact = await prisma.contactList.findUnique({
      where: { id },
    });

    if (!contact) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    res.json(contact);
  } catch (error) {
    next(error);
  }
};

app.get("/contacts/:id", handleGetContactById);
app.get("/api/contacts/:id", handleGetContactById);

// 4. UPDATE: PUT/PATCH /contacts/:id (and /api/contacts/:id)
const handleUpdateContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getId(req);
    const { name, email, phone } = req.body ?? {};

    const existing = await prisma.contactList.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    const updateData: { name?: string; email?: string; phone?: string } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        res.status(400).json({ error: "Name cannot be empty" });
        return;
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || email.trim() === "") {
        res.status(400).json({ error: "Email cannot be empty" });
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }
      if (cleanEmail !== existing.email) {
        const emailTaken = await prisma.contactList.findUnique({
          where: { email: cleanEmail },
        });
        if (emailTaken) {
          res.status(409).json({ error: "A contact with this email already exists" });
          return;
        }
      }
      updateData.email = cleanEmail;
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.trim() === "") {
        res.status(400).json({ error: "Phone cannot be empty" });
        return;
      }
      updateData.phone = phone.trim();
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "Please provide at least one field to update (name, email, or phone)" });
      return;
    }

    const updated = await prisma.contactList.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "Contact updated successfully",
      contact: updated,
    });
  } catch (error) {
    next(error);
  }
};

app.put("/contacts/:id", handleUpdateContact);
app.patch("/contacts/:id", handleUpdateContact);
app.put("/api/contacts/:id", handleUpdateContact);
app.patch("/api/contacts/:id", handleUpdateContact);

// 5. DELETE: DELETE /contacts/:id (and /api/contacts/:id)
const handleDeleteContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getId(req);
    const existing = await prisma.contactList.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    await prisma.contactList.delete({
      where: { id },
    });

    res.json({
      message: "Contact deleted successfully",
      deletedContact: existing,
    });
  } catch (error) {
    next(error);
  }
};

app.delete("/contacts/:id", handleDeleteContact);
app.delete("/api/contacts/:id", handleDeleteContact);

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Contact Management API running on http://localhost:${port}`);
});

export default app;
export { server, prisma };
