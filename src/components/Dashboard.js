import React from 'react';
import { DollarSign, AlertTriangle, FileText, ShoppingCart, Send, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

const Dashboard = ({ stats, bills, customers, onNavigate, onViewBill, onOpenSettleModal }) => {
  const openWhatsAppReminder = (customerName, phone, amountOwed) => {
    let cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const message = `🙏 *REMINDER: Pending Balance Payment*
----------------------------------
Dear *${customerName}*,

This is a gentle reminder regarding your pending balance of *₹${amountOwed}* at *NovaBill Super Store*.

Kindly clear the balance amount at your earliest convenience via UPI / Cash.

If you have already paid, please ignore this message.

Thank you!
*NovaBill Super Store* 🏪`;

    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const topDebtors = customers
    .filter(c => c.total_due > 0)
    .sort((a, b) => b.total_due - a.total_due)
    .slice(0, 5);

  const recentBills = [...bills].slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15))',
        border: '1px solid var(--border-accent)',
        borderRadius: '20px',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'var(--glass-backdrop)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            Welcome back, Shopkeeper! 🛒
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: 0 }}>
            Never forget who owes you money! Effortlessly issue E-Bills with custom partial payment tracking and send instant automated WhatsApp debt reminders.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => onNavigate('create-bill')}
          style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)' }}
        >
          <ShoppingCart size={20} />
          <span>New E-Bill (POS)</span>
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Total Sales Today */}
        <div className="glass-card glass-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Today's Sales</span>
            <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            ₹{(stats?.todaySales || 0).toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '0.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={14} /> Collected ₹{(stats?.todayCollected || 0).toLocaleString()} today
          </p>
        </div>

        {/* Card 2: Total Pending Udhar Dues */}
        <div className="glass-card glass-card-hover" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Udhar (Credit Due)</span>
            <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', margin: 0 }}>
            ₹{(stats?.totalPendingDues || 0).toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.4rem', margin: 0 }}>
            {stats?.activeDebtorsCount || 0} Customers with remaining balance
          </p>
        </div>

        {/* Card 3: Total Collected Revenue */}
        <div className="glass-card glass-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Cash Collected</span>
            <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', margin: 0 }}>
            ₹{(stats?.totalCollected || 0).toLocaleString()}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', margin: 0 }}>
            Out of ₹{(stats?.totalSales || 0).toLocaleString()} total billed
          </p>
        </div>

        {/* Card 4: Total Bills Count */}
        <div className="glass-card glass-card-hover">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total E-Bills</span>
            <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <FileText size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            {stats?.totalBills || 0}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', margin: 0 }}>
            Across {stats?.totalCustomers || 0} registered customers
          </p>
        </div>
      </div>

      {/* Main Grid: Top Debtors vs Recent Bills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Left: Top Customers with Pending Dues */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#ef4444" />
                Customers Owing Udhar (Pending Dues)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Click WhatsApp to send instant balance invoice message
              </p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('customer-khata')}
            >
              View Khata <ArrowUpRight size={14} />
            </button>
          </div>

          {topDebtors.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              🎉 All customers have cleared their dues! No pending balance.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topDebtors.map((cust) => (
                <div 
                  key={cust.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      {cust.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      📞 {cust.phone}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444', display: 'block' }}>
                        ₹{cust.total_due.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600 }}>Due Balance</span>
                    </div>
                    <button 
                      className="btn btn-whatsapp btn-sm"
                      onClick={() => openWhatsAppReminder(cust.name, cust.phone, cust.total_due)}
                      title="Send WhatsApp Debt Reminder"
                    >
                      <Send size={14} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Bills */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="#6366f1" />
                Recent E-Bills
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Latest transactions & payment status
              </p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('bills-history')}
            >
              All Bills <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentBills.map((bill) => {
              let badgeClass = 'badge-paid';
              if (bill.payment_status === 'PARTIAL') badgeClass = 'badge-partial';
              if (bill.payment_status === 'UNPAID') badgeClass = 'badge-unpaid';

              return (
                <div 
                  key={bill.id}
                  onClick={() => onViewBill(bill.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  className="glass-card-hover"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6366f1' }}>
                        {bill.bill_number}
                      </span>
                      <span className={`badge ${badgeClass}`}>
                        {bill.payment_status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', margin: '0.2rem 0 0 0' }}>
                      {bill.customer_name}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                      ₹{bill.total_amount}
                    </span>
                    {bill.due_amount > 0 ? (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                        Due: ₹{bill.due_amount}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                        Fully Paid
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
