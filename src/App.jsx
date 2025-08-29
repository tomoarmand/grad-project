import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X } from 'lucide-react';
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
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [browserSupport, setBrowserSupport] = useState({
    isChrome: false,
    isEdge: false,
    isFirefox: false,
    isSafari: false,
    isChromeIOS: false,
    supportsInstall: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(userAgent);
    const android = /Android/.test(userAgent);
    const desktop = window.innerWidth > 1024;

    const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edg') && !userAgent.includes('OPR');
    const isEdge = userAgent.includes('Edg');
    const isFirefox = userAgent.includes('Firefox');
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    const isChromeIOS = iOS && isChrome;

    setIsIOS(iOS);
    setIsAndroid(android);
    setIsDesktop(desktop);

    setBrowserSupport({
      isChrome,
      isEdge,
      isFirefox,
      isSafari,
      isChromeIOS,
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
      console.log('New beforeinstallprompt event received');
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
  }, []); // Keep empty dependency array to avoid re-running

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
      setShowIOSModal(true);
      setShowInstallBanner(false);
      return;
    }

    // If we have a deferred prompt, use it
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
        // Always clear the prompt after use (whether accepted or dismissed)
        // The browser will provide a new one if conditions are met
        setDeferredPrompt(null);
      } catch (error) {
        console.log('Install prompt failed, clearing deferredPrompt');
        setDeferredPrompt(null);
        // Show modal as fallback
        if (isDesktop) setShowDesktopModal(true);
        else if (isIOS) setShowIOSModal(true);
        setShowInstallBanner(false);
      }
      return;
    }

    // No deferred prompt available - show appropriate modal/instructions
    if (isDesktop) {
      setShowDesktopModal(true);
    } else if (isAndroid && browserSupport.supportsInstall) {
      // For modern Android browsers, show instructions as fallback
      setShowAndroidModal(true);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
    // Note: Most Android users should never reach this point because they'll have deferredPrompt
    setShowInstallBanner(false);
  };

  const handleDismissInstalledMessage = () => {
    setShowInstalledMessage(false);
  };

  // Check if we should show the tip (not installed AND app was never installed)
  const shouldShowTip = !isInstalled && !localStorage.getItem('kenToneAppInstalled');

  // Get device-specific tip text
  const getTipText = () => {
    if (isIOS) {
      return (
        <>
          💡 Tip: <span className="underline">Add KenTone to your home screen</span> for the best experience
        </>
      );
    } else if (isAndroid) {
      return (
        <>
          💡 Tip: <span className="underline">Add KenTone to your home screen</span> for the best experience
        </>
      );
    } else {
      return (
        <>
          💡 Tip: <span className="underline">Add KenTone to your desktop</span> for the best experience
        </>
      );
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
            <p><strong>Chrome/Edge:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Click the install icon in the address bar</li>
              <li>Or go to Settings → More tools → Create shortcut</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const AndroidInstallModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#334155] rounded-xl p-6 max-w-sm mx-auto shadow-2xl border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold flex items-center gap-2">
            <Smartphone size={20} /> Add to Home Screen
          </h3>
          <button
            onClick={() => setShowAndroidModal(false)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-300 text-sm space-y-3">
          <p>The automatic install prompt isn't available right now.</p>
          <p>To add KenTone to your home screen manually:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">1.</span>
              <span>Tap the menu button <strong>⋮</strong> (three dots)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">2.</span>
              <span>Look for <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">3.</span>
              <span>Tap <strong>"Add"</strong> or <strong>"Install"</strong> to confirm</span>
            </div>
          </div>
          <div className="bg-blue-900 bg-opacity-30 border border-blue-400 rounded-lg p-3 mt-3">
            <p className="text-blue-300 text-xs">
              💡 Try refreshing the page to see if the install prompt appears.
            </p>
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
        <div className="text-gray-300 text-sm space-y-3">
          {browserSupport.isChromeIOS ? (
            <>
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-400 rounded-lg p-3 mb-3">
                <p className="text-yellow-300 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>You're using Chrome on iOS. For the best experience, please open this page in <strong>Safari</strong> to add it to your home screen.</span>
                </p>
              </div>
              <p>To switch to Safari:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">1.</span>
                  <span>Copy this page's URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">2.</span>
                  <span>Open Safari and paste the URL</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">3.</span>
                  <span>Follow the instructions below</span>
                </div>
              </div>
              <hr className="border-gray-600 my-4" />
            </>
          ) : null}
          <p>To add KenTone to your home screen{browserSupport.isChromeIOS ? ' (in Safari)' : ''}:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">1.</span>
              <span>Tap the Share button <strong>⬆️</strong> at the bottom</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">2.</span>
              <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">3.</span>
              <span>Tap <strong>"Add"</strong> to confirm</span>
            </div>
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
      {showDesktopModal && <DesktopInstallModal />}
      {showAndroidModal && <AndroidInstallModal />}

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

        {/* Tip only shows if app was never installed */}
        {shouldShowTip && (
          <p
            className="text-gray-400 text-xs mt-4 cursor-pointer hover:underline"
            onClick={handleInstallClick}
          >
            {getTipText()}
          </p>
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