import React, { useState } from 'react';
import { User, Phone, Mail, Lock, ShieldCheck, Heart, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SPORTS_LIST } from '../components/PopularSports';

export default function ProfilePage() {
  const { user, updateProfile, changePassword, showToast } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    preferred_sports: user?.preferred_sports || ['Badminton', 'Cricket']
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(passwordForm.old_password, passwordForm.new_password);
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const toggleSport = (sportName) => {
    const list = [...(profileForm.preferred_sports || [])];
    const index = list.indexOf(sportName);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(sportName);
    }
    setProfileForm({ ...profileForm, preferred_sports: list });
  };

  return (
    <div className="dashboard-page profile-page">
      <div className="dashboard-hero-banner profile-banner">
        <div className="dash-hero-content">
          <span className="section-kicker">PERSONAL SETTINGS</span>
          <h1>My Profile & Security</h1>
          <p>Update personal contact info, preferred sports, and account security credentials.</p>
        </div>
      </div>

      <div className="profile-grid-container">
        {/* Left Column: Personal Info Form */}
        <div className="profile-card">
          <div className="card-head">
            <User size={20} />
            <div>
              <h3>Account Information</h3>
              <p>Manage your public athlete or venue owner details.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address (Immutable):</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input-disabled"
              />
              <small className="help-text">Email address is bound to your account ID.</small>
            </div>

            <div className="form-group">
              <label>Contact Phone:</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={profileForm.phone}
                onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Account Role:</label>
              <div className="role-display-pill">
                <ShieldCheck size={16} />
                <b>{user?.role?.toUpperCase()}</b>
              </div>
            </div>

            {/* Favorite Sports Selector */}
            <div className="form-group">
              <label>Preferred Sports:</label>
              <div className="sports-checkbox-cloud">
                {SPORTS_LIST.filter(s => s.id).map(s => {
                  const isChecked = profileForm.preferred_sports?.includes(s.name);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      className={`sport-select-chip ${isChecked ? 'active' : ''}`}
                      onClick={() => toggleSport(s.name)}
                    >
                      <span>{s.icon}</span> {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-solid" disabled={savingProfile}>
              <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Right Column: Password & Security */}
        <div className="profile-card">
          <div className="card-head">
            <Lock size={20} />
            <div>
              <h3>Security & Password</h3>
              <p>Ensure your account uses a secure password.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label>Current Password:</label>
              <input
                type="password"
                required
                placeholder="Enter existing password"
                value={passwordForm.old_password}
                onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>New Password (8+ characters):</label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Enter new strong password"
                value={passwordForm.new_password}
                onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password:</label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Re-enter new password"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-outline" disabled={savingPassword}>
              <Lock size={15} /> {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
