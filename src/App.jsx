import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X } from 'lucide-react';
import './App.css';
import logo from './assets/logo.svg';
import useUserStore from './store/userStore';

function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}

function trackAnalyticsEvent(category, action, label = '') {
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
}

function HomePage() {
  const { clearUser } = useUserStore();
  const navigate = useNavigate();

  usePageTracking();

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
      isChrome, isEdge, isFirefox, isSafari, isChromeIOS,
      supportsInstall: isChrome || isEdge || (!desktop && !iOS),
    });

    const checkInstallStatus = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      const isMobilePWA =
        !desktop &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true);
      return isStandalone || isMobilePWA;
    };

    const installedStatus = checkInstallStatus();
    setIsInstalled(installedStatus);

    const appEverInstalled = localStorage.getItem('kenToneAppInstalled');
    const hasShownInstalledMessage = localStorage.getItem('kenToneInstalledMessageShown');

    if (installedStatus && !hasShownInstalledMessage) {
      setShowInstalledMessage(true);
      localStorage.setItem('kenToneInstalledMessageShown', 'true');
    }

    const hasShownInstallBanner = localStorage.getItem('kenToneInstallBannerShown');
    const shouldHideBanner = !!hasShownInstallBanner || !!appEverInstalled || installedStatus;
    setHasShownBanner(shouldHideBanner);

    const delay = desktop ? 500 : 300;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!checkInstallStatus() && !shouldHideBanner) {
        setTimeout(() => {
          setShowInstallBanner(true);
          localStorage.setItem('kenToneInstallBannerShown', 'true');
          setHasShownBanner(true);
        }, delay);
      }
    };

    const handleAppInstalled = () => {
      localStorage.setItem('kenToneAppInstalled', 'true');
      localStorage.setItem('kenToneInstallBannerShown', 'true');
      setIsInstalled(true);
      setShowInstallBanner(false);
      setShowDesktopModal(false);
      setDeferredPrompt(null);
      setHasShownBanner(true);
      if (checkInstallStatus()) {
        setShowInstalledMessage(true);
        localStorage.setItem('kenToneInstalledMessageShown', 'true');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

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

    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      const newInstalledStatus = checkInstallStatus();
      setIsInstalled(newInstalledStatus);
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
      trackAnalyticsEvent('Navigation', 'Create_User_Click', 'HomePage');
      clearUser();
      localStorage.removeItem('authToken');
      navigate('/CreateUserPage');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/CreateUserPage';
    }
  };

  const handleLoginClick = () => {
    trackAnalyticsEvent('Navigation', 'Login_Click', 'HomePage');
  };

  const handleInstallClick = async () => {
    trackAnalyticsEvent('PWA', 'Install_Click', isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop');

    if (isIOS) {
      setShowIOSModal(true);
      setShowInstallBanner(false);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          trackAnalyticsEvent('PWA', 'Install_Accepted', 'Native_Prompt');
          localStorage.setItem('kenToneAppInstalled', 'true');
          setShowInstallBanner(false);
          setHasShownBanner(true);
        } else {
          trackAnalyticsEvent('PWA', 'Install_Dismissed', 'Native_Prompt');
        }
      } catch (error) {
        if (isDesktop) setShowDesktopModal(true);
        else if (isIOS) setShowIOSModal(true);
        setShowInstallBanner(false);
      }
      return;
    }

    if (isDesktop) setShowDesktopModal(true);
    else if (isAndroid && browserSupport.supportsInstall) setShowAndroidModal(true);
    else if (isIOS) setShowIOSModal(true);
    setShowInstallBanner(false);
  };

  const handleDismissInstalledMessage = () => {
    trackAnalyticsEvent('PWA', 'Installed_Message_Dismissed');
    setShowInstalledMessage(false);
  };

  const shouldShowTip = !isInstalled && !localStorage.getItem('kenToneAppInstalled');

  const getTipText = () => {
    if (isIOS || isAndroid) {
      return (<>💡 Tip: <span className="underline">Add to your home screen</span> for the best experience</>);
    }
    return (<>💡 Tip: <span className="underline">Add to your desktop</span> for the best experience</>);
  };

  // Modal shared styles
  const modalBackdrop = "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50";
  const modalCard = "bg-neutral-900 border-2 border-red-600 rounded-lg p-6 max-w-md mx-auto shadow-lg";
  const modalHeader = "flex justify-between items-center mb-4";
  const modalTitle = "text-white text-lg font-heading uppercase tracking-wide flex items-center gap-2";
  const modalClose = "text-gray-400 hover:text-white transition-colors";
  const modalBody = "text-gray-300 text-sm font-body space-y-3";

  const DesktopInstallModal = () => (
    <div className={modalBackdrop}>
      <div className={modalCard}>
        <div className={modalHeader}>
          <h3 className={modalTitle}><Monitor size={20} /> Install on Desktop</h3>
          <button onClick={() => setShowDesktopModal(false)} className={modalClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div className={modalBody}>
          <p>To install as a desktop app:</p>
          <div className="space-y-2">
            <p><strong className="text-white">Chrome/Edge:</strong></p>
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
    <div className={modalBackdrop}>
      <div className={`${modalCard} max-w-sm`}>
        <div className={modalHeader}>
          <h3 className={modalTitle}><Smartphone size={20} /> Add to Home Screen</h3>
          <button onClick={() => setShowAndroidModal(false)} className={modalClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div className={modalBody}>
          <p>The automatic install prompt isn't available right now.</p>
          <p>To add to your home screen manually:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><span>1.</span><span>Tap the menu button <strong className="text-white">⋮</strong></span></div>
            <div className="flex items-center gap-2"><span>2.</span><span>Look for <strong className="text-white">"Add to Home screen"</strong> or <strong className="text-white">"Install app"</strong></span></div>
            <div className="flex items-center gap-2"><span>3.</span><span>Tap <strong className="text-white">"Add"</strong> or <strong className="text-white">"Install"</strong> to confirm</span></div>
          </div>
          <div className="bg-neutral-800 border border-white/10 rounded-lg p-3 mt-3">
            <p className="text-gray-400 text-xs">💡 Try refreshing the page to see if the install prompt appears.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const IOSInstallModal = () => (
    <div className={modalBackdrop}>
      <div className={`${modalCard} max-w-sm`}>
        <div className={modalHeader}>
          <h3 className={modalTitle}>Add to Home Screen</h3>
          <button onClick={() => setShowIOSModal(false)} className={modalClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div className={modalBody}>
          {browserSupport.isChromeIOS && (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3 mb-3">
                <p className="text-yellow-500 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>You're using Chrome on iOS. For the best experience, open this page in <strong>Safari</strong> to add it to your home screen.</span>
                </p>
              </div>
              <p>To switch to Safari:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><span>1.</span><span>Copy this page's URL</span></div>
                <div className="flex items-center gap-2"><span>2.</span><span>Open Safari and paste the URL</span></div>
                <div className="flex items-center gap-2"><span>3.</span><span>Follow the instructions below</span></div>
              </div>
              <hr className="border-white/10 my-4" />
            </>
          )}
          <p>To add to your home screen{browserSupport.isChromeIOS ? ' (in Safari)' : ''}:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><span>1.</span><span>Tap the Share button <strong className="text-white">⬆️</strong> at the bottom</span></div>
            <div className="flex items-center gap-2"><span>2.</span><span>Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong></span></div>
            <div className="flex items-center gap-2"><span>3.</span><span>Tap <strong className="text-white">"Add"</strong> to confirm</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 px-4 relative">

      {/* Install banner */}
      {showInstallBanner && !isInstalled && (
        <div
          className="fixed top-4 left-4 right-4 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-lg z-40 animate-slideDown"
          role="banner"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded">
                {isDesktop ? <Monitor size={20} className="text-white" /> : <Smartphone size={20} className="text-white" />}
              </div>
              <div>
                <p className="text-white font-heading uppercase tracking-wide text-sm">Install App</p>
                <p
                  className="text-gray-400 text-xs font-body cursor-pointer hover:underline"
                  onClick={handleInstallClick}
                >
                  {isDesktop ? 'Get the desktop app experience' : 'Get the full app experience'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-heading uppercase tracking-wide shadow-lg transition flex items-center gap-1 focus:outline-none"
                aria-label="Install app"
              >
                <Download size={14} /> Install
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-gray-400 hover:text-white p-1 transition focus:outline-none rounded"
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
      <div className="w-full max-w-sm bg-neutral-900 border-2 border-red-600 rounded-lg shadow-lg p-8 sm:p-10 text-center">
        <div className="flex flex-col items-center mb-10">
          <img
            src={logo}
            alt="KenTone logo"
            className="w-32 h-32 sm:w-36 sm:h-36 object-contain mb-4 drop-shadow-md"
          />
          <h1 className="text-white text-4xl sm:text-5xl font-heading uppercase tracking-wide">
            KenTone
          </h1>
          <div className="w-24 h-1 bg-red-600 mx-auto mt-4" />
        </div>

        {isInstalled && showInstalledMessage && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500 rounded-lg relative">
            <p className="text-green-500 text-sm font-body flex items-center justify-center gap-2">
              <span>✓</span> You're using the KenTone app
            </p>
            <button
              onClick={handleDismissInstalledMessage}
              className="absolute top-1 right-1 text-green-500 hover:text-green-400 p-1"
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Link to="/LoginPage" className="w-full" onClick={handleLoginClick}>
            <button className="w-full text-lg sm:text-xl font-heading uppercase tracking-wide text-white bg-red-600 hover:bg-red-700 py-3 rounded shadow-lg transition duration-200 focus:outline-none">
              Log In
            </button>
          </Link>
          <button
            onClick={handleCreateUserClick}
            className="w-full text-lg sm:text-xl font-heading uppercase tracking-wide text-white bg-red-600 hover:bg-red-700 py-3 rounded shadow-lg transition duration-200 focus:outline-none"
          >
            Create New User
          </button>
        </div>

        {shouldShowTip && (
          <p
            className="text-gray-500 text-xs font-body mt-4 cursor-pointer hover:underline"
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