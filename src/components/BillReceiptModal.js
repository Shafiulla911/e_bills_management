import React, { useRef } from 'react';
import { Printer, Download, Send, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helper to convert number to words (Indian Currency System)
function numberToWords(num) {
  if (!num || num === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(num);
  const words = inWords(integerPart);
  return words ? `${words} Rupees Only` : '';
}

const BillReceiptModal = ({ bill, onClose, onOpenSettleModal }) => {
  const receiptRef = useRef(null);

  let savedShop = {};
  try { savedShop = JSON.parse(localStorage.getItem('ebill_shop') || '{}'); } catch (e) {}
  const shopSignature = bill?.shop_signature || savedShop.signature;

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`E-Bill_${bill.bill_number}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF download');
    }
  };

  const handleSendWhatsApp = () => {
    let phone = bill.customer_phone ? bill.customer_phone.replace(/\D/g, '') : '';
    if (phone.length === 10) phone = '91' + phone;

    const itemsSummary = (bill.items || [])
      .map((i, idx) => `${idx + 1}. ${i.product_name} (${i.quantity}) = ₹${i.total}`)
      .join('\n');

    const amountInWords = numberToWords(bill.total_amount);

    const message = `🧾 *E-BILL INVOICE RECEIPT*
----------------------------------
🏪 *PATEL SUPER MARKET*
📍 Shop 4, Main Market Road
📞 Phone: +91 98765 43210

👤 *Customer:* ${bill.customer_name}
📅 *Date:* ${new Date(bill.created_at).toLocaleDateString()}
📄 *Bill No:* ${bill.bill_number}

*Purchased Items:*
${itemsSummary}

----------------------------------
💰 *Total:* ₹${bill.total_amount}
💵 *Paid:* ₹${bill.paid_amount}
📌 *Balance:* ₹${bill.due_amount}
💬 *Rupees in Words:* ${amountInWords}

${bill.due_amount > 0 ? `⚠️ *Note:* Kindly clear the remaining balance of *₹${bill.due_amount}* at your convenience.` : '✅ Thank You! Visit Again.'}`;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  let badgeClass = 'badge-paid';
  if (bill.payment_status === 'PARTIAL') badgeClass = 'badge-partial';
  if (bill.payment_status === 'UNPAID') badgeClass = 'badge-unpaid';

  const amountInWords = numberToWords(bill.total_amount);
  const itemsList = bill.items || [];
  // Fill minimum 5 rows for clean visual structure like paper bills
  const emptyRowsCount = Math.max(0, 5 - itemsList.length);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px', padding: 0, overflow: 'hidden' }}>
        
        {/* Top Control Bar (No Print) */}
        <div className="no-print" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              🧾 Digital E-Bill Format
            </h3>
            <span className={`badge ${badgeClass}`}>{bill.payment_status}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-whatsapp btn-sm" onClick={handleSendWhatsApp}>
              <Send size={14} /> Send WhatsApp
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF}>
              <Download size={14} /> Download PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={14} /> Print Bill
            </button>
            <button 
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Traditional Hand-Drawn Style Paper E-Bill (Printable) */}
        <div 
          ref={receiptRef}
          className="printable-bill-area"
          style={{
            padding: '2.5rem',
            background: '#ffffff',
            color: '#000000',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            boxSizing: 'border-box'
          }}
        >
          {/* Main Outer Box Frame matching hand-drawn bill */}
          <div style={{ border: '2px solid #000000', width: '100%', boxSizing: 'border-box' }}>
            
            {/* 1. Header Section: Shop Name, Address, Phone Number */}
            <div style={{
              textAlign: 'center',
              padding: '1.25rem 1rem',
              borderBottom: '2px solid #000000'
            }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                PATEL SUPER MARKET
              </h1>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#222222', margin: '0.3rem 0 0 0' }}>
                Shop No. 4, Main Market Road, City
              </p>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#000000', margin: '0.2rem 0 0 0' }}>
                Phone: +91 98765 43210
              </p>
            </div>

            {/* 2. Customer Name & Date Section */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '2px solid #000000',
              fontSize: '1.05rem',
              fontWeight: 700
            }}>
              <div>
                <span>Customer Name: </span>
                <span style={{ textDecoration: 'underline', fontWeight: 800 }}>{bill.customer_name}</span>
                {bill.customer_phone && <span style={{ fontSize: '0.85rem', color: '#444', fontWeight: 600 }}> ({bill.customer_phone})</span>}
              </div>

              <div style={{ textAlign: 'right' }}>
                <span>Date: </span>
                <span style={{ textDecoration: 'underline', fontWeight: 800 }}>
                  {new Date(bill.created_at).toLocaleDateString('en-GB')}
                </span>
                <div style={{ fontSize: '0.8rem', color: '#444', fontWeight: 600 }}>
                  Bill No: {bill.bill_number}
                </div>
              </div>
            </div>

            {/* 3. Items Table (S/No | Items | Qty | Amount Rs) */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '1rem',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000000', fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ width: '60px', padding: '0.6rem 0.5rem', borderRight: '2px solid #000000', textAlign: 'center' }}>
                    S/No
                  </th>
                  <th style={{ padding: '0.6rem 0.75rem', borderRight: '2px solid #000000' }}>
                    Items
                  </th>
                  <th style={{ width: '70px', padding: '0.6rem 0.5rem', borderRight: '2px solid #000000', textAlign: 'center' }}>
                    Qty
                  </th>
                  <th style={{ width: '150px', padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                    Amount Rs
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemsList.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '0.65rem 0.5rem', borderRight: '2px solid #000000', textAlign: 'center', fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', borderRight: '2px solid #000000', fontWeight: 700 }}>
                      {item.product_name}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', borderRight: '2px solid #000000', textAlign: 'center', fontWeight: 600 }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>
                      ₹{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}

                {/* Empty padding rows for hand-drawn bill aesthetic */}
                {Array.from({ length: emptyRowsCount }).map((_, i) => (
                  <tr key={`empty-${i}`} style={{ height: '35px', borderBottom: '1px solid #eee' }}>
                    <td style={{ borderRight: '2px solid #000000' }}></td>
                    <td style={{ borderRight: '2px solid #000000' }}></td>
                    <td style={{ borderRight: '2px solid #000000' }}></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 4. Bottom Right Total / Paid / Balance Summary Box */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '2px solid #000000'
            }}>
              <div style={{ width: '260px', borderLeft: '2px solid #000000' }}>
                
                {/* Total Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid #000000',
                  fontSize: '1.05rem',
                  fontWeight: 800
                }}>
                  <span>Total</span>
                  <span>₹{bill.total_amount.toFixed(2)}</span>
                </div>

                {/* Paid Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid #000000',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#15803d'
                }}>
                  <span>Paid</span>
                  <span>₹{bill.paid_amount.toFixed(2)}</span>
                </div>

                {/* Balance Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: bill.due_amount > 0 ? '#b91c1c' : '#15803d',
                  background: bill.due_amount > 0 ? '#fef2f2' : '#f0fdf4'
                }}>
                  <span>Balance</span>
                  <span>₹{bill.due_amount.toFixed(2)}</span>
                </div>

              </div>
            </div>

            {/* 5. Footer Section: Rupees in words | Thank You | Signature */}
            <div style={{
              borderTop: '2px solid #000000',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Rupees in Words Line */}
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                <span>Rupees in words: </span>
                <span style={{ fontStyle: 'italic', fontWeight: 800, textDecoration: 'underline' }}>
                  {amountInWords}
                </span>
              </div>

              {/* Thank You & Signature Row */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginTop: '0.5rem',
                paddingTop: '0.5rem'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'cursive, sans-serif' }}>
                  Thank You
                </div>

                <div style={{ textAlign: 'center', minWidth: '160px' }}>
                  <div style={{ minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {shopSignature ? (
                      shopSignature.startsWith('data:image') ? (
                        <img src={shopSignature} alt="Authorized Signature" style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain', transform: 'rotate(-2.5deg)' }} />
                      ) : (
                        <span style={{ fontFamily: 'Alex Brush, Caveat, cursive', fontSize: '1.6rem', color: '#1d4ed8', fontWeight: 700, transform: 'rotate(-2.5deg)' }}>
                          {shopSignature}
                        </span>
                      )
                    ) : null}
                  </div>
                  <div style={{ borderBottom: '1.5px solid #000000', marginBottom: '0.2rem', width: '100%' }}></div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Authorized Signatory
                  </div>
                  {shopSignature && (
                    <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      ✓ Digitally Verified
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
          {/* End of Outer Box Frame */}

        </div>

        {/* Settle Payment Action Footer (No Print) */}
        {bill.due_amount > 0 && (
          <div className="no-print" style={{
            padding: '1rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.12)',
            borderTop: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 700 }}>
              ⚠️ Customer owes remaining balance of ₹{bill.due_amount}
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => { onClose(); onOpenSettleModal(bill); }}
            >
              💵 Collect / Settle Balance
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BillReceiptModal;
