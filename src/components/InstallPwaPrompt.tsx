import React, { useState, useEffect } from 'react';
import './InstallPwaPrompt.css';

const InstallPwaPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  // Reverted to true FOR DEBUGGING PURPOSES so the user can see the status.
  const [isVisible, setIsVisible] = useState(true); 
  const [debugStatus, setDebugStatus] = useState("Debug mode active. Waiting for browser's install event...");

  useEffect(() => {
    console.log('InstallPwaPrompt: Adding beforeinstallprompt event listener.');
    const handleBeforeInstallPrompt = (event: Event) => {
      console.log('InstallPwaPrompt: beforeinstallprompt event captured!', event);
      event.preventDefault();
      setInstallPrompt(event);
      setDebugStatus("Install event received! Button is now active.");
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // A timeout to inform the user if the event doesn't fire
    const timer = setTimeout(() => {
        if (!installPrompt) {
            console.log("InstallPwaPrompt: 10 seconds elapsed and beforeinstallprompt has not fired.");
            setDebugStatus("Debug: After 10s, the browser has not sent the install event. The app might not meet PWA criteria on this URL.");
        }
    }, 10000);

    return () => {
      console.log('InstallPwaPrompt: Cleaning up beforeinstallprompt event listener.');
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [installPrompt]); // Re-run if installPrompt changes, though it shouldn't be necessary.

  const handleInstallClick = () => {
    console.log('InstallPwaPrompt: Install button clicked.');
    if (!installPrompt) {
      console.log('InstallPwaPrompt: installPrompt is null. Cannot show prompt.');
      return;
    }
    // Typescript doesn't know about the prompt() method on the event
    (installPrompt as any).prompt();

    (installPrompt as any).userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setDebugStatus("Install successful! You can close this now.");
      } else {
        console.log('User dismissed the install prompt');
        setDebugStatus("Install dismissed. You may need to clear browser data to see this again.");
      }
      setInstallPrompt(null);
      // Keep it visible for debugging to see the final status message
      // setIsVisible(false);
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
        
        {/* --- DEBUGGING UI --- */}
        <div style={{ border: '1px solid #ffc107', padding: '10px', marginTop: '10px', borderRadius: '8px', backgroundColor: '#fff3cd' }}>
            <p style={{ color: '#664d03', fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Debugging Status:</p>
            <p style={{ color: '#664d03', fontSize: '11px', margin: '0', whiteSpace: 'pre-wrap' }}>{debugStatus}</p>
        </div>
        {/* --- END DEBUGGING UI --- */}
        
        <div className="install-pwa-prompt-buttons">
          <button onClick={handleInstallClick} disabled={!installPrompt}>Install</button>
          <button onClick={handleDismissClick}>Later</button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwaPrompt;
