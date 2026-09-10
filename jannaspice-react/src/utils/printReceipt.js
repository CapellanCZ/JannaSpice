import { CONFIG } from '../data/data.js';

export function printReceipt(res) {
  if (!res) return;
  const container = document.getElementById('print-receipt-container');
  if (!container) return;

  const p = res.package.price;
  const fee = p * CONFIG.reservationFeePct;
  const down = p * CONFIG.downpaymentPct;
  const bal = p - fee - down;

  const menuBlock = res.menu ? `
    <div style="font-size: 12px; color: #444; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px;">
      <div>• <strong>Chicken:</strong> ${res.menu.chicken}</div>
      <div>• <strong>Pork/Beef:</strong> ${res.menu.beefPork}</div>
      <div>• <strong>Fish/Seafood:</strong> ${res.menu.fishSeafood}</div>
      <div>• <strong>Vegetable:</strong> ${res.menu.veg}</div>
      <div>• <strong>Pasta:</strong> ${res.menu.pasta}</div>
      <div>• <strong>Staples:</strong> ${res.menu.staples}</div>
    </div>
  ` : `<div style="font-size: 12px; font-style: italic; color: #666;">Equipment Rental Only (No food inclusions)</div>`;

  container.innerHTML = `
    <div style="font-family: 'Outfit', sans-serif; color: #2D2825; max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #E8E1D7; border-radius: 12px; background: #fff;">
      <div style="text-align: center; border-bottom: 2px solid #D86B49; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #D86B49; margin: 0 0 5px 0;">JannaSpice Cuisine</h1>
        <p style="font-size: 13px; color: #666; margin: 0;">Food Catering, Rent Tables, Chairs & Party Needs</p>
        <p style="font-size: 12px; color: #888; margin: 4px 0 0 0;">Blk 4 Lot 4 Chester Place Subd, Dasmariñas | 0966 687 8302 / 0992 637 0100</p>
        <h2 style="font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 15px 0 0 0; color: #2D2825;">Official Event Catering Receipt / Invoice</h2>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
        <div>
          <strong>Reference ID:</strong> #RES-${res.id}<br>
          <strong>Date Issued:</strong> ${new Date().toLocaleDateString()}<br>
          <strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold;">${res.status}</span>
        </div>
        <div style="text-align: right;">
          <strong>Client Name:</strong> ${res.name}<br>
          <strong>Contact Number:</strong> ${res.phone}<br>
          <strong>Email Address:</strong> ${res.email}
        </div>
      </div>

      <div style="background: #FDF8F6; border: 1px solid #EED3CA; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 13px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #D86B49; text-transform: uppercase; letter-spacing: 0.5px;">Event Logistics & Design</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div><strong>Event Title:</strong> ${res.eventTitle}</div>
          <div><strong>Occasion:</strong> ${res.eventType}</div>
          <div><strong>Event Date & Time:</strong> ${res.date} @ ${res.startTime}</div>
          <div><strong>Venue:</strong> ${res.venue}</div>
          <div><strong>Theme / Motif:</strong> ${res.theme || 'N/A'}</div>
          <div><strong>Centerpiece:</strong> ${res.centerpiece || 'Artificial Flowers'}</div>
          <div style="grid-column: span 2;"><strong>Styro Name / Standee:</strong> ${res.styroAvail ? res.styroName : 'Not Availed'}</div>
        </div>
      </div>

      <div style="margin-bottom: 20px; font-size: 13px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #D86B49; text-transform: uppercase; letter-spacing: 0.5px;">Package & Menu Selection</h3>
        <div style="border: 1px solid #E8E1D7; border-radius: 8px; padding: 12px; background: #fff;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 6px;">
            <span>${res.package.name} (${res.package.pax} Pax)</span>
            <span>₱${p.toLocaleString()}</span>
          </div>
          ${menuBlock}
        </div>
      </div>

      <div style="margin-bottom: 30px; font-size: 13px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #D86B49; text-transform: uppercase; letter-spacing: 0.5px;">Payment Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #E8E1D7;"><td style="padding: 8px 0;">Total Package Value</td><td style="text-align: right; font-weight: bold;">₱${p.toLocaleString()}</td></tr>
          <tr style="border-bottom: 1px solid #E8E1D7;"><td style="padding: 8px 0;">20% Reservation Fee ${res.payments.fee ? '<span style="color: green; font-size: 11px;">(Paid)</span>' : ''}</td><td style="text-align: right;">₱${fee.toLocaleString()}</td></tr>
          <tr style="border-bottom: 1px solid #E8E1D7;"><td style="padding: 8px 0;">30% Downpayment ${res.payments.down ? '<span style="color: green; font-size: 11px;">(Paid)</span>' : ''}</td><td style="text-align: right;">₱${down.toLocaleString()}</td></tr>
          <tr style="border-bottom: 1px solid #E8E1D7;"><td style="padding: 8px 0;">50% Final Balance ${res.payments.bal ? '<span style="color: green; font-size: 11px;">(Paid)</span>' : ''}</td><td style="text-align: right;">₱${bal.toLocaleString()}</td></tr>
        </table>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px; color: #666;">
        <div>
          <p style="margin: 0 0 30px 0;">Prepared by: <strong>JannaSpice Operations</strong></p>
          <div style="border-top: 1px solid #2D2825; width: 200px; padding-top: 4px; text-align: center;">Authorized Signature</div>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0 0 30px 0;">Received by Client: <strong>${res.name}</strong></p>
          <div style="border-top: 1px solid #2D2825; width: 200px; padding-top: 4px; text-align: center; margin-left: auto;">Client Signature</div>
        </div>
      </div>
    </div>
  `;

  window.print();
}
