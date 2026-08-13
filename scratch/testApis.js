// Integration test runner to verify REST API CRUD operations
const API_BASE = 'http://localhost:3000/api/invoices';

async function runTests() {
  console.log("=== STARTING API INTEGRATION TESTS ===");
  
  const testId = `test-inv-${Date.now()}`;
  const testInvoice = {
    id: testId,
    invoiceNo: "INV-999",
    invoiceDate: "05.07.2026",
    customerName: "TEST CLIENT",
    customerLocation: "TEST LAND",
    hasGst: true,
    gstDetails: { cgst: 9, sgst: 9, igst: 0 },
    hasTransporter: true,
    vehicleNo: "TS 09 TEST 1234",
    items: [
      { name: "Test Bed", description: "Foam specs", quantity: 2, unit: "Set", price: 10000 },
      { name: "Test Chair", description: "Wood specs", quantity: 4, unit: "Nos", price: 2000 }
    ]
  };

  try {
    // 1. Test POST (Create)
    console.log("\n1. Testing POST (Create Invoice)...");
    const postRes = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testInvoice)
    });
    if (postRes.status !== 201) throw new Error(`POST failed with status ${postRes.status}`);
    const postData = await postRes.json();
    console.log("✅ POST successful:", postData);

    // 2. Test GET (Fetch all and find our test ID)
    console.log("\n2. Testing GET (Fetch All Invoices)...");
    const getRes = await fetch(API_BASE);
    if (!getRes.ok) throw new Error(`GET failed with status ${getRes.status}`);
    const invoices = await getRes.json();
    const found = invoices.find(inv => inv.id === testId);
    if (!found) throw new Error("GET failed: Created invoice not found in list");
    console.log("✅ GET successful. Found invoice:");
    console.log(`   ID: ${found.id}, No: ${found.invoiceNo}, Items: ${found.items.length}`);

    // 3. Test PUT (Update)
    console.log("\n3. Testing PUT (Update Invoice)...");
    const updatedInvoice = {
      ...testInvoice,
      customerName: "TEST CLIENT UPDATED",
      items: [
        { name: "Test Bed", description: "Foam specs", quantity: 3, unit: "Set", price: 10000 } // Modified quantity, removed chair
      ]
    };
    const putRes = await fetch(`${API_BASE}/${testId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedInvoice)
    });
    if (!putRes.ok) throw new Error(`PUT failed with status ${putRes.status}`);
    const putData = await putRes.json();
    console.log("✅ PUT successful:", putData);

    // Verify PUT changes via GET by ID
    const getSingleRes = await fetch(`${API_BASE}/${testId}`);
    if (!getSingleRes.ok) throw new Error(`GET single failed with status ${getSingleRes.status}`);
    const singleInv = await getSingleRes.json();
    if (singleInv.customerName !== "TEST CLIENT UPDATED") throw new Error("PUT failed: Customer name was not updated");
    if (singleInv.items.length !== 1) throw new Error(`PUT failed: Expected 1 item, got ${singleInv.items.length}`);
    console.log("✅ PUT changes verified successfully.");

    // 5. Test Quotation CRUD
    console.log("\n5. Testing POST (Create Quotation)...");
    const testQuotationId = `test-qtn-${Date.now()}`;
    const testQuotation = {
      id: testQuotationId,
      docType: 'quotation',
      invoiceNo: "QTN-101",
      invoiceDate: "13.08.2026",
      customerName: "QUOTATION CLIENT",
      customerPhone: "9876543210",
      customerLocation: "HYDERABAD",
      hasGst: false,
      items: [
        { name: "Sofa Set 3+2", description: "Cenflex foam Mittals fabric", quantity: 1, unit: "Set", price: 75000 }
      ]
    };
    const postQtnRes = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testQuotation)
    });
    if (postQtnRes.status !== 201) throw new Error(`POST Quotation failed with status ${postQtnRes.status}`);
    console.log("✅ POST Quotation successful");

    // Fetch and check quotation
    const getQtnRes = await fetch(`${API_BASE}/${testQuotationId}`);
    if (!getQtnRes.ok) throw new Error(`GET Quotation failed with status ${getQtnRes.status}`);
    const fetchedQtn = await getQtnRes.json();
    if (fetchedQtn.docType !== 'quotation' || fetchedQtn.customerPhone !== '9876543210') {
      throw new Error("GET Quotation failed: Attributes do not match");
    }
    console.log("✅ GET Quotation verified successfully.");

    // Delete quotation
    const delQtnRes = await fetch(`${API_BASE}/${testQuotationId}`, { method: 'DELETE' });
    if (!delQtnRes.ok) throw new Error(`DELETE Quotation failed`);
    console.log("✅ DELETE Quotation successful.");

    console.log("\n⭐️ ALL INVOICE & QUOTATION API TESTS PASSED SUCCESSFULLY! ⭐️");

  } catch (error) {
    console.error("❌ API Test Failed:", error.message);
  }
}

runTests();
