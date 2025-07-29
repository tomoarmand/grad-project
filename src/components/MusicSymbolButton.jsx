import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMusic, FaTimes } from 'react-icons/fa';

const symbols = [
  { symbol: '♯', name: 'Sharp', useBravura: false, mobileSymbol: '♯' },
  { symbol: '♭', name: 'Flat', useBravura: false, mobileSymbol: '♭' },
  { symbol: '♮', name: 'Natural', useBravura: false, mobileSymbol: '♮' },
  // { symbol: '𝅝', name: 'Whole Note', useBravura: false, mobileSymbol: 'o' },
  // { symbol: '𝅗𝅥', name: 'Half Note', useBravura: false, mobileSymbol: '1/2' },
  // { symbol: '𝅘𝅥', name: 'Quarter Note', useBravura: false, mobileSymbol: '♩' },
  // { symbol: '𝅘𝅥𝅮', name: 'Eighth Note', useBravura: false, mobileSymbol: '♪' },
  // { symbol: '𝅘𝅥𝅯', name: 'Sixteenth Note', useBravura: false, mobileSymbol: '♬' },
  // { symbol: '𝄺', name: 'Fortissimo', useBravura: false, mobileSymbol: 'ff' },
  // { symbol: '𝄻', name: 'Pianissimo', useBravura: false, mobileSymbol: 'pp' },
  // { symbol: '𝄼', name: 'Sforzando', useBravura: false, mobileSymbol: 'sf' },
  // { symbol: '𝄽', name: 'Rinforzando', useBravura: false, mobileSymbol: 'rf' },
  // { symbol: '𝄾', name: 'Fp', useBravura: false, mobileSymbol: 'fp' },
  // { symbol: '𝄿', name: 'Sfp', useBravura: false, mobileSymbol: 'sfp' },
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

    // Test if Bravura font is available (temporary debug)
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
      const currentValue = inputRef.current.value; // Fixed typo here
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

// const symbols = [
//   { symbol: '♯', name: 'Sharp' },
//   { symbol: '♭', name: 'Flat' },
//   { symbol: '♮', name: 'Natural' },
//   { symbol: '𝅝', name: 'Whole Note' },
//   { symbol: '𝅗𝅥', name: 'Half Note' },
//   { symbol: '𝅘𝅥', name: 'Quarter Note' },
//   { symbol: '𝅘𝅥𝅮', name: 'Eighth Note' },
//   { symbol: '𝅘𝅥𝅯', name: 'Sixteenth Note' },
//   { symbol: '𝄞', name: 'Treble Clef' },
//   { symbol: '𝄢', name: 'Bass Clef' },
//   { symbol: '𝄡', name: 'C Clef' },
//   { symbol: '𝄪', name: 'Double Sharp' },
//   { symbol: '𝄫', name: 'Double Flat' },
//   { symbol: '𝄴', name: 'Common Time' },
//   { symbol: '𝄵', name: 'Cut Time' },
//   { symbol: '𝄶', name: 'Forte' },
//   { symbol: '𝄷', name: 'Piano' },
//   { symbol: '𝄸', name: 'Mezzo-forte' },
//   { symbol: '𝄹', name: 'Mezzo-piano' },
//   { symbol: '𝄺', name: 'Fortissimo' },
//   { symbol: '𝄻', name: 'Pianissimo' },
//   { symbol: '𝄼', name: 'Sforzando' },
//   { symbol: '𝄽', name: 'Rinforzando' },
//   { symbol: '𝄾', name: 'Fp' },
//   { symbol: '𝄿', name: 'Sfp' },
// ];


// import { useState } from 'react';

// function MusicSymbolFAB({ onInsert }) {
//   const [isOpen, setIsOpen] = useState(false);

//   const symbols = [
//     { symbol: '♪', name: 'Eighth Note' },
//     { symbol: '♫', name: 'Beamed Eighth Notes' },
//     { symbol: '♬', name: 'Beamed Sixteenth Notes' },
//     { symbol: '♭', name: 'Flat' },
//     { symbol: '♮', name: 'Natural' },
//     { symbol: '♯', name: 'Sharp' },
//     { symbol: '𝄞', name: 'Treble Clef' },
//     { symbol: '𝄢', name: 'Bass Clef' },
//     { symbol: '𝄡', name: 'C Clef' },
//     { symbol: '𝄪', name: 'Double Sharp' },
//     { symbol: '𝄫', name: 'Double Flat' },
//     { symbol: '𝄴', name: 'Common Time' },
//     { symbol: '𝄵', name: 'Cut Time' },
//     { symbol: '𝄶', name: 'Forte' },
//     { symbol: '𝄷', name: 'Piano' },
//     { symbol: '𝄸', name: 'Mezzo-forte' },
//     { symbol: '𝄹', name: 'Mezzo-piano' },
//     { symbol: '𝄺', name: 'Fortissimo' },
//     { symbol: '𝄻', name: 'Pianissimo' },
//     { symbol: '𝄼', name: 'Sforzando' },
//     { symbol: '𝄽', name: 'Rinforzando' },
//     { symbol: '𝄾', name: 'Fp' },
//     { symbol: '𝄿', name: 'Sfp' },
//   ];

//   const handleInsert = (symbol) => {
//     onInsert(symbol);
//     setIsOpen(false);
//   };

//   return (
//     <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" data-fab>
//       {isOpen && (
//         <div className="mb-4 bg-white rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto w-72" data-fab>
//           <h3 className="text-lg font-semibold text-gray-800 mb-3">Music Symbols</h3>
//           <div className="grid grid-cols-4 gap-2">
//             {symbols.map((item, index) => (
//               <button
//                 key={index}
//                 onClick={() => handleInsert(item.symbol)}
//                 className="p-3 text-2xl hover:bg-gray-100 rounded-md transition-colors duration-200 flex items-center justify-center"
//                 title={item.name}
//                 data-fab
//               >
//                 {item.symbol}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
      
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="w-14 h-14 bg-orange-400 hover:bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-bold transition-colors duration-200"
//         aria-label="Music symbols"
//         data-fab
//       >
//         ♪
//       </button>
//     </div>
//   );
// }

// export default MusicSymbolFAB;