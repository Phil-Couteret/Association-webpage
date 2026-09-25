import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Extend Window interface for beforeinstallprompt
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Save the event for later use
      setDeferredPrompt(e);
      
      // Show our custom install prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Show after 5 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-br from-deep-purple to-electric-blue/90 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-electric-blue rounded-lg flex items-center justify-center">
            <Smartphone className="h-6 w-6 text-deep-purple" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              {t('pwa.install.title') || 'Install Elektr-Âme'}
            </h3>
            <p className="text-white/80 text-sm mb-3">
              {t('pwa.install.description') || 'Install our app for quick access to your membership card, events, and more!'}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                className="bg-white text-deep-purple hover:bg-white/90 flex items-center gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                {t('pwa.install.button') || 'Install'}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                size="sm"
              >
                {t('pwa.install.later') || 'Maybe Later'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/60 text-xs">
            ✨ {t('pwa.install.benefits') || 'Offline access • Faster loading • Home screen icon'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;

