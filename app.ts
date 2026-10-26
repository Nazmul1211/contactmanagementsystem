import express, { type Request, type Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Initialize Database Client
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

const getId = (req: Request): string => {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : (id ?? "");
};

// 1. CREATE CONTACT
app.post("/api/contacts", async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      res.status(400).json({ error: "Name, email, and phone are required" });
      return;
    }

    const contact = await prisma.contactList.create({
      data: { name, email, phone },
    });

    res.status(201).json(contact);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// 2. GET ALL CONTACTS
app.get("/api/contacts", async (_req: Request, res: Response) => {
  try {
    const contacts = await prisma.contactList.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET CONTACT BY ID
app.get("/api/contacts/:id", async (req: Request, res: Response) => {
  try {
    const contact = await prisma.contactList.findUnique({
      where: { id: getId(req) },
    });

    if (!contact) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }

    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. UPDATE CONTACT
app.put("/api/contacts/:id", async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;

    const contact = await prisma.contactList.update({
      where: { id: getId(req) },
      data: { name, email, phone },
    });

    res.json(contact);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
    if (error.code === "P2002") {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE CONTACT
app.delete("/api/contacts/:id", async (req: Request, res: Response) => {
  try {
    await prisma.contactList.delete({
      where: { id: getId(req) },
    });

    res.json({ message: "Contact deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`Contact Management API running on http://localhost:${port}`);
});

export default app;
export { server };
