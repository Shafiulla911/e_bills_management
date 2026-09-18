import { useState, useEffect, useRef } from 'react';
import './App.css';
import BillAnimationModal from './components/BillAnimationModal';

// ─── Constants & Default Data ────────────────────────────────────────────────
const UNITS = ['pcs', 'kg', 'g', 'grams', 'L', 'mL', 'box', 'pack', 'dozen', 'pairs', 'set', 'bundle'];

const PRODUCT_CATEGORIES = [
  'All',
  'Grocery',
  'Dairy & Bakery',
  'Beverages',
  'Snacks & Biscuits',
  'Spices & Grains',
  'Personal Care',
  'Household',
  'Others'
];

const DEFAULT_SHOP = {
  name: 'My Store',
  address: '123 Market Street, Main Road, City',
  phone: '9876543210',
  signature: ''
};

const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Fresh Milk 1L', category: 'Dairy & Bakery', rate: 65, unit: 'L', stock: 24 },
  { id: 'p2', name: 'Basmati Rice 5kg', category: 'Spices & Grains', rate: 420, unit: 'pack', stock: 15 },
  { id: 'p3', name: 'Tata Tea Gold 500g', category: 'Beverages', rate: 290, unit: 'pack', stock: 8 },
  { id: 'p4', name: 'Refined Sunflower Oil 1L', category: 'Grocery', rate: 145, unit: 'L', stock: 30 },
  { id: 'p5', name: 'Whole Wheat Atta 10kg', category: 'Grocery', rate: 380, unit: 'pack', stock: 12 },
  { id: 'p6', name: 'Cadbury Dairy Milk', category: 'Snacks & Biscuits', rate: 40, unit: 'pcs', stock: 50 },
  { id: 'p7', name: 'Dettol Handwash 250ml', category: 'Personal Care', rate: 99, unit: 'pcs', stock: 18 },
  { id: 'p8', name: 'Surf Excel Detergent 1kg', category: 'Household', rate: 135, unit: 'pack', stock: 22 }
];

const DEFAULT_CONTACTS = [
  { id: 'c1', name: 'Rahul Sharma', phone: '9876501234', address: 'Flat 402, Green Valley' },
  { id: 'c2', name: 'Priya Patel', phone: '9823456789', address: '12-A, Shanti Nagar' },
  { id: 'c3', name: 'Amit Verma', phone: '9712345678', address: 'Shop 5, Station Road' },
  { id: 'c4', name: 'Sunita Devi', phone: '9654321098', address: 'B-104, Sunrise Heights' }
];

const EMPTY_ITEM = { name: '', qty: '', rate: '', unit: 'pcs' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const nextBillNo = bills => 'BILL-' + String(bills.length + 1).padStart(4, '0');
const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── Number → Indian Words ───────────────────────────────────────────────────
function numberToWords(amount) {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const below100 = n => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  const below1000 = n => n < 100 ? below100(n) : ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + below100(n % 100) : '');
  let n = num, result = '';
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) result += below1000(crore) + ' Crore ';
  if (lakh) result += below1000(lakh) + ' Lakh ';
  if (thousand) result += below1000(thousand) + ' Thousand ';
  if (n) result += below1000(n);
  return result.trim() + ' Rupees Only';
}

const getBillPaid = bill =>
  bill.payments?.length ? bill.payments.reduce((s, p) => s + (p.amount || 0), 0) : (bill.paid || 0);
const getBillBalance = bill => Math.max(0, bill.total - getBillPaid(bill));

const normalizeBill = bill => {
  if (bill.payments) return bill;
  return {
    ...bill,
    payments: (bill.paid || 0) > 0
      ? [{ id: uid(), amount: bill.paid, type: bill.paymentType || 'paid', date: bill.date, note: '' }]
      : [],
  };
};

// ─── PDF & Photo Generators ──────────────────────────────────────────────────
async function generateAndSharePDF(bill, shop) {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById('print-area');
  if (!element) return;
  const filename = `${bill.billNo}-${bill.customer.replace(/\s+/g, '_')}.pdf`;
  const opt = {
    margin: [4, 4, 4, 4], filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' },
  };
  const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try { await navigator.share({ title: `Bill from ${shop.name}`, text: `Bill: ${bill.billNo}`, files: [pdfFile] }); return; }
    catch (e) { /* fallback */ }
  }
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  setTimeout(() => {
    const phone = bill.phone ? bill.phone.replace(/\D/g, '') : '';
    const msg = `Hi ${bill.customer}, here is your bill (${bill.billNo}) from ${shop.name}. Total: ${fmt(bill.total)}. Thank you!`;
    window.open(phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }, 800);
}

async function generateAndShareImage(bill, shop) {
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById('print-area');
  if (!element) return;
  const filename = `${bill.billNo}-${bill.customer.replace(/\s+/g, '_')}.png`;

  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const imageFile = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try {
          await navigator.share({
            title: `Bill Photo from ${shop.name}`,
            text: `E-Bill Photo: ${bill.billNo}`,
            files: [imageFile],
          });
          return;
        } catch (e) { /* fallback */ }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setTimeout(() => {
        const phone = bill.phone ? bill.phone.replace(/\D/g, '') : '';
        const msg = `Hi ${bill.customer}, here is your bill photo (${bill.billNo}) from ${shop.name}. Total: ${fmt(bill.total)}. Thank you!`;
        window.open(phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
      }, 800);
    }, 'image/png');
  } catch (err) {
    console.error('Error generating image:', err);
    alert('Could not generate bill photo. Please try again.');
  }
}

async function downloadBillImage(bill) {
  const html2canvas = (await import('html2canvas')).default;
  const element = document.getElementById('print-area');
  if (!element) return;
  const filename = `${bill.billNo}-${bill.customer.replace(/\s+/g, '_')}.png`;

  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } catch (err) {
    console.error('Error downloading bill image:', err);
    alert('Could not download image.');
  }
}

function sendWhatsAppReminder(bill, shop) {
  const phone = bill.phone ? bill.phone.replace(/\D/g, '') : '';
  const balance = getBillBalance(bill);
  const msg = `🙏 *Payment Reminder from ${shop.name}*\n\nDear *${bill.customer}*,\nThis is a gentle reminder that an outstanding balance of *${fmt(balance)}* is pending for bill *${bill.billNo}* dated ${bill.date}.\n\nKindly clear the balance at your earliest convenience via Cash or UPI.\n\nThank you for your business! ✨`;
  window.open(phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function WAIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.853L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.877 9.877 0 01-5.042-1.383l-.361-.214-3.744.981.999-3.648-.235-.374A9.867 9.867 0 012.118 12C2.118 6.58 6.58 2.118 12 2.118S21.882 6.58 21.882 12 17.42 21.882 12 21.882z" />
    </svg>
  );
}

// ─── E-Signature Pad (Executive Calligraphy & Fountain Pen Suite) ───────────
const CURSIVE_FONTS = [
  { name: 'Mr De Haviland', family: "'Mr De Haviland', cursive", label: 'CEO Grand Calligraphy' },
  { name: 'Herr Von Muellerhoff', family: "'Herr Von Muellerhoff', cursive", label: 'Executive Loop Script' },
  { name: 'Monsieur La Doulaise', family: "'Monsieur La Doulaise', cursive", label: 'Victorian Flourish' },
  { name: 'Pinyon Script', family: "'Pinyon Script', cursive", label: 'Royal Fountain Pen' },
  { name: 'Italianno', family: "'Italianno', cursive", label: 'Ribbon Signature' },
  { name: 'Alex Brush', family: "'Alex Brush', cursive", label: 'Alex Brush' },
  { name: 'Great Vibes', family: "'Great Vibes', cursive", label: 'Great Vibes' },
  { name: 'Sacramento', family: "'Sacramento', cursive", label: 'Sacramento' },
  { name: 'Caveat', family: "'Caveat', cursive", label: 'Caveat' },
];

const FLOURISH_STYLES = [
  { id: 'executive-loop', label: '✒️ Executive Loop & Dot (As in Photo)', desc: 'Sweeping lower loop with fountain pen end dot' },
  { id: 'swoosh-underline', label: '〰️ Calligraphic Swoosh Underline', desc: 'Flowing underline with tapered tail' },
  { id: 'cross-flourish', label: '✨ Grand Monogram Flourish', desc: 'Decorative loop flourish' },
  { id: 'none', label: 'Plain Signature', desc: 'Only cursive text without underline' },
];

const INK_COLORS = [
  { id: 'black', hex: '#0a0a0a', name: 'Fountain Black' },
  { id: 'blue', hex: '#1d4ed8', name: 'Royal Blue' },
  { id: 'navy', hex: '#0f172a', name: 'Deep Navy' },
  { id: 'purple', hex: '#7c3aed', name: 'Imperial Purple' },
];

function SignaturePad({ onSave }) {
  const [mode, setMode] = useState('type');
  const [typedSig, setTypedSig] = useState('Eshan');
  const [selectedFont, setSelectedFont] = useState(CURSIVE_FONTS[0].family);
  const [flourish, setFlourish] = useState('executive-loop');
  const [inkColor, setInkColor] = useState('#0a0a0a');
  const [penNib, setPenNib] = useState('calligraphy'); // 'calligraphy' | 'fine' | 'thick'
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const canvasRef = useRef(null);

  // ─── Drawing with Calligraphic Chisel Nib Simulation ───────────
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    setLastPoint({ x, y, time: Date.now() });

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(x, y, penNib === 'fine' ? 1.5 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = inkColor;
    ctx.fill();
  };

  const draw = (e) => {
    if (!isDrawing || !lastPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const currentY = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    const currentTime = Date.now();

    const dx = currentX - lastPoint.x;
    const dy = currentY - lastPoint.y;
    const distance = Math.hypot(dx, dy);
    const dt = Math.max(1, currentTime - lastPoint.time);
    const speed = distance / dt;

    if (penNib === 'calligraphy') {
      // 45-degree Fountain Pen Calligraphy Nib physics
      const angle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(Math.sin(angle - (Math.PI / 4)));
      const nibWidth = Math.max(1.2, 5.5 * angleDiff);

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = nibWidth;
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      ctx.stroke();
    } else {
      const width = penNib === 'fine'
        ? Math.max(1, 3 - speed * 0.4)
        : Math.max(2.5, 6.5 - speed * 0.8);
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    setLastPoint({ x: currentX, y: currentY, time: currentTime });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSaveDrawn = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  // ─── Render High-Res Calligraphic Signature to PNG ─────────
  const handleSaveExecutiveSignature = () => {
    if (!typedSig.trim()) return;
    const width = 480;
    const height = 160;
    const offscreen = document.createElement('canvas');
    offscreen.width = width * 2; // high resolution retina
    offscreen.height = height * 2;
    const ctx = offscreen.getContext('2d');
    ctx.scale(2, 2);

    ctx.fillStyle = inkColor;
    ctx.strokeStyle = inkColor;

    // 1. Draw "Signature" header label (subtle uppercase)
    ctx.font = '700 10px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('SIGNATURE', 30, 24);

    // 2. Draw Main Calligraphic Signature
    ctx.font = `700 64px ${selectedFont}`;
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedSig.trim(), 40, 75);

    // 3. Draw Flourish swooshes if selected
    if (flourish === 'executive-loop') {
      // Sweeping bottom loop and underline with fountain pen end dot (like photo)
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      // Initial grand loop
      ctx.moveTo(35, 95);
      ctx.bezierCurveTo(15, 60, 25, 40, 75, 45);
      ctx.bezierCurveTo(115, 50, 45, 120, 25, 145);
      // Sweeping underline towards right
      ctx.bezierCurveTo(40, 115, 140, 115, 410, 110);
      ctx.stroke();

      // Fountain pen end dot
      ctx.beginPath();
      ctx.arc(414, 110, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (flourish === 'swoosh-underline') {
      ctx.beginPath();
      ctx.lineWidth = 2.2;
      ctx.moveTo(35, 115);
      ctx.bezierCurveTo(120, 105, 240, 125, 420, 112);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(424, 112, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (flourish === 'cross-flourish') {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.moveTo(35, 60);
      ctx.bezierCurveTo(70, 25, 120, 120, 380, 115);
      ctx.stroke();
    }

    const dataUrl = offscreen.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="sig-pad-container">
      {/* Mode Selector */}
      <div className="sig-mode-tabs">
        <button
          type="button"
          className={`sig-tab ${mode === 'type' ? 'active' : ''}`}
          onClick={() => setMode('type')}
        >
          🖋️ Executive Calligraphy (As in Photo)
        </button>
        <button
          type="button"
          className={`sig-tab ${mode === 'draw' ? 'active' : ''}`}
          onClick={() => setMode('draw')}
        >
          ✒️ Draw with Fountain Pen Nib
        </button>
      </div>

      {/* Ink Color Picker */}
      <div className="sig-controls-row">
        <div className="sig-color-picker">
          <span className="sig-label">Ink:</span>
          <div className="color-options">
            {INK_COLORS.map(col => (
              <button
                key={col.id}
                type="button"
                className={`color-btn ${inkColor === col.hex ? 'active' : ''}`}
                style={{ backgroundColor: col.hex }}
                onClick={() => setInkColor(col.hex)}
                title={col.name}
              />
            ))}
          </div>
        </div>

        {mode === 'draw' && (
          <div className="sig-pen-width">
            <span className="sig-label">Nib:</span>
            <button
              type="button"
              className={`pen-btn ${penNib === 'calligraphy' ? 'active' : ''}`}
              onClick={() => setPenNib('calligraphy')}
            >
              ✒️ Chisel Fountain Nib
            </button>
            <button
              type="button"
              className={`pen-btn ${penNib === 'fine' ? 'active' : ''}`}
              onClick={() => setPenNib('fine')}
            >
              Fine Nib
            </button>
            <button
              type="button"
              className={`pen-btn ${penNib === 'thick' ? 'active' : ''}`}
              onClick={() => setPenNib('thick')}
            >
              Bold Nib
            </button>
          </div>
        )}
      </div>

      {/* ── MODE 1: EXECUTIVE CALLIGRAPHY GENERATOR ── */}
      {mode === 'type' ? (
        <div className="sig-type-wrap">
          {/* Signer Name Input */}
          <div className="field-group dark-field" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.78rem' }}>Name to Sign (e.g. Eshan)</label>
            <input
              className="dark-input"
              placeholder="e.g. Eshan or Shopkeeper Name"
              value={typedSig}
              onChange={e => setTypedSig(e.target.value)}
            />
          </div>

          {/* Calligraphy Font Choices */}
          <div style={{ marginTop: '0.4rem' }}>
            <span className="sig-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
              Choose Calligraphy Style:
            </span>
            <div className="font-selector-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {CURSIVE_FONTS.map(f => (
                <button
                  key={f.name}
                  type="button"
                  className={`font-chip ${selectedFont === f.family ? 'active' : ''}`}
                  onClick={() => setSelectedFont(f.family)}
                >
                  <span className="font-chip-label">{f.label}</span>
                  <span className="font-chip-preview" style={{ fontFamily: f.family, color: inkColor, fontSize: '1.45rem' }}>
                    {typedSig || f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Flourish & Swoosh Selector (Matching the photo) */}
          <div style={{ marginTop: '0.4rem' }}>
            <span className="sig-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
              Flourish &amp; Loop Pattern:
            </span>
            <div className="flourish-options-grid">
              {FLOURISH_STYLES.map(fl => (
                <button
                  key={fl.id}
                  type="button"
                  className={`flourish-pill-btn ${flourish === fl.id ? 'active' : ''}`}
                  onClick={() => setFlourish(fl.id)}
                >
                  <span style={{ fontWeight: 700 }}>{fl.label}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block' }}>{fl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          {typedSig && (
            <div className="executive-sig-preview-box">
              <div className="espb-tag">Executive Signature Preview:</div>
              <div className="espb-content">
                <span className="espb-label">SIGNATURE</span>
                <div
                  className="espb-calligraphy-text"
                  style={{ fontFamily: selectedFont, color: inkColor }}
                >
                  {typedSig}
                </div>

                {flourish === 'executive-loop' && (
                  <svg className="espb-flourish-svg" viewBox="0 0 400 60" fill="none">
                    <path
                      d="M20 15 C 5 35, 15 50, 45 45 C 85 40, 25 5, 15 45 C 30 15, 120 15, 380 12"
                      stroke={inkColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="384" cy="12" r="3.5" fill={inkColor} />
                  </svg>
                )}

                {flourish === 'swoosh-underline' && (
                  <svg className="espb-flourish-svg" viewBox="0 0 400 40" fill="none">
                    <path
                      d="M25 20 C 110 5, 230 35, 380 15"
                      stroke={inkColor}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <circle cx="385" cy="15" r="3" fill={inkColor} />
                  </svg>
                )}

              </div>
            </div>
          )}

          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}
            onClick={handleSaveExecutiveSignature}
            disabled={!typedSig.trim()}
          >
            💾 Save Executive Calligraphy Signature
          </button>
        </div>
      ) : (
        /* ── MODE 2: FOUNTAIN PEN CANVAS DRAWING ── */
        <div className="sig-canvas-wrap">
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0 0 0.4rem 0' }}>
            Draw smoothly with your finger or mouse — realistic fountain pen nib physics automatically creates calligraphic tapers!
          </p>
          <canvas
            ref={canvasRef}
            width={380}
            height={130}
            className="sig-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="sig-actions">
            <button type="button" className="btn-ghost btn-sm" onClick={clearCanvas}>🧹 Clear</button>
            <button type="button" className="btn-primary btn-sm" onClick={handleSaveDrawn}>💾 Save Hand-Drawn Signature</button>
          </div>
        </div>
      )}
    </div>
  );
}




// ─── Contacts Picker Modal ───────────────────────────────────────────────────
function ContactsPickerModal({ isOpen, onClose, onSelectContact, contacts, onAddNewContact }) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddr, setNewAddr] = useState('');

  if (!isOpen) return null;

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const handleCreateContact = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newC = {
      id: uid(),
      name: newName.trim(),
      phone: newPhone.replace(/\D/g, ''),
      address: newAddr.trim()
    };
    onAddNewContact(newC);
    onSelectContact(newC);
    setNewName('');
    setNewPhone('');
    setNewAddr('');
    setShowAddForm(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box fade-in" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>📱 Select Customer Contact</h3>
            <p className="modal-sub">Pick from your phone contacts or address book</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              className="dark-input"
              style={{ flex: 1 }}
              placeholder="🔍 Search contacts by name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => setShowAddForm(p => !p)}
            >
              {showAddForm ? 'Cancel' : '+ New'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateContact} className="quick-add-contact-card">
              <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>➕ Save New Phone Contact</h4>
              <input
                className="dark-input"
                placeholder="Full Name *"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
              <input
                className="dark-input"
                placeholder="10-digit Phone / WhatsApp Number"
                maxLength={10}
                inputMode="numeric"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
              />
              <input
                className="dark-input"
                placeholder="Address / Area (Optional)"
                value={newAddr}
                onChange={e => setNewAddr(e.target.value)}
              />
              <button type="submit" className="btn-primary btn-sm" style={{ width: '100%', marginTop: '0.25rem' }}>
                Save &amp; Select
              </button>
            </form>
          )}

          <div className="contacts-picker-list">
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                <div className="empty-icon" style={{ fontSize: '1.75rem' }}>📱</div>
                <p>No contacts found matching &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              filtered.map(c => (
                <div
                  key={c.id}
                  className="contact-picker-item"
                  onClick={() => { onSelectContact(c); onClose(); }}
                >
                  <div className="cpi-avatar">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="cpi-info">
                    <div className="cpi-name">{c.name}</div>
                    <div className="cpi-phone">📞 {c.phone || 'No phone'}</div>
                    {c.address && <div className="cpi-addr">📍 {c.address}</div>}
                  </div>
                  <button className="cpi-select-btn">Select ➔</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer-btns">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ───────────────────────────────────────────────────────────
function PaymentModal({ bill, onClose, onAdd }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('paid');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const balance = getBillBalance(bill);

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onAdd({ id: uid(), amount: amt, type, date, note: note.trim() });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>💰 Add Payment</h3>
            <p className="modal-sub">{bill.billNo} · {bill.customer}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-balance-tag">
          Outstanding Balance: <strong>{fmt(balance)}</strong>
        </div>
        <div className="modal-body">
          <div className="field-group dark-field">
            <label>Payment Type</label>
            <div className="pay-type-group">
              <button type="button" className={`pay-type-btn${type === 'paid' ? ' selected-paid' : ''}`} onClick={() => setType('paid')}>✅ Paid / Cleared</button>
              <button type="button" className={`pay-type-btn${type === 'advance' ? ' selected-advance' : ''}`} onClick={() => setType('advance')}>⏩ Advance</button>
            </div>
          </div>
          <div className="field-group dark-field">
            <label>Amount (₹) *</label>
            <input className="dark-input" type="number" min="0.01" step="0.01"
              placeholder={`Outstanding: ${balance.toFixed(2)}`} inputMode="decimal"
              value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
          </div>
          <div className="field-group dark-field">
            <label>Payment Date</label>
            <input className="dark-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="field-group dark-field">
            <label>Note / Mode (Optional)</label>
            <input className="dark-input" placeholder="e.g. Cash, GPay, PhonePe, Bank Transfer…"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer-btns">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!amount || parseFloat(amount) <= 0} onClick={handleAdd}>
            + Settle Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bill Card ───────────────────────────────────────────────────────────────
function BillCard({ bill, onView, onSend, onDelete, onAddPayment, onDuplicate, onSendReminder, shop }) {
  const paid = getBillPaid(bill);
  const balance = getBillBalance(bill);
  return (
    <div className={`bill-card${balance > 0 ? ' pending' : ' paid'}`} onClick={() => onView(bill)}>
      <div className="bc-top">
        <div>
          <div className="bc-billno">{bill.billNo}</div>
          <div className="bc-customer">{bill.customer}</div>
        </div>
        <span className={`status-pill${balance > 0 ? ' pending' : ' paid'}`}>
          {balance > 0 ? '⏳ Due' : '✅ Paid'}
        </span>
      </div>
      <div className="bc-meta">
        <span>📅 {bill.date}</span>
        <span>📦 {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}</span>
        {bill.phone && <span>📞 {bill.phone}</span>}
      </div>
      <div className="bc-amounts">
        <div className="bc-amt"><span>Total</span><strong>{fmt(bill.total)}</strong></div>
        <div className="bc-amt"><span>Paid</span><strong>{fmt(paid)}</strong></div>
        {balance > 0 && <div className="bc-amt balance-due"><span>Due Balance</span><strong>{fmt(balance)}</strong></div>}
      </div>
      <div className="bc-actions" onClick={e => e.stopPropagation()}>
        {balance > 0 && (
          <>
            <button className="bc-btn pay-btn" title="Add Payment" onClick={() => onAddPayment(bill)}>
              💰 Pay
            </button>
            <button className="bc-btn reminder-btn" title="Send WhatsApp Udhar Reminder" onClick={() => onSendReminder(bill, shop)}>
              <WAIcon size={14} /> Remind
            </button>
          </>
        )}
        <button className="bc-btn dup-btn" title="Duplicate into New Bill" onClick={() => onDuplicate(bill)}>
          📋 Copy
        </button>
        {bill.phone && (
          <button className="btn-wa-small" onClick={() => onSend(bill)} title="Send Bill to WhatsApp">
            <WAIcon size={14} /> Send
          </button>
        )}
        <button className="bc-btn del-btn" title="Delete" onClick={() => onDelete(bill.id)}>
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── Receipt View ────────────────────────────────────────────────────────────
function ReceiptView({ bill, shop, onSend, onSendImage, onSaveImage, onBack, generating, onAddPayment }) {
  const totalPaid = getBillPaid(bill);
  const balance = getBillBalance(bill);

  return (
    <div className="fade-in tab-pane receipt-view-pane">
      <div className="receipt-paper" id="print-area">
        <div className="rcp-watermark">{shop.name}</div>
        <div className="rcp-header">
          <div className="rcp-shop-name">{shop.name}</div>
          <div className="rcp-shop-info">{shop.address}</div>
          <div className="rcp-shop-info">📞 {shop.phone}</div>
        </div>

        <div className="rcp-divider" />

        <div className="rcp-meta-grid">
          <div className="rcp-meta-row">
            <span className="rcp-label">Customer</span>
            <strong className="rcp-value">{bill.customer}</strong>
          </div>
          <div className="rcp-meta-row">
            <span className="rcp-label">Bill No</span>
            <strong className="rcp-value">{bill.billNo}</strong>
          </div>
          <div className="rcp-meta-row">
            <span className="rcp-label">Date</span>
            <strong className="rcp-value">{bill.date}</strong>
          </div>
          {bill.phone && (
            <div className="rcp-meta-row">
              <span className="rcp-label">Phone</span>
              <strong className="rcp-value">{bill.phone}</strong>
            </div>
          )}
        </div>

        <div className="rcp-divider" />

        <table className="rcp-items-tbl">
          <thead>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>S.NO</th>
              <th style={{ textAlign: 'left' }}>ITEM</th>
              <th style={{ textAlign: 'center', width: '90px' }}>QTY</th>
              <th style={{ textAlign: 'right', width: '110px' }}>AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td style={{ textAlign: 'left', fontWeight: 500 }}>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.qty} {item.unit}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rcp-divider" />

        <div className="rcp-totals">
          <div className="rcp-total-row"><span>Total</span><span>{fmt(bill.total)}</span></div>
          <div className="rcp-total-row"><span>Paid</span><span>{fmt(totalPaid)}</span></div>
          <div className={`rcp-total-row rcp-balance${balance > 0 ? ' due' : ''}`}>
            <span>Balance</span><span>{fmt(balance)}</span>
          </div>
        </div>

        {bill.payments?.length > 0 && (
          <div className="rcp-payment-history">
            <div className="rcp-ph-title">PAYMENT HISTORY</div>
            {bill.payments.map((p, i) => (
              <div key={p.id || i} className="rcp-ph-row">
                <div className="rcp-ph-left">
                  <span className="rcp-ph-icon">✅</span>
                  <span className="rcp-ph-date">{p.date}</span>
                  <span className="rcp-ph-note">{p.note || (p.type === 'advance' ? 'Advance' : 'Payment')}</span>
                </div>
                <span className="rcp-ph-amt">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {bill.remarks && <div className="rcp-remarks"><span>Remarks: </span>{bill.remarks}</div>}
        <div className="rcp-words">
          {balance > 0
            ? <em>Balance: {numberToWords(balance)}</em>
            : <em>Amount: {numberToWords(bill.total)}</em>}
        </div>
        <div className="rcp-divider" />
        <div className="rcp-footer">
          <div className="rcp-thankyou">Thank You 🙏</div>
          <div className="rcp-signature-block">
            <div className="rcp-sig-wrapper">
              {shop.signature && (
                shop.signature.startsWith('data:image') ? (
                  <img src={shop.signature} alt="Authorized E-Signature" className="rcp-sig-img" />
                ) : (
                  <span className="rcp-sig-cursive">{shop.signature}</span>
                )
              )}
            </div>
            <div className="rcp-sig-line" />
            <div className="rcp-sig-title">AUTHORIZED SIGNATORY</div>
            {shop.signature && (
              <div className="rcp-sig-badge">
                <span>✓</span> Digitally Verified
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="receipt-actions no-print">
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        {balance > 0 && (
          <button className="btn-add-payment" onClick={() => onAddPayment(bill)}>💰 Add Payment</button>
        )}
        <button className="btn-print" onClick={() => window.print()}>🖨️ Print</button>
        <button className="btn-print" onClick={() => onSaveImage(bill)}>🖼️ Save Photo</button>
        <button className="btn-wa" onClick={() => onSend(bill)} disabled={generating}>
          {generating ? <><span className="spinner" /> Generating…</> : <><WAIcon /> Send PDF</>}
        </button>
        <button className="btn-wa" style={{ background: '#0284c7' }} onClick={() => onSendImage(bill)} disabled={generating}>
          🖼️ Send Photo
        </button>
      </div>
    </div>
  );
}

// ─── HOME / OPERATIONS DASHBOARD PAGE ────────────────────────────────────────
function HomeOperationsPage({
  shop,
  bills,
  products,
  customers,
  onNavigate,
  onQuickBillFromContact,
  onQuickAddProductToBill,
  onViewBill,
  onAddPayment,
  onSendReminder
}) {
  const pendingBills = bills.filter(b => getBillBalance(b) > 0);
  const totalSales = bills.reduce((s, b) => s + (b.total || 0), 0);
  const totalCollected = bills.reduce((s, b) => s + getBillPaid(b), 0);
  const totalPendingUdhar = bills.reduce((s, b) => s + getBillBalance(b), 0);

  const today = todayStr();
  const todayBills = bills.filter(b => b.date === today);
  const todaySales = todayBills.reduce((s, b) => s + (b.total || 0), 0);

  const recentBills = bills.slice(0, 5);

  const OPERATIONS = [
    {
      id: 'new-bill',
      title: 'Create New Bill',
      desc: 'Instant POS billing, item search & WhatsApp invoices',
      icon: '🧾',
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      badge: 'Fast POS'
    },
    {
      id: 'products',
      title: 'Product Catalog',
      desc: 'Manage stock inventory, categories, units & price list',
      icon: '📦',
      gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
      badge: `${products.length} Items`
    },
    {
      id: 'customers',
      title: 'Customer Book & Contacts',
      desc: 'Address book, phone contacts sync & purchase histories',
      icon: '👥',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      badge: `${customers.length} Saved`
    },
    {
      id: 'pending',
      title: 'Pending Dues (Udhar)',
      desc: 'Track outstanding balances & 1-tap WhatsApp reminders',
      icon: '⏳',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      badge: pendingBills.length > 0 ? `${pendingBills.length} Pending` : 'All Clear'
    },
    {
      id: 'history',
      title: 'Bills & Invoices History',
      desc: 'Search, reprint, download PDF / PNG photo receipts',
      icon: '📋',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      badge: `${bills.length} Bills`
    },
    {
      id: 'settings',
      title: 'Shop & E-Signature',
      desc: 'Store details, GST/phone & shopkeeper digital signature',
      icon: '⚙️',
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
      badge: shop.signature ? 'Signed ✓' : 'Setup'
    }
  ];

  return (
    <div className="fade-in tab-pane">
      {/* Hero Welcome Banner */}
      <div className="home-hero-card">
        <div className="home-hero-text">
          <div className="home-hero-badge">⚡ Quick Operations Hub</div>
          <h2>Welcome to {shop.name || 'E-Bills Management'}</h2>
          <p>Create attractive E-Bills, manage inventory, pick customers from phone contacts, and collect udhar dues effortlessly.</p>
        </div>
        <div className="home-hero-actions">
          <button className="btn-hero-primary" onClick={() => onNavigate('new-bill')}>
            <span>🧾</span> Create New Bill
          </button>
          <button className="btn-hero-secondary" onClick={onQuickBillFromContact}>
            <span>📱</span> Pick Phone Contact
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Today's Sales</span>
            <span className="stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>💵</span>
          </div>
          <div className="stat-val">{fmt(todaySales)}</div>
          <div className="stat-sub">{todayBills.length} invoice{todayBills.length !== 1 ? 's' : ''} generated today</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-header">
            <span className="stat-label">Pending Udhar Dues</span>
            <span className="stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>⏳</span>
          </div>
          <div className="stat-val" style={{ color: '#ef4444' }}>{fmt(totalPendingUdhar)}</div>
          <div className="stat-sub">{pendingBills.length} customer{pendingBills.length !== 1 ? 's' : ''} with pending balance</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Revenue Collected</span>
            <span className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>✅</span>
          </div>
          <div className="stat-val" style={{ color: '#10b981' }}>{fmt(totalCollected)}</div>
          <div className="stat-sub">Lifetime sales: {fmt(totalSales)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Product Inventory</span>
            <span className="stat-icon-wrap" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>📦</span>
          </div>
          <div className="stat-val">{products.length}</div>
          <div className="stat-sub">Catalog items available for fast billing</div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="section-title-wrap">
        <h3>🚀 Select an Operation</h3>
        <p>Choose what you would like to do right now</p>
      </div>

      <div className="operations-grid">
        {OPERATIONS.map(op => (
          <div
            key={op.id}
            className="operation-card"
            onClick={() => onNavigate(op.id)}
          >
            <div className="op-top">
              <div className="op-icon-box" style={{ background: op.gradient }}>
                <span>{op.icon}</span>
              </div>
              <span className="op-badge">{op.badge}</span>
            </div>
            <h4 className="op-title">{op.title}</h4>
            <p className="op-desc">{op.desc}</p>
            <div className="op-footer">
              <span>Open feature</span>
              <span className="op-arrow">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launchpad & Pending Debtors Section */}
      <div className="home-bottom-grid">
        {/* Recent Invoices */}
        <div className="home-panel">
          <div className="home-panel-header">
            <h4>📋 Recent Invoices</h4>
            <button className="btn-link" onClick={() => onNavigate('history')}>View All ({bills.length}) →</button>
          </div>
          {recentBills.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-icon">📄</div>
              <p>No bills generated yet. Click &ldquo;Create New Bill&rdquo; to start!</p>
            </div>
          ) : (
            <div className="recent-bills-list">
              {recentBills.map(b => {
                const bal = getBillBalance(b);
                return (
                  <div key={b.id} className="recent-bill-item" onClick={() => onViewBill(b)}>
                    <div className="rbi-info">
                      <div className="rbi-name">{b.customer}</div>
                      <div className="rbi-meta">{b.billNo} · {b.date}</div>
                    </div>
                    <div className="rbi-right">
                      <div className="rbi-total">{fmt(b.total)}</div>
                      <span className={`status-pill ${bal > 0 ? 'pending' : 'paid'}`}>
                        {bal > 0 ? `Due ${fmt(bal)}` : 'Paid'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Urgent Udhar Reminders */}
        <div className="home-panel">
          <div className="home-panel-header">
            <h4>⏳ Pending Balances &amp; Reminders</h4>
            <button className="btn-link" onClick={() => onNavigate('pending')}>Manage Khata →</button>
          </div>
          {pendingBills.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-icon">🎉</div>
              <p>Great job! All customer accounts are fully paid up.</p>
            </div>
          ) : (
            <div className="recent-bills-list">
              {pendingBills.slice(0, 5).map(b => {
                const bal = getBillBalance(b);
                return (
                  <div key={b.id} className="recent-bill-item" style={{ cursor: 'default' }}>
                    <div className="rbi-info" onClick={() => onViewBill(b)} style={{ cursor: 'pointer' }}>
                      <div className="rbi-name">{b.customer}</div>
                      <div className="rbi-meta">Due: <strong style={{ color: '#ef4444' }}>{fmt(bal)}</strong> · {b.phone || 'No phone'}</div>
                    </div>
                    <div className="rbi-right" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button className="btn-pay-tiny" onClick={() => onAddPayment(b)}>
                        💰 Settle
                      </button>
                      <button className="btn-wa-tiny" onClick={() => onSendReminder(b, shop)}>
                        <WAIcon size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT CATALOG PAGE (UPGRADED & FIXED) ─────────────────────────────────
function ProductsPage({ products, setProducts, onQuickAddProductToBill }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: 'Grocery',
    rate: '',
    unit: 'pcs',
    stock: '50'
  });

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setEditId(null);
    setForm({ name: '', category: 'Grocery', rate: '', unit: 'pcs', stock: '50' });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      category: p.category || 'Grocery',
      rate: String(p.rate),
      unit: p.unit || 'pcs',
      stock: String(p.stock ?? 50)
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.rate) return;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      rate: parseFloat(form.rate),
      unit: form.unit,
      stock: parseFloat(form.stock) || 0
    };

    if (editId) {
      setProducts(prev => prev.map(p => p.id === editId ? { ...p, ...payload } : p));
    } else {
      setProducts(prev => [{ id: uid(), ...payload }, ...prev]);
    }

    setShowModal(false);
  };

  const deleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="fade-in tab-pane">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>📦 Product Catalog &amp; Inventory</h1>
          <p>Organize items, set rates &amp; 1-click add to customer bills</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          + Add New Product
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="catalog-filters-bar">
        <div className="cat-search-wrap">
          <input
            className="dark-input list-search"
            placeholder="🔍 Search products by name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="category-pills">
          {PRODUCT_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>{search ? 'No products match your search query.' : 'No products in this category yet. Click "+ Add New Product"!'}</p>
        </div>
      ) : (
        <div className="products-card-grid">
          {filtered.map(p => {
            const isLowStock = (p.stock || 0) < 10;
            return (
              <div key={p.id} className="product-item-card">
                <div className="pic-header">
                  <span className="pic-category-badge">{p.category || 'General'}</span>
                  <span className={`pic-stock-badge ${isLowStock ? 'low' : 'ok'}`}>
                    {isLowStock ? '⚠️ Low Stock: ' : 'Stock: '} {p.stock ?? 0} {p.unit}
                  </span>
                </div>
                <h3 className="pic-name">{p.name}</h3>
                <div className="pic-rate-row">
                  <span className="pic-price">{fmt(p.rate)}</span>
                  <span className="pic-unit">/ {p.unit}</span>
                </div>
                <div className="pic-actions-row">
                  <button
                    className="pic-btn-add-bill"
                    onClick={() => onQuickAddProductToBill(p)}
                    title="Add this product directly into a new bill"
                  >
                    🧾 + Add to Bill
                  </button>
                  <button className="pic-btn-icon edit" onClick={() => openEditModal(p)} title="Edit product">
                    ✏️
                  </button>
                  <button className="pic-btn-icon delete" onClick={() => deleteProduct(p.id)} title="Delete product">
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{editId ? '✏️ Edit Product' : '📦 Add New Product'}</h3>
                <p className="modal-sub">Set item name, price per unit and category</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="field-group dark-field">
                  <label>Product / Item Name *</label>
                  <input
                    className="dark-input"
                    placeholder="e.g. Basmati Rice 5kg"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                <div className="field-group dark-field">
                  <label>Category</label>
                  <select
                    className="dark-input"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {PRODUCT_CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="field-group dark-field">
                    <label>Rate (₹) *</label>
                    <input
                      className="dark-input"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={form.rate}
                      onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="field-group dark-field">
                    <label>Unit</label>
                    <select
                      className="dark-input"
                      value={form.unit}
                      onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="field-group dark-field">
                  <label>Stock Quantity in Hand</label>
                  <input
                    className="dark-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer-btns">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editId ? 'Save Changes' : '+ Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMERS & KHATA PAGE ──────────────────────────────────────────────────
function CustomersPage({ customers, setCustomers, bills, onQuickBillFromContact, onPickPhoneContact }) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [editId, setEditId] = useState(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setCustomers(prev => prev.map(c => c.id === editId ? { ...c, ...form, phone: form.phone.replace(/\D/g, '') } : c));
      setEditId(null);
    } else {
      setCustomers(prev => [{
        id: uid(),
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        address: form.address.trim()
      }, ...prev]);
    }
    setForm({ name: '', phone: '', address: '' });
  };

  const startEdit = c => { setForm({ name: c.name, phone: c.phone || '', address: c.address || '' }); setEditId(c.id); };
  const cancelEdit = () => { setForm({ name: '', phone: '', address: '' }); setEditId(null); };
  const deleteCustomer = id => { if (window.confirm('Delete customer?')) setCustomers(prev => prev.filter(c => c.id !== id)); };

  const getStats = c => {
    const cb = bills.filter(b => b.customer.toLowerCase() === c.name.toLowerCase() || (c.phone && b.phone === c.phone));
    return { count: cb.length, balance: cb.reduce((s, b) => s + getBillBalance(b), 0) };
  };

  return (
    <div className="fade-in tab-pane">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>👥 Customer Book &amp; Phone Contacts</h1>
          <p>Save customer contacts, track outstanding udhar &amp; auto-fill billing</p>
        </div>
        <button className="btn-secondary" onClick={onPickPhoneContact} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📱</span> Sync Phone Contacts
        </button>
      </div>

      <div className="catalog-form" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) 120px' }}>
        <input placeholder="Customer name *" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleSave()} />
        <input placeholder="10-digit WhatsApp number" maxLength={10} inputMode="numeric"
          value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} />
        <input placeholder="Address / Location"
          value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSave}>{editId ? 'Update' : '+ Add'}</button>
          {editId && <button className="btn-ghost" onClick={cancelEdit}>✕</button>}
        </div>
      </div>

      <input className="list-search" placeholder="🔍 Search customers by name or phone…"
        value={search} onChange={e => setSearch(e.target.value)} />

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>{search ? 'No customers match your search.' : 'No customers saved yet. Add your first customer above!'}</p>
        </div>
      ) : (
        <div className="catalog-list">
          {filtered.map(c => {
            const stats = getStats(c);
            return (
              <div key={c.id} className="catalog-item">
                <div className="ci-avatar-circle">{c.name.charAt(0).toUpperCase()}</div>
                <div className="ci-info">
                  <div className="ci-name">{c.name}</div>
                  <div className="ci-meta">
                    {c.phone && <span>📞 {c.phone}</span>}
                    {c.address && <span> · 📍 {c.address}</span>}
                    {stats.count > 0 && <span> · 📄 {stats.count} bill{stats.count !== 1 ? 's' : ''}</span>}
                    {stats.balance > 0 && <span className="ci-balance"> · Due: {fmt(stats.balance)}</span>}
                  </div>
                </div>
                <div className="ci-actions">
                  <button className="ci-btn-bill" onClick={() => onQuickBillFromContact(c)} title="Create Bill for this customer">
                    🧾 Bill
                  </button>
                  <button className="ci-btn edit-btn" onClick={() => startEdit(c)} title="Edit">✏️</button>
                  <button className="ci-btn del-btn" onClick={() => deleteCustomer(c.id)} title="Delete">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APPLICATION COMPONENT ──────────────────────────────────────────────
export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const s = localStorage.getItem('theme');
    return s ? s === 'dark' : (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false);
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Core data states
  // DEFAULT TAB is now 'home' (Home Operations Hub)
  const [tab, setTab] = useState('home');
  const [shop, setShop] = useState(() => JSON.parse(localStorage.getItem('shopSettings') || JSON.stringify(DEFAULT_SHOP)));
  const [bills, setBills] = useState(() => (JSON.parse(localStorage.getItem('bills') || '[]')).map(normalizeBill));
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
  });

  // UI / Navigation state
  const [viewBill, setViewBill] = useState(null);
  const [animatingBill, setAnimatingBill] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [billSearch, setBillSearch] = useState('');
  const [showContactsModal, setShowContactsModal] = useState(false);

  // New Bill form states
  const [customer, setCustomer] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [date, setDate] = useState(todayStr());
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [paid, setPaid] = useState('');
  const [paymentType, setPaymentType] = useState('paid');
  const [remarks, setRemarks] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCustDrop, setShowCustDrop] = useState(false);

  // Settings states
  const [shopEdit, setShopEdit] = useState(shop);
  const [shopSaved, setShopSaved] = useState(false);

  // LocalStorage Sync
  useEffect(() => { localStorage.setItem('bills', JSON.stringify(bills)); }, [bills]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('shopSettings', JSON.stringify(shop)); }, [shop]);

  // Computed Values
  const total = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
  const paidAmt = parseFloat(paid) || 0;
  const balance = Math.max(0, total - paidAmt);
  const validItems = items.filter(i => i.name.trim() && i.qty && i.rate);
  const pendingBills = bills.filter(b => getBillBalance(b) > 0);

  const filteredBills = billSearch
    ? bills.filter(b =>
        b.customer.toLowerCase().includes(billSearch.toLowerCase()) ||
        b.billNo.toLowerCase().includes(billSearch.toLowerCase()) ||
        (b.phone && b.phone.includes(billSearch)))
    : bills;

  const filteredProducts = productSearch
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products.slice(0, 10);

  const custMatches = (showCustDrop && customer.trim())
    ? customers.filter(c => c.name.toLowerCase().includes(customer.toLowerCase())).slice(0, 6)
    : [];

  // Item handlers
  const setItem = (idx, f, v) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, [f]: v } : it));
  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = idx => setItems(prev => prev.filter((_, i) => i !== idx));

  // Add product from catalog → active items list
  const addProductToItems = (product) => {
    const existIdx = items.findIndex(it => it.name.toLowerCase() === product.name.toLowerCase());
    if (existIdx >= 0) {
      setItem(existIdx, 'qty', String((parseFloat(items[existIdx].qty) || 0) + 1));
    } else {
      const emptyIdx = items.findIndex(it => !it.name.trim());
      if (emptyIdx >= 0) {
        setItems(prev => prev.map((it, i) => i === emptyIdx
          ? { name: product.name, qty: '1', rate: String(product.rate), unit: product.unit || 'pcs' } : it));
      } else {
        setItems(prev => [...prev, { name: product.name, qty: '1', rate: String(product.rate), unit: product.unit || 'pcs' }]);
      }
    }
    setProductSearch('');
  };

  // Quick Action: Add product from catalog and jump straight to POS
  const handleQuickAddProductToBill = (product) => {
    addProductToItems(product);
    setTab('new-bill');
    setViewBill(null);
  };

  // Handle native Web Contact Picker or Fallback Modal
  const handlePickPhoneContact = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const selected = await navigator.contacts.select(props, { multiple: false });
        if (selected && selected.length > 0) {
          const picked = selected[0];
          const name = picked.name?.[0] || 'Customer';
          const tel = picked.tel?.[0]?.replace(/\D/g, '') || '';
          setCustomer(name);
          setCustPhone(tel);
          // Also persist into customers if not present
          if (tel && !customers.find(c => c.phone === tel)) {
            setCustomers(prev => [{ id: uid(), name, phone: tel }, ...prev]);
          }
          return;
        }
      } catch (err) {
        console.log('Native contact picker cancelled or unavailable, opening directory modal:', err);
      }
    }
    // Fallback: Show interactive Phone Contact Picker Modal
    setShowContactsModal(true);
  };

  const handleSelectContactFromModal = (c) => {
    setCustomer(c.name);
    setCustPhone(c.phone || '');
    setShowContactsModal(false);
    setTab('new-bill');
    setViewBill(null);
  };

  const handleAddNewContact = (newC) => {
    setCustomers(prev => [newC, ...prev]);
  };

  // Quick Bill for specific customer
  const handleQuickBillForCustomer = (cust) => {
    setCustomer(cust.name);
    setCustPhone(cust.phone || '');
    setDate(todayStr());
    setTab('new-bill');
    setViewBill(null);
  };

  // Generate Bill
  const handleGenerate = () => {
    if (!customer.trim() || validItems.length === 0) return;
    const initialPayments = paidAmt > 0
      ? [{ id: uid(), amount: paidAmt, type: paymentType, date, note: '' }]
      : [];
    const newBill = {
      id: Date.now(),
      billNo: nextBillNo(bills),
      customer: customer.trim(),
      phone: custPhone.trim(),
      date,
      items: validItems,
      total,
      payments: initialPayments,
      paid: paidAmt,
      paymentType,
      balance,
      remarks: remarks.trim(),
      createdAt: new Date().toISOString(),
    };

    // Auto-save new customer
    if (custPhone.trim() && !customers.find(c => c.phone === custPhone.trim())) {
      setCustomers(prev => [{ id: uid(), name: customer.trim(), phone: custPhone.trim() }, ...prev]);
    }

    setBills(prev => [newBill, ...prev]);
    setViewBill(newBill); // Open bill receipt view directly in the previous format
  };

  const handleCloseAnimation = () => {
    if (animatingBill) {
      setViewBill(animatingBill);
      setAnimatingBill(null);
    }
  };

  const handleViewBill = (bill) => {
    setViewBill(bill);
  };

  const handleAddPayment = (bill, payment) => {
    setBills(prev => prev.map(b => {
      if (b.id !== bill.id) return b;
      const newPayments = [...(b.payments || []), payment];
      const newPaid = newPayments.reduce((s, p) => s + p.amount, 0);
      const newBalance = Math.max(0, b.total - newPaid);
      const updated = { ...b, payments: newPayments, paid: newPaid, balance: newBalance };
      if (viewBill?.id === b.id) setViewBill(updated);
      return updated;
    }));
  };

  const handleDuplicate = (bill) => {
    setCustomer(bill.customer);
    setCustPhone(bill.phone || '');
    setDate(todayStr());
    setItems(bill.items.map(it => ({ ...it })));
    setPaid('');
    setPaymentType('paid');
    setRemarks(bill.remarks || '');
    setViewBill(null);
    setTab('new-bill');
  };

  const handleSendPDF = async (bill) => {
    setGenerating(true);
    try { await generateAndSharePDF(bill, shop); }
    catch (e) { alert('Could not generate PDF.'); console.error(e); }
    finally { setGenerating(false); }
  };

  const handleSendImage = async (bill) => {
    setGenerating(true);
    try { await generateAndShareImage(bill, shop); }
    catch (e) { alert('Could not generate photo.'); console.error(e); }
    finally { setGenerating(false); }
  };

  const handleSaveImage = async (bill) => {
    try { await downloadBillImage(bill); }
    catch (e) { alert('Could not save photo.'); console.error(e); }
  };

  const deleteBill = (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      setBills(prev => prev.filter(b => b.id !== id));
      if (viewBill?.id === id) setViewBill(null);
    }
  };

  const clearForm = () => {
    setCustomer('');
    setCustPhone('');
    setDate(todayStr());
    setItems([{ ...EMPTY_ITEM }]);
    setPaid('');
    setPaymentType('paid');
    setRemarks('');
    setViewBill(null);
    setProductSearch('');
  };

  const saveSettings = () => {
    setShop(shopEdit);
    setShopSaved(true);
    setTimeout(() => setShopSaved(false), 2500);
  };

  const saveSignature = (sig) => {
    const updated = { ...shopEdit, signature: sig };
    setShopEdit(updated);
    setShop(updated);
    setShopSaved(true);
    setTimeout(() => setShopSaved(false), 2500);
  };

  const clearSignature = () => {
    const updated = { ...shopEdit, signature: '' };
    setShopEdit(updated);
    setShop(updated);
  };

  const navTo = (id) => {
    setTab(id);
    setViewBill(null);
    setPaymentTarget(null);
  };

  const NAV_ITEMS = [
    { id: 'home', icon: '⚡', label: 'Home Hub' },
    { id: 'new-bill', icon: '🧾', label: 'Create Bill' },
    { id: 'products', icon: '📦', label: 'Products', badge: products.length },
    { id: 'pending', icon: '⏳', label: 'Pending Dues', badge: pendingBills.length },
    { id: 'history', icon: '📋', label: 'All Bills' },
    { id: 'customers', icon: '👥', label: 'Customers' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="app">
      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar no-print">
        <div className="logo" onClick={() => navTo('home')} style={{ cursor: 'pointer' }}>
          <span className="logo-icon">🧾</span>
          <div className="logo-texts">
            <span className="logo-text">E-Bill Pro</span>
            <span className="logo-subtitle">POS &amp; Khata Manager</span>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map(n => (
            <button
              key={n.id}
              id={`nav-${n.id}`}
              className={`nav-item${tab === n.id ? ' active' : ''}`}
              onClick={() => navTo(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
              {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button id="theme-toggle" className="theme-toggle" onClick={() => setDarkMode(d => !d)}>
            <span>{darkMode ? '☀️' : '🌙'}</span>
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="sidebar-shop">🏪 {shop.name}</div>
        </div>
      </aside>

      {/* ── Main Work Area ── */}
      <main className="main">
        {/* Mobile Top Header */}
        <div className="topbar no-print">
          <div className="topbar-title" onClick={() => navTo('home')} style={{ cursor: 'pointer' }}>
            <span className="topbar-logo">🧾</span>
            <span>{shop.name || 'E-Bill Pro'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="topbar-quick-btn" onClick={handlePickPhoneContact} title="Pick Phone Contact">
              📱 Contacts
            </button>
            <button id="theme-toggle-mobile" className="theme-toggle-mobile" onClick={() => setDarkMode(d => !d)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* ══ 1. HOME / OPERATIONS HUB (DEFAULT) ══ */}
        {tab === 'home' && !viewBill && (
          <HomeOperationsPage
            shop={shop}
            bills={bills}
            products={products}
            customers={customers}
            onNavigate={navTo}
            onQuickBillFromContact={handlePickPhoneContact}
            onQuickAddProductToBill={handleQuickAddProductToBill}
            onViewBill={handleViewBill}
            onAddPayment={b => setPaymentTarget(b)}
            onSendReminder={sendWhatsAppReminder}
          />
        )}

        {/* ══ 2. CREATE NEW BILL (POS) ══ */}
        {tab === 'new-bill' && !viewBill && (
          <div className="fade-in tab-pane">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1>🧾 Create New E-Bill</h1>
                <p>Fill item details → Generate instant invoice → Share on WhatsApp</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handlePickPhoneContact}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>📱</span> Pick from Phone Contacts
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setAnimatingBill({ billNo: nextBillNo(bills), customer: customer.trim() || 'Demo Customer' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🎬</span> Preview Animation
                </button>
              </div>
            </div>

            <div className="bill-paper">
              <div className="rcp-watermark">{shop.name}</div>

              {/* Shop Details Header */}
              <div className="bp-shop-header">
                <div className="bp-shop-name">{shop.name}</div>
                <div className="bp-shop-info">{shop.address}</div>
                <div className="bp-shop-info">📞 {shop.phone}</div>
              </div>

              {/* Customer Row */}
              <div className="bp-customer-row">
                <div className="field-group" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="f-customer">Customer Name <span className="req">*</span></label>
                    <button
                      type="button"
                      className="contact-quick-link"
                      onClick={handlePickPhoneContact}
                    >
                      📱 Phone Contacts
                    </button>
                  </div>
                  <input
                    id="f-customer"
                    placeholder="Type name or select from phonebook"
                    value={customer}
                    autoComplete="off"
                    onChange={e => { setCustomer(e.target.value); setShowCustDrop(true); }}
                    onBlur={() => setTimeout(() => setShowCustDrop(false), 180)}
                    onFocus={() => customer.trim() && setShowCustDrop(true)}
                  />
                  {custMatches.length > 0 && (
                    <div className="customer-dropdown">
                      {custMatches.map(c => (
                        <div
                          key={c.id}
                          className="cust-option"
                          onMouseDown={() => { setCustomer(c.name); setCustPhone(c.phone || ''); setShowCustDrop(false); }}
                        >
                          <span className="cust-opt-name">{c.name}</span>
                          {c.phone && <span className="cust-opt-phone">📞 {c.phone}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label htmlFor="f-phone">WhatsApp Number</label>
                  <input
                    id="f-phone"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    inputMode="numeric"
                    value={custPhone}
                    onChange={e => setCustPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="f-date">Bill Date</label>
                  <input id="f-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>

              {/* Product Catalog Quick-Add Search Bar */}
              {products.length > 0 && (
                <div className="product-quickadd">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className="pqa-label">⚡ Quick Add from Catalog:</span>
                    <button type="button" className="btn-link" onClick={() => navTo('products')}>Manage Products ({products.length}) →</button>
                  </div>
                  <input
                    className="pqa-search"
                    placeholder="🔍 Search item from product catalog to add instantly…"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                  {productSearch && (
                    <div className="pqa-chips">
                      {filteredProducts.length === 0 ? (
                        <span className="pqa-empty">No matching products found</span>
                      ) : (
                        filteredProducts.map(p => (
                          <button key={p.id} type="button" className="pqa-chip" onClick={() => addProductToItems(p)}>
                            + {p.name} <span className="pqa-rate">{fmt(p.rate)}/{p.unit}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div className="table-scroll">
                <table className="items-tbl">
                  <thead>
                    <tr>
                      <th className="col-sno">#</th>
                      <th className="col-item">Item Description</th>
                      <th className="col-qty">Qty</th>
                      <th className="col-unit">Unit</th>
                      <th className="col-rate">Rate (₹)</th>
                      <th className="col-amt">Amount (₹)</th>
                      <th className="col-del"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="sno-cell">{idx + 1}</td>
                        <td>
                          <input
                            className="tbl-input"
                            placeholder="Item name (e.g. Milk 1L)"
                            value={item.name}
                            onChange={e => setItem(idx, 'name', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="tbl-input tbl-num"
                            type="number"
                            min="0"
                            placeholder="0"
                            inputMode="decimal"
                            value={item.qty}
                            onChange={e => setItem(idx, 'qty', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="tbl-select"
                            value={item.unit}
                            onChange={e => setItem(idx, 'unit', e.target.value)}
                          >
                            {UNITS.map(u => <option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            className="tbl-input tbl-num"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            inputMode="decimal"
                            value={item.rate}
                            onChange={e => setItem(idx, 'rate', e.target.value)}
                          />
                        </td>
                        <td className="amt-cell">
                          {((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                        </td>
                        <td className="del-cell">
                          {items.length > 1 && (
                            <button className="del-row-btn" onClick={() => removeItem(idx)}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button id="add-item-btn" className="add-row-btn" onClick={addItem}>+ Add Item Row</button>

              {/* Totals & Payments */}
              <div className="bp-totals">
                <div className="bp-total-row">
                  <span>Grand Total</span>
                  <span className="bp-total-val">{fmt(total)}</span>
                </div>
                <div className="bp-total-row">
                  <div className="pay-type-group">
                    <button
                      type="button"
                      className={`pay-type-btn${paymentType === 'paid' ? ' selected-paid' : ''}`}
                      onClick={() => setPaymentType('paid')}
                    >
                      ✅ Paid
                    </button>
                    <button
                      type="button"
                      className={`pay-type-btn${paymentType === 'advance' ? ' selected-advance' : ''}`}
                      onClick={() => setPaymentType('advance')}
                    >
                      ⏩ Advance
                    </button>
                  </div>
                  <input
                    id="paid-input"
                    className="paid-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    inputMode="decimal"
                    value={paid}
                    onChange={e => setPaid(e.target.value)}
                  />
                </div>
                <div className={`bp-total-row balance-row${balance > 0 ? ' has-balance' : ' no-balance'}`}>
                  <span>Due Balance</span>
                  <span className="balance-val">{fmt(balance)}</span>
                </div>
              </div>

              {/* Remarks */}
              <div className="remarks-field">
                <label htmlFor="f-remarks">Remarks / Notes (Optional)</label>
                <input
                  id="f-remarks"
                  placeholder="e.g. Paid via PhonePe UPI, balance payable next week…"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>

              {balance > 0 && (
                <div className="words-section">
                  <span className="words-label">Balance in Words: </span>
                  <span className="words-text">{numberToWords(balance)}</span>
                </div>
              )}

              {/* Footer with Digital Signature */}
              <div className="bp-footer-text">
                <span>Thank You for your business! 🙏</span>
                <div className="rcp-signature-block" style={{ marginTop: '0.5rem' }}>
                  <div className="rcp-sig-wrapper">
                    {shop.signature && (
                      shop.signature.startsWith('data:image') ? (
                        <img src={shop.signature} alt="Authorized E-Signature" className="rcp-sig-img" />
                      ) : (
                        <span className="rcp-sig-cursive">{shop.signature}</span>
                      )
                    )}
                  </div>
                  <div className="rcp-sig-line" />
                  <div className="rcp-sig-title">Authorized Signatory</div>
                  {shop.signature && (
                    <div className="rcp-sig-badge">
                      <span>✓</span> Digitally Verified
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button id="clear-form-btn" className="btn-ghost" onClick={clearForm}>🗑 Clear Form</button>
              <button
                id="generate-bill-btn"
                className="btn-primary"
                disabled={!customer.trim() || validItems.length === 0}
                onClick={handleGenerate}
              >
                Generate &amp; Save Bill →
              </button>
            </div>
          </div>
        )}

        {/* ══ RECEIPT VIEW MODAL ══ */}
        {viewBill && (
          <ReceiptView
            bill={viewBill}
            shop={shop}
            onSend={handleSendPDF}
            onSendImage={handleSendImage}
            onSaveImage={handleSaveImage}
            onBack={() => setViewBill(null)}
            generating={generating}
            onAddPayment={b => setPaymentTarget(b)}
          />
        )}

        {/* ══ 3. PRODUCT CATALOG TAB ══ */}
        {tab === 'products' && (
          <ProductsPage
            products={products}
            setProducts={setProducts}
            onQuickAddProductToBill={handleQuickAddProductToBill}
          />
        )}

        {/* ══ 4. PENDING DUES (UDHAR) TAB ══ */}
        {tab === 'pending' && !viewBill && (
          <div className="fade-in tab-pane">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1>⏳ Pending Balances &amp; Udhar Khata</h1>
                <p>{pendingBills.length} customer account{pendingBills.length !== 1 ? 's' : ''} with outstanding balance</p>
              </div>
            </div>

            {pendingBills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <p>No pending balances! All customer accounts are fully paid.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {pendingBills.map(b => (
                  <BillCard
                    key={b.id}
                    bill={b}
                    onView={handleViewBill}
                    onSend={handleSendPDF}
                    onDelete={deleteBill}
                    onAddPayment={b => setPaymentTarget(b)}
                    onDuplicate={handleDuplicate}
                    onSendReminder={sendWhatsAppReminder}
                    shop={shop}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ 5. ALL BILLS HISTORY TAB ══ */}
        {tab === 'history' && !viewBill && (
          <div className="fade-in tab-pane">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h1>📋 All Generated Invoices</h1>
                <p>{bills.length} total invoice{bills.length !== 1 ? 's' : ''} on record</p>
              </div>
              <button className="btn-primary" onClick={() => navTo('new-bill')}>
                + New Bill
              </button>
            </div>

            <input
              className="list-search"
              placeholder="🔍 Search invoices by customer name, bill number or mobile…"
              value={billSearch}
              onChange={e => setBillSearch(e.target.value)}
            />

            {filteredBills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <p>{billSearch ? 'No bills match your search criteria.' : 'No invoices generated yet. Create your first bill!'}</p>
              </div>
            ) : (
              <div className="cards-grid">
                {filteredBills.map(b => (
                  <BillCard
                    key={b.id}
                    bill={b}
                    onView={handleViewBill}
                    onSend={handleSendPDF}
                    onDelete={deleteBill}
                    onAddPayment={b => setPaymentTarget(b)}
                    onDuplicate={handleDuplicate}
                    onSendReminder={sendWhatsAppReminder}
                    shop={shop}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ 6. CUSTOMER BOOK TAB ══ */}
        {tab === 'customers' && (
          <CustomersPage
            customers={customers}
            setCustomers={setCustomers}
            bills={bills}
            onQuickBillFromContact={handleQuickBillForCustomer}
            onPickPhoneContact={handlePickPhoneContact}
          />
        )}

        {/* ══ 7. SHOP SETTINGS TAB (LANDSCAPE LAYOUT) ══ */}
        {tab === 'settings' && (
          <div className="fade-in tab-pane">
            <div className="page-header">
              <h1>⚙️ Shop Profile &amp; E-Signature Studio</h1>
              <p>Configure your business identity and authorized digital signature in landscape mode</p>
            </div>

            <div className="settings-landscape-grid">
              {/* Left Column: Store Profile & Details */}
              <div className="settings-card">
                <h3 className="settings-card-title">🏪 Store Information</h3>

                <div className="field-group">
                  <label htmlFor="s-name">Store / Business Name</label>
                  <input
                    id="s-name"
                    placeholder="e.g. Ramesh Super Market"
                    value={shopEdit.name}
                    onChange={e => setShopEdit(s => ({ ...s, name: e.target.value }))}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="s-addr">Store Address</label>
                  <textarea
                    id="s-addr"
                    rows={3}
                    placeholder="e.g. 12, Main Bazaar Road, Near City Mall"
                    value={shopEdit.address}
                    onChange={e => setShopEdit(s => ({ ...s, address: e.target.value }))}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="s-phone">Contact / WhatsApp Phone Number</label>
                  <input
                    id="s-phone"
                    placeholder="e.g. 9876543210"
                    inputMode="tel"
                    value={shopEdit.phone}
                    onChange={e => setShopEdit(s => ({ ...s, phone: e.target.value }))}
                  />
                </div>

                <button id="save-settings-btn" className="btn-primary" onClick={saveSettings} style={{ width: '100%', marginTop: '0.75rem' }}>
                  {shopSaved ? '✅ Profile Saved Successfully!' : '💾 Save Store Profile'}
                </button>

                <div className="settings-info" style={{ marginTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.4rem' }}>📲 WhatsApp PDF Sharing</h4>
                  <ol style={{ fontSize: '0.8rem', color: 'var(--text-sub)', paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                    <li>Enter customer 10-digit number</li>
                    <li>Click <strong>Generate Bill</strong></li>
                    <li>Click <strong>Send PDF</strong> to open WhatsApp</li>
                  </ol>
                  <p className="info-note" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>📌 India (+91) country code is prefixed automatically</p>
                </div>
              </div>

              {/* Right Column: E-Signature Studio */}
              <div className="settings-card">
                <h3 className="settings-card-title">✍️ Authorized E-Signature Studio</h3>

                {shopEdit.signature ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'var(--surface2)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '0.85rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Saved Signature:</span>
                      {shopEdit.signature.startsWith('data:image') ? (
                        <img src={shopEdit.signature} alt="Saved Signature" style={{ height: '44px', marginTop: '0.25rem' }} />
                      ) : (
                        <div className="rcp-sig-cursive" style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>{shopEdit.signature}</div>
                      )}
                    </div>
                    <button type="button" className="btn-delete-small" onClick={clearSignature}>🗑 Remove</button>
                  </div>
                ) : null}

                <SignaturePad onSave={saveSignature} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="bottom-nav no-print">
        {NAV_ITEMS.map(n => (
          <button
            key={n.id}
            id={`bnav-${n.id}`}
            className={`bnav-item${tab === n.id ? ' active' : ''}`}
            onClick={() => navTo(n.id)}
          >
            <span className="bnav-icon">{n.icon}</span>
            <span className="bnav-label">{n.label}</span>
            {n.badge > 0 && <span className="bnav-badge">{n.badge}</span>}
          </button>
        ))}
      </nav>

      {/* ── Modals ── */}
      {showContactsModal && (
        <ContactsPickerModal
          isOpen={showContactsModal}
          onClose={() => setShowContactsModal(false)}
          onSelectContact={handleSelectContactFromModal}
          contacts={customers}
          onAddNewContact={handleAddNewContact}
        />
      )}

      {animatingBill && (
        <BillAnimationModal
          isOpen={Boolean(animatingBill)}
          onClose={handleCloseAnimation}
          billNumber={animatingBill.billNo}
          customerName={animatingBill.customer}
        />
      )}

      {paymentTarget && (
        <PaymentModal
          bill={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onAdd={payment => { handleAddPayment(paymentTarget, payment); setPaymentTarget(null); }}
        />
      )}
    </div>
  );
}
