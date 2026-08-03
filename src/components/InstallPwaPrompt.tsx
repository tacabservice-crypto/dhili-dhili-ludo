import React, { useState, useEffect } from 'react';
import './InstallPwaPrompt.css';

const InstallPwaPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
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
      return;
    }
    (installPrompt as any).prompt();

    (installPrompt as any).userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
      setIsVisible(false);
    });
  };

  const handleDismissClick = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="install-pwa-prompt">
      <div className="install-pwa-prompt-content">
        <h3>Install App</h3>
        <p>Install this application on your phone or desktop for the best experience.</p>
        
        <div className="install-pwa-prompt-buttons">
          <button onClick={handleInstallClick} disabled={!installPrompt}>Install</button>
          <button onClick={handleDismissClick}>Later</button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaPrompt;
