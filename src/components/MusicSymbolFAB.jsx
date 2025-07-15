import { useState, useEffect, useRef } from 'react';

function MusicSymbolFAB({ onInsert }) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const containerRef = useRef(null);

  const symbols = [
    { symbol: '♯', name: 'Sharp' },
    { symbol: '♭', name: 'Flat' },
    { symbol: '♮', name: 'Natural' },
    { symbol: '𝅝', name: 'Whole Note' },
    { symbol: '𝅗𝅥', name: 'Half Note' },
    { symbol: '𝅘𝅥', name: 'Quarter Note' },
    { symbol: '𝅘𝅥𝅮', name: 'Eighth Note' },
    { symbol: '𝅘𝅥𝅯', name: 'Sixteenth Note' },
    { symbol: '𝄞', name: 'Treble Clef' },
    { symbol: '𝄢', name: 'Bass Clef' },
    { symbol: '𝄡', name: 'C Clef' },
    { symbol: '𝄪', name: 'Double Sharp' },
    { symbol: '𝄫', name: 'Double Flat' },
    { symbol: '𝄴', name: 'Common Time' },
    { symbol: '𝄵', name: 'Cut Time' },
    { symbol: '𝄶', name: 'Forte' },
    { symbol: '𝄷', name: 'Piano' },
    { symbol: '𝄸', name: 'Mezzo-forte' },
    { symbol: '𝄹', name: 'Mezzo-piano' },
    { symbol: '𝄺', name: 'Fortissimo' },
    { symbol: '𝄻', name: 'Pianissimo' },
    { symbol: '𝄼', name: 'Sforzando' },
    { symbol: '𝄽', name: 'Rinforzando' },
    { symbol: '𝄾', name: 'Fp' },
    { symbol: '𝄿', name: 'Sfp' },
  ];

  // Track keyboard visibility and height
  useEffect(() => {
    let timeoutId;
    
    const handleResize = () => {
      // Clear any pending timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Add a small delay to account for toolbar appearing after keyboard
      timeoutId = setTimeout(() => {
        // Only run on mobile devices
        if (window.innerWidth <= 768) {
          const initialHeight = window.screen.height;
          const currentHeight = window.innerHeight;
          const heightDifference = initialHeight - currentHeight;
          
          // If height difference is significant, keyboard is likely open
          if (heightDifference > 150) {
            // Add extra padding for mobile keyboard toolbar (typically 40-50px)
            const toolbarPadding = 60; // Adjust this value if needed
            setKeyboardHeight(heightDifference + toolbarPadding);
          } else {
            setKeyboardHeight(0);
          }
        } else {
          setKeyboardHeight(0);
        }
      }, 300); // 300ms delay to account for toolbar animation
    };

    // Initial check
    handleResize();
    
    // Listen for viewport changes
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Visual viewport API for better keyboard detection (if supported)
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport;
      const handleViewportChange = () => {
        // Clear any pending timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        // Add delay for toolbar
        timeoutId = setTimeout(() => {
          const keyboardOpen = visualViewport.height < window.innerHeight;
          if (keyboardOpen) {
            const keyboardHeight = window.innerHeight - visualViewport.height;
            // Add extra padding for toolbar
            const toolbarPadding = 85;
            setKeyboardHeight(keyboardHeight + toolbarPadding);
          } else {
            setKeyboardHeight(0);
          }
        }, 300);
      };
      
      visualViewport.addEventListener('resize', handleViewportChange);
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        visualViewport.removeEventListener('resize', handleViewportChange);
      };
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInsert = (symbol) => {
    onInsert(symbol);
    setIsOpen(false);
  };

  // Calculate dynamic bottom position
  const bottomPosition = keyboardHeight > 0 ? keyboardHeight + 24 : 24; // 24px = 1.5rem

  return (
    <div 
      ref={containerRef} 
      className="fixed right-6 z-50 transition-all duration-300 ease-out" 
      style={{ bottom: `${bottomPosition}px` }}
      data-fab
    >
      {/* Backdrop for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 -z-10 md:hidden" data-fab />
      )}
      
      {/* Symbol menu */}
      {isOpen && (
        <div 
          className="absolute right-0 bg-white rounded-lg shadow-2xl border border-gray-200 transform transition-all duration-200 ease-out" 
          style={{ 
            bottom: '70px', // Always position above the FAB
            maxHeight: keyboardHeight > 0 ? '200px' : '320px' // Reduce height when keyboard is open
          }}
          data-fab
        >
          {/* Arrow pointing to FAB */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" data-fab></div>
          
          <div className="p-4 w-80 max-w-[calc(100vw-3rem)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Music Symbols</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
                data-fab
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: keyboardHeight > 0 ? '140px' : '280px' }}>
              <div className="grid grid-cols-6 gap-1">
                {symbols.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleInsert(item.symbol)}
                    className="p-3 text-xl hover:bg-gray-100 rounded-md transition-colors duration-150 flex items-center justify-center group relative"
                    title={item.name}
                    data-fab
                  >
                    <span className="select-none">{item.symbol}</span>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {item.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-orange-400 hover:bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
          isOpen ? 'rotate-45 scale-105' : 'hover:scale-110'
        }`}
        aria-label="Music symbols"
        aria-expanded={isOpen}
        data-fab
      >
        {isOpen ? '×' : '♪'}
      </button>
      

    </div>
  );
}

export default MusicSymbolFAB;


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