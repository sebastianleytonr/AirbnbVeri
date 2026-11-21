'use strict';

const AwenAbout = (() => {
  const slideDuration = 5000;
  let selectedIndex = 0;
  let playing = true;
  let stopRotation;

  function unmount() {
    stopRotation?.();
    stopRotation = undefined;
  }

  function control(label, symbol) {
    const button = element('button', 'about-control');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.append(symbol);
    return button;
  }

  function gallery({photos, language, t}) {
    const section = element('section', 'about-gallery');
    section.setAttribute('aria-label', t('gallery'));

    const preview = element('button', 'about-preview');
    preview.type = 'button';
    preview.setAttribute('aria-label', t('enlarge'));
    preview.setAttribute('aria-haspopup', 'dialog');
    preview.title = t('enlarge');
    const thumbnail = element('img');
    thumbnail.id = 'about-thumbnail';
    preview.setAttribute('aria-describedby', thumbnail.id);
    const expandIcon = element('span', 'about-expand-icon', '⤢');
    expandIcon.setAttribute('aria-hidden', 'true');
    preview.append(thumbnail, expandIcon);
    section.append(preview);

    const position = element('span', 'about-position');
    position.setAttribute('role', 'status');
    const numbers = new Intl.NumberFormat(language);
    let timer;
    let viewer;

    function scheduleNext() {
      clearTimeout(timer);
      if (photos.length > 1 && playing && !document.hidden && !viewer?.open) {
        timer = setTimeout(() => show(selectedIndex + 1, true), slideDuration);
      }
    }

    function show(index, automatic = false) {
      selectedIndex = (index + photos.length) % photos.length;
      const photo = photos[selectedIndex];
      thumbnail.src = 'assets/sobre-awen/' + photo.file;
      thumbnail.alt = t('photos.' + photo.altKey);
      position.setAttribute('aria-live', automatic ? 'off' : 'polite');
      position.textContent = t('position', {
        current: numbers.format(selectedIndex + 1), total: numbers.format(photos.length)
      });
      scheduleNext();
    }

    if (photos.length > 1) {
      const controls = element('div', 'about-controls');
      const playback = element('button', 'about-control');
      playback.type = 'button';
      function syncPlayback() {
        const action = playing ? 'pause' : 'play';
        playback.title = t(action);
        playback.setAttribute('aria-label', playback.title);
        playback.replaceChildren(icon(action));
      }
      playback.addEventListener('click', () => {
        playing = !playing;
        syncPlayback();
        scheduleNext();
      });
      syncPlayback();
      document.addEventListener('visibilitychange', scheduleNext);
      stopRotation = () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', scheduleNext);
      };
      const previous = control(t('previous'), icon('previous'));
      const next = control(t('next'), icon('next'));
      previous.addEventListener('click', () => show(selectedIndex - 1));
      next.addEventListener('click', () => show(selectedIndex + 1));
      controls.append(position, playback, previous, next);
      section.append(controls);
      section.addEventListener('keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        show(selectedIndex + (event.key === 'ArrowLeft' ? -1 : 1));
      });
    }
    show(selectedIndex);

    preview.addEventListener('click', () => {
      if (viewer) return;
      viewer = element('dialog', 'about-viewer');
      viewer.setAttribute('aria-label', t('gallery'));
      const fullPhoto = image(thumbnail.src, thumbnail.alt, false);
      fullPhoto.addEventListener('load', () => {
        fullPhoto.style.setProperty('--photo-ratio', fullPhoto.naturalWidth / fullPhoto.naturalHeight);
      }, {once: true});
      const closeIcon = element('span', '', '×');
      closeIcon.setAttribute('aria-hidden', 'true');
      const close = control(t('close'), closeIcon);
      close.classList.add('about-close');
      close.autofocus = true;
      close.addEventListener('click', () => viewer.close());
      viewer.addEventListener('click', event => {
        if (event.target === viewer) viewer.close();
      });
      viewer.addEventListener('close', () => {
        viewer.remove();
        viewer = undefined;
        if (preview.isConnected) {
          preview.focus({preventScroll: true});
          scheduleNext();
        }
      }, {once: true});
      viewer.append(fullPhoto, close);
      // Keep the modal inside its view so changing routes also dismisses it.
      section.after(viewer);
      viewer.showModal();
      scheduleNext();
    });
    return section;
  }

  function render(options) {
    const article = element('article', 'about-page');
    if (options.photos.length) article.append(gallery(options));
    article.append(element('h1', '', options.t('title')), element('p', 'about-welcome', options.t('welcome')));
    return article;
  }

  return {render, unmount};
})();
