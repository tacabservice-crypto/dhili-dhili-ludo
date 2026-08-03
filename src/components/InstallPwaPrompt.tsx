import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const InstallPwaPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      alert("Installation is not available on this browser or has already been installed.");
      return
    }
    installPrompt.prompt();

    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const handleDismissClick = () => {
    setIsVisible(false);
    // Optionally, you can store this preference in localStorage
    // to not show the prompt again for some time.
  };

  if (!installPrompt || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl w-full max-w-sm p-4 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600/20 border border-blue-500/30 p-2 rounded-xl text-blue-400">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-white">Ku Rakibo App-ka (Install App)</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Si aad u hesho khibrad fiican, ku rakibo app-kan taleefankaaga ama kombiyuutarkaaga.
            </p>
            <button
              onClick={handleInstallClick}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-lg transition-all active:scale-95"
            >
              Hadda Rakib (Install Now)
            </button>
          </div>
          <button onClick={handleDismissClick} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaPrompt;
