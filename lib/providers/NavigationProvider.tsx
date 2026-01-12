'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, createContext, useContext } from 'react';

interface NavigationContextType {
  isNavigating: boolean;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
});

export function useNavigation() {
  return useContext(NavigationContext);
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Show loading state when navigation starts
    setIsNavigating(true);
    setProgress(20);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);

    // Hide loading state after a short delay to ensure smooth transition
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  return (
    <NavigationContext.Provider value={{ isNavigating }}>
      {/* Top Loading Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-blue-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content Overlay */}
      <div className={`transition-opacity duration-200 ${isNavigating ? 'opacity-50' : 'opacity-100'}`}>
        {children}
      </div>

      {/* Loading Spinner in Center */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
}
