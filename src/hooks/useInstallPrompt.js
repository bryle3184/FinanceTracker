// @ts-check
import { useEffect, useState } from 'react';

/**
 * PWA install prompt. Captures the `beforeinstallprompt` event, exposes
 * `canInstall` (false after install or when unsupported) and `install()`
 * which shows the deferred prompt. Returns `{ canInstall, install }`.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return { canInstall: Boolean(deferred), install };
}