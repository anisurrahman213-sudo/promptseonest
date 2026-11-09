# Project Architecture Rules

- Initialize translations with a stable server/client default, then apply browser language preferences after hydration; browser-dependent global widgets render client-only to prevent SSR hydration mismatches.