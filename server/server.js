const express = require('express');
const cors = require('cors');
const path = require('path');
const dbApi = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API ROUTES

// Auth (Vendor Login & Register)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const user = await dbApi.authenticateUser(username, password);
    res.json({
      success: true,
      message: 'Login successful',
      user,
      token: `novabill-token-${user.id}-${Date.now()}`
    });
  } catch (err) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const newUser = await dbApi.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Vendor account registered successfully',
      user: newUser,
      token: `novabill-token-${newUser.id}-${Date.now()}`
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.get('/api/auth/me/:id', async (req, res) => {
  try {
    const user = await dbApi.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await dbApi.getProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProd = await dbApi.addProduct(req.body);
    res.status(201).json(newProd);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await dbApi.updateProduct(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await dbApi.deleteProduct(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await dbApi.getCustomers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const newCust = await dbApi.addCustomer(req.body);
    res.status(201).json(newCust);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bills
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await dbApi.getBills();
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bills/:id', async (req, res) => {
  try {
    const bill = await dbApi.getBillById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const createdBill = await dbApi.createBill(req.body);
    res.status(201).json(createdBill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills/:id/pay', async (req, res) => {
  try {
    const paymentResult = await dbApi.recordPayment({
      bill_id: req.params.id,
      ...req.body
    });
    res.json(paymentResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await dbApi.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper for generating formatted WhatsApp invoice link
app.get('/api/bills/:id/whatsapp', async (req, res) => {
  try {
    const bill = await dbApi.getBillById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    let phone = bill.customer_phone ? bill.customer_phone.replace(/\D/g, '') : '';
    if (phone.length === 10) phone = '91' + phone; // Default India prefix if 10 digit

    const itemsSummary = (bill.items || [])
      .map(i => `• ${i.product_name} (${i.quantity} x ₹${i.price}) = ₹${i.total}`)
      .join('\n');

    const message = `🧾 *E-BILL RECEIPT* - Invoice #${bill.bill_number}
----------------------------------
👤 *Customer:* ${bill.customer_name}
📅 *Date:* ${new Date(bill.created_at).toLocaleDateString()}

*Items Purchased:*
${itemsSummary}

----------------------------------
💰 *Total Amount:* ₹${bill.total_amount}
💵 *Amount Paid:* ₹${bill.paid_amount}
📌 *REMAINING DUE:* ₹${bill.due_amount}
💳 *Status:* ${bill.payment_status}

${bill.due_amount > 0 ? `⚠️ *Note:* Kindly clear the pending balance of *₹${bill.due_amount}* at your earliest convenience. Thank you!` : '✅ Thank you for shopping with us!'}

- *Sent via E-Bill Store System*`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://wa.me/?text=${encodedMsg}`;

    res.json({ whatsappUrl, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Backend E-Bill Server running on http://localhost:${PORT}`);
});
