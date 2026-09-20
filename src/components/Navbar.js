import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

const Navbar = ({ onNewBillClick, stats }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="top-navbar">
      {/* Title / Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          NovaBill POS &amp; Ledger
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <ShieldCheck size={14} />
          System Online
        </div>
      </div>

      {/* Right Tools & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Total Credit Due Indicator */}
        {stats && stats.totalPendingDues > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.4rem 0.85rem',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <AlertCircle size={16} />
            <span>Pending Dues: ₹{stats.totalPendingDues.toLocaleString()}</span>
          </div>
        )}

        {/* Live Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Clock size={16} />
          <span>{time}</span>
        </div>

        {/* Quick New Bill Button */}
        <button className="btn btn-primary" onClick={onNewBillClick}>
          <PlusCircle size={18} />
          <span>+ Create New E-Bill</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
