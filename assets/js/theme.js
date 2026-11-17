(() => {
  const isLocal = location.protocol === 'file:' ||
    ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
  const requestedTheme = new URLSearchParams(location.search).get('theme');
  const forcedTheme = isLocal && ['dark', 'light', 'white'].includes(requestedTheme)
    ? requestedTheme === 'dark' ? 'dark' : 'light'
    : null;
  const preference = matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = theme => {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      if (!meta.dataset.colorScheme) {
        meta.dataset.colorScheme = meta.media.includes('dark') ? 'dark' : 'light';
      }
      meta.media = meta.dataset.colorScheme === theme ? 'all' : 'not all';
    });
  };

  applyTheme(forcedTheme || (preference.matches ? 'dark' : 'light'));
  if (!forcedTheme) {
    const updateTheme = event => applyTheme(event.matches ? 'dark' : 'light');
    if (preference.addEventListener) preference.addEventListener('change', updateTheme);
    else preference.addListener(updateTheme);
  }

  if (forcedTheme) {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('a[href]').forEach(link => {
        const destination = new URL(link.href, location.href);
        if (destination.origin === location.origin && destination.protocol === location.protocol) {
          destination.searchParams.set('theme', forcedTheme);
          link.href = destination.href;
        }
      });
    });
  }
})();
