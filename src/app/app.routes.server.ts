import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // '' redirects to 'feed' (the app's default/landing page) — rendered
  // client-side for the same reason 'feed' itself is: it calls real APIs
  // (and, for feed specifically, touches browser-only IntersectionObserver)
  // that don't exist at build/SSR time.
  { path: '', renderMode: RenderMode.Client },
  // Public pages that fetch real data — no session is needed to view them,
  // but prerendering would still bake in build-time API responses (or fail
  // outright, with no API reachable at build time). Render these client-side.
  { path: 'feed', renderMode: RenderMode.Client },
  { path: 'journal', renderMode: RenderMode.Client },
  { path: 'post/:id', renderMode: RenderMode.Client },
  // Signed-in pages show personalized content and sit behind authGuard/
  // adminGuard, which see no session at build/SSR time — prerendering (or
  // even SSR) them would bake in a logged-out redirect. Render these
  // client-side only.
  { path: 'compose', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'members', renderMode: RenderMode.Client },
  { path: 'messages', renderMode: RenderMode.Client },
  { path: 'insights', renderMode: RenderMode.Client },
  { path: 'pending-approval', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
