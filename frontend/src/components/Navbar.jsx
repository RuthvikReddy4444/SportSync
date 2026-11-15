import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  CalendarDays, 
  LayoutDashboard, 
  ShieldCheck, 
  LogOut, 
  User, 
  Sparkles,
  Layers,
  ChevronDown,
  Palette,
  Check
} from 'lucide-react';

export default function Navbar({ currentPage, setPage }) {
  const { user, isAuthenticated, role, logout, openAuth, demoLogin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState(() => {
    return localStorage.getItem('sportsync_theme') || 'electric';
  });

  const themeOptions = [
    { id: 'electric', label: 'SportSync Electric', dot: '#2563eb' },
    { id: 'emerald', label: 'Stadium Turf', dot: '#16a34a' },
    { id: 'sunset', label: 'Clay Court', dot: '#ea580c' },
    { id: 'midnight', label: 'Midnight Arena', dot: '#38bdf8' }
  ];

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('sportsync_theme', currentTheme);
  }, [currentTheme]);

  const selectTheme = (themeId) => {
    setCurrentTheme(themeId);
    setThemeDropdownOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <div className="logo-group" onClick={() => setPage('home')}>
          <div className="logo-badge">S</div>
          <div className="logo-text">
            <b>SportSync</b>
            <span className="logo-sub">UNIFIED SPORTS BOOKING SYSTEM</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="nav-links">
          <button 
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setPage('home')}
          >
            <Search size={15} /> Discover
          </button>

          {isAuthenticated && role === 'customer' && (
            <button 
              className={`nav-btn ${currentPage === 'customer' ? 'active' : ''}`}
              onClick={() => setPage('customer')}
            >
              <CalendarDays size={15} /> My Bookings
            </button>
          )}

          {isAuthenticated && (role === 'owner' || role === 'admin') && (
            <button 
              className={`nav-btn ${currentPage === 'owner' ? 'active' : ''}`}
              onClick={() => setPage('owner')}
            >
              <LayoutDashboard size={15} /> Owner Portal
            </button>
          )}

          {isAuthenticated && role === 'admin' && (
            <button 
              className={`nav-btn ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => setPage('admin')}
            >
              <ShieldCheck size={15} /> Admin Console
            </button>
          )}

          {isAuthenticated && (
            <button 
              className={`nav-btn ${currentPage === 'profile' ? 'active' : ''}`}
              onClick={() => setPage('profile')}
            >
              <User size={15} /> Profile
            </button>
          )}
        </nav>

        {/* Right Action Buttons */}
        <div className="nav-actions">
          {/* Theme Selector */}
          <div className="theme-switcher-wrapper">
            <button 
              className="btn-theme-switcher"
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              title="Switch SportSync Theme"
              type="button"
            >
              <Palette size={14} />
              <span 
                className="theme-dot" 
                style={{ backgroundColor: themeOptions.find(t => t.id === currentTheme)?.dot }}
              ></span>
              <span className="theme-label-short">
                {themeOptions.find(t => t.id === currentTheme)?.label.split(' ')[0]}
              </span>
            </button>
            {themeDropdownOpen && (
              <div className="theme-dropdown-menu">
                <div className="theme-dropdown-title">Theme Palette</div>
                {themeOptions.map((opt) => (
                  <button 
                    key={opt.id} 
                    className={`theme-option-btn ${currentTheme === opt.id ? 'active' : ''}`}
                    onClick={() => selectTheme(opt.id)}
                    type="button"
                  >
                    <span className="theme-option-dot" style={{ backgroundColor: opt.dot }}></span>
                    <span className="theme-option-text">{opt.label}</span>
                    {currentTheme === opt.id && <Check size={14} className="theme-check-icon" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="user-menu-wrapper">
              <div 
                className="user-pill"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className={`role-tag ${role}`}>{role.toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
                <ChevronDown size={14} />
              </div>

              {dropdownOpen && (
                <div className="user-dropdown" onClick={() => setDropdownOpen(false)}>
                  <div className="dropdown-header">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                  <hr />
                  <button onClick={() => setPage('profile')}>
                    <User size={14} /> My Profile & Preferences
                  </button>
                  {role === 'customer' && (
                    <button onClick={() => setPage('customer')}>
                      <CalendarDays size={14} /> My Bookings & Receipts
                    </button>
                  )}
                  {(role === 'owner' || role === 'admin') && (
                    <button onClick={() => setPage('owner')}>
                      <LayoutDashboard size={14} /> Manage Venues & Slots
                    </button>
                  )}
                  {role === 'admin' && (
                    <button onClick={() => setPage('admin')}>
                      <ShieldCheck size={14} /> Admin Overview
                    </button>
                  )}
                  <hr />
                  <button className="danger-link" onClick={logout}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <button 
                className="btn-quick-demo" 
                onClick={() => openAuth('login')}
                title="Quick demo access"
              >
                <Sparkles size={13} /> Demo Logins
              </button>
              <button 
                className="btn-outline" 
                onClick={() => openAuth('login')}
              >
                Log In
              </button>
              <button 
                className="btn-solid" 
                onClick={() => openAuth('register')}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
