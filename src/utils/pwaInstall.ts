import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

function detectIos(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

export function usePwaInstall() {
  const [canPrompt, setCanPrompt] = useState(() => deferredPrompt !== null);
  const [isInstalled, setIsInstalled] = useState(detectStandalone);
  const [isIos] = useState(detectIos);

  useEffect(() => {
    const sync = () => {
      setCanPrompt(deferredPrompt !== null);
      setIsInstalled(detectStandalone());
    };
    listeners.add(sync);

    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener('change', sync);

    return () => {
      listeners.delete(sync);
      mq.removeEventListener('change', sync);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      notifyListeners();
    }
    return outcome;
  }, []);

  return {
    isInstalled,
    canPrompt,
    isIos,
    promptInstall,
  };
}
