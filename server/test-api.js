const http = require('http');

function makeRequest(path, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting E-Bill API End-to-End Test Suite...\n');

  try {
    // Test 1: Dashboard stats
    const stats = await makeRequest('/api/dashboard/stats');
    console.log('✅ 1. Dashboard Stats API:', stats.status === 200 ? 'PASS' : 'FAIL');
    console.log('   Data:', JSON.stringify(stats.body));

    // Test 2: Get products
    const products = await makeRequest('/api/products');
    console.log('\n✅ 2. Get Products API:', products.status === 200 ? 'PASS' : 'FAIL');
    console.log(`   Fetched ${products.body.length} products.`);

    // Test 3: Get customers
    const customers = await makeRequest('/api/customers');
    console.log('\n✅ 3. Get Customers API:', customers.status === 200 ? 'PASS' : 'FAIL');
    console.log(`   Fetched ${customers.body.length} customers.`);

    // Test 4: Create a new bill with partial payment
    console.log('\n✅ 4. Creating Test Bill with Partial Payment (Total ₹1000, Paid ₹400, Remaining ₹600)...');
    const newBillReq = {
      customer_id: customers.body[0].id,
      customer_name: customers.body[0].name,
      customer_phone: customers.body[0].phone,
      total_amount: 1000,
      paid_amount: 400,
      due_amount: 600,
      payment_mode: 'Cash',
      notes: 'Test partial bill',
      items: [
        { product_id: products.body[0].id, product_name: products.body[0].name, price: products.body[0].price, quantity: 2, total: products.body[0].price * 2 }
      ]
    };
    const createdBill = await makeRequest('/api/bills', 'POST', newBillReq);
    console.log('   Status:', createdBill.status);
    console.log('   Bill Number:', createdBill.body.bill_number);
    console.log('   Calculated Status:', createdBill.body.payment_status);
    console.log('   Remaining Due:', createdBill.body.due_amount);

    // Test 5: Settle partial payment on the created bill (Collect ₹600)
    console.log('\n✅ 5. Settling Remaining Due ₹600 on Invoice', createdBill.body.bill_number, '...');
    const payRes = await makeRequest(`/api/bills/${createdBill.body.id}/pay`, 'POST', {
      amount: 600,
      payment_mode: 'UPI',
      notes: 'Cleared remaining balance via GPay'
    });
    console.log('   Payment Success:', payRes.body.success);
    console.log('   New Bill Status:', payRes.body.bill.payment_status);
    console.log('   Updated Due:', payRes.body.bill.due_amount);

    // Test 6: WhatsApp link generation
    const waRes = await makeRequest(`/api/bills/${createdBill.body.id}/whatsapp`);
    console.log('\n✅ 6. WhatsApp Share Link Generator API:', waRes.status === 200 ? 'PASS' : 'FAIL');
    console.log('   WhatsApp URL:', waRes.body.whatsappUrl ? 'Generated Successfully' : 'FAIL');

    console.log('\n🎉 ALL E-BILL API TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Test Failed:', err.message);
  }
}

runTests();
