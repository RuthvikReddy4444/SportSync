import React, { useEffect, useState } from 'react';
import { X, Printer, CheckCircle, Shield, Download } from 'lucide-react';
import { api } from '../services/api';

export default function ReceiptModal({ bookingId, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    api(`/bookings/${bookingId}/receipt`)
      .then(res => setReceipt(res.receipt))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (!bookingId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-receipt" onClick={e => e.stopPropagation()}>
        <div className="receipt-toolbar no-print">
          <button className="btn-print" onClick={handlePrint}>
            <Printer size={16} /> Print Receipt
          </button>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="loader-box">Loading verified receipt...</div>
        ) : receipt ? (
          <div className="receipt-printable-area">
            {/* Receipt Header */}
            <div className="receipt-header">
              <div className="receipt-brand">
                <span className="brand-symbol">⚡</span>
                <div>
                  <h2>SPORTSYNC</h2>
                  <small>OFFICIAL BOOKING RECEIPT</small>
                </div>
              </div>
              <div className="receipt-status-stamp">
                <span className={`stamp ${receipt.payment_status}`}>
                  {receipt.payment_status?.toUpperCase() || 'PAID'}
                </span>
              </div>
            </div>

            <hr className="receipt-sep" />

            {/* Meta Info Grid */}
            <div className="receipt-meta-grid">
              <div>
                <label>BOOKING ID</label>
                <p><code>#{receipt.booking_id}</code></p>
              </div>
              <div>
                <label>TRANSACTION ID</label>
                <p><code>{receipt.transaction_id}</code></p>
              </div>
              <div>
                <label>DATE ISSUED</label>
                <p>{new Date(receipt.booked_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              <div>
                <label>PAYMENT METHOD</label>
                <p>{receipt.payment_method}</p>
              </div>
            </div>

            <hr className="receipt-sep" />

            {/* Venue & Customer Sections */}
            <div className="receipt-parties-grid">
              <div className="party-block">
                <h4>SPORTS FACILITY</h4>
                <b>{receipt.facility_name}</b>
                <p>{receipt.facility_address?.street ? `${receipt.facility_address.street}, ` : ''}{receipt.facility_address?.locality}, {receipt.facility_address?.city}</p>
                {receipt.facility_phone && <p>Tel: {receipt.facility_phone}</p>}
              </div>

              <div className="party-block">
                <h4>CUSTOMER</h4>
                <b>{receipt.customer_name}</b>
                {receipt.customer_email && <p>{receipt.customer_email}</p>}
                {receipt.customer_phone && <p>{receipt.customer_phone}</p>}
              </div>
            </div>

            {/* Reservation Line Item Table */}
            <div className="receipt-table-wrapper">
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Playing Area</th>
                    <th>Schedule</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <b>{receipt.sport} Slot Reservation</b>
                      <small>Standard Hourly Booking</small>
                    </td>
                    <td>{receipt.playing_area}</td>
                    <td>
                      {new Date(receipt.slot_start).toLocaleDateString([], { dateStyle: 'short' })}<br />
                      <small>
                        {new Date(receipt.slot_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(receipt.slot_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td className="text-right">
                      <b>₹{receipt.amount}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Block */}
            <div className="receipt-total-block">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>₹{receipt.amount}</span>
              </div>
              <div className="total-row">
                <span>Platform Convenience Fee:</span>
                <span>₹0 (Waived)</span>
              </div>
              <hr />
              <div className="total-row grand-total">
                <span>Total Paid:</span>
                <span>₹{receipt.amount} INR</span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="receipt-footer">
              <p>
                <Shield size={13} /> This is a computer-generated confirmation receipt issued by SportSync. Present this receipt or show your booking ID at the venue desk upon arrival.
              </p>
              <small>SportSync Technologies Inc. · www.sportsync.com</small>
            </div>
          </div>
        ) : (
          <div className="empty-state-card">
            <p>Could not load receipt data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
