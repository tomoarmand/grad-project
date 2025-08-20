import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import './App.css';
import logo from './assets/logo.svg';
import useUserStore from './store/userStore';

function HomePage() {
  const { clearUser } = useUserStore();
  const navigate = useNavigate();
  
  // PWA state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check platform and installation status
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Enhanced installation detection
    const checkInstallStatus = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      );
    };

    setIsInstalled(checkInstallStatus());

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      if (!checkInstallStatus()) {
        setTimeout(() => setShowInstallBanner(true), 2000);
      }
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show install banner for iOS or when criteria are met
    const timer = setTimeout(() => {
      const shouldShowBanner = !checkInstallStatus() && 
        (iOS || deferredPrompt || window.innerWidth <= 768);
      
      if (shouldShowBanner) {
        setShowInstallBanner(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleCreateUserClick = () => {
    try {
      clearUser();
      localStorage.removeItem('authToken');
      navigate('/CreateUserPage');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try direct navigation
      window.location.href = '/CreateUserPage';
    }
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      setShowInstallBanner(false);
      return;
    }

    if (!deferredPrompt) {
      // Fallback for browsers without beforeinstallprompt
      setShowInstallBanner(false);
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install prompt error:', error);
      setShowInstallBanner(false);
    }
  };

  const handleGetAppClick = () => {
    if (isInstalled) return;
    setShowInstallBanner(true);
  };

  const IOSInstallModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#334155] rounded-xl p-6 max-w-sm mx-auto shadow-2xl border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Install KenTone</h3>
          <button 
            onClick={() => setShowIOSModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-white text-sm space-y-3">
          <p className="text-gray-300">To install KenTone on your iPhone/iPad:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white flex-shrink-0 mt-0.5 font-medium">1</span>
              <div>
                <p className="font-medium">Tap the Share button</p>
                <p className="text-gray-300 text-xs mt-1">Look for the square with arrow pointing up at the bottom of Safari</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white flex-shrink-0 mt-0.5 font-medium">2</span>
              <div>
                <p className="font-medium">Find "Add to Home Screen"</p>
                <p className="text-gray-300 text-xs mt-1">Scroll down in the share menu until you see this option</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white flex-shrink-0 mt-0.5 font-medium">3</span>
              <div>
                <p className="font-medium">Tap "Add"</p>
                <p className="text-gray-300 text-xs mt-1">Confirm the installation to add KenTone to your home screen</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-700">
            <p className="text-xs text-blue-200 flex items-center gap-2">
              <span>🚀</span>
              Once installed, KenTone will work offline and feel like a native app!
            </p>
          </div>
          <div className="mt-3 p-2 bg-amber-900 bg-opacity-30 rounded border border-amber-600">
            <p className="text-xs text-amber-200 flex items-center gap-1">
              <span>⚠️</span>
              This only works in Safari browser, not Chrome or other browsers on iOS
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4 relative">
      {/* Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div 
          className="fixed top-4 left-4 right-4 bg-[#334155] border border-orange-400 rounded-lg p-4 shadow-lg z-40 animate-slideDown"
          role="banner"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-400 rounded-lg">
                <Smartphone size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Install KenTone</p>
                <p className="text-gray-300 text-xs">Get the full app experience</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-orange-400 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                aria-label="Install KenTone app"
              >
                <Download size={14} />
                Install
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-gray-400 hover:text-white p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
                aria-label="Dismiss install prompt"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIOSModal && <IOSInstallModal />}

      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl p-8 sm:p-10 text-center">
        <div className="flex flex-col items-center mb-10">
          <img
            src={logo}
            alt="KenTone logo"
            className="w-32 h-32 sm:w-36 sm:h-36 object-contain mb-4 drop-shadow-md"
            style={{ filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3))' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h1
            style={{ 
              fontFamily: "'Merriweather', serif", 
              textShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)' 
            }}
            className="text-[#f5f0e6] text-4xl sm:text-5xl font-semibold tracking-wide"
          >
            KenTone
          </h1>
        </div>

        {/* Installation Status or Install Button */}
        {isInstalled ? (
          <div className="mb-6 p-3 bg-green-900 bg-opacity-30 border border-green-400 rounded-lg">
            <p className="text-green-300 text-sm flex items-center justify-center gap-2">
              <span className="text-green-400">✓</span>
              Great! You're using the KenTone app
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <button
              onClick={handleGetAppClick}
              className="w-full text-lg font-semibold text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
              aria-label="Install KenTone as an app"
            >
              <Download size={20} />
              {window.innerWidth > 768 ? 'Install Desktop App' : 'Get the App'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Link to="/LoginPage" className="w-full">
            <button 
              className="w-full text-lg sm:text-xl font-semibold text-[#f5f0e6] bg-[#64748b] hover:bg-[#fb923c] py-3 rounded transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              aria-label="Navigate to login page"
            >
              Log In
            </button>
          </Link>
          <button
            onClick={handleCreateUserClick}
            className="w-full text-lg sm:text-xl font-semibold text-[#f5f0e6] bg-[#64748b] hover:bg-[#fb923c] py-3 rounded transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            aria-label="Create a new user account"
          >
            Create New User
          </button>
        </div>

        {/* Subtle hint for users who missed the banner */}
        {!showInstallBanner && !isInstalled && (
          <p className="text-gray-400 text-xs mt-4">
            💡 Tip: Add KenTone to your home screen for the best experience
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default HomePage;