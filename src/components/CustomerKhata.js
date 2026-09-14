import React, { useState } from 'react';
import { Users, Search, Send, History, UserPlus } from 'lucide-react';

const CustomerKhata = ({ customers, bills, onOpenSettleModal, onViewBill, onAddCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DUE_ONLY, CLEARED
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // New Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = cust.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cust.phone.includes(searchTerm);
    if (statusFilter === 'DUE_ONLY') return matchesSearch && cust.total_due > 0;
    if (statusFilter === 'CLEARED') return matchesSearch && cust.total_due === 0;
    return matchesSearch;
  });

  const sendWhatsAppKhataStatement = (customer) => {
    let cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const customerBills = bills.filter(b => b.customer_id === customer.id && b.due_amount > 0);
    const billsListStr = customerBills.map(b => `• Invoice #${b.bill_number} (${new Date(b.created_at).toLocaleDateString()}): Total ₹${b.total_amount}, Paid ₹${b.paid_amount}, Due ₹${b.due_amount}`).join('\n');

    const message = `📜 *KHATA CREDIT STATEMENT* - Patel Super Market
----------------------------------
👤 *Customer:* ${customer.name}
📞 *Phone:* ${customer.phone}

*Pending Unpaid Invoices:*
${billsListStr || 'No pending individual invoices.'}

----------------------------------
🔴 *TOTAL OUTSTANDING BALANCE DUE: ₹${customer.total_due}*

Kindly clear the balance at your convenience via Cash or UPI.

Thank you!
*Patel Super Market* 🏪`;

    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSaveNewCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    await onAddCustomer({
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddr
    });
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddr('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users color="#6366f1" size={28} />
            Customer Udhar Khata (Credit Ledger)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
            Track total credit owed by each customer, view individual bill ledger, and send WhatsApp payment statements.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddCustomerModal(true)}>
          <UserPlus size={18} />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-control"
            placeholder="Search customer by name or phone number..."
            style={{ paddingLeft: '2.75rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Customers ({customers.length})
          </button>
          <button 
            className={`btn btn-sm ${statusFilter === 'DUE_ONLY' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('DUE_ONLY')}
          >
            Owing Dues ({customers.filter(c => c.total_due > 0).length})
          </button>
          <button 
            className={`btn btn-sm ${statusFilter === 'CLEARED' ? 'btn-secondary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('CLEARED')}
            style={statusFilter === 'CLEARED' ? { background: '#10b981', color: '#fff' } : {}}
          >
            Cleared Balance
          </button>
        </div>
      </div>

      {/* Customer List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredCustomers.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No customer accounts found matching criteria.
          </div>
        ) : (
          filteredCustomers.map(cust => {
            const customerBills = bills.filter(b => b.customer_id === cust.id);
            const hasDue = cust.total_due > 0;

            return (
              <div 
                key={cust.id}
                className="glass-card glass-card-hover"
                style={{
                  borderLeft: hasDue ? '4px solid #ef4444' : '4px solid #10b981',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {cust.name}
                    </h3>
                    <span className={`badge ${hasDue ? 'badge-unpaid' : 'badge-paid'}`}>
                      {hasDue ? 'DUE BAL' : 'CLEARED'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                    📞 {cust.phone} {cust.address ? `• 📍 ${cust.address}` : ''}
                  </p>

                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    margin: '1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Outstanding Due</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: hasDue ? '#ef4444' : '#10b981' }}>
                        ₹{cust.total_due.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Invoices</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                        {customerBills.length} Bills
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedCustomer(cust)}
                  >
                    <History size={14} /> Ledger Details
                  </button>

                  <button 
                    className="btn btn-whatsapp btn-sm"
                    onClick={() => sendWhatsAppKhataStatement(cust)}
                    title="Send WhatsApp Khata Statement"
                  >
                    <Send size={14} /> WhatsApp
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Detail & Bill History Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', padding: '1.75rem' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  👤 Khata Ledger: {selectedCustomer.name}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Phone: {selectedCustomer.phone} | Address: {selectedCustomer.address || 'N/A'}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Current Credit Due</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: selectedCustomer.total_due > 0 ? '#ef4444' : '#10b981' }}>
                  ₹{selectedCustomer.total_due}
                </span>
              </div>
            </div>

            {/* Invoices List for this customer */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.85rem' }}>
              📜 Customer Purchase Bills
            </h4>

            <div className="custom-table-container" style={{ marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Remaining Due</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.filter(b => b.customer_id === selectedCustomer.id).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                        No billing history found for this customer.
                      </td>
                    </tr>
                  ) : (
                    bills.filter(b => b.customer_id === selectedCustomer.id).map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700, color: '#6366f1' }}>{b.bill_number}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: 700 }}>₹{b.total_amount}</td>
                        <td style={{ color: '#34d399' }}>₹{b.paid_amount}</td>
                        <td style={{ fontWeight: 800, color: b.due_amount > 0 ? '#ef4444' : '#10b981' }}>
                          ₹{b.due_amount}
                        </td>
                        <td>
                          <span className={`badge ${b.payment_status === 'PAID' ? 'badge-paid' : b.payment_status === 'PARTIAL' ? 'badge-partial' : 'badge-unpaid'}`}>
                            {b.payment_status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => { setSelectedCustomer(null); onViewBill(b.id); }}
                            >
                              View
                            </button>
                            {b.due_amount > 0 && (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => { setSelectedCustomer(null); onOpenSettleModal(b); }}
                              >
                                Collect ₹
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="btn btn-whatsapp"
                onClick={() => sendWhatsAppKhataStatement(selectedCustomer)}
              >
                <Send size={16} /> Send WhatsApp Statement
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Close Ledger
              </button>
            </div>

          </div>
        </div>
      )}

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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerKhata;
