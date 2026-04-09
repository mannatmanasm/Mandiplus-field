'use client';

import { useEffect, useMemo, useState } from 'react';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import {
  getQueuedRequestCount,
  subscribeToOfflineQueue,
  subscribeToOfflineSaved,
  syncOfflineQueue,
} from '@/features/pwa/offlineQueue';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIosDevice() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function PwaEnhancer() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showIosHint, setShowIosHint] = useState(
    () => isIosDevice() && !isStandaloneMode(),
  );
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.localStorage.getItem('mandiplus-pwa-install-dismissed') === '1'
    );
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // no-op
        });
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const refreshQueueState = async () => {
      try {
        const count = await getQueuedRequestCount();
        if (mounted) {
          setPendingSyncCount(count);
        }
      } catch {
        // no-op
      }
    };

    const runSync = async () => {
      if (!navigator.onLine) return;

      try {
        setIsSyncing(true);
        const result = await syncOfflineQueue();
        if (mounted) {
          setPendingSyncCount(result.remainingCount);
        }
      } catch {
        // no-op
      } finally {
        if (mounted) {
          setIsSyncing(false);
        }
      }
    };

    const handleOnline = async () => {
      setIsOnline(true);
      await runSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    refreshQueueState();
    if (navigator.onLine) {
      runSync();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsubscribe = subscribeToOfflineQueue(refreshQueueState);
    const unsubscribeOfflineSaved = subscribeToOfflineSaved(() => {
      setShowOfflineToast(true);
      window.setTimeout(() => {
        setShowOfflineToast(false);
      }, 2600);
    });

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      unsubscribeOfflineSaved();
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallEvent(null);
      setShowIosHint(false);
      window.localStorage.removeItem('mandiplus-pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const shouldShowPrompt = useMemo(() => {
    if (dismissed || isStandaloneMode()) return false;
    return Boolean(installEvent) || showIosHint;
  }, [dismissed, installEvent, showIosHint]);

  const dismissPrompt = () => {
    setDismissed(true);
    setShowIosHint(false);
    window.localStorage.setItem('mandiplus-pwa-install-dismissed', '1');
  };

  const handleInstall = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === 'accepted') {
        setInstallEvent(null);
        setDismissed(true);
      }
      return;
    }

    setShowIosHint(true);
  };

  if (!shouldShowPrompt) {
    if (isOnline && pendingSyncCount === 0) {
      return null;
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-20 z-50 flex flex-col items-center gap-3 sm:bottom-6">
      {showOfflineToast ? (
        <div className="pointer-events-auto w-full max-w-sm rounded-[1.2rem] border border-amber-200 bg-[#fff8ef] px-4 py-3 text-sm font-medium text-[#9a3412] shadow-[0_18px_40px_-26px_rgba(15,23,42,0.35)]">
          Saved offline. Will sync automatically.
        </div>
      ) : null}

      {!isOnline || pendingSyncCount > 0 ? (
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-[1.4rem] border border-[#eadfcf] bg-white/95 px-4 py-3 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-[#166534]" />
              ) : (
                <CloudOff className="h-4 w-4 text-[#b45309]" />
              )}
              {isOnline ? 'Sync ready' : 'Offline mode active'}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {!isOnline
                ? `Changes will be saved offline${pendingSyncCount ? ` (${pendingSyncCount} queued)` : ''}.`
                : pendingSyncCount > 0
                  ? `${pendingSyncCount} offline change${pendingSyncCount > 1 ? 's' : ''} waiting to sync.`
                  : 'All offline changes are synced.'}
            </p>
          </div>

          {isOnline && pendingSyncCount > 0 ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  setIsSyncing(true);
                  const result = await syncOfflineQueue();
                  setPendingSyncCount(result.remainingCount);
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#5b21b6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4c1d95] disabled:bg-slate-400"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing' : 'Sync now'}
            </button>
          ) : null}
        </div>
      ) : null}

      {shouldShowPrompt ? (
        <div className="pointer-events-auto max-w-sm rounded-[1.5rem] border border-[#eadfcf] bg-white/95 p-4 shadow-[0_24px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Install app</p>
              <p className="mt-1 text-sm text-slate-600">
                {showIosHint && !installEvent
                  ? 'On iPhone, tap Share and then Add to Home Screen.'
                  : 'Add MandiPlus Field to the home screen for faster access.'}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissPrompt}
              className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100"
            >
              X
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 rounded-full bg-[#5b21b6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4c1d95]"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismissPrompt}
              className="rounded-full border border-[#e7dcc7] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Later
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
