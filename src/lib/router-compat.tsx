/**
 * Compatibility shim: react-router-dom API surface backed by TanStack Router.
 * Lets pages migrated from the SPA stack keep using Link/useNavigate/etc.
 */
import { forwardRef, useCallback, useMemo } from "react";
import {
  Link as TSLink,
  useNavigate as useTSNavigate,
  useRouterState,
} from "@tanstack/react-router";

type To = string | { pathname?: string; search?: string; hash?: string };

function toPath(to: To): string {
  if (typeof to === "string") return to;
  return `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
}

export const Link = forwardRef<HTMLAnchorElement, any>(function Link(
  { to, replace, state, ...rest },
  ref,
) {
  return <TSLink ref={ref} to={toPath(to) as any} replace={replace} {...rest} />;
});

export const NavLink = forwardRef<HTMLAnchorElement, any>(function NavLink(
  { to, className, children, end, ...rest },
  ref,
) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const target = toPath(to);
  const isActive = end ? pathname === target : pathname.startsWith(target);
  const args = { isActive, isPending: false, isTransitioning: false };
  return (
    <TSLink
      ref={ref}
      to={target as any}
      className={typeof className === "function" ? className(args) : className}
      {...rest}
    >
      {typeof children === "function" ? children(args) : children}
    </TSLink>
  );
});

export type NavLinkProps = any;

export function useNavigate() {
  const navigate = useTSNavigate();
  return useCallback(
    (to: To | number, options?: { replace?: boolean; state?: unknown }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      navigate({ to: toPath(to) as any, replace: options?.replace ?? false });
    },
    [navigate],
  );
}

export function useLocation() {
  return useRouterState({ select: (s) => s.location });
}

export function useParams<T = Record<string, string>>(): T {
  return useRouterState({ select: (s) => s.matches.at(-1)?.params ?? {} }) as T;
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>) => void] {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const navigate = useTSNavigate();
  const params = useMemo(() => new URLSearchParams(searchStr), [searchStr]);
  const setParams = useCallback(
    (next: URLSearchParams | Record<string, string>) => {
      const usp = next instanceof URLSearchParams ? next : new URLSearchParams(next);
      const qs = usp.toString();
      navigate({ to: `${window.location.pathname}${qs ? `?${qs}` : ""}` as any, replace: true });
    },
    [navigate],
  );
  return [params, setParams];
}

export function Navigate({ to, replace = true }: { to: To; replace?: boolean }) {
  const navigate = useTSNavigate();
  const target = toPath(to);
  useMemo(() => {
    void navigate({ to: target as any, replace });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return null;
}
