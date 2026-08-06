import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // defaultOptions ported from the pre-migration src/App.tsx QueryClient
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Aggressive caching for maximum speed
        staleTime: 1000 * 60 * 10, // 10 minutes - serve cached instantly
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        refetchOnWindowFocus: false, // Don't refetch when tab regains focus
        refetchOnReconnect: "always",
        refetchOnMount: false, // Use cache if available
        retry: (failureCount: number) => {
          if (typeof navigator !== "undefined" && !navigator.onLine) return false;
          return failureCount < 2; // Reduced retries for faster failure
        },
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
