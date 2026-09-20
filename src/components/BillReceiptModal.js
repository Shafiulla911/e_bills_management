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

  if (!bill) return null;

  let savedShop = {};
  try {
    savedShop = JSON.parse(localStorage.getItem('shopSettings') || localStorage.getItem('ebill_shop') || '{}');
  } catch (e) {}

  const shopName = bill.shop_name || savedShop.name || 'NovaBill Super Store';
  const shopAddress = bill.shop_address || savedShop.address || 'Shop No. 4, Main Market Road, City';
  const shopPhone = bill.shop_phone || savedShop.phone || '9876543210';
  const shopSignature = bill.shop_signature || savedShop.signature;

  const billNo = bill.bill_number || bill.billNo || `BILL-${bill.id || '1001'}`;
  const customerName = bill.customer_name || bill.customer || 'Walk-in Customer';
  const customerPhone = bill.customer_phone || bill.phone || '';
  const totalAmt = parseFloat(bill.total_amount !== undefined ? bill.total_amount : (bill.total || 0));
  const paidAmt = parseFloat(bill.paid_amount !== undefined ? bill.paid_amount : (bill.paid || 0));
  const dueAmt = parseFloat(bill.due_amount !== undefined ? bill.due_amount : (bill.balance !== undefined ? bill.balance : Math.max(0, totalAmt - paidAmt)));
  const dateObj = bill.created_at ? new Date(bill.created_at) : (bill.date ? new Date(bill.date + (String(bill.date).length === 10 ? 'T00:00:00' : '')) : new Date());
  const isValidDate = !isNaN(dateObj.getTime());
  const billDate = isValidDate ? dateObj.toLocaleDateString('en-GB') : (bill.date || new Date().toLocaleDateString('en-GB'));
  const billDay = isValidDate ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const paymentStatus = bill.payment_status || (dueAmt === 0 ? 'PAID' : (paidAmt > 0 ? 'PARTIAL' : 'UNPAID'));

  const itemsList = (bill.items || []).map(i => {
    const qty = parseFloat(i.quantity !== undefined ? i.quantity : (i.qty || 1)) || 1;
    const price = parseFloat(i.price !== undefined ? i.price : (i.rate || 0)) || 0;
    const lineTotal = parseFloat(i.total !== undefined ? i.total : (qty * price)) || 0;
    return {
      name: i.product_name || i.name || 'Item',
      quantity: qty,
      unit: i.unit || 'pcs',
      price: price,
      total: lineTotal
    };
  });

  const emptyRowsCount = Math.max(0, 4 - itemsList.length);
  const amountInWords = numberToWords(totalAmt);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`NovaBill_${billNo}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Error generating PDF download');
    }
  };

  const handleSendWhatsApp = () => {
    let phone = customerPhone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const itemsSummary = itemsList
      .map((i, idx) => `${idx + 1}. ${i.name} (${i.quantity} ${i.unit}) = ₹${i.total.toFixed(2)}`)
      .join('\n');

    const message = `🧾 *E-BILL INVOICE RECEIPT*
----------------------------------
🏪 *${shopName.toUpperCase()}*
📍 ${shopAddress}
📞 Phone: +91 ${shopPhone}

👤 *Customer:* ${customerName}
☀️ *Day:* ${billDay}
📅 *Date:* ${billDate}
📄 *Bill No:* ${billNo}

*Purchased Items:*
${itemsSummary}

----------------------------------
💰 *Total:* ₹${totalAmt.toFixed(2)}
💵 *Paid:* ₹${paidAmt.toFixed(2)}
📌 *Balance:* ₹${dueAmt.toFixed(2)}
💬 *Rupees in Words:* ${amountInWords}

${dueAmt > 0 ? `⚠️ *Note:* Kindly clear the remaining balance of *₹${dueAmt.toFixed(2)}* at your earliest convenience.` : '✅ Thank You! Visit Again.'}

- *Sent via NovaBill POS & Ledger* ⚡`;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  let badgeClass = 'badge-paid';
  if (paymentStatus === 'PARTIAL') badgeClass = 'badge-partial';
  if (paymentStatus === 'UNPAID') badgeClass = 'badge-unpaid';

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
            <span className={`badge ${badgeClass}`}>{paymentStatus}</span>
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
            padding: '2rem 2.5rem',
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
                {shopName}
              </h1>
              <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#222222', margin: '0.3rem 0 0 0' }}>
                {shopAddress}
              </p>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#000000', margin: '0.2rem 0 0 0' }}>
                Phone: +91 {shopPhone}
              </p>
            </div>

            {/* 2. Customer Name, Date & Day Section */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '2px solid #000000',
              fontSize: '1.02rem',
              fontWeight: 700,
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <span>Customer Name: </span>
                <span style={{ textDecoration: 'underline', fontWeight: 800 }}>{customerName}</span>
                {customerPhone && <span style={{ fontSize: '0.85rem', color: '#444', fontWeight: 600 }}> ({customerPhone})</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div>
                  <span>Day: </span>
                  <span style={{ textDecoration: 'underline', fontWeight: 800, color: '#1e1b4b' }}>
                    {billDay}
                  </span>
                </div>
                <div>
                  <span>Date: </span>
                  <span style={{ textDecoration: 'underline', fontWeight: 800 }}>
                    {billDate}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#444', fontWeight: 700 }}>
                  Bill No: {billNo}
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
                  <th style={{ width: '80px', padding: '0.6rem 0.5rem', borderRight: '2px solid #000000', textAlign: 'center' }}>
                    Qty
                  </th>
                  <th style={{ width: '140px', padding: '0.6rem 0.75rem', textAlign: 'right' }}>
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
                      {item.name}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', borderRight: '2px solid #000000', textAlign: 'center', fontWeight: 600 }}>
                      {item.quantity} {item.unit}
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
                  <span>₹{totalAmt.toFixed(2)}</span>
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
                  <span>₹{paidAmt.toFixed(2)}</span>
                </div>

                {/* Balance Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: dueAmt > 0 ? '#b91c1c' : '#15803d',
                  background: dueAmt > 0 ? '#fef2f2' : '#f0fdf4'
                }}>
                  <span>Balance</span>
                  <span>₹{dueAmt.toFixed(2)}</span>
                </div>

              </div>
            </div>

            {/* 5. UPI QR Code & Rupees in Words Section */}
            <div style={{
              borderTop: '2px solid #000000',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              {/* Rupees in Words Line */}
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                <span>Rupees in words: </span>
                <span style={{ fontStyle: 'italic', fontWeight: 800, textDecoration: 'underline' }}>
                  {amountInWords}
                </span>
              </div>

              {/* UPI Direct Scan Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: '#f8fafc',
                border: '1px dashed #64748b',
                borderRadius: '6px'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>📱 Scan &amp; Pay via UPI (GPay / PhonePe / Paytm)</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                    UPI ID: <strong>{savedShop.upiId || bill.upi_id || `${shopPhone}@upi`}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>Payable: ₹{(dueAmt > 0 ? dueAmt : totalAmt).toFixed(2)}</div>
                </div>
                {(savedShop.upiQrImage || bill.upi_qr_image) ? (
                  <img
                    src={savedShop.upiQrImage || bill.upi_qr_image}
                    alt="Custom Standee QR"
                    style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #94a3b8' }}
                  />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=upi://pay?pa=${encodeURIComponent(savedShop.upiId || bill.upi_id || `${shopPhone}@upi`)}%26pn=${encodeURIComponent(shopName)}%26am=${(dueAmt > 0 ? dueAmt : totalAmt).toFixed(2)}%26cu=INR`}
                    alt="UPI QR Code"
                    style={{ width: '60px', height: '60px', borderRadius: '4px' }}
                  />
                )}
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
                  Thank You! Visit Again 🙏
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
                  <div style={{ borderTop: '1.5px solid #000000', width: '100%', marginTop: '4px' }}></div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Settle Action (If unpaid & opened via Khata) */}
        {dueAmt > 0 && onOpenSettleModal && (
          <div className="no-print" style={{
            padding: '1rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button 
              className="btn btn-primary"
              onClick={() => { onClose(); onOpenSettleModal(bill); }}
            >
              💰 Settle Pending Balance (₹{dueAmt.toFixed(2)})
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BillReceiptModal;
