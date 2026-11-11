import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import CustomerDashboard from './pages/CustomerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { user, isAuthenticated, role } = useAuth();
  const [page, setPage] = useState('home'); // 'home', 'customer', 'owner', 'admin', 'profile'

  // Route protection
  useEffect(() => {
    if (page === 'customer' && (!isAuthenticated || role !== 'customer')) {
      setPage('home');
    }
    if (page === 'owner' && (!isAuthenticated || (role !== 'owner' && role !== 'admin'))) {
      setPage('home');
    }
    if (page === 'admin' && (!isAuthenticated || role !== 'admin')) {
      setPage('home');
    }
    if (page === 'profile' && !isAuthenticated) {
      setPage('home');
    }
  }, [page, isAuthenticated, role]);

  return (
    <div className="playreserve-app-shell">
      <Navbar currentPage={page} setPage={setPage} />
      <Toast />

      <main className="main-content-flow">
        {page === 'home' && (
          <HomePage onOpenOwnerWorkspace={() => setPage('owner')} />
        )}
        {page === 'customer' && (
          <CustomerDashboard setPage={setPage} />
        )}
        {page === 'owner' && (
          <OwnerDashboard />
        )}
        {page === 'admin' && (
          <AdminDashboard />
        )}
        {page === 'profile' && (
          <ProfilePage />
        )}
      </main>

      <Footer setPage={setPage} />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
