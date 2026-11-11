import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Sparkles, Shield, Building, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authModalMode, 
    setAuthModalMode,
    authRoleChoice,
    setAuthRoleChoice,
    login, 
    register, 
    demoLogin, 
    showToast 
  } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: authRoleChoice || 'customer'
  });
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const isRegister = authModalMode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          role: form.role
        });
      } else {
        await login(form.email.trim(), form.password);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (email, password) => {
    setLoading(true);
    try {
      await demoLogin(email, password);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setAuthModalOpen(false)}>
      <div className="modal-card modal-auth" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={() => setAuthModalOpen(false)} title="Close">
          <X size={20} />
        </button>

        <div className="auth-head">
          <span className="section-kicker">PLAYRESERVE ACCOUNT ACCESS</span>
          <h2>{isRegister ? 'Create Your Account' : 'Welcome Back'}</h2>
          <p>
            {isRegister 
              ? 'Join as a player to book venues or as an owner to manage facilities.' 
              : 'Sign in to access your bookings, venues, and profile.'}
          </p>
        </div>

        {/* Instant Demo Switcher Box */}
        <div className="demo-accounts-box">
          <div className="demo-box-head">
            <Sparkles size={14} />
            <b>Instant 1-Click Demo Logins:</b>
          </div>
          <div className="demo-btns-row">
            <button 
              type="button" 
              className="btn-demo-pill" 
              onClick={() => handleQuickDemo('player@playreserve.com', 'Demo@123')}
              disabled={loading}
            >
              ⚽ Demo Player
            </button>
            <button 
              type="button" 
              className="btn-demo-pill" 
              onClick={() => handleQuickDemo('owner@playreserve.com', 'Demo@123')}
              disabled={loading}
            >
              🏟️ Facility Owner
            </button>
            <button 
              type="button" 
              className="btn-demo-pill" 
              onClick={() => handleQuickDemo('admin@playreserve.com', 'Demo@123')}
              disabled={loading}
            >
              🛡️ Demo Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <>
              <div className="form-group">
                <label>Account Role:</label>
                <div className="role-selector-cards">
                  <div 
                    className={`role-card-opt ${form.role === 'customer' ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, role: 'customer' })}
                  >
                    <User size={18} />
                    <b>Player / Customer</b>
                    <small>Search & book courts</small>
                  </div>
                  <div 
                    className={`role-card-opt ${form.role === 'owner' ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, role: 'owner' })}
                  >
                    <Building size={18} />
                    <b>Facility Owner</b>
                    <small>List venues & slots</small>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name:</label>
                <div className="input-with-icon">
                  <User size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mobile Number:</label>
                <div className="input-with-icon">
                  <Phone size={16} />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address:</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password:</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-solid-full auth-submit"
            disabled={loading}
          >
            {loading 
              ? 'Processing...' 
              : isRegister ? 'Create PlayReserve Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer-toggle">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                className="link-btn" 
                onClick={() => setAuthModalMode('login')}
              >
                Log In
              </button>
            </p>
          ) : (
            <p>
              New to PlayReserve?{' '}
              <button 
                type="button" 
                className="link-btn" 
                onClick={() => setAuthModalMode('register')}
              >
                Create an Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
