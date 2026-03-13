/**
 * AdBlockBanner Component
 * Detects the user's browser/OS and shows the right ad-blocking instructions.
 * Shows only once per session after the player is opened.
 */

import { useState, useEffect } from 'react';
import { FiX, FiShield } from 'react-icons/fi';

export default function AdBlockBanner() {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState('desktop'); // 'android-firefox' | 'android-chrome' | 'ios' | 'desktop'

  useEffect(() => {
    // Don't show if user already dismissed it
    if (sessionStorage.getItem('adblock_dismissed')) return;

    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isFirefox = /Firefox/i.test(ua);

    if (isAndroid && isFirefox) setDevice('android-firefox');
    else if (isAndroid) setDevice('android-chrome');
    else if (isIOS) setDevice('ios');
    else setDevice('desktop');

    // Small delay so it doesn't flash immediately
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('adblock_dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  const content = {
    'android-firefox': {
      icon: '🦊',
      title: 'Block ads on Firefox Android',
      steps: [
        'Open Firefox menu → Add-ons',
        'Search for "uBlock Origin"',
        'Tap Install — done!',
      ],
      cta: { label: 'Open Firefox Add-ons', url: 'https://addons.mozilla.org/en-US/android/addon/ublock-origin/' },
      note: 'Firefox is the only mobile browser that supports real ad blockers.',
    },
    'android-chrome': {
      icon: '📱',
      title: 'Switch to Firefox for ad-free watching',
      steps: [
        'Download Firefox for Android',
        'Open this site in Firefox',
        'Install uBlock Origin add-on',
      ],
      cta: { label: 'Get Firefox for Android', url: 'https://play.google.com/store/apps/details?id=org.mozilla.firefox' },
      note: 'Chrome on Android cannot block ads — Firefox can.',
    },
    'ios': {
      icon: '🍎',
      title: 'Block ads on iPhone/iPad',
      steps: [
        'Download "AdGuard" from the App Store',
        'Enable it in Settings → Safari → Content Blockers',
        'Or use Firefox Focus as your browser',
      ],
      cta: { label: 'Get AdGuard for iOS', url: 'https://apps.apple.com/app/adguard-adblock-privacy/id1047223162' },
      note: 'Safari with AdGuard blocks most ads site-wide.',
    },
    'desktop': {
      icon: '🖥️',
      title: 'Block ads for free',
      steps: [
        'Install uBlock Origin in your browser',
        'It blocks ads, popups, and trackers',
        'Works on Chrome, Firefox, Edge',
      ],
      cta: { label: 'Get uBlock Origin', url: 'https://ublockorigin.com/' },
      note: 'The most effective free ad blocker available.',
    },
  };

  const c = content[device];

  return (
    <div className="relative mt-4 rounded-xl border border-cinema-border bg-cinema-card px-4 py-4 animate-slide-up">
      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-cinema-muted hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <FiX size={16} />
      </button>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-cinema-dark flex items-center justify-center text-xl shrink-0">
          {c.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FiShield size={14} className="text-cinema-accent" />
            <p className="text-white text-sm font-medium">{c.title}</p>
          </div>

          {/* Steps */}
          <ol className="mt-2 space-y-1">
            {c.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-cinema-muted">
                <span className="w-4 h-4 rounded-full bg-cinema-border flex items-center justify-center text-white shrink-0 mt-0.5 text-[10px]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a
              href={c.cta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-cinema-accent hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
            >
              <FiShield size={12} />
              {c.cta.label}
            </a>
            <p className="text-cinema-muted text-xs">{c.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
