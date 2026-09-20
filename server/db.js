const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const jsonBackupPath = isVercel ? path.join('/tmp', 'db_data.json') : path.join(__dirname, 'db_data.json');
const seedBackupPath = path.join(__dirname, 'db_data.json');

let mysqlPool = null;
let isMysqlAvailable = false;

// Fallback in-memory store
let store = {
  products: [],
  customers: [],
  bills: [],
  bill_items: [],
  payments: [],
  users: [
    {
      id: 1,
      username: 'root',
      password: 'Password',
      store_name: 'NovaBill Super Store',
      owner_name: 'Vendor Admin',
      phone: '9876543210',
      email: 'root@novabill.com',
      role: 'Vendor Admin',
      created_at: new Date().toISOString()
    }
  ]
};

function loadJsonStore() {
  const targetPath = fs.existsSync(jsonBackupPath) ? jsonBackupPath : (fs.existsSync(seedBackupPath) ? seedBackupPath : null);
  if (targetPath) {
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      const loaded = JSON.parse(content);
      store = { ...store, ...loaded };
      if (!store.users || store.users.length === 0) {
        store.users = [
          {
            id: 1,
            username: 'root',
            password: 'Password',
            store_name: 'NovaBill Super Store',
            owner_name: 'Vendor Admin',
            phone: '9876543210',
            email: 'root@novabill.com',
            role: 'Vendor Admin',
            created_at: new Date().toISOString()
          }
        ];
      }
    } catch (e) {
      console.error('Error reading JSON store:', e);
    }
  }
}

function saveJsonStore() {
  try {
    fs.writeFileSync(jsonBackupPath, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving JSON store:', e);
  }
}

loadJsonStore();

// Initialize MySQL Database (novabill_db with credentials root / Password)
async function initMysql() {
  try {
    const rootConn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Password',
      port: parseInt(process.env.DB_PORT, 10) || 3306
    });

    await rootConn.query('CREATE DATABASE IF NOT EXISTS novabill_db');
    await rootConn.end();

    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Password',
      database: process.env.DB_NAME || 'novabill_db',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create Tables
    await mysqlPool.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      store_name VARCHAR(255) NOT NULL,
      owner_name VARCHAR(150),
      phone VARCHAR(20),
      email VARCHAR(150),
      role VARCHAR(50) DEFAULT 'Vendor Admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await mysqlPool.query(`CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT 'Grocery',
      price DECIMAL(10, 2) NOT NULL,
      unit VARCHAR(50) DEFAULT 'pcs',
      stock DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await mysqlPool.query(`CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      address TEXT,
      total_due DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await mysqlPool.query(`CREATE TABLE IF NOT EXISTS bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_number VARCHAR(100) UNIQUE NOT NULL,
      customer_id INT,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(20),
      total_amount DECIMAL(10, 2) NOT NULL,
      paid_amount DECIMAL(10, 2) DEFAULT 0,
      due_amount DECIMAL(10, 2) DEFAULT 0,
      payment_status VARCHAR(50) DEFAULT 'UNPAID',
      payment_mode VARCHAR(50) DEFAULT 'Cash',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await mysqlPool.query(`CREATE TABLE IF NOT EXISTS bill_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      product_id INT,
      product_name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      quantity DECIMAL(10, 2) NOT NULL,
      unit VARCHAR(50) DEFAULT 'pcs',
      total DECIMAL(10, 2) NOT NULL
    )`);

    // Ensure unit column exists if table was created previously
    try {
      await mysqlPool.query(`ALTER TABLE bill_items ADD COLUMN unit VARCHAR(50) DEFAULT 'pcs'`);
    } catch (e) {
      // Column might already exist
    }

    await mysqlPool.query(`CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      customer_id INT,
      amount DECIMAL(10, 2) NOT NULL,
      payment_mode VARCHAR(50) DEFAULT 'Cash',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed Root User
    await mysqlPool.query(`
      INSERT INTO users (username, password, store_name, owner_name, phone, email, role)
      SELECT 'root', 'Password', 'NovaBill Super Store', 'Vendor Admin', '9876543210', 'root@novabill.com', 'Vendor Admin'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'root')
    `);

    // Seed Sample Products if empty
    const [pCount] = await mysqlPool.query('SELECT COUNT(*) as count FROM products');
    if (pCount[0].count === 0) {
      await mysqlPool.query(`
        INSERT INTO products (name, category, price, unit, stock) VALUES
        ('Basmati Rice 5kg', 'Grocery', 450.00, 'bag', 25.0),
        ('Fortune Sunflower Oil 1L', 'Grocery', 165.00, 'bottle', 40.0),
        ('Aashirvaad Atta 10kg', 'Grocery', 420.00, 'bag', 18.0),
        ('Tata Salt 1kg', 'Grocery', 28.00, 'packet', 100.0),
        ('Amul Butter 500g', 'Dairy & Bakery', 275.00, 'pack', 15.0),
        ('Surf Excel Washing Powder 1kg', 'Household', 140.00, 'packet', 30.0),
        ('Sugar (Fine) 1kg', 'Grocery', 44.00, 'kg', 80.0),
        ('Toor Dal 1kg', 'Grocery', 160.00, 'kg', 50.0)
      `);
    }

    // Seed Sample Customers if empty
    const [cCount] = await mysqlPool.query('SELECT COUNT(*) as count FROM customers');
    if (cCount[0].count === 0) {
      await mysqlPool.query(`
        INSERT INTO customers (name, phone, address, total_due) VALUES
        ('Ramesh Patel', '9876543210', 'Shop 4, Market Road', 450.00),
        ('Suresh Sharma', '9123456789', 'B-12, Sector 5', 0.00),
        ('Anita Verma', '9988776655', 'House 42, Green Avenue', 620.00),
        ('Vikram Singh', '9811223344', 'Near Bus Stand', 1250.00)
      `);
    }

    isMysqlAvailable = true;
    console.log('✅ [MySQL Database Connected]: novabill_db on localhost (User: root)');
  } catch (err) {
    console.warn('⚠️ MySQL connection error, running with in-memory/JSON store:', err.message);
    isMysqlAvailable = false;
  }
}

initMysql();

const dbApi = {
  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  getProducts: async () => {
    if (isMysqlAvailable && mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM products ORDER BY id DESC');
        return rows;
      } catch (err) {
        console.error('MySQL getProducts error:', err.message);
      }
    }
    return [...store.products].reverse();
  },

  addProduct: async (product) => {
    if (isMysqlAvailable && mysqlPool) {
      try {
        const [res] = await mysqlPool.query(
          'INSERT INTO products (name, category, price, unit, stock) VALUES (?, ?, ?, ?, ?)',
          [
            product.name,
            product.category || 'Grocery',
            parseFloat(product.price) || 0,
            product.unit || 'pcs',
            parseFloat(product.stock) || 0
          ]
        );
        return {
          id: res.insertId,
          name: product.name,
          category: product.category || 'Grocery',
          price: parseFloat(product.price) || 0,
          unit: product.unit || 'pcs',
          stock: parseFloat(product.stock) || 0,
          created_at: new Date().toISOString()
        };
      } catch (err) {
        console.error('MySQL addProduct error:', err.message);
      }
    }

    const newProd = {
      id: Date.now(),
      name: product.name,
      category: product.category || 'Grocery',
      price: parseFloat(product.price) || 0,
      unit: product.unit || 'pcs',
      stock: parseFloat(product.stock) || 0,
      created_at: new Date().toISOString()
    };
    store.products.push(newProd);
    saveJsonStore();
    return newProd;
  },

  updateProduct: async (id, product) => {
    const pId = parseInt(id, 10);
    if (isMysqlAvailable && mysqlPool) {
      try {
        await mysqlPool.query(
          'UPDATE products SET name = ?, category = ?, price = ?, unit = ?, stock = ? WHERE id = ?',
          [
            product.name,
            product.category || 'Grocery',
            parseFloat(product.price) || 0,
            product.unit || 'pcs',
            parseFloat(product.stock) || 0,
            pId
          ]
        );
        return { id: pId, ...product };
      } catch (err) {
        console.error('MySQL updateProduct error:', err.message);
      }
    }

    const idx = store.products.findIndex(p => p.id === pId);
    if (idx !== -1) {
      store.products[idx] = { ...store.products[idx], ...product };
      saveJsonStore();
    }
    return { id: pId, ...product };
  },

  deleteProduct: async (id) => {
    const pId = parseInt(id, 10);
    if (isMysqlAvailable && mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM products WHERE id = ?', [pId]);
        return { success: true, id: pId };
      } catch (err) {
        console.error('MySQL deleteProduct error:', err.message);
      }
    }

    store.products = store.products.filter(p => p.id !== pId);
    saveJsonStore();
    return { success: true, id: pId };
  },

  // ─── CUSTOMERS ────────────────────────────────────────────────────────────
  getCustomers: async () => {
    if (isMysqlAvailable && mysqlPool) {
      try {
        const [customers] = await mysqlPool.query('SELECT * FROM customers ORDER BY id DESC');
        const [dues] = await mysqlPool.query('SELECT customer_id, SUM(due_amount) as total_due FROM bills WHERE due_amount > 0 GROUP BY customer_id');
        const duesMap = {};
        dues.forEach(d => { duesMap[d.customer_id] = parseFloat(d.total_due) || 0; });

        return customers.map(c => ({
          ...c,
          total_due: duesMap[c.id] !== undefined ? duesMap[c.id] : (parseFloat(c.total_due) || 0)
        }));
      } catch (err) {
        console.error('MySQL getCustomers error:', err.message);
      }
    }

    return store.customers.map(c => {
      const customerBills = store.bills.filter(b => b.customer_id === c.id);
      const computedDue = customerBills.reduce((acc, b) => acc + (parseFloat(b.due_amount) || 0), 0);
      return { ...c, total_due: computedDue };
    });
  },

  addCustomer: async (customer) => {
    if (isMysqlAvailable && mysqlPool) {
      try {
        const [res] = await mysqlPool.query(
          'INSERT INTO customers (name, phone, address, total_due) VALUES (?, ?, ?, ?)',
          [customer.name, customer.phone, customer.address || '', 0]
        );
        return {
          id: res.insertId,
          name: customer.name,
          phone: customer.phone,
          address: customer.address || '',
          total_due: 0,
          created_at: new Date().toISOString()
        };
      } catch (err) {
        console.error('MySQL addCustomer error:', err.message);
      }
    }

    const newCust = {
      id: Date.now(),
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
      total_due: 0,
      created_at: new Date().toISOString()
    };
    store.customers.push(newCust);
    saveJsonStore();
    return newCust;
  },

  // ─── BILLS ────────────────────────────────────────────────────────────────
  getBills: async () => {
    if (isMysqlAvailable && mysqlPool) {
      try {
        const [bills] = await mysqlPool.query('SELECT * FROM bills ORDER BY id DESC');
        const [items] = await mysqlPool.query('SELECT * FROM bill_items');
        const [payments] = await mysqlPool.query('SELECT * FROM payments');

        return bills.map(b => ({
          ...b,
          items: items.filter(i => i.bill_id === b.id),
          payments: payments.filter(p => p.bill_id === b.id)
        }));
      } catch (err) {
        console.error('MySQL getBills error:', err.message);
      }
    }

    return [...store.bills].reverse().map(b => ({
      ...b,
      items: store.bill_items.filter(i => i.bill_id === b.id),
      payments: store.payments.filter(p => p.bill_id === b.id)
    }));
  },

  getBillById: async (id) => {
    const bId = parseInt(id, 10);
    if (isMysqlAvailable && mysqlPool) {
      try {
        const [bills] = await mysqlPool.query('SELECT * FROM bills WHERE id = ?', [bId]);
        if (bills.length === 0) return null;
        const [items] = await mysqlPool.query('SELECT * FROM bill_items WHERE bill_id = ?', [bId]);
        const [payments] = await mysqlPool.query('SELECT * FROM payments WHERE bill_id = ?', [bId]);
        return { ...bills[0], items, payments };
      } catch (err) {
        console.error('MySQL getBillById error:', err.message);
      }
    }

    const bill = store.bills.find(b => b.id === bId);
    if (!bill) return null;
    const items = store.bill_items.filter(bi => bi.bill_id === bId);
    const payments = store.payments.filter(p => p.bill_id === bId);
    return { ...bill, items, payments };
  },

  createBill: async (billData) => {
    let billNumber = billData.bill_number;
    if (!billNumber) {
      if (isMysqlAvailable && mysqlPool) {
        try {
          const [bCount] = await mysqlPool.query('SELECT COUNT(*) as cnt, MAX(id) as maxId FROM bills');
          const nextId = (bCount[0].maxId || bCount[0].cnt || 0) + 1;
          billNumber = `BILL-${String(nextId).padStart(4, '0')}`;
        } catch (e) {
          billNumber = `BILL-${Date.now().toString().slice(-6)}`;
        }
      } else {
        const count = (store.bills.length || 0) + 1;
        billNumber = `BILL-${String(count).padStart(4, '0')}`;
      }
    }

    const totalAmount = parseFloat(billData.total_amount) || 0;
    const paidAmount = parseFloat(billData.paid_amount) || 0;
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    let paymentStatus = 'UNPAID';
    if (dueAmount <= 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    }

    if (isMysqlAvailable && mysqlPool) {
      try {
        const [bRes] = await mysqlPool.query(
          'INSERT INTO bills (bill_number, customer_id, customer_name, customer_phone, total_amount, paid_amount, due_amount, payment_status, payment_mode, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            billNumber,
            billData.customer_id ? parseInt(billData.customer_id, 10) : null,
            billData.customer_name || 'Walk-in Customer',
            billData.customer_phone || '',
            totalAmount,
            paidAmount,
            dueAmount,
            paymentStatus,
            billData.payment_mode || 'Cash',
            billData.notes || ''
          ]
        );

        const newBillId = bRes.insertId;

        // Insert items
        const items = [];
        for (const item of (billData.items || [])) {
          const itemTotal = parseFloat(item.price) * parseFloat(item.quantity);
          const itemUnit = item.unit ? String(item.unit).trim() : 'pcs';
          const [iRes] = await mysqlPool.query(
            'INSERT INTO bill_items (bill_id, product_id, product_name, price, quantity, unit, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newBillId, item.product_id || null, item.product_name, parseFloat(item.price), parseFloat(item.quantity), itemUnit, itemTotal]
          );
          items.push({
            id: iRes.insertId,
            bill_id: newBillId,
            product_id: item.product_id,
            product_name: item.product_name,
            price: parseFloat(item.price),
            quantity: parseFloat(item.quantity),
            unit: itemUnit,
            total: itemTotal
          });

          // Deduct stock if product exists
          if (item.product_id) {
            await mysqlPool.query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [parseFloat(item.quantity), item.product_id]);
          }
        }

        // Insert initial payment if any
        const payments = [];
        if (paidAmount > 0) {
          const [pRes] = await mysqlPool.query(
            'INSERT INTO payments (bill_id, customer_id, amount, payment_mode, notes) VALUES (?, ?, ?, ?, ?)',
            [newBillId, billData.customer_id || null, paidAmount, billData.payment_mode || 'Cash', 'Initial payment at invoice creation']
          );
          payments.push({
            id: pRes.insertId,
            bill_id: newBillId,
            customer_id: billData.customer_id,
            amount: paidAmount,
            payment_mode: billData.payment_mode || 'Cash',
            notes: 'Initial payment at invoice creation'
          });
        }

        // Update customer total due
        if (billData.customer_id && dueAmount > 0) {
          await mysqlPool.query('UPDATE customers SET total_due = total_due + ? WHERE id = ?', [dueAmount, billData.customer_id]);
        }

        return {
          id: newBillId,
          bill_number: billNumber,
          customer_id: billData.customer_id,
          customer_name: billData.customer_name,
          customer_phone: billData.customer_phone,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          due_amount: dueAmount,
          payment_status: paymentStatus,
          payment_mode: billData.payment_mode || 'Cash',
          notes: billData.notes || '',
          items,
          payments,
          created_at: new Date().toISOString()
        };
      } catch (err) {
        console.error('MySQL createBill error:', err.message);
      }
    }

    // Fallback store
    const billId = Date.now();
    const newBill = {
      id: billId,
      bill_number: billNumber,
      customer_id: parseInt(billData.customer_id, 10) || null,
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

    const items = (billData.items || []).map((item, idx) => ({
      id: billId * 100 + idx,
      bill_id: billId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      price: parseFloat(item.price),
      quantity: parseFloat(item.quantity),
      unit: item.unit ? String(item.unit).trim() : 'pcs',
      total: parseFloat(item.price) * parseFloat(item.quantity)
    }));

    store.bills.push(newBill);
    store.bill_items.push(...items);

    const payments = [];
    if (paidAmount > 0) {
      const pay = {
        id: Date.now() + 1,
        bill_id: billId,
        customer_id: newBill.customer_id,
        amount: paidAmount,
        payment_mode: newBill.payment_mode,
        notes: 'Initial payment at invoice creation',
        created_at: new Date().toISOString()
      };
      store.payments.push(pay);
      payments.push(pay);
    }

    saveJsonStore();
    return { ...newBill, items, payments };
  },

  recordPayment: async (paymentData) => {
    const billId = parseInt(paymentData.bill_id, 10);
    const amount = parseFloat(paymentData.amount) || 0;

    if (isMysqlAvailable && mysqlPool) {
      try {
        const [bills] = await mysqlPool.query('SELECT * FROM bills WHERE id = ?', [billId]);
        if (bills.length === 0) throw new Error('Bill not found');
        const bill = bills[0];

        const newPaid = parseFloat(bill.paid_amount) + amount;
        const newDue = Math.max(0, parseFloat(bill.total_amount) - newPaid);
        const newStatus = newDue === 0 ? 'PAID' : 'PARTIAL';

        await mysqlPool.query(
          'UPDATE bills SET paid_amount = ?, due_amount = ?, payment_status = ? WHERE id = ?',
          [newPaid, newDue, newStatus, billId]
        );

        const [pRes] = await mysqlPool.query(
          'INSERT INTO payments (bill_id, customer_id, amount, payment_mode, notes) VALUES (?, ?, ?, ?, ?)',
          [billId, bill.customer_id, amount, paymentData.payment_mode || 'Cash', paymentData.notes || 'Settlement payment']
        );

        if (bill.customer_id) {
          await mysqlPool.query('UPDATE customers SET total_due = GREATEST(0, total_due - ?) WHERE id = ?', [amount, bill.customer_id]);
        }

        return {
          success: true,
          bill: { ...bill, paid_amount: newPaid, due_amount: newDue, payment_status: newStatus },
          payment: {
            id: pRes.insertId,
            bill_id: billId,
            amount,
            payment_mode: paymentData.payment_mode || 'Cash',
            notes: paymentData.notes || 'Settlement payment'
          }
        };
      } catch (err) {
        console.error('MySQL recordPayment error:', err.message);
      }
    }

    const bill = store.bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');
    bill.paid_amount = (bill.paid_amount || 0) + amount;
    bill.due_amount = Math.max(0, bill.total_amount - bill.paid_amount);
    bill.payment_status = bill.due_amount === 0 ? 'PAID' : 'PARTIAL';

    const paymentRecord = {
      id: Date.now(),
      bill_id: billId,
      customer_id: bill.customer_id,
      amount,
      payment_mode: paymentData.payment_mode || 'Cash',
      notes: paymentData.notes || 'Partial payment received',
      created_at: new Date().toISOString()
    };
    store.payments.push(paymentRecord);
    saveJsonStore();

    return { success: true, bill, payment: paymentRecord };
  },

  // ─── DASHBOARD STATS ──────────────────────────────────────────────────────
  getDashboardStats: async () => {
    if (isMysqlAvailable && mysqlPool) {
      try {
        const [sales] = await mysqlPool.query(`
          SELECT 
            COALESCE(SUM(total_amount), 0) as totalSales,
            COALESCE(SUM(paid_amount), 0) as totalCollected,
            COALESCE(SUM(due_amount), 0) as totalPendingDues,
            COUNT(*) as totalBills
          FROM bills
        `);

        const [custs] = await mysqlPool.query('SELECT COUNT(*) as totalCustomers FROM customers');
        const [debtors] = await mysqlPool.query('SELECT COUNT(DISTINCT customer_id) as activeDebtorsCount FROM bills WHERE due_amount > 0');

        const todayStr = new Date().toISOString().split('T')[0];
        const [today] = await mysqlPool.query(`
          SELECT 
            COALESCE(SUM(total_amount), 0) as todaySales,
            COALESCE(SUM(paid_amount), 0) as todayCollected
          FROM bills
          WHERE DATE(created_at) = ?
        `, [todayStr]);

        return {
          totalSales: parseFloat(sales[0].totalSales) || 0,
          totalCollected: parseFloat(sales[0].totalCollected) || 0,
          totalPendingDues: parseFloat(sales[0].totalPendingDues) || 0,
          totalBills: parseInt(sales[0].totalBills, 10) || 0,
          totalCustomers: parseInt(custs[0].totalCustomers, 10) || 0,
          activeDebtorsCount: parseInt(debtors[0].activeDebtorsCount, 10) || 0,
          todaySales: parseFloat(today[0].todaySales) || 0,
          todayCollected: parseFloat(today[0].todayCollected) || 0
        };
      } catch (err) {
        console.error('MySQL getDashboardStats error:', err.message);
      }
    }

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

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = store.bills.filter(b => (b.created_at || '').startsWith(todayStr));
    const todaySales = todayBills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const todayCollected = todayBills.reduce((sum, b) => sum + (parseFloat(b.paid_amount) || 0), 0);

    return {
      totalSales,
      totalCollected,
      totalPendingDues,
      totalBills,
      totalCustomers,
      activeDebtorsCount,
      todaySales,
      todayCollected
    };
  },

  // ─── AUTHENTICATION & VENDOR MANAGEMENT ──────────────────────────────────
  authenticateUser: async (username, password) => {
    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    const cleanUser = String(username).trim().toLowerCase();
    const cleanPass = String(password).trim();

    if (isMysqlAvailable && mysqlPool) {
      try {
        const [rows] = await mysqlPool.query(
          'SELECT id, username, store_name, owner_name, phone, email, role, created_at FROM users WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND password = ?',
          [cleanUser, cleanUser, cleanPass]
        );
        if (rows.length > 0) return rows[0];
      } catch (err) {
        console.error('MySQL authenticateUser error:', err.message);
      }
    }

    const user = (store.users || []).find(
      u => (u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)) && u.password === cleanPass
    );

    if (user) {
      const { password: _, ...userSafe } = user;
      return userSafe;
    }

    throw new Error('Invalid username or password.');
  },

  registerUser: async (userData) => {
    if (!userData.password || (!userData.name && !userData.username) || (!userData.email && !userData.username)) {
      throw new Error('Name, email, and password are required.');
    }

    const cleanEmail = userData.email ? String(userData.email).trim().toLowerCase() : '';
    const cleanName = userData.name ? String(userData.name).trim() : (userData.owner_name || 'Vendor');
    const cleanUser = userData.username ? String(userData.username).trim().toLowerCase() : (cleanEmail || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    const cleanPhone = userData.phone ? String(userData.phone).replace(/\D/g, '').trim() : '';
    const cleanStore = userData.store_name ? String(userData.store_name).trim() : `${cleanName}'s Store`;
    const cleanPass = String(userData.password).trim();

    if (isMysqlAvailable && mysqlPool) {
      try {
        const [existing] = await mysqlPool.query(
          'SELECT id FROM users WHERE LOWER(username) = ? OR (email IS NOT NULL AND email != "" AND LOWER(email) = ?)',
          [cleanUser, cleanEmail]
        );
        if (existing.length > 0) {
          throw new Error('A vendor with this email or username already exists.');
        }

        const [res] = await mysqlPool.query(
          'INSERT INTO users (username, password, store_name, owner_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            cleanUser,
            cleanPass,
            cleanStore,
            cleanName,
            cleanPhone,
            cleanEmail,
            'Vendor Admin'
          ]
        );

        return {
          id: res.insertId,
          username: cleanUser,
          store_name: cleanStore,
          owner_name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          role: 'Vendor Admin',
          created_at: new Date().toISOString()
        };
      } catch (err) {
        if (err.message && err.message.includes('already exists')) throw err;
        console.error('MySQL registerUser error:', err.message);
      }
    }

    const existing = (store.users || []).find(
      u => u.username.toLowerCase() === cleanUser || (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
    );
    if (existing) {
      throw new Error('A vendor with this email or username already exists.');
    }

    const newUser = {
      id: Date.now(),
      username: cleanUser,
      password: cleanPass,
      store_name: cleanStore,
      owner_name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      role: 'Vendor Admin',
      created_at: new Date().toISOString()
    };

    store.users.push(newUser);
    saveJsonStore();

    const { password: _, ...userSafe } = newUser;
    return userSafe;
  },

  getUserById: async (id) => {
    const uId = parseInt(id, 10);
    if (isMysqlAvailable && mysqlPool) {
      try {
        const [rows] = await mysqlPool.query(
          'SELECT id, username, store_name, owner_name, phone, email, role, created_at FROM users WHERE id = ?',
          [uId]
        );
        if (rows.length > 0) return rows[0];
      } catch (err) {
        console.error('MySQL getUserById error:', err.message);
      }
    }

    const user = (store.users || []).find(u => u.id === uId);
    if (user) {
      const { password: _, ...userSafe } = user;
      return userSafe;
    }
    throw new Error('User not found');
  }
};

module.exports = dbApi;
