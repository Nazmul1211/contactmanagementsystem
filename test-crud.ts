import { server } from "./app";

const port = Number(process.env.PORT) || 3000;
const baseUrl = `http://localhost:${port}`;

async function runTests() {
  console.log(`Starting End-to-End CRUD tests against ${baseUrl}...`);

  try {
    // 1. Root info test
    console.log("\n1. Testing GET /");
    const rootRes = await fetch(`${baseUrl}/`);
    const rootData = await rootRes.json();
    console.log("Status:", rootRes.status, "Message:", rootData.message);
    if (rootRes.status !== 200) throw new Error("Root endpoint failed");

    // Dynamic test emails
    const testEmail = `test_${Date.now()}@example.com`;
    const updateEmail = `updated_${Date.now()}@example.com`;

    // 2. CREATE contact test
    console.log("\n2. Testing POST /contacts (Create)");
    const createRes = await fetch(`${baseUrl}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Johnson",
        email: testEmail,
        phone: "+1-555-0199",
      }),
    });
    const createData = await createRes.json();
    console.log("Status:", createRes.status, "Created Contact ID:", createData.contact?.id);
    if (createRes.status !== 201 || !createData.contact?.id) {
      throw new Error(`Failed to create contact: ${JSON.stringify(createData)}`);
    }
    const createdId = createData.contact.id;

    // 3. READ ALL contacts test
    console.log("\n3. Testing GET /contacts (Read All)");
    const getAllRes = await fetch(`${baseUrl}/contacts`);
    const getAllData = await getAllRes.json();
    console.log("Status:", getAllRes.status, "Total Contacts count:", getAllData.count);
    const found = getAllData.contacts.some((c: any) => c.id === createdId);
    if (!found) throw new Error("Created contact not found in list");

    // 4. READ ONE contact test
    console.log("\n4. Testing GET /contacts/:id (Read One)");
    const getOneRes = await fetch(`${baseUrl}/contacts/${createdId}`);
    const getOneData = await getOneRes.json();
    console.log("Status:", getOneRes.status, "Name:", getOneData.name, "Email:", getOneData.email);
    if (getOneRes.status !== 200 || getOneData.id !== createdId) {
      throw new Error("Failed to get contact by ID");
    }

    // 5. UPDATE contact test (PATCH)
    console.log("\n5. Testing PATCH /contacts/:id (Update)");
    const updateRes = await fetch(`${baseUrl}/contacts/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alice Johnson-Smith",
        email: updateEmail,
        phone: "+1-555-9999",
      }),
    });
    const updateData = await updateRes.json();
    console.log("Status:", updateRes.status, "Updated name:", updateData.contact?.name, "Updated email:", updateData.contact?.email);
    if (updateRes.status !== 200 || updateData.contact?.name !== "Alice Johnson-Smith") {
      throw new Error(`Failed to update contact: ${JSON.stringify(updateData)}`);
    }

    // 6. VALIDATION & DUPLICATE test
    console.log("\n6. Testing duplicate email validation (expected 409)");
    const dupRes = await fetch(`${baseUrl}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: updateEmail, // already used by Alice
        phone: "+1-555-0000",
      }),
    });
    console.log("Duplicate status:", dupRes.status);
    if (dupRes.status !== 409) throw new Error("Expected 409 for duplicate email");

    // 7. DELETE contact test
    console.log("\n7. Testing DELETE /contacts/:id (Delete)");
    const deleteRes = await fetch(`${baseUrl}/contacts/${createdId}`, {
      method: "DELETE",
    });
    const deleteData = await deleteRes.json();
    console.log("Status:", deleteRes.status, "Message:", deleteData.message);
    if (deleteRes.status !== 200) throw new Error("Failed to delete contact");

    // 8. VERIFY DELETED (404)
    console.log("\n8. Testing GET /contacts/:id after delete (expected 404)");
    const verifyRes = await fetch(`${baseUrl}/contacts/${createdId}`);
    console.log("Status (expected 404):", verifyRes.status);
    if (verifyRes.status !== 404) throw new Error("Contact should be 404 after delete");

    console.log("\n=======================================================");
    console.log("🎉 ALL CRUD OPERATIONS PASSED END-TO-END SUCCESSFULLY!");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("\n❌ Test failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode ?? 0);
  }
}

// Give server a brief moment to bind
setTimeout(runTests, 100);
