import React, { useEffect, useState } from 'react';
import invoiceGif from '../assets/invoice-printing.gif';

const BillAnimationModal = ({ isOpen, onClose, billNumber, customerName }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        animation: 'fadeIn 0.25s ease-out',
        cursor: 'pointer'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '2.5rem 2rem',
          maxWidth: '460px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 50px rgba(99, 102, 241, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          animation: 'popUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'default'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
          onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          ✕
        </button>

        {/* Invoice Printing GIF Container */}
        <div style={{ 
          width: '240px', 
          height: '240px', 
          margin: '0 auto 1.25rem auto',
          borderRadius: '20px',
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 12px 30px rgba(0,0,0,0.35), 0 0 20px rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px'
        }}>
          <img 
            src={invoiceGif} 
            alt="Invoice Printing Animation" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              display: 'block'
            }} 
          />
        </div>

        {/* Text Details */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(34, 197, 94, 0.18)',
          color: '#22c55e',
          padding: '6px 14px',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          border: '1px solid rgba(34, 197, 94, 0.35)'
        }}>
          <span>🖨️</span> Generating & Printing Bill...
        </div>

        <h2 style={{
          color: '#ffffff',
          fontSize: '1.45rem',
          fontWeight: 800,
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.02em'
        }}>
          {billNumber || 'E-Bill Ready'}
        </h2>

        <p style={{
          color: '#94a3b8',
          fontSize: '0.92rem',
          margin: '0 0 1.5rem 0',
          lineHeight: '1.5'
        }}>
          {customerName ? (
            <>Invoice for <strong style={{ color: '#f8fafc' }}>{customerName}</strong> has been generated.</>
          ) : (
            'Your bill has been generated and is ready to view, print, or share on WhatsApp.'
          )}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.85rem 1.8rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 20px -3px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.2s ease',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span>View Bill Receipt ({countdown}s)</span>
          <span style={{ fontSize: '1.1rem' }}>→</span>
        </button>
      </div>
    </div>
  );
};

export default BillAnimationModal;
