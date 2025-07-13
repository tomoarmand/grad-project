import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useFABStore = create((set) => ({
    insertSymbol: () => {},
    setInsertSymbol: (fn) => set({ insertSymbol: fn }),
    isVisible: false,
    showFAB: () => set({ isVisible: true }),
    hideFAB: () => set({ isVisible: false }),
  }));
  
  export default useFABStore;