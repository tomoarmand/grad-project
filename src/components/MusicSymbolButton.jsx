import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMusic, FaTimes } from 'react-icons/fa';

const symbols = [
  { symbol: '♯', name: 'Sharp', useBravura: false, mobileSymbol: '♯' },
  { symbol: '♭', name: 'Flat', useBravura: false, mobileSymbol: '♭' },
  { symbol: '♮', name: 'Natural', useBravura: false, mobileSymbol: '♮' },
];

export default function MusicSymbolButton({ onInsert, inputRef, setterFunction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();

    // Check Bravura font availability for proper symbol rendering
    const testDiv = document.createElement('div');
    testDiv.style.fontFamily = 'Bravura';
    testDiv.innerHTML = '𝅝';
    testDiv.style.position = 'absolute';
    testDiv.style.visibility = 'hidden';
    document.body.appendChild(testDiv);
    console.log('Bravura font test - Font width:', testDiv.offsetWidth);
    console.log('Is mobile detected:', /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    document.body.removeChild(testDiv);
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleSymbolInsertion = (symbol) => {
    if (inputRef && inputRef.current) {
      const cursorPos = inputRef.current.selectionStart;
      const currentValue = inputRef.current.value;
      const newValue = currentValue.slice(0, cursorPos) + symbol + currentValue.slice(cursorPos);
      setterFunction(newValue);
      setTimeout(() => {
        inputRef.current.setSelectionRange(cursorPos + symbol.length, cursorPos + symbol.length);
        inputRef.current.focus();
      }, 0);
    }
  };

  return (
    <div ref={containerRef} className="relative z-40" data-fab>
      <button
        className="w-12 h-12 flex items-center justify-center bg-orange-400 hover:bg-orange-500 text-white rounded transition duration-300 focus:outline-none z-50 relative"
        onClick={toggleMenu}
        onMouseDown={(e) => e.preventDefault()}
      >
        <motion.div
          key={menuOpen ? 'times' : 'music'}
          initial={{ rotate: menuOpen ? -90 : 90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: menuOpen ? 90 : -90, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {menuOpen ? <FaTimes size={20} /> : <FaMusic size={20} />}
        </motion.div>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              className="fixed inset-0 bg-gray-900 bg-opacity-60 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu */}
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-4 right-0 bg-white text-black rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto w-72 z-40"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Music Symbols</h3>
              <div className="grid grid-cols-4 gap-2">
                {symbols.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      handleSymbolInsertion(item.symbol);
                      setSelectedSymbol(item.symbol);
                      setMenuOpen(false);
                    }}
                    data-fab
                    title={item.name}
                    className={`p-3 text-2xl hover:bg-gray-100 rounded-md transition ${
                      selectedSymbol === item.symbol ? 'border-2 border-white bg-gray-200' : ''
                    } ${item.useBravura && !isMobile ? 'font-bravura' : ''}`}
                  >
                    {isMobile && item.mobileSymbol ? item.mobileSymbol : item.symbol}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}