import React, { useState } from 'react';
import { DollarSign, CheckCircle2, X } from 'lucide-react';

const SettlePaymentModal = ({ bill, onClose, onRecordPayment }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');

  if (!bill) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (amount > bill.due_amount) {
      if (!window.confirm(`Amount ₹${amount} exceeds the remaining due ₹${bill.due_amount}. Continue?`)) {
        return;
      }
    }

    onRecordPayment({
      bill_id: bill.id,
      amount: amount,
      payment_mode: paymentMode,
      notes: notes || 'Partial balance payment collected'
    });

    onClose();
  };

  const handleQuickFill = (percent) => {
    const val = (bill.due_amount * percent).toFixed(2);
    setPaymentAmount(val);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', padding: '1.75rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign color="#10b981" size={24} />
            Record Payment / Settle Due
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Bill Summary Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Invoice #:</span>
            <span style={{ fontWeight: 700, color: '#6366f1' }}>{bill.bill_number}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>{bill.customer_name}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Bill Amount:</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>₹{bill.total_amount}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            <span style={{ color: '#34d399' }}>Already Paid:</span>
            <span style={{ fontWeight: 700, color: '#34d399' }}>₹{bill.paid_amount}</span>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#f87171' }}>Remaining Due Balance:</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444' }}>₹{bill.due_amount}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ color: '#34d399', fontWeight: 700, margin: 0 }}>
                💵 Payment Amount Collected (₹) *
              </label>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleQuickFill(0.5)}>
                  50%
                </button>
                <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleQuickFill(1)}>
                  Full (100%)
                </button>
              </div>
            </div>

            <input 
              type="number"
              className="form-control"
              required
              placeholder="e.g. 450"
              style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.5)' }}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select 
              className="form-control"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="Cash">💵 Cash</option>
              <option value="UPI">📱 UPI / GPay / PhonePe</option>
              <option value="Card">💳 Card</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Note / Remark</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="e.g. Cleared remaining balance via UPI"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              <CheckCircle2 size={18} /> Confirm & Save Payment
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default SettlePaymentModal;
