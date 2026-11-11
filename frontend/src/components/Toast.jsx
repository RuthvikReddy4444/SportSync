import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Toast() {
  const { toast, showToast } = useAuth();

  if (!toast?.message) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className={`platform-toast ${toast.type}`}>
      <div className="toast-icon">
        {isSuccess && <CheckCircle2 size={18} />}
        {isError && <AlertCircle size={18} />}
        {!isSuccess && !isError && <Info size={18} />}
      </div>
      <span className="toast-text">{toast.message}</span>
      <button 
        className="toast-close"
        onClick={() => showToast('', 'info')}
        title="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
