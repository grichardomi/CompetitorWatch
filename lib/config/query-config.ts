/**
 * React Query Configuration Guide
 * Different data types need different staleness/refetch strategies
 */

// CRITICAL DATA (Alerts, New Competitor Results)
export const CRITICAL_QUERY_CONFIG = {
  staleTime: 10 * 1000,        // Fresh for 10 seconds
  refetchInterval: 15 * 1000,  // Poll every 15 seconds
  refetchOnWindowFocus: true,  // Refetch when tab regains focus
  refetchOnReconnect: true,    // Refetch on network reconnect
};

// DYNAMIC DATA (Competitors List, Dashboard Stats)
export const DYNAMIC_QUERY_CONFIG = {
  staleTime: 2 * 60 * 1000,    // Fresh for 2 minutes (balance between freshness and efficiency)
  refetchInterval: 3 * 60 * 1000,  // Poll every 3 minutes (crawls don't happen that often)
  refetchOnWindowFocus: true,   // Still refetch on focus (but respects staleTime)
  refetchOnReconnect: true,
};

// SEMI-STATIC DATA (Business Info, User Profile)
export const STATIC_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,    // Fresh for 5 minutes
  refetchInterval: false as const,  // No polling - data rarely changes
  refetchOnWindowFocus: false,  // Don't refetch on focus - data is stable
  refetchOnReconnect: true,     // Only refetch if network was disconnected
} as const;

// STATIC DATA (Industry Metadata, Plans)
export const CACHED_QUERY_CONFIG = {
  staleTime: Infinity,         // Never stale (manual invalidation only)
  refetchInterval: false as const,  // No polling
  refetchOnWindowFocus: false,  // Don't refetch on focus
  refetchOnReconnect: false,   // Don't refetch on reconnect
} as const;

/**
 * Example Usage:
 *
 * export function useCompetitors() {
 *   return useQuery({
 *     queryKey: competitorKeys.list(),
 *     queryFn: fetchCompetitors,
 *     ...DYNAMIC_QUERY_CONFIG, // ← Apply config
 *   });
 * }
 */
