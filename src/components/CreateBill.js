import React, { useState } from 'react';
import { Search, Trash2, UserPlus, CheckCircle2, ShoppingCart } from 'lucide-react';

const CreateBill = ({ products, customers, onCreateBill, onAddCustomer }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Cart line items: [{ product_id, product_name, price, quantity, total }]
  const [cartItems, setCartItems] = useState([]);
  
  // Custom Product Search
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Custom ad-hoc product modal / input
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');

  // Payment Breakdown
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');

  // New Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');

  // Handle Customer Selection
  const handleCustomerChange = (e) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    if (id) {
      const cust = customers.find(c => c.id === parseInt(id));
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        setCustomerAddress(cust.address || '');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  // Handle Adding Product to Cart
  const addToCart = (product) => {
    const existingIndex = cartItems.findIndex(item => item.product_id === product.id);
    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].price;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price
      }]);
    }
  };

  const addCustomItemToCart = () => {
    if (!customName || !customPrice) return;
    const price = parseFloat(customPrice);
    const qty = parseFloat(customQty) || 1;
    setCartItems([...cartItems, {
      product_id: null,
      product_name: customName,
      price: price,
      quantity: qty,
      total: price * qty
    }]);
    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
      updated[index].total = newQty * updated[index].price;
    }
    setCartItems(updated);
  };

  const removeItem = (index) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = subtotal;
  const numPaid = parseFloat(paidAmount) || 0;
  const remainingDue = Math.max(0, grandTotal - numPaid);

  let paymentStatus = 'UNPAID';
  if (remainingDue <= 0 && grandTotal > 0) {
    paymentStatus = 'PAID';
  } else if (numPaid > 0) {
    paymentStatus = 'PARTIAL';
  }

  // Submit Handler
  const handleSubmitBill = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Please add at least one product to the bill.');
      return;
    }

    const billData = {
      customer_id: selectedCustomerId ? parseInt(selectedCustomerId) : null,
      customer_name: customerName || 'Walk-in Customer',
      customer_phone: customerPhone || '',
      total_amount: grandTotal,
      paid_amount: numPaid,
      due_amount: remainingDue,
      payment_mode: paymentMode,
      notes: notes,
      items: cartItems
    };

    onCreateBill(billData);
  };

  // Save Inline New Customer
  const handleSaveNewCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    const created = await onAddCustomer({
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddr
    });
    if (created) {
      setSelectedCustomerId(created.id);
      setCustomerName(created.name);
      setCustomerPhone(created.phone);
      setCustomerAddress(created.address || '');
    }
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddr('');
  };

  // Filter products
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCustomerObj = customers.find(c => c.id === parseInt(selectedCustomerId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingCart color="#6366f1" size={28} />
            Create E-Bill (Point of Sale)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
            Issue E-Bills with custom payment split (Paid vs Remaining Due) & send direct WhatsApp receipts.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }}>
        
        {/* LEFT COLUMN: Product Catalog & Item Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Customer Selection Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                👤 Select Customer
              </label>
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddCustomerModal(true)}
              >
                <UserPlus size={14} /> + New Customer
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <select 
                  className="form-control"
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                >
                  <option value="">-- Walk-in / Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {c.total_due > 0 ? `| Due: ₹${c.total_due}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Customer Name (if Walk-in)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.85rem' }}>
              <input 
                type="text"
                className="form-control"
                placeholder="WhatsApp Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <input 
                type="text"
                className="form-control"
                placeholder="Address / Note"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>

            {selectedCustomerObj && selectedCustomerObj.total_due > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.65rem 1rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>⚠️ Previous Credit Owed by {selectedCustomerObj.name}:</span>
                <span style={{ fontWeight: 800 }}>₹{selectedCustomerObj.total_due}</span>
              </div>
            )}
          </div>

          {/* Product Catalog Picker */}
          <div className="glass-card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                📦 Product Picker
              </h3>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: selectedCategory === cat ? '#6366f1' : 'rgba(255,255,255,0.05)',
                      color: selectedCategory === cat ? '#fff' : 'var(--text-muted)'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-control"
                placeholder="Search products by name..."
                style={{ paddingLeft: '2.75rem' }}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            {/* Products Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '0.75rem',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '0.25rem'
            }}>
              {filteredProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="glass-card-hover"
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      {p.name}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {p.category} ({p.unit})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
                      ₹{p.price}
                    </span>
                    <span style={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#6366f1',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700
                    }}>
                      + Add
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ad-hoc Custom Item Add */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <input 
                type="text"
                className="form-control"
                placeholder="Or custom item name..."
                style={{ flex: 2 }}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <input 
                type="number"
                className="form-control"
                placeholder="₹ Price"
                style={{ flex: 1 }}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
              <input 
                type="number"
                className="form-control"
                placeholder="Qty"
                style={{ width: '60px' }}
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
              />
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={addCustomItemToCart}
              >
                + Add Custom
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: E-Bill Summary & Payment Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <form onSubmit={handleSubmitBill} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
              🧾 Current Bill Items ({cartItems.length})
            </h3>

            {/* Cart Items List */}
            <div style={{ flex: 1, minHeight: '180px', maxHeight: '250px', overflowY: 'auto', marginBottom: '1rem' }}>
              {cartItems.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
                  🛒 Cart is empty. Click products from the picker to add line items.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cartItems.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(15, 23, 42, 0.5)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                          {item.product_name}
                        </h5>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ₹{item.price} x {item.quantity}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-input)', borderRadius: '6px', padding: '0.15rem' }}>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(idx, -1)}
                            style={{ width: '24px', height: '24px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                          >-</button>
                          <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(idx, 1)}
                            style={{ width: '24px', height: '24px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                          >+</button>
                        </div>

                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', minWidth: '60px', textAlign: 'right' }}>
                          ₹{item.total}
                        </span>

                        <button 
                          type="button"
                          onClick={() => removeItem(idx)}
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations & Partial Payment Breakdown */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '14px',
              padding: '1.25rem',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              
              {/* Grand Total */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Grand Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>₹{grandTotal.toLocaleString()}</span>
              </div>

              <hr style={{ borderColor: 'var(--border-color)', margin: '0.25rem 0' }} />

              {/* Amount Paid Field */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ color: '#34d399', fontWeight: 700 }}>
                    💵 Amount Paid (₹)
                  </label>
                  <input 
                    type="number"
                    className="form-control"
                    placeholder="Enter paid amount..."
                    style={{ borderColor: 'rgba(16, 185, 129, 0.4)', fontWeight: 700, fontSize: '1.05rem', color: '#34d399' }}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Payment Method</label>
                  <select 
                    className="form-control"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="UPI">📱 UPI / GPay / PhonePe</option>
                    <option value="Card">💳 Card</option>
                    <option value="Credit/Udhar">📜 Udhar / Credit Ledger</option>
                  </select>
                </div>
              </div>

              {/* Remaining Due Computed Card */}
              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: remainingDue > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: remainingDue > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: remainingDue > 0 ? '#f87171' : '#34d399', display: 'block' }}>
                    {remainingDue > 0 ? '📌 REMAINING BALANCE DUE (UDHAR)' : '✅ FULLY PAID (No Due)'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Payment Status: {paymentStatus}
                  </span>
                </div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: remainingDue > 0 ? '#ef4444' : '#10b981' }}>
                  ₹{remainingDue.toLocaleString()}
                </span>
              </div>

              {/* Optional Notes */}
              <input 
                type="text"
                className="form-control"
                placeholder="Notes (e.g. promised to pay balance by Friday)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', marginTop: '0.5rem' }}
              >
                <CheckCircle2 size={20} />
                <span>Generate E-Bill & Save</span>
              </button>

            </div>

          </form>

        </div>

      </div>

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
              👤 Register New Customer
            </h3>
            <form onSubmit={handleSaveNewCustomer}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Mobile Number *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address / Landmark</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newCustAddr}
                  onChange={(e) => setNewCustAddr(e.target.value)}
                  placeholder="e.g. Shop 4, Station Road"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCustomerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Select Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateBill;
