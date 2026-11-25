window.SiteNavigation = (() => {
  const siteConfiguration = window.SITE_CONFIG || {};
  const selectElement = selector => document.querySelector(selector);

  const configureContactLinks = () => {
    document.querySelectorAll('[data-ig]').forEach(link => {
      link.href = siteConfiguration.instagram;
      link.target = '_blank';
      link.rel = 'noopener';
    });

    document.querySelectorAll('[data-wa]').forEach(link => {
      link.href = `https://wa.me/${siteConfiguration.whatsapp}?text=${encodeURIComponent(link.dataset.wa)}`;
      link.target = '_blank';
      link.rel = 'noopener';
    });

    document.querySelectorAll('[data-mail]').forEach(link => {
      link.href = `mailto:${siteConfiguration.email}?subject=${encodeURIComponent(link.dataset.mail)}`;
    });

    document.querySelectorAll('[data-mail-text]').forEach(link => {
      link.textContent = siteConfiguration.email;
    });
  };

  const closeMenu = () => {
    const burgerButton = selectElement('#burger');
    const menuElement = selectElement('#menu');
    menuElement.hidden = true;
    burgerButton.setAttribute('aria-expanded', 'false');
  };

  const setupHamburgerMenu = () => {
    const burgerButton = selectElement('#burger');
    const menuElement = selectElement('#menu');

    if (!burgerButton || !menuElement) return;

    burgerButton.onclick = event => {
      event.stopPropagation();
      const shouldOpen = menuElement.hidden;
      menuElement.hidden = !shouldOpen;
      burgerButton.setAttribute('aria-expanded', String(shouldOpen));
    };

    document.addEventListener('click', event => {
      if (!menuElement.hidden && !menuElement.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });

    document.addEventListener('site-language-change', () => {
      if (!menuElement.hidden) closeMenu();
    });
  };

  return {
    init() {
      configureContactLinks();
      setupHamburgerMenu();
    },
  };
})();
