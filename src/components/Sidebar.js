import React from 'react';
import { LayoutDashboard, Receipt, Users, Package, ShoppingCart } from 'lucide-react';

const Sidebar = ({ currentTab, setCurrentTab, stats }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-bill', label: 'Create E-Bill (POS)', icon: ShoppingCart, badge: 'New' },
    { id: 'bills-history', label: 'Bills & Receipts', icon: Receipt },
    { 
      id: 'customer-khata', 
      label: 'Customer Khata', 
      icon: Users, 
      count: stats?.activeDebtorsCount > 0 ? stats.activeDebtorsCount : null 
    },
    { id: 'products', label: 'Product Catalog', icon: Package }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
              QuickBill
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              E-Bill & Udhar Khata
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ padding: '1.25rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15))' : 'transparent',
                color: isActive ? '#6366f1' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Icon size={20} color={isActive ? '#6366f1' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  textTransform: 'uppercase'
                }}>
                  {item.badge}
                </span>
              )}
              {item.count ? (
                <span style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.5rem',
                  borderRadius: '999px'
                }}>
                  {item.count} due
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer Store Info */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(11, 15, 25, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem'
          }}>
            🏪
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Patel Super Market
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Shopkeeper Portal
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
