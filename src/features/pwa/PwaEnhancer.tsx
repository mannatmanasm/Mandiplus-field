'use client';

import { useEffect, useMemo, useState } from 'react';

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
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-20 z-50 flex justify-center sm:bottom-6">
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
    </div>
  );
}
