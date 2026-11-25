const selectElement = selector => document.querySelector(selector);
const siteConfiguration = window.SITE_CONFIG || {};
const siteRoot = new URL('../../', document.currentScript.src);
const driveConfiguration =
  siteConfiguration.drive &&
  siteConfiguration.drive.apiKey &&
  siteConfiguration.drive.folderId
    ? siteConfiguration.drive
    : null;

// Apply localized Instagram, WhatsApp, and email links.
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

// Reject a pending operation after the requested timeout.
const withTimeout = (promise, timeoutMilliseconds) =>
  Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMilliseconds);
    }),
  ]);

// Fetch every page of Drive files matching a query.
async function fetchDriveFiles(query, fields = 'files(id,name)') {
  if (!driveConfiguration) return [];

  const driveFiles = [];
  let pageToken = '';

  do {
    const queryParameters = new URLSearchParams({
      q: query,
      fields: `nextPageToken,${fields}`,
      pageSize: '1000',
      key: driveConfiguration.apiKey,
    });

    if (pageToken) queryParameters.set('pageToken', pageToken);

    // Fetch Drive files with a 6-second timeout.
    const driveResponse = await withTimeout(
      fetch(`https://www.googleapis.com/drive/v3/files?${queryParameters}`, {
        referrerPolicy: 'no-referrer-when-downgrade',
      }),
      6000,
    );

    if (!driveResponse.ok) {
      let errorMessage = '';
      try {
        errorMessage = (await driveResponse.json()).error.message;
      } catch (error) {
        console.warn('[Drive] Unable to parse the API error response.', error);
      }

      throw new Error(
        I18N.t('errors.driveRequestFailed', {
          status: driveResponse.status,
          message: errorMessage,
        }),
      );
    }

    const driveData = await driveResponse.json();
    driveFiles.push(...(driveData.files || []));
    pageToken = driveData.nextPageToken || '';
  } while (pageToken);

  return driveFiles;
}

// Normalize a folder name for reliable matching.
const normalizeName = name => String(name).trim().toLowerCase();

const galleryDriveFolderNames = {
  home: ['home'],
  commissions: ['commissioni'],
  portraits: ['ritrattini'],
  editorials: ['editoriali', 'illustrazioni'],
};
const localGalleryFolderNames = {
  commissions: 'commissioni',
  portraits: 'ritrattini',
  editorials: 'editoriali',
};

// Fetch all folders directly inside a parent folder.
const fetchSubfolders = parentFolderId =>
  fetchDriveFiles(
    `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );

// Find a folder by exact name or a case-insensitive name prefix.
const findFolder = (folderList, possibleNames) =>
  (
    folderList.find(folder => possibleNames.includes(normalizeName(folder.name))) ||
    folderList.find(folder =>
      possibleNames.some(name => normalizeName(folder.name).startsWith(name)),
    ) ||
    {}
  ).id;

// Fetch and cache Drive photos for a gallery section.
async function fetchDrivePhotos(sectionName) {
  const cacheKey = `luna-drive-${sectionName}`;
  let cachedData = null;

  try {
    cachedData = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
  } catch (error) {
    console.warn('[Drive] Unable to read the session cache.', error);
  }

  if (cachedData && Date.now() - cachedData.timestamp < 30000) {
    return cachedData.files;
  }

  const subfolders = await fetchSubfolders(driveConfiguration.folderId);
  const photoRootId =
    findFolder(subfolders, ['foto']) || driveConfiguration.folderId;
  const sectionFolderId =
    photoRootId === driveConfiguration.folderId
      ? findFolder(
          subfolders,
          galleryDriveFolderNames[sectionName] || [sectionName],
        )
      : findFolder(
          await fetchSubfolders(photoRootId),
          galleryDriveFolderNames[sectionName] || [sectionName],
        );

  if (!sectionFolderId) {
    throw new Error(
      I18N.t('errors.driveFolderNotFound', { name: sectionName }),
    );
  }

  const files = (
    await fetchDriveFiles(
      `'${sectionFolderId}' in parents and trashed=false`,
      'files(id,name,mimeType,thumbnailLink)',
    )
  )
    .filter(file => file.mimeType && file.mimeType.startsWith('image/'))
    .sort((firstFile, secondFile) =>
      firstFile.name.localeCompare(secondFile.name, undefined, { numeric: true }),
    );

  if (files.length) {
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ timestamp: Date.now(), files }),
      );
    } catch (error) {
      console.warn('[Drive] Unable to write the session cache.', error);
    }
  }

  return files;
}

// Build all supported image URLs for a Drive file.
const buildDriveImageUrls = (driveFile, width) => [
  driveFile.thumbnailLink &&
    driveFile.thumbnailLink.replace(/=s\d+.*$/, `=w${width}`),
  `https://lh3.googleusercontent.com/d/${driveFile.id}=w${width}`,
  `https://drive.google.com/thumbnail?id=${driveFile.id}&sz=w${width}`,
].filter(Boolean);

// Try image sources in sequence and report when every source fails.
const tryImageSources = (imageElement, sourceList, onFailure) => {
  let sourceIndex = 0;
  imageElement.referrerPolicy = 'no-referrer';
  imageElement.onerror = () => {
    if (++sourceIndex < sourceList.length) {
      imageElement.src = sourceList[sourceIndex];
    } else {
      onFailure();
    }
  };
  imageElement.src = sourceList[0];
};

// Load the home photo from Drive, then fall back to a local photo or placeholder.
const loadHomePhoto = () => {
  document.querySelectorAll('.foto[data-photo]').forEach(async photoElement => {
    const photoBox = photoElement.closest('.fotobox');
    const localPhotoUrls = [
      'jpeg',
      'jpg',
      'png',
      'webp',
      'JPG',
      'JPEG',
      'svg',
    ].map(extension =>
      new URL(`foto/home/${photoElement.dataset.foto}.${extension}`, siteRoot).href,
    );

    let imageSources = localPhotoUrls;
    if (driveConfiguration) {
      try {
        const homeFiles = await fetchDrivePhotos('home');
        const matchingFile =
          homeFiles.find(file =>
            file.name
              .toLowerCase()
              .startsWith(photoElement.dataset.foto),
          ) || homeFiles[0];

        if (matchingFile) {
          imageSources = [
            ...buildDriveImageUrls(matchingFile, 1400),
            ...localPhotoUrls,
          ];
        }
      } catch (error) {
        console.warn('[Drive]', error.message);
      }
    }

    photoElement.onload = () => photoBox.classList.add('ok');
    tryImageSources(photoElement, imageSources, () =>
      photoBox.classList.add('ko'),
    );
  });
};

// Close the hamburger menu and update its accessibility state.
const closeMenu = () => {
  const burgerButton = selectElement('#burger');
  const menuElement = selectElement('#menu');
  menuElement.hidden = true;
  burgerButton.setAttribute('aria-expanded', 'false');
};

// Set up hamburger menu opening, closing, and keyboard behavior.
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

// Load one gallery from Drive or from its local fallback images.
const loadGallery = async galleryElement => {
  const sectionName = galleryElement.dataset.gallery;
  const localFolderName = localGalleryFolderNames[sectionName] || sectionName;
  const maximumPhotos = 12;
  const captionKey = galleryElement.dataset.caption;
  let localFallbackAdded = false;

  const createGalleryItem = imageNumber => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery-image-button';
    button.dataset.lightbox = '';
    const imageElement = new Image();
    const imageCaptionKey = captionKey || 'gallery.work';
    const imageCaption = I18N.t(imageCaptionKey, { number: imageNumber });
    imageElement.dataset.captionKey = imageCaptionKey;
    imageElement.dataset.captionNumber = imageNumber;
    imageElement.alt = imageCaption;
    imageElement.decoding = 'async';
    imageElement.loading = 'lazy';
    button.setAttribute('aria-label', imageCaption);
    button.append(imageElement);

    if (!captionKey) return { container: button, image: imageElement };

    const figure = document.createElement('figure');
    const captionElement = document.createElement('figcaption');
    captionElement.textContent = imageCaption;
    figure.append(button, captionElement);
    return { container: figure, image: imageElement };
  };

  const addLocalGallery = () => {
    if (localFallbackAdded) return;
    localFallbackAdded = true;
    galleryElement.classList.remove('carica');
    for (let imageNumber = 1; imageNumber <= maximumPhotos; imageNumber++) {
      const { container, image: imageElement } = createGalleryItem(imageNumber);
      imageElement.onerror = () => container.remove();
      imageElement.src = new URL(
        `foto/${localFolderName}/${imageNumber}.jpeg`,
        siteRoot,
      ).href;
      galleryElement.append(container);
    }
  };

  if (driveConfiguration) {
    galleryElement.classList.add('carica');
    try {
      const driveFiles = (await fetchDrivePhotos(sectionName)).slice(
        0,
        maximumPhotos,
      );
      if (driveFiles.length) {
        let failedImages = 0;
        driveFiles.forEach((driveFile, imageIndex) => {
          const { container, image: imageElement } = createGalleryItem(
            imageIndex + 1,
          );
          imageElement.onload = () => galleryElement.classList.remove('carica');

          tryImageSources(
            imageElement,
            buildDriveImageUrls(driveFile, 600),
            () => {
              container.remove();
              failedImages += 1;
              if (failedImages === driveFiles.length) {
                console.warn('[Drive] No image preview was loaded successfully.');
                addLocalGallery();
              }
            },
          );
          galleryElement.append(container);
        });
        galleryElement.classList.remove('carica');
      } else {
        addLocalGallery();
      }
    } catch (error) {
      console.warn('[Drive]', error.message);
      addLocalGallery();
    }
  } else {
    addLocalGallery();
  }
};

// Set up the gallery loading routine for every gallery on the page.
const setupGalleries = () => {
  document
    .querySelectorAll('[data-gallery]')
    .forEach(galleryElement => loadGallery(galleryElement));
};

// Open gallery images in a native, keyboard-accessible modal.
const setupLightbox = () => {
  const lightbox = selectElement('.lightbox');
  if (!lightbox) return;

  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('p');
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => {
    lightbox.close();
  });

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-lightbox]');
    if (!trigger) return;
    const sourceImage = trigger.querySelector('img');
    if (!sourceImage) return;

    lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
    lightboxImage.alt = sourceImage.alt;
    lightboxCaption.textContent =
      sourceImage.closest('figure')?.querySelector('figcaption')?.textContent ||
      sourceImage.alt;
    lightbox.showModal();
  });

  document.addEventListener('site-language-change', () => {
    document
      .querySelectorAll('.gallery-image-button img[data-caption-key]')
      .forEach(imageElement => {
        const caption = I18N.t(imageElement.dataset.captionKey, {
          number: imageElement.dataset.captionNumber,
        });
        imageElement.alt = caption;
        imageElement.parentElement.setAttribute('aria-label', caption);
        const captionElement =
          imageElement.closest('figure')?.querySelector('figcaption');
        if (captionElement) captionElement.textContent = caption;
      });
  });
};

// Switch between Android and iPhone installation instructions.
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

// Set up install tabs and remove install links when already running standalone.
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
    matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone
  ) {
    document
      .querySelectorAll('[data-install-link]')
      .forEach(link => link.remove());
  }
};

// Register the install prompt and expose the one-tap install button.
const setupInstallPrompt = () => {
  let installPromptEvent = null;
  const isMobileDevice =
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  const oneTapButton = selectElement('#one-tap');

  addEventListener('beforeinstallprompt', event => {
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

// Register the service worker with cache revalidation disabled.
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(new URL('sw.js', siteRoot), {
      updateViaCache: 'none',
    });
  }
};

// Initialize all shared site behavior.
const initializeSite = () => {
  configureContactLinks();
  loadHomePhoto();
  setupHamburgerMenu();
  setupGalleries();
  setupLightbox();
  setupInstallPrompt();
  setupInstallExperience();
  registerServiceWorker();
};

initializeSite();
