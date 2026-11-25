window.SiteInstallation = (() => {
  const siteRoot = new URL('../../', document.currentScript.src);
  const selectElement = selector => document.querySelector(selector);

  const setInstallTab = tabName => {
    document.querySelectorAll('[data-tab]').forEach(button => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.tab === tabName),
      );
    });

    document.querySelectorAll('[data-pane]').forEach(pane => {
      pane.hidden = pane.dataset.pane !== tabName;
    });
  };

  const setupInstallExperience = () => {
    if (selectElement('[data-tab]')) {
      document.querySelectorAll('[data-tab]').forEach(button => {
        button.onclick = () => setInstallTab(button.dataset.tab);
      });

      setInstallTab(
        /android/i.test(navigator.userAgent) ? 'android' : 'iphone',
      );
    }

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone
    ) {
      document
        .querySelectorAll('[data-install-link]')
        .forEach(link => link.remove());
    }
  };

  const setupInstallPrompt = () => {
    let installPromptEvent = null;
    const isMobileDevice =
      /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    const oneTapButton = selectElement('#one-tap');

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      installPromptEvent = event;
      if (oneTapButton && isMobileDevice) oneTapButton.hidden = false;
    });

    if (oneTapButton) {
      oneTapButton.onclick = async () => {
        if (!installPromptEvent) return;
        installPromptEvent.prompt();
        await installPromptEvent.userChoice;
        oneTapButton.hidden = true;
      };
    }
  };

  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(new URL('sw.js', siteRoot), {
        updateViaCache: 'none',
      });
    }
  };

  return {
    init() {
      setupInstallPrompt();
      setupInstallExperience();
      registerServiceWorker();
    },
  };
})();
