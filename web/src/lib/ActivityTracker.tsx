import { useEffect } from 'react';
import { apiMode } from './api';
import { activityApi } from './httpApi';

const HEARTBEAT_INTERVAL_MS = 60_000;
const IDLE_TIMEOUT_MS = 120_000;

export function ActivityTracker() {
  useEffect(() => {
    if (apiMode !== 'http') return;

    let lastActivityAt = Date.now();
    let failureReported = false;

    const markActive = () => {
      lastActivityAt = Date.now();
    };

    const recordActivity = (allowHidden = false, keepalive = false) => {
      if (!allowHidden && document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivityAt > IDLE_TIMEOUT_MS) return;

      void activityApi.heartbeat(keepalive).catch((error: unknown) => {
        if (!failureReported) {
          console.error('Impossible d’enregistrer l’activité de l’application.', error);
          failureReported = true;
        }
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markActive();
        recordActivity();
      } else {
        recordActivity(true, true);
      }
    };

    const onPageHide = () => recordActivity(true, true);
    const interval = window.setInterval(() => recordActivity(), HEARTBEAT_INTERVAL_MS);

    window.addEventListener('pointerdown', markActive, { passive: true });
    window.addEventListener('keydown', markActive);
    window.addEventListener('scroll', markActive, { passive: true });
    window.addEventListener('touchstart', markActive, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    recordActivity();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pointerdown', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('scroll', markActive);
      window.removeEventListener('touchstart', markActive);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      recordActivity(true, true);
    };
  }, []);

  return null;
}
