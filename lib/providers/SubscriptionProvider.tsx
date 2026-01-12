'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Subscription {
  status: string;
  daysRemaining: number | null;
  currentPeriodEnd: string;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: true,
  refetch: async () => {},
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/billing/subscription');
      const data = await res.json();
      if (data.hasSubscription) {
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        refetch: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}
