import { useState } from 'react';

function SettingsMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out? You will need to log in again.')) {
      setIsOpen(false);
      onLogout();
    }
  };

  return (
    <div className="relative">
      {/* Settings Gear Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 text-white/70 hover:text-white hover:bg-neutral-800 rounded-full transition-all duration-200 touch-manipulation"
        title="Account Settings"
        aria-label="Account Settings"
      >
        <svg
          className="w-6 h-6 sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 bg-black/20 sm:bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {/* Current User Info */}
            <div className="px-4 py-3 sm:px-3 sm:py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-sm sm:text-xs font-heading uppercase tracking-wide text-gray-900 truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-sm sm:text-xs font-body text-gray-500 truncate mt-1">
                {user?.email}
              </p>
              <p className="text-sm sm:text-xs font-body text-red-600 font-medium capitalize mt-1">
                {user?.role} Account
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2 sm:py-1">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 sm:px-3 sm:py-2 text-base sm:text-sm font-body text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors duration-150 flex items-center space-x-3 sm:space-x-2 touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SettingsMenu;