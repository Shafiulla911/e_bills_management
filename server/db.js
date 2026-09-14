const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, 'database.sqlite');
const jsonBackupPath = path.join(__dirname, 'db_data.json');

let dbEngine = null;
let isSqliteAvailable = false;

// Seed initial data if fresh
const initialData = {
  products: [
    { id: 1, name: 'Basmati Rice 5kg', category: 'Grocery', price: 450, unit: 'bag', stock: 25, created_at: new Date().toISOString() },
    { id: 2, name: 'Fortune Sunflower Oil 1L', category: 'Grocery', price: 165, unit: 'bottle', stock: 40, created_at: new Date().toISOString() },
    { id: 3, name: 'Aashirvaad Atta 10kg', category: 'Grocery', price: 420, unit: 'bag', stock: 18, created_at: new Date().toISOString() },
    { id: 4, name: 'Tata Salt 1kg', category: 'Grocery', price: 28, unit: 'packet', stock: 100, created_at: new Date().toISOString() },
    { id: 5, name: 'Amul Butter 500g', category: 'Dairy', price: 275, unit: 'pack', stock: 15, created_at: new Date().toISOString() },
    { id: 6, name: 'Surf Excel Washing Powder 1kg', category: 'Household', price: 140, unit: 'packet', stock: 30, created_at: new Date().toISOString() },
    { id: 7, name: 'Sugar (Fine) 1kg', category: 'Grocery', price: 44, unit: 'kg', stock: 80, created_at: new Date().toISOString() },
    { id: 8, name: 'Toor Dal 1kg', category: 'Grocery', price: 160, unit: 'kg', stock: 50, created_at: new Date().toISOString() }
  ],
  customers: [
    { id: 1, name: 'Ramesh Patel', phone: '9876543210', address: 'Shop 4, Market Road', total_due: 450, created_at: new Date().toISOString() },
    { id: 2, name: 'Suresh Sharma', phone: '9123456789', address: 'B-12, Sector 5', total_due: 0, created_at: new Date().toISOString() },
    { id: 3, name: 'Anita Verma', phone: '9988776655', address: 'House 42, Green Avenue', total_due: 620, created_at: new Date().toISOString() },
    { id: 4, name: 'Vikram Singh', phone: '9811223344', address: 'Near Bus Stand', total_due: 1250, created_at: new Date().toISOString() }
  ],
  bills: [
    {
      id: 1,
      bill_number: 'INV-1001',
      customer_id: 1,
      customer_name: 'Ramesh Patel',
      customer_phone: '9876543210',
      total_amount: 870,
      paid_amount: 420,
      due_amount: 450,
      payment_status: 'PARTIAL',
      payment_mode: 'Cash',
      notes: 'Paid 420 in cash, 450 balance remaining',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 2,
      bill_number: 'INV-1002',
      customer_id: 3,
      customer_name: 'Anita Verma',
      customer_phone: '9988776655',
      total_amount: 620,
      paid_amount: 0,
      due_amount: 620,
      payment_status: 'UNPAID',
      payment_mode: 'Credit/Udhar',
      notes: 'Promised to clear by weekend',
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      id: 3,
      bill_number: 'INV-1003',
      customer_id: 4,
      customer_name: 'Vikram Singh',
      customer_phone: '9811223344',
      total_amount: 1750,
      paid_amount: 500,
      due_amount: 1250,
      payment_status: 'PARTIAL',
      payment_mode: 'UPI',
      notes: 'Paid 500 via GPay, rest remaining',
      created_at: new Date().toISOString()
    }
  ],
  bill_items: [
    { id: 1, bill_id: 1, product_id: 3, product_name: 'Aashirvaad Atta 10kg', price: 420, quantity: 1, total: 420 },
    { id: 2, bill_id: 1, product_id: 1, product_name: 'Basmati Rice 5kg', price: 450, quantity: 1, total: 450 },
    { id: 3, bill_id: 2, product_id: 3, product_name: 'Aashirvaad Atta 10kg', price: 420, quantity: 1, total: 420 },
    { id: 4, bill_id: 2, product_id: 2, product_name: 'Fortune Sunflower Oil 1L', price: 165, quantity: 1, total: 165 },
    { id: 5, bill_id: 2, product_id: 4, product_name: 'Tata Salt 1kg', price: 35, quantity: 1, total: 35 },
    { id: 6, bill_id: 3, product_id: 1, product_name: 'Basmati Rice 5kg', price: 450, quantity: 2, total: 900 },
    { id: 7, bill_id: 3, product_id: 5, product_name: 'Amul Butter 500g', price: 275, quantity: 2, total: 550 },
    { id: 8, bill_id: 3, product_id: 2, product_name: 'Fortune Sunflower Oil 1L', price: 165, quantity: 1, total: 165 },
    { id: 9, bill_id: 3, product_id: 6, product_name: 'Surf Excel Washing Powder 1kg', price: 135, quantity: 1, total: 135 }
  ],
  payments: [
    { id: 1, bill_id: 1, customer_id: 1, amount: 420, payment_mode: 'Cash', notes: 'Initial payment at billing', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 2, bill_id: 3, customer_id: 4, amount: 500, payment_mode: 'UPI', notes: 'Initial UPI payment', created_at: new Date().toISOString() }
  ]
};

// Simple JSON File Database Implementation for maximum reliability
let store = { ...initialData };

function loadJsonStore() {
  if (fs.existsSync(jsonBackupPath)) {
    try {
      const content = fs.readFileSync(jsonBackupPath, 'utf8');
      store = JSON.parse(content);
    } catch (e) {
      console.error('Error reading JSON store:', e);
      saveJsonStore();
    }
  } else {
    saveJsonStore();
  }
}

function saveJsonStore() {
  fs.writeFileSync(jsonBackupPath, JSON.stringify(store, null, 2), 'utf8');
}

// Try sqlite3 module if available
try {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
      console.warn('SQLite connection error, falling back to JSON DB:', err.message);
      isSqliteAvailable = false;
    } else {
      isSqliteAvailable = true;
      dbEngine = db;
      initSqliteTables();
    }
  });
} catch (e) {
  console.warn('sqlite3 module not found/working, using built-in JSON file DB.');
  isSqliteAvailable = false;
}

loadJsonStore();

function initSqliteTables() {
  if (!dbEngine) return;
  dbEngine.serialize(() => {
    dbEngine.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL,
      unit TEXT DEFAULT 'pcs',
      stock REAL DEFAULT 0,
      created_at TEXT
    )`);

    dbEngine.run(`CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      total_due REAL DEFAULT 0,
      created_at TEXT
    )`);

    dbEngine.run(`CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      customer_name TEXT,
      customer_phone TEXT,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      due_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'UNPAID',
      payment_mode TEXT DEFAULT 'Cash',
      notes TEXT,
      created_at TEXT
    )`);

    dbEngine.run(`CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity REAL NOT NULL,
      total REAL NOT NULL
    )`);

    dbEngine.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      customer_id INTEGER,
      amount REAL NOT NULL,
      payment_mode TEXT DEFAULT 'Cash',
      notes TEXT,
      created_at TEXT
    )`);

    // Check if products exist, else seed
    dbEngine.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (!err && row && row.count === 0) {
        seedSqliteData();
      }
    });
  });
}

function seedSqliteData() {
  store.products.forEach(p => {
    dbEngine.run("INSERT INTO products (id, name, category, price, unit, stock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [p.id, p.name, p.category, p.price, p.unit, p.stock, p.created_at]);
  });

  store.customers.forEach(c => {
    dbEngine.run("INSERT INTO customers (id, name, phone, address, total_due, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [c.id, c.name, c.phone, c.address, c.total_due, c.created_at]);
  });

  store.bills.forEach(b => {
    dbEngine.run("INSERT INTO bills (id, bill_number, customer_id, customer_name, customer_phone, total_amount, paid_amount, due_amount, payment_status, payment_mode, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [b.id, b.bill_number, b.customer_id, b.customer_name, b.customer_phone, b.total_amount, b.paid_amount, b.due_amount, b.payment_status, b.payment_mode, b.notes, b.created_at]);
  });

  store.bill_items.forEach(bi => {
    dbEngine.run("INSERT INTO bill_items (id, bill_id, product_id, product_name, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [bi.id, bi.bill_id, bi.product_id, bi.product_name, bi.price, bi.quantity, bi.total]);
  });

  store.payments.forEach(pay => {
    dbEngine.run("INSERT INTO payments (id, bill_id, customer_id, amount, payment_mode, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [pay.id, pay.bill_id, pay.customer_id, pay.amount, pay.payment_mode, pay.notes, pay.created_at]);
  });
}

// Universal Async API wrappers supporting both SQLite and JSON fallback seamlessly
const dbApi = {
  // PRODUCTS
  getProducts: () => new Promise((resolve, reject) => {
    if (isSqliteAvailable && dbEngine) {
      dbEngine.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
        if (err) resolve(store.products);
        else resolve(rows);
      });
    } else {
      resolve([...store.products].reverse());
    }
  }),

  addProduct: (product) => new Promise((resolve, reject) => {
    const newProduct = {
      id: Date.now(),
      name: product.name,
      category: product.category || 'General',
      price: parseFloat(product.price) || 0,
      unit: product.unit || 'pcs',
      stock: parseFloat(product.stock) || 0,
      created_at: new Date().toISOString()
    };
    if (isSqliteAvailable && dbEngine) {
      dbEngine.run(
        "INSERT INTO products (name, category, price, unit, stock, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [newProduct.name, newProduct.category, newProduct.price, newProduct.unit, newProduct.stock, newProduct.created_at],
        function(err) {
          if (err) {
            store.products.push(newProduct);
            saveJsonStore();
            resolve(newProduct);
          } else {
            newProduct.id = this.lastID;
            resolve(newProduct);
          }
        }
      );
    } else {
      store.products.push(newProduct);
      saveJsonStore();
      resolve(newProduct);
    }
  }),

  updateProduct: (id, product) => new Promise((resolve, reject) => {
    const pId = parseInt(id);
    if (isSqliteAvailable && dbEngine) {
      dbEngine.run(
        "UPDATE products SET name = ?, category = ?, price = ?, unit = ?, stock = ? WHERE id = ?",
        [product.name, product.category, product.price, product.unit, product.stock, pId],
        function(err) {
          const idx = store.products.findIndex(p => p.id === pId);
          if (idx !== -1) {
            store.products[idx] = { ...store.products[idx], ...product };
            saveJsonStore();
          }
          resolve({ id: pId, ...product });
        }
      );
    } else {
      const idx = store.products.findIndex(p => p.id === pId);
      if (idx !== -1) {
        store.products[idx] = { ...store.products[idx], ...product };
        saveJsonStore();
      }
      resolve({ id: pId, ...product });
    }
  }),

  deleteProduct: (id) => new Promise((resolve) => {
    const pId = parseInt(id);
    if (isSqliteAvailable && dbEngine) {
      dbEngine.run("DELETE FROM products WHERE id = ?", [pId], () => {});
    }
    store.products = store.products.filter(p => p.id !== pId);
    saveJsonStore();
    resolve({ success: true, id: pId });
  }),

  // CUSTOMERS
  getCustomers: () => new Promise((resolve) => {
    // Recalculate customer due balance accurately
    const customersMap = store.customers.map(c => {
      const customerBills = store.bills.filter(b => b.customer_id === c.id);
      const computedDue = customerBills.reduce((acc, b) => acc + (parseFloat(b.due_amount) || 0), 0);
      return { ...c, total_due: computedDue };
    });

    if (isSqliteAvailable && dbEngine) {
      dbEngine.all("SELECT * FROM customers ORDER BY id DESC", [], (err, rows) => {
        if (err || !rows) resolve(customersMap);
        else {
          const updatedRows = rows.map(r => {
            const customerBills = store.bills.filter(b => b.customer_id === r.id);
            const computedDue = customerBills.reduce((acc, b) => acc + (parseFloat(b.due_amount) || 0), 0);
            return { ...r, total_due: computedDue };
          });
          resolve(updatedRows);
        }
      });
    } else {
      resolve(customersMap);
    }
  }),

  addCustomer: (customer) => new Promise((resolve) => {
    const newCust = {
      id: Date.now(),
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      total_due: 0,
      created_at: new Date().toISOString()
    };
    if (isSqliteAvailable && dbEngine) {
      dbEngine.run(
        "INSERT INTO customers (name, phone, address, total_due, created_at) VALUES (?, ?, ?, ?, ?)",
        [newCust.name, newCust.phone, newCust.address, 0, newCust.created_at],
        function(err) {
          if (!err && this.lastID) newCust.id = this.lastID;
          store.customers.push(newCust);
          saveJsonStore();
          resolve(newCust);
        }
      );
    } else {
      store.customers.push(newCust);
      saveJsonStore();
      resolve(newCust);
    }
  }),

  // BILLS
  getBills: () => new Promise((resolve) => {
    if (isSqliteAvailable && dbEngine) {
      dbEngine.all("SELECT * FROM bills ORDER BY id DESC", [], (err, rows) => {
        if (err || !rows) resolve([...store.bills].reverse());
        else resolve(rows);
      });
    } else {
      resolve([...store.bills].reverse());
    }
  }),

  getBillById: (id) => new Promise((resolve) => {
    const bId = parseInt(id);
    const bill = store.bills.find(b => b.id === bId);
    if (!bill) return resolve(null);

    const items = store.bill_items.filter(bi => bi.bill_id === bId);
    const payments = store.payments.filter(p => p.bill_id === bId);
    resolve({ ...bill, items, payments });
  }),

  createBill: (billData) => new Promise((resolve) => {
    const billId = Date.now();
    const count = store.bills.length + 1001;
    const billNumber = `INV-${count}`;

    const totalAmount = parseFloat(billData.total_amount) || 0;
    const paidAmount = parseFloat(billData.paid_amount) || 0;
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    let paymentStatus = 'UNPAID';
    if (dueAmount <= 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    }

    const newBill = {
      id: billId,
      bill_number: billNumber,
      customer_id: parseInt(billData.customer_id) || null,
      customer_name: billData.customer_name || 'Walk-in Customer',
      customer_phone: billData.customer_phone || '',
      total_amount: totalAmount,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_status: paymentStatus,
      payment_mode: billData.payment_mode || 'Cash',
      notes: billData.notes || '',
      created_at: new Date().toISOString()
    };

    // Process Bill Items
    const items = (billData.items || []).map((item, idx) => ({
      id: billId * 100 + idx,
      bill_id: billId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      price: parseFloat(item.price),
      quantity: parseFloat(item.quantity),
      total: parseFloat(item.price) * parseFloat(item.quantity)
    }));

    store.bills.push(newBill);
    store.bill_items.push(...items);

    // If initial payment was made
    if (paidAmount > 0) {
      const initialPayment = {
        id: Date.now() + 1,
        bill_id: billId,
        customer_id: newBill.customer_id,
        amount: paidAmount,
        payment_mode: newBill.payment_mode,
        notes: 'Initial payment at invoice creation',
        created_at: new Date().toISOString()
      };
      store.payments.push(initialPayment);
    }

    // Deduct product stock & update customer due
    items.forEach(item => {
      if (item.product_id) {
        const prod = store.products.find(p => p.id === item.product_id);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
        }
      }
    });

    if (newBill.customer_id) {
      const cust = store.customers.find(c => c.id === newBill.customer_id);
      if (cust) {
        cust.total_due = (cust.total_due || 0) + dueAmount;
      }
    }

    saveJsonStore();

    // Also sync to SQLite if active
    if (isSqliteAvailable && dbEngine) {
      dbEngine.run(
        "INSERT INTO bills (id, bill_number, customer_id, customer_name, customer_phone, total_amount, paid_amount, due_amount, payment_status, payment_mode, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newBill.id, newBill.bill_number, newBill.customer_id, newBill.customer_name, newBill.customer_phone, newBill.total_amount, newBill.paid_amount, newBill.due_amount, newBill.payment_status, newBill.payment_mode, newBill.notes, newBill.created_at]
      );
      items.forEach(i => {
        dbEngine.run(
          "INSERT INTO bill_items (id, bill_id, product_id, product_name, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [i.id, i.bill_id, i.product_id, i.product_name, i.price, i.quantity, i.total]
        );
      });
    }

    resolve({ ...newBill, items });
  }),

  // RECORD PARTIAL / FULL DUE PAYMENT
  recordPayment: (paymentData) => new Promise((resolve) => {
    const billId = parseInt(paymentData.bill_id);
    const amount = parseFloat(paymentData.amount) || 0;
    const bill = store.bills.find(b => b.id === billId);

    if (!bill) return resolve({ success: false, message: 'Bill not found' });

    const newPaid = bill.paid_amount + amount;
    const newDue = Math.max(0, bill.total_amount - newPaid);
    let newStatus = 'UNPAID';
    if (newDue <= 0) {
      newStatus = 'PAID';
    } else if (newPaid > 0) {
      newStatus = 'PARTIAL';
    }

    bill.paid_amount = newPaid;
    bill.due_amount = newDue;
    bill.payment_status = newStatus;

    const paymentRecord = {
      id: Date.now(),
      bill_id: billId,
      customer_id: bill.customer_id,
      amount: amount,
      payment_mode: paymentData.payment_mode || 'Cash',
      notes: paymentData.notes || 'Partial payment received',
      created_at: new Date().toISOString()
    };

    store.payments.push(paymentRecord);

    // Update customer due
    if (bill.customer_id) {
      const cust = store.customers.find(c => c.id === bill.customer_id);
      if (cust) {
        cust.total_due = Math.max(0, (cust.total_due || 0) - amount);
      }
    }

    saveJsonStore();

    if (isSqliteAvailable && dbEngine) {
      dbEngine.run(
        "UPDATE bills SET paid_amount = ?, due_amount = ?, payment_status = ? WHERE id = ?",
        [bill.paid_amount, bill.due_amount, bill.payment_status, billId]
      );
      dbEngine.run(
        "INSERT INTO payments (id, bill_id, customer_id, amount, payment_mode, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [paymentRecord.id, paymentRecord.bill_id, paymentRecord.customer_id, paymentRecord.amount, paymentRecord.payment_mode, paymentRecord.notes, paymentRecord.created_at]
      );
    }

    resolve({ success: true, bill, payment: paymentRecord });
  }),

  // DASHBOARD STATS
  getDashboardStats: () => new Promise((resolve) => {
    const totalSales = store.bills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const totalCollected = store.bills.reduce((sum, b) => sum + (parseFloat(b.paid_amount) || 0), 0);
    const totalPendingDues = store.bills.reduce((sum, b) => sum + (parseFloat(b.due_amount) || 0), 0);
    const totalBills = store.bills.length;
    const totalCustomers = store.customers.length;
    const activeDebtorsCount = store.customers.filter(c => {
      const customerBills = store.bills.filter(b => b.customer_id === c.id);
      const computedDue = customerBills.reduce((acc, b) => acc + (parseFloat(b.due_amount) || 0), 0);
      return computedDue > 0;
    }).length;

    // Today's sales calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = store.bills.filter(b => b.created_at.startsWith(todayStr));
    const todaySales = todayBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const todayCollected = todayBills.reduce((sum, b) => sum + (parseFloat(b.paid_amount) || 0), 0);

    resolve({
      totalSales,
      totalCollected,
      totalPendingDues,
      totalBills,
      totalCustomers,
      activeDebtorsCount,
      todaySales,
      todayCollected
    });
  })
};

module.exports = dbApi;
