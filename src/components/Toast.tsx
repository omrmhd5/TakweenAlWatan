import React from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function Toast() {
  const { toast, hideToast } = useToast();

  if (!toast) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  const Icon = icons[toast.type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`flex items-center p-4 rounded-lg border shadow-lg max-w-sm ${colors[toast.type]}`}>
        <Icon className="w-5 h-5 ml-3 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button
          onClick={hideToast}
          className="mr-2 p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}