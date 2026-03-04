import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger"
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const confirmButtonColor = type === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 focus:ring-red-500';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm w-full mx-4 transform transition-all">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              type === 'danger' ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                type === 'danger' ? 'text-red-600' : 'text-orange-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-heading uppercase tracking-wide text-gray-900 leading-tight">
                {title}
              </h3>
            </div>
          </div>

          <p className="text-gray-600 text-base font-body leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-heading uppercase tracking-wide text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 text-sm font-heading uppercase tracking-wide text-white rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${confirmButtonColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;