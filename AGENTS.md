# Project Architecture Rules

- Initialize translations with a stable server/client default, then apply browser language preferences after hydration; browser-dependent widgets and the localized sign-in page render client-only to prevent SSR hydration mismatches.