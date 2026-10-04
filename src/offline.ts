// PR-63: the page side of the offline service worker (src/service-worker.js, built by
// src/precache.ts). SheetLayout calls it in production builds only.
import { SERVICE_WORKER_PATH } from './config';

/** Registers the worker once the page has loaded, so its install never competes with the page. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  const register = () => {
    // No worker (private mode, blocked storage) only means no offline copy: the site still works.
    navigator.serviceWorker.register(SERVICE_WORKER_PATH).catch(() => undefined);
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
