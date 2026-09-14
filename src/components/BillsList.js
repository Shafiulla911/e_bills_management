import React, { useState } from 'react';
import { Receipt, Search, Eye, Send, DollarSign } from 'lucide-react';

const BillsList = ({ bills, onViewBill, onOpenSettleModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.customer_phone && bill.customer_phone.includes(searchTerm));

    if (statusFilter === 'PAID') return matchesSearch && bill.payment_status === 'PAID';
    if (statusFilter === 'PARTIAL') return matchesSearch && bill.payment_status === 'PARTIAL';
    if (statusFilter === 'UNPAID') return matchesSearch && bill.payment_status === 'UNPAID';
    return matchesSearch;
  });

  const sendWhatsAppBill = (bill) => {
    let phone = bill.customer_phone ? bill.customer_phone.replace(/\D/g, '') : '';
    if (phone.length === 10) phone = '91' + phone;

    const message = `🧾 *E-BILL RECEIPT* - Patel Super Market
----------------------------------
📄 *Invoice #:* ${bill.bill_number}
👤 *Customer:* ${bill.customer_name}
📅 *Date:* ${new Date(bill.created_at).toLocaleDateString()}

💰 *Total Amount:* ₹${bill.total_amount}
💵 *Amount Paid:* ₹${bill.paid_amount}
📌 *REMAINING BALANCE DUE:* ₹${bill.due_amount}
💳 *Status:* ${bill.payment_status} (${bill.payment_mode})

${bill.due_amount > 0 ? `⚠️ *Note:* Kindly clear the remaining balance of *₹${bill.due_amount}* at your earliest convenience.` : '✅ Thank you for your payment!'}

- *Sent via E-Bill Store System* 🏪`;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt color="#6366f1" size={28} />
            Bills & Receipts Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>
            Search past invoices, track payment status, clear due balances, and resend WhatsApp receipts.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            className="form-control"
            placeholder="Search by Bill #, Customer Name, or Phone..."
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
            All ({bills.length})
          </button>
          <button 
            className={`btn btn-sm ${statusFilter === 'PARTIAL' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('PARTIAL')}
          >
            Partial / Udhar ({bills.filter(b => b.payment_status === 'PARTIAL').length})
          </button>
          <button 
            className={`btn btn-sm ${statusFilter === 'UNPAID' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('UNPAID')}
          >
            Unpaid ({bills.filter(b => b.payment_status === 'UNPAID').length})
          </button>
          <button 
            className={`btn btn-sm ${statusFilter === 'PAID' ? 'btn-secondary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('PAID')}
            style={statusFilter === 'PAID' ? { background: '#10b981', color: '#fff' } : {}}
          >
            Fully Paid ({bills.filter(b => b.payment_status === 'PAID').length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Payment Mode</th>
                <th>Total Billed</th>
                <th>Amount Paid</th>
                <th>Remaining Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    No invoices match your search query.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => {
                  let badgeClass = 'badge-paid';
                  if (bill.payment_status === 'PARTIAL') badgeClass = 'badge-partial';
                  if (bill.payment_status === 'UNPAID') badgeClass = 'badge-unpaid';

                  return (
                    <tr key={bill.id}>
                      <td style={{ fontWeight: 800, color: '#6366f1' }}>{bill.bill_number}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(bill.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#fff', display: 'block' }}>{bill.customer_name}</span>
                        {bill.customer_phone && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {bill.customer_phone}</span>}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                          {bill.payment_mode}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{bill.total_amount}</td>
                      <td style={{ color: '#34d399', fontWeight: 600 }}>₹{bill.paid_amount}</td>
                      <td style={{ fontWeight: 800, color: bill.due_amount > 0 ? '#ef4444' : '#10b981' }}>
                        ₹{bill.due_amount}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {bill.payment_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => onViewBill(bill.id)}
                            title="View E-Bill Receipt"
                          >
                            <Eye size={14} /> Receipt
                          </button>

                          <button 
                            className="btn btn-whatsapp btn-sm"
                            onClick={() => sendWhatsAppBill(bill)}
                            title="Send WhatsApp Bill"
                          >
                            <Send size={14} /> WhatsApp
                          </button>

                          {bill.due_amount > 0 && (
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => onOpenSettleModal(bill)}
                              title="Collect Due Payment"
                            >
                              <DollarSign size={14} /> Collect
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default BillsList;
