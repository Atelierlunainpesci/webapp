const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scripts = ['navigation.js', 'gallery.js', 'install.js'].map(
  name => ({
    name,
    source: fs.readFileSync(
      path.join(__dirname, '..', 'assets', 'js', name),
      'utf8',
    ),
  }),
);
const i18nScript = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'js', 'i18n.js'),
  'utf8',
);

class FakeElement {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.attributes = {};
    this.children = [];
    this.classes = new Set();
    this.classList = {
      add: name => this.classes.add(name),
      remove: name => this.classes.delete(name),
      contains: name => this.classes.has(name),
    };
    this.hidden = false;
  }

  append(...children) {
    children.forEach(child => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  remove() {
    this.removed = true;
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(
        child => child !== this,
      );
    }
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  addEventListener(name, handler) {
    this.listeners ||= {};
    (this.listeners[name] ||= []).push(handler);
  }
}

class FakeImage extends FakeElement {
  set src(value) {
    this._src = value;
    queueMicrotask(() => {
      const localImage = new URL(value).pathname.startsWith('/foto/');
      const handler = localImage ? this.onload : this.onerror;
      if (handler) handler();
    });
  }

  get src() {
    return this._src;
  }
}

const createSite = ({ standalone = false, driveEnabled = false } = {}) => {
  const documentHandlers = {};
  const globalHandlers = {};
  const window = {
    SITE_CONFIG: driveEnabled
      ? { drive: { apiKey: 'test-key', folderId: 'root-folder' } }
      : {},
    addEventListener(name, handler) {
      (globalHandlers[name] ||= []).push(handler);
    },
    matchMedia: () => ({ matches: standalone }),
  };
  const burger = new FakeElement();
  const menu = new FakeElement();
  menu.hidden = true;
  menu.contains = () => false;
  const installLinks = [
    new FakeElement(),
    new FakeElement(),
  ];
  installLinks[0].href = 'view/installa.html';
  installLinks[1].href = 'installa.html';
  const createdElements = [];

  const document = {
    currentScript: { src: '' },
    querySelector(selector) {
      return {
        '#burger': burger,
        '#menu': menu,
        '#one-tap': null,
        '.lightbox': null,
        '[data-tab]': null,
      }[selector] || null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-install-link]') return installLinks;
      return [];
    },
    createElement() {
      const element = new FakeElement();
      createdElements.push(element);
      return element;
    },
    addEventListener(name, handler) {
      (documentHandlers[name] ||= []).push(handler);
    },
  };

  const fetchDrive = async url => {
    const query = new URL(url).searchParams.get('q');
    let files;

    if (query.includes("mimeType='application/vnd.google-apps.folder'")) {
      files = query.includes("'foto-folder'")
        ? [{ id: 'commissioni-folder', name: 'commissioni' }]
        : [{ id: 'foto-folder', name: 'foto' }];
    } else {
      files = [{
        id: 'drive-image',
        name: '1.jpeg',
        mimeType: 'image/jpeg',
        thumbnailLink: 'https://preview.test/image',
      }];
    }

    return { ok: true, json: async () => ({ files }) };
  };

  const context = vm.createContext({
    URL,
    URLSearchParams,
    Image: FakeImage,
    Promise,
    Date,
    JSON,
    RegExp,
    String,
    encodeURIComponent,
    queueMicrotask,
    setTimeout: () => 1,
    navigator: { userAgent: 'test', standalone: false },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    fetch: driveEnabled ? fetchDrive : undefined,
    document,
    window,
    I18N: {
      t: (key, values = {}) =>
        Object.keys(values).reduce(
          (message, name) =>
            message.replace(`{${name}}`, String(values[name])),
          key,
        ),
    },
    console: { warn() {} },
  });

  scripts.forEach(script => {
    document.currentScript.src = `https://site.test/assets/js/${script.name}`;
    vm.runInContext(script.source, context);
  });
  context.window.SiteNavigation.init();
  context.window.SiteGallery.init();
  context.window.SiteInstallation.init();

  return {
    api: context.window.SiteGallery,
    burger,
    createdElements,
    documentHandlers,
    globalHandlers,
    installLinks,
    menu,
  };
};

test('menu keeps its expanded state in sync and closes on language change', () => {
  const site = createSite();

  site.burger.onclick({ stopPropagation() {} });
  assert.equal(site.menu.hidden, false);
  assert.equal(site.burger.attributes['aria-expanded'], 'true');

  site.documentHandlers['site-language-change'][0]();
  assert.equal(site.menu.hidden, true);
  assert.equal(site.burger.attributes['aria-expanded'], 'false');
});

test('standalone mode removes install links independent of their relative href', () => {
  const site = createSite({ standalone: true });

  assert.ok(site.installLinks.every(link => link.removed));
});

test('gallery uses lazy local images when every Drive preview fails', async () => {
  const site = createSite({ driveEnabled: true });
  const gallery = new FakeElement({ gallery: 'commissions' });

  await site.api.loadGallery(gallery);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(gallery.children.length, 12);
  assert.equal(gallery.classList.contains('carica'), false);
  assert.ok(
    gallery.children.every(button => {
      const image = button.children[0];
      return image.loading === 'lazy' &&
        new URL(image.src).pathname.startsWith('/foto/commissioni/');
    }),
  );
});

test('language toggle displays the destination flag and accessible label', () => {
  const languageButton = new FakeElement();
  const document = {
    documentElement: { lang: '' },
    querySelector(selector) {
      return selector === '#language-toggle' ? languageButton : null;
    },
    querySelectorAll() {
      return [];
    },
    dispatchEvent() {},
  };
  const context = vm.createContext({
    CustomEvent: class {},
    document,
    localStorage: {
      getItem: () => null,
      setItem() {},
    },
    window: {},
    console: { warn() {} },
    URL,
    JSON,
    RegExp,
    String,
  });

  vm.runInContext(i18nScript, context);
  assert.equal(languageButton.textContent, '🇬🇧');
  assert.equal(languageButton.attributes['aria-label'], 'Passa all’inglese');

  languageButton.listeners.click[0]();
  assert.equal(languageButton.textContent, '🇮🇹');
  assert.equal(languageButton.attributes['aria-label'], 'Switch language to Italian');
});
