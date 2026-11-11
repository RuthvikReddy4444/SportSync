import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, CreditCard, Smartphone, Building, Lock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentModal({ 
  bookingData, 
  onClose, 
  onPaymentSuccess 
}) {
  const { showToast } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('UPI (Google Pay / PhonePe)');
  const [processing, setProcessing] = useState(false);
  const [successData, setSuccessData] = useState(null);

  if (!bookingData) return null;

  const { booking, facility, slot } = bookingData;
  const bookingId = booking?._id || booking?.booking_id;
  const amount = booking?.amount || slot?.price || 0;

  const handleSimulatePayment = async () => {
    setProcessing(true);
    try {
      // Simulate real gateway latency
      await new Promise(r => setTimeout(r, 900));

      const res = await api(`/bookings/${bookingId}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: paymentMethod,
          gateway: 'simulated_razorpay'
        })
      });

      setSuccessData(res);
      showToast('Payment successful! Booking confirmed.', 'success');
      if (onPaymentSuccess) {
        onPaymentSuccess(res);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-payment" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Cancel">
          <X size={20} />
        </button>

        {!successData ? (
          <div className="payment-flow-body">
            <div className="payment-head">
              <span className="secure-badge">
                <Lock size={13} /> 256-Bit Simulated Gateway
              </span>
              <h3>Confirm & Pay Reservation</h3>
              <p>PlayReserve Fast Checkout · Ready for Razorpay</p>
            </div>

            {/* Booking Summary Card */}
            <div className="payment-summary-box">
              <div className="summary-row">
                <span>Facility:</span>
                <b>{facility?.name || 'Selected Sports Venue'}</b>
              </div>
              <div className="summary-row">
                <span>Sport & Court:</span>
                <b>{booking?.sport || slot?.sport} · {booking?.playing_area || slot?.playing_area}</b>
              </div>
              <div className="summary-row">
                <span>Slot Timing:</span>
                <b>
                  {slot?.start_at ? new Date(slot.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  {' – '}
                  {slot?.end_at ? new Date(slot.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </b>
              </div>
              <hr />
              <div className="summary-total-row">
                <span>Total Payable:</span>
                <span className="total-amount">₹{amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="payment-methods-group">
              <label>Select Payment Method:</label>
              
              <div 
                className={`method-option ${paymentMethod.includes('UPI') ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('UPI (Google Pay / PhonePe / Paytm)')}
              >
                <Smartphone size={18} />
                <div className="method-text">
                  <b>UPI / QR Instant Pay</b>
                  <small>Google Pay, PhonePe, Paytm, BHIM</small>
                </div>
                <input type="radio" checked={paymentMethod.includes('UPI')} readOnly />
              </div>

              <div 
                className={`method-option ${paymentMethod.includes('Card') ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('Debit / Credit Card')}
              >
                <CreditCard size={18} />
                <div className="method-text">
                  <b>Credit & Debit Cards</b>
                  <small>Visa, Mastercard, RuPay</small>
                </div>
                <input type="radio" checked={paymentMethod.includes('Card')} readOnly />
              </div>

              <div 
                className={`method-option ${paymentMethod.includes('NetBanking') ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('NetBanking (Simulated)')}
              >
                <Building size={18} />
                <div className="method-text">
                  <b>Net Banking</b>
                  <small>HDFC, SBI, ICICI, Axis Bank</small>
                </div>
                <input type="radio" checked={paymentMethod.includes('NetBanking')} readOnly />
              </div>
            </div>

            <div className="demo-gateway-notice">
              <AlertCircle size={15} />
              <span>
                Demo Mode: Payment simulation will approve instantly and generate a verified transaction receipt. No real funds are deducted.
              </span>
            </div>

            <button 
              className="btn-pay-action"
              onClick={handleSimulatePayment}
              disabled={processing}
            >
              {processing ? 'Authorizing Payment...' : `Simulate Pay ₹${amount.toLocaleString('en-IN')}`}
            </button>
          </div>
        ) : (
          <div className="payment-success-body">
            <div className="success-icon-ring">
              <CheckCircle2 size={48} className="check-success" />
            </div>
            <h3>Reservation Confirmed!</h3>
            <p>Your payment was authorized and your slot is officially locked.</p>

            <div className="success-meta-card">
              <div className="meta-line">
                <span>Transaction ID:</span>
                <code>{successData.transaction_id || 'pay_pr_SIMULATED'}</code>
              </div>
              <div className="meta-line">
                <span>Amount Paid:</span>
                <b>₹{amount}</b>
              </div>
              <div className="meta-line">
                <span>Status:</span>
                <span className="badge-confirmed">CONFIRMED (PAID)</span>
              </div>
            </div>

            <div className="success-actions">
              <button className="btn-solid" onClick={onClose}>
                Done & View Bookings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
