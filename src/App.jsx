import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X, Share, Plus } from 'lucide-react';
import './App.css';
import logo from './assets/logo.svg';
import useUserStore from './store/userStore';

function HomePage() {
  const { clearUser } = useUserStore();
  const navigate = useNavigate();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [hasShownBanner, setHasShownBanner] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstalledMessage, setShowInstalledMessage] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [showNonSafariIOSModal, setShowNonSafariIOSModal] = useState(false);
  const [browserSupport, setBrowserSupport] = useState({
    isChrome: false,
    isEdge: false,
    isFirefox: false,
    isSafari: false,
    supportsInstall: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(userAgent);
    const desktop = window.innerWidth > 1024;

    const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg') && !userAgent.includes('OPR');
    const isEdge = userAgent.includes('Edg');
    const isFirefox = userAgent.includes('Firefox');
    
    // Better Safari detection for iOS
    const isSafariBrowser = iOS && userAgent.includes('Safari') && 
                          !userAgent.includes('CriOS') && 
                          !userAgent.includes('FxiOS') && 
                          !userAgent.includes('EdgiOS') &&
                          !userAgent.includes('Chrome');

    setIsIOS(iOS);
    setIsDesktop(desktop);
    setIsSafari(isSafariBrowser);

    setBrowserSupport({
      isChrome,
      isEdge,
      isFirefox,
      isSafari: isSafariBrowser,
      supportsInstall: isChrome || isEdge || (!desktop && !iOS),
    });

    // Improved PWA detection
    const checkInstallStatus = () => {
      // Check if running in standalone mode (PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true ||
                          document.referrer.includes('android-app://');
      
      // Additional check for mobile PWA
      const isMobilePWA = !desktop && (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      );
      
      return isStandalone || isMobilePWA;
    };

    const installedStatus = checkInstallStatus();
    setIsInstalled(installedStatus);

    // Check if app has ever been installed (persistent flag)
    const appEverInstalled = localStorage.getItem('kenToneAppInstalled');
    
    // Check if the installed message should be shown
    const hasShownInstalledMessage = localStorage.getItem('kenToneInstalledMessageShown');
    
    // Show installed message only when actually in PWA mode
    if (installedStatus && !hasShownInstalledMessage) {
      setShowInstalledMessage(true);
      localStorage.setItem('kenToneInstalledMessageShown', 'true');
    }

    // Check if the install banner has been shown before OR if app was ever installed
    const hasShownInstallBanner = localStorage.getItem('kenToneInstallBannerShown');
    const shouldHideBanner = !!hasShownInstallBanner || !!appEverInstalled || installedStatus;
    setHasShownBanner(shouldHideBanner);

    const delay = desktop ? 500 : 300;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show banner if app was ever installed or currently installed
      if (!checkInstallStatus() && !shouldHideBanner) {
        setTimeout(() => {
          setShowInstallBanner(true);
          localStorage.setItem('kenToneInstallBannerShown', 'true');
          setHasShownBanner(true);
        }, delay);
      }
    };

    const handleAppInstalled = () => {
      // Mark app as permanently installed
      localStorage.setItem('kenToneAppInstalled', 'true');
      localStorage.setItem('kenToneInstallBannerShown', 'true');
      
      setIsInstalled(true);
      setShowInstallBanner(false);
      setShowDesktopModal(false);
      setDeferredPrompt(null);
      setHasShownBanner(true);
      
      // Only show installed message if actually in PWA mode
      if (checkInstallStatus()) {
        setShowInstalledMessage(true);
        localStorage.setItem('kenToneInstalledMessageShown', 'true');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Only show banner if not installed and hasn't been shown and app wasn't previously installed
    const timer = setTimeout(() => {
      const shouldShowBanner =
        !checkInstallStatus() &&
        !shouldHideBanner &&
        !appEverInstalled &&
        (iOS || deferredPrompt || (!desktop && browserSupport.supportsInstall));

      if (shouldShowBanner) {
        setShowInstallBanner(true);
        localStorage.setItem('kenToneInstallBannerShown', 'true');
        setHasShownBanner(true);
      }
    }, delay);

    // Listen for display mode changes
    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      const newInstalledStatus = checkInstallStatus();
      setIsInstalled(newInstalledStatus);
      
      // If we're now in standalone mode and haven't shown the message
      if (newInstalledStatus && !localStorage.getItem('kenToneInstalledMessageShown')) {
        setShowInstalledMessage(true);
        localStorage.setItem('kenToneInstalledMessageShown', 'true');
      }
    };
    
    standaloneMediaQuery.addListener(handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneMediaQuery.removeListener(handleDisplayModeChange);
      clearTimeout(timer);
    };
  }, []);

  const handleCreateUserClick = () => {
    try {
      clearUser();
      localStorage.removeItem('authToken');
      navigate('/CreateUserPage');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/CreateUserPage';
    }
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      if (isSafari) {
        setShowIOSModal(true);
      } else {
        setShowNonSafariIOSModal(true);
      }
      setShowInstallBanner(false);
      return;
    }

    // For desktop, try to use deferredPrompt first, only show modal as fallback
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          // Mark as installed and hide banner
          localStorage.setItem('kenToneAppInstalled', 'true');
          setShowInstallBanner(false);
          setHasShownBanner(true);
        }
        setDeferredPrompt(null);
      } catch (error) {
        if (isDesktop) setShowDesktopModal(true);
        setShowInstallBanner(false);
      }
      return;
    }

    // Only show desktop modal if no deferredPrompt is available
    if (isDesktop) {
      setShowDesktopModal(true);
      setShowInstallBanner(false);
      return;
    }

    // For mobile without deferredPrompt, show install banner was dismissed
    setShowInstallBanner(false);
  };

  const handleDismissInstalledMessage = () => {
    setShowInstalledMessage(false);
  };

  // Check if we should show the tip (not installed AND app was never installed)
  const shouldShowTip = !isInstalled && !localStorage.getItem('kenToneAppInstalled');

  // Generate platform-specific tip text
  const getTipText = () => {
    if (isIOS && isSafari) {
      return 'Tap here to add KenTone to your home screen';
    } else if (isIOS && !isSafari) {
      return 'Tap here to get install instructions';
    } else if (isDesktop) {
      return 'Click here to install KenTone on your desktop';
    } else {
      return 'Tap here to install KenTone';
    }
  };

  const DesktopInstallModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#334155] rounded-xl p-6 max-w-md mx-auto shadow-2xl border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold flex items-center gap-2">
            <Monitor size={20} /> Install KenTone on Desktop
          </h3>
          <button
            onClick={() => setShowDesktopModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-300 text-sm space-y-3">
          <p>To install KenTone as a desktop app:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-semibold">1.</span>
              <span>Look for the install icon in your browser's address bar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-semibold">2.</span>
              <span>Click it and select "Install"</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-semibold">3.</span>
              <span>Or use your browser's menu and look for "Install KenTone"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const IOSInstallModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#334155] rounded-xl p-6 max-w-sm mx-auto shadow-2xl border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Add to Home Screen</h3>
          <button
            onClick={() => setShowIOSModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-300 text-sm space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-semibold mt-0.5">1.</span>
              <div className="flex items-center gap-2">
                <span>Tap the</span>
                <div className="inline-flex items-center gap-1 bg-blue-600 px-2 py-1 rounded text-xs">
                  <Share size={12} />
                  <span>Share</span>
                </div>
                <span>button at the bottom</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-semibold mt-0.5">2.</span>
              <div className="flex items-center gap-2">
                <span>Scroll down and tap</span>
                <div className="inline-flex items-center gap-1 bg-gray-600 px-2 py-1 rounded text-xs">
                  <Plus size={12} />
                  <span>Add to Home Screen</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-semibold mt-0.5">3.</span>
              <span>Tap "Add" to confirm</span>
            </div>
          </div>
          <div className="bg-blue-900 bg-opacity-30 border border-blue-400 rounded-lg p-3 mt-4">
            <p className="text-blue-300 text-xs">
              💡 After adding to home screen, KenTone will open like a native app!
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const NonSafariIOSModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#334155] rounded-xl p-6 max-w-sm mx-auto shadow-2xl border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Switch to Safari</h3>
          <button
            onClick={() => setShowNonSafariIOSModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-300 text-sm space-y-4">
          <p>To install KenTone on your iPhone, you'll need to use Safari:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-semibold mt-0.5">1.</span>
              <span>Copy this page's URL</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-semibold mt-0.5">2.</span>
              <span>Open Safari browser</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-semibold mt-0.5">3.</span>
              <span>Paste the URL and visit KenTone</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 font-semibold mt-0.5">4.</span>
              <span>You'll then see the option to "Add to Home Screen"</span>
            </div>
          </div>
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-400 rounded-lg p-3 mt-4">
            <p className="text-yellow-300 text-xs">
              ⚠️ iPhone apps can only be installed through Safari, not other browsers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-4 relative">
      
      {showInstallBanner && !isInstalled && (
        <div
          className="fixed top-4 left-4 right-4 bg-[#334155] border border-orange-400 rounded-lg p-4 shadow-lg z-40 animate-slideDown"
          role="banner"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-400 rounded-lg">
                {isDesktop ? (
                  <Monitor size={20} className="text-white" />
                ) : (
                  <Smartphone size={20} className="text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-medium text-sm">Install KenTone</p>
                <p
                  className="text-gray-300 text-xs cursor-pointer hover:underline"
                  onClick={handleInstallClick}
                >
                  {isDesktop ? 'Get the desktop app experience' : 'Get the full app experience'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-orange-400 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                aria-label="Install KenTone app"
              >
                <Download size={14} /> Install
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

      {showIOSModal && <IOSInstallModal />}
      {showNonSafariIOSModal && <NonSafariIOSModal />}
      {showDesktopModal && <DesktopInstallModal />}

      {/* Main card */}
      <div className="w-full max-w-sm bg-[#334155] rounded-xl shadow-xl p-8 sm:p-10 text-center">
        <div className="flex flex-col items-center mb-10">
          <img
            src={logo}
            alt="KenTone logo"
            className="w-32 h-32 sm:w-36 sm:h-36 object-contain mb-4 drop-shadow-md"
          />
          <h1
            style={{ fontFamily: "'Merriweather', serif", textShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)' }}
            className="text-[#f5f0e6] text-4xl sm:text-5xl font-semibold tracking-wide"
          >
            KenTone
          </h1>
        </div>

        {isInstalled && showInstalledMessage && (
          <div className="mb-6 p-3 bg-green-900 bg-opacity-30 border border-green-400 rounded-lg relative">
            <p className="text-green-300 text-sm flex items-center justify-center gap-2">
              <span className="text-green-400">✓</span> Great! You're using the KenTone app
            </p>
            <button
              onClick={handleDismissInstalledMessage}
              className="absolute top-1 right-1 text-green-400 hover:text-green-300 p-1"
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Link to="/LoginPage" className="w-full">
            <button
              className="w-full text-lg sm:text-xl font-semibold text-[#f5f0e6] bg-[#64748b] hover:bg-[#fb923c] py-3 rounded transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              Log In
            </button>
          </Link>
          <button
            onClick={handleCreateUserClick}
            className="w-full text-lg sm:text-xl font-semibold text-[#f5f0e6] bg-[#64748b] hover:bg-[#fb923c] py-3 rounded transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            Create New User
          </button>
        </div>

        {/* Enhanced tip with platform-specific text - Choose between subtle or ghost button */}
        {shouldShowTip && (
          <div className="mt-6">
            {/* Option 1: Subtle button (less prominent) */}
            <button 
              onClick={handleInstallClick}
              className="group inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 transition-all duration-200 text-xs font-medium px-2 py-1 rounded border border-orange-400/20 hover:border-orange-300/30 hover:bg-orange-400/5 focus:outline-none focus:ring-1 focus:ring-orange-300/40"
            >
              <Download size={12} className="group-hover:animate-bounce" />
              <span>{getTipText()}</span>
            </button>

            {/* Option 2: Ghost button (transparent background, text-like) */}
            {/* 
            <button 
              onClick={handleInstallClick}
              className="group inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors duration-200 text-sm underline decoration-orange-400/50 underline-offset-2 hover:decoration-orange-300/70 focus:outline-none focus:ring-2 focus:ring-orange-300/50 focus:ring-offset-2 focus:ring-offset-slate-700"
            >
              <Download size={14} className="group-hover:animate-bounce" />
              <span>{getTipText()}</span>
            </button>
            */}
            
            <p className="text-gray-500 text-xs mt-2">for the best experience</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default HomePage;