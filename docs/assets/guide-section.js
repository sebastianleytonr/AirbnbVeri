'use strict';

const AwenGuide = (() => {
  // Original page numbers keep links to sections stable.
  const chapterPages = [
    [2], [5, 6, 7], [8, 9, 10], [11, 12, 13], [14, 15], [16, 17, 18], [19, 20, 21],
    [22, 23, 24], [25, 26, 27], [28, 29, 30], [31, 32, 33], [34, 35, 36], [38]
  ];
  function element(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value != null) el.textContent = value;
    return el;
  }
  function illustration(file, alt, imageUrl) {
    const map = file === 'guia-31-1.webp' || file === 'guia-34-1.webp';
    const img = element('img', map ? '' : 'chapter-photo');
    img.src = imageUrl(file);
    img.alt = alt;
    img.loading = 'lazy';
    return img;
  }
  const palette = new Set(['#F8F4ED', '#F1E4D4', '#F2F2E9', '#333414', '#19140C',
    '#244D5B', '#0A4B60', '#7E9180', '#CAA572', '#B58352']);
  function safeHref(value) {
    if (typeof value !== 'string' || !/^(?:https?:\/\/|mailto:)/i.test(value) ||
        /[\s\u0000-\u001f\u007f\\]/.test(value)) return null;
    try {
      const url = new URL(value);
      if (url.protocol === 'mailto:') {
        if (!url.pathname || url.pathname.startsWith('/')) return null;
      } else {
        const authority = value.slice(value.indexOf('://') + 3).split(/[/?#]/, 1)[0];
        if (!authority || authority.includes('@') || !url.hostname) return null;
      }
      return value;
    } catch { return null; }
  }
  function validRun(run) {
    if (!run || typeof run.text !== 'string') return false;
    return Object.entries(run).every(([key, value]) => {
      if (key === 'text') return true;
      if (['bold', 'italic', 'underline'].includes(key)) return value === true;
      if (key === 'color' || key === 'background') return typeof value === 'string' && palette.has(value.toUpperCase());
      return key === 'href' && Boolean(safeHref(value));
    });
  }
  function richText(el, plain, runs) {
    el.textContent = plain;
    // The locale remains authoritative when a previous editor changed the plain text.
    if (!Array.isArray(runs) || !runs.length || !runs.every(validRun) ||
        runs.map(run => run.text).join('') !== plain) return el;
    const fragment = document.createDocumentFragment();
    for (const run of runs) {
      let part = document.createTextNode(run.text);
      function wrap(tag) {
        const wrapper = element(tag);
        wrapper.append(part);
        part = wrapper;
        return wrapper;
      }
      if (run.bold) wrap('strong');
      if (run.italic) wrap('em');
      if (run.underline) wrap('u');
      if (run.color || run.background) {
        const span = wrap('span');
        if (run.color) span.dataset.color = run.color.toUpperCase();
        if (run.background) span.dataset.background = run.background.toUpperCase();
      }
      if (run.href && el.localName !== 'a') wrap('a').href = run.href;
      fragment.append(part);
    }
    el.replaceChildren(fragment);
    return el;
  }
  function applyImageLayout(figure, layout) {
    if (!layout || !['block', 'left', 'right'].includes(layout.align) ||
        !Number.isInteger(layout.width) || layout.width < 20 || layout.width > 100) return false;
    figure.dataset.imageAlign = layout.align;
    figure.dataset.imageWidth = layout.width;
    figure.style.setProperty('--image-width', layout.width + '%');
    return true;
  }
  function imageSlots(files, positions, layouts, makeFigure, cover = false) {
    // Keep the image's original index for its caption even when it moves up the page.
    const pending = new Map(files.map((file, index) => [file, index]));
    return (container, anchor) => {
      let gallery = [];
      function appendGallery() {
        if (!gallery.length) return;
        const group = element('div', cover ? 'hero-photo' : gallery.length > 1 ? 'photo-gallery' : '');
        group.append(...gallery);
        container.append(group);
        gallery = [];
      }
      for (const [file, index] of pending) {
        if (anchor !== 'end' && positions?.[file] !== anchor) continue;
        const figure = makeFigure(file, index);
        figure.dataset.imageFile = file;
        if (applyImageLayout(figure, layouts?.[file])) {
          appendGallery();
          container.append(figure);
        } else gallery.push(figure);
        pending.delete(file);
      }
      appendGallery();
    };
  }
  function appendBlock(container, key, block, photos) {
    if (block) {
      block.dataset.guideAnchor = key;
      container.append(block);
    }
    photos(container, key);
  }
  function cover({dictionary, guide, language, imageUrl}) {
    const region = element('section', 'cover');
    const positions = guide.positions?.cover;
    const formats = guide.rich?.[language]?.cover;
    const layouts = guide.layout?.cover;
    if (guide.cover.some(file => positions?.[file] || layouts?.[file])) region.classList.add('cover-flow');
    const photos = imageSlots(guide.cover, positions, layouts, file => {
      const figure = element('figure'), img = element('img');
      img.src = imageUrl(file);
      img.alt = file === 'puerto.webp' ? dictionary.ui.harbor : dictionary.ui.coverPhotos[file];
      figure.append(img);
      return figure;
    }, true);
    const heading = element('header', 'cover-heading');
    const title = richText(element('h1'), dictionary.ui.title, formats?.title);
    title.dataset.field = 'title';
    heading.append(element('p', 'location', 'Maldonado, Uruguay'), title);
    const subtitle = richText(element('p', 'intro'), dictionary.ui.subtitle, formats?.subtitle);
    subtitle.dataset.field = 'subtitle';
    photos(region, 'start');
    appendBlock(region, 'title', heading, photos);
    appendBlock(region, 'subtitle', subtitle, photos);
    photos(region, 'end');
    return region;
  }
  function section({page, data, dictionary, book, language, imageUrl}) {
    const chapter = chapterPages.findIndex(pages => pages.includes(page));
    const start = chapterPages[chapter][0];
    const article = element('section', 'transcription');
    const ui = dictionary.ui;
    const files = book.guide.illustrations[page] || [];
    const formats = book.guide.rich?.[language]?.[page];
    function text(tag, field, index, className) {
      const plain = index == null ? data[field] : data[field][index];
      let key = index == null ? field : field + '.' + index;
      if (field === 'captions' && files[index]) key = 'captions:' + files[index];
      const el = richText(element(tag, className), plain, formats?.[key]);
      el.dataset.field = field;
      if (index != null) el.dataset.index = index;
      return el;
    }
    const photos = imageSlots(files, book.guide.positions?.[page], book.guide.layout?.[page], (file, index) => {
      const figure = element('figure');
      const img = illustration(file, data.captions[index] || data.title, imageUrl);
      const size = book.guide.sizes[file];
      if (size) [img.width, img.height] = size;
      if (file === 'guia-34-1.webp') {
        const map = element('div', 'favorites-map');
        map.append(img, element('span', 'map-label map-beaches', ui.beaches),
          element('span', 'map-label map-harbor', ui.harbor));
        figure.append(map);
      } else figure.append(img);
      figure.append(text('figcaption', 'captions', index));
      return figure;
    });
    if (page === start) {
      const number = new Intl.NumberFormat(language).format(chapter);
      article.append(element('header', 'chapter-heading', ui.chapter.replace('{number}', number)));
    }
    const startPage = dictionary.pages['p' + String(start).padStart(2, '0')];
    const showTitle = page === start || data.title !== startPage.title;
    photos(article, 'start');
    appendBlock(article, 'title', showTitle ? text(page === start ? 'h1' : 'h2', 'title') : null, photos);
    function tipsAt(position) {
      data.tips.forEach((_, index) => {
        if ((data.tipAt?.[index] ?? data.paragraphs.length) !== position) return;
        const tip = element('aside');
        if (page !== 36) tip.append(element('strong', '', ui.tip));
        tip.append(text('p', 'tips', index));
        appendBlock(article, 'tips.' + index, tip, photos);
      });
    }
    tipsAt(0);
    data.paragraphs.forEach((_, index) => {
      const heading = data.headings?.[index] ? text(page === start || !showTitle ? 'h2' : 'h3', 'headings', index) : null;
      appendBlock(article, 'headings.' + index, heading, photos);
      appendBlock(article, 'paragraphs.' + index, text('p', 'paragraphs', index), photos);
      tipsAt(index + 1);
    });
    const urls = book.resources[page] || [];
    if (urls.length) {
      const list = element('ul', 'resources');
      urls.forEach(({url}, index) => {
        let destination;
        try { destination = new URL(url); } catch { return; }
        if (!['https:', 'http:'].includes(destination.protocol)) return;
        const item = element('li');
        const anchor = data.links?.[index] != null ? text('a', 'links', index) : element('a');
        anchor.href = url;
        if (!anchor.textContent) anchor.textContent = destination.hostname;
        item.append(anchor);
        list.append(item);
      });
      article.append(list);
    }
    const notes = data.captions.slice(files.length);
    // Historical galleries precede the map note. Explicitly placing an image
    // at the end puts it after all the content, including that note.
    if (notes.length) photos(article, undefined);
    notes.forEach((_, index) =>
      article.append(text('p', 'captions', files.length + index, 'editorial-note')));
    photos(article, 'end');
    return article;
  }
  return {chapterPages, cover, section, illustration, richText, safeHref, applyImageLayout};
})();
