'use strict';

// The web chapters use the original page numbers so shared links stay valid.
const chapterPages = [
  [2], [5, 6, 7], [8, 9, 10], [11, 12, 13], [14, 15], [16, 17, 18], [19, 20, 21],
  [22, 23, 24], [25, 26, 27], [28, 29, 30], [31, 32, 33], [34, 35, 36], [38]
];
const legacyPages = {1: '#portada', 3: '#indice', 4: '#indice', 37: '#pagina-38'};
// Reserve space for photos so a link into a chapter stays aligned as images load.
const photoSizes = {
  2: [[405, 304]], 5: [[460, 631], [365, 653]], 7: [[709, 307]],
  8: [[695, 384], [655, 331]], 11: [[849, 328], [414, 292], [408, 292]], 13: [[712, 309]],
  14: [[416, 700], [400, 182], [400, 182], [400, 233]], 16: [[887, 377], [397, 353], [465, 353]],
  18: [[715, 307]], 19: [[807, 417], [807, 350]], 21: [[712, 307]],
  22: [[831, 368], [404, 287], [406, 287]], 24: [[712, 307]],
  25: [[829, 303], [382, 252], [201, 382], [203, 382]], 27: [[712, 309]],
  28: [[829, 349], [406, 284], [404, 284]], 30: [[712, 307]], 31: [[893, 713]], 34: [[817, 626]]
};
const main = document.querySelector('main');
const selector = document.querySelector('#language');
const languages = Array.from(selector.options, option => option.value);
const key = 'awen.language';
const pad = number => String(number).padStart(2, '0');
const pageHref = number => '#pagina-' + number;
const photo = (number, position = 1) => 'assets/images/guia-' + pad(number) + '-' + position + '.webp';
let language = 'es';
let dictionary;
let resources;
let formatNumber;
let request = 0;
let localFolderStatus = '';
const languagePicker = createLanguagePicker();

function createLanguagePicker() {
  const container = selector.closest('.language');
  const label = element('span', 'sr-only');
  label.id = 'language-label';
  label.textContent = selector.getAttribute('aria-label');
  const current = element('span');
  current.id = 'language-current';
  const trigger = element('button', 'language-trigger');
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'language-options');
  trigger.setAttribute('aria-labelledby', label.id + ' ' + current.id);
  const list = element('div', 'language-options');
  list.id = 'language-options';
  list.hidden = true;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-labelledby', label.id);
  function flag(code) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 30 20');
    svg.setAttribute('class', 'language-flag');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', '#flag-' + code);
    svg.append(use);
    return svg;
  }
  function close(restoreFocus = false) {
    list.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({preventScroll: true});
  }
  const options = Array.from(selector.options, source => {
    const option = element('button', 'language-option');
    option.type = 'button';
    option.lang = source.lang;
    option.tabIndex = -1;
    option.dataset.code = source.value;
    option.setAttribute('role', 'option');
    option.append(flag(source.value), element('span', '', source.textContent));
    option.addEventListener('click', () => {
      selector.value = source.value;
      close(true);
      selector.dispatchEvent(new Event('change'));
    });
    list.append(option);
    return option;
  });
  function open(index = languages.indexOf(selector.value)) {
    list.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    options[Math.max(0, index)].focus({preventScroll: true});
    options[Math.max(0, index)].scrollIntoView({block: 'nearest'});
  }
  trigger.addEventListener('click', () => list.hidden ? open() : close());
  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    open(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : undefined);
  });
  let search = '';
  let searchedAt = 0;
  list.addEventListener('keydown', event => {
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % options.length;
    if (event.key === 'ArrowUp') next = (index + options.length - 1) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      options[next].focus();
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      close(true);
    } else if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      search = (now - searchedAt < 700 ? search : '') + event.key.toLocaleLowerCase();
      searchedAt = now;
      const match = options.find(option => option.textContent.toLocaleLowerCase().startsWith(search));
      if (match) match.focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!container.contains(event.target)) close();
  });
  container.addEventListener('focusout', event => {
    if (!container.contains(event.relatedTarget)) close();
  });
  function sync() {
    const source = selector.selectedOptions[0];
    label.textContent = selector.getAttribute('aria-label');
    current.textContent = source.textContent;
    current.lang = source.lang;
    trigger.replaceChildren(flag(source.value), current, element('span', 'chevron'));
    options.forEach(option => option.setAttribute('aria-selected', String(option.dataset.code === source.value)));
  }
  selector.closest('label').hidden = true;
  container.append(label, trigger, list);
  sync();
  return {sync};
}

function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value != null) node.textContent = value;
  return node;
}
function link(href, className, value) {
  const node = element('a', className, value);
  node.href = href;
  return node;
}
function icon(name) {
  const paths = {
    right: 'M4 12h16m-6-6 6 6-6 6',
    next: 'm9 5 7 7-7 7', previous: 'm15 5-7 7 7 7',
    index: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', paths[name]);
  svg.append(path);
  return svg;
}
function image(src, alt, lazy = true) {
  const img = element('img');
  img.src = src;
  img.alt = alt;
  if (lazy) img.loading = 'lazy';
  return img;
}
function t(id, parameters = {}) {
  const value = id.includes('.') ? id.split('.').reduce((entry, key) => entry[key], dictionary) : dictionary.ui[id];
  return value.replace(/\{(\w+)\}/g, (_, name) => parameters[name]);
}
function pageData(page) {
  return dictionary.pages['p' + pad(page)];
}
function chapters() {
  const list = element('ol', 'chapter-list');
  list.start = 0;
  chapterPages.forEach(([start], number) => {
    const item = element('li');
    const anchor = link(pageHref(start), 'chapter-link');
    const details = element('span', 'chapter-detail');
    details.append(element('small', '', t('chapter', {number: formatNumber.format(number)})),
      element('strong', '', chapterTitle(start)));
    if (photoSizes[start]) anchor.append(image(photo(start), ''));
    anchor.append(details, icon('right'));
    item.append(anchor);
    list.append(item);
  });
  return list;
}
function home(calendarOptions) {
  const wrapper = element('div', 'wrap');
  const cover = element('section', 'cover');
  const heading = element('header', 'cover-heading');
  heading.append(element('p', 'location', 'Maldonado, Uruguay'), element('h1', '', t('title')));
  const figure = element('figure', 'hero-photo');
  figure.append(image('assets/images/puerto.webp', t('harbor'), false));
  cover.append(heading, element('p', 'intro', t('subtitle')), figure);
  const section = element('section', 'contents');
  section.id = 'indice';
  section.tabIndex = -1;
  section.append(element('h2', '', t('contents')), chapters());
  wrapper.append(cover, section);
  const fragment = document.createDocumentFragment();
  fragment.append(AwenCalendar.nextEventRow(calendarOptions), wrapper);
  return fragment;
}
function chapterIndex(page) {
  return chapterPages.findIndex(pages => pages.includes(page));
}
function chapterTitle(start) {
  if (start === 2) return t('welcome');
  if (start === 38) return t('farewell');
  return pageData(start).title;
}
function chapterTurn(start, previous) {
  const anchor = link(pageHref(start), 'chapter-turn');
  anchor.rel = previous ? 'prev' : 'next';
  const labels = element('span', 'chapter-destination');
  const label = previous ? 'previousChapter' : 'nextChapter';
  labels.append(element('span', 'direction', t(label)), element('strong', '', chapterTitle(start)));
  if (previous) anchor.append(icon('previous'), labels);
  else anchor.append(labels, icon('next'));
  return anchor;
}
function chapterNav(index) {
  const nav = element('nav', 'chapter-nav');
  nav.setAttribute('aria-label', t('title'));
  if (index > 0) nav.append(chapterTurn(chapterPages[index - 1][0], true));
  nav.append(tocLink());
  if (index + 1 < chapterPages.length) nav.append(chapterTurn(chapterPages[index + 1][0], false));
  return nav;
}
function tocLink() {
  const anchor = link('#indice', 'toc-link');
  anchor.append(icon('index'), t('index'));
  return anchor;
}
function formattedPage(page, data, chapter) {
  const start = chapterPages[chapter][0];
  const article = element('section', 'transcription');
  if (page === start) {
    article.append(element('header', 'chapter-heading', t('chapter', {number: formatNumber.format(chapter)})));
  }
  const showTitle = page === start || data.title !== pageData(start).title;
  if (showTitle) {
    article.append(element(page === start ? 'h1' : 'h2', '', data.title));
  }
  function tipsAt(position) {
    data.tips.forEach((value, i) => {
      if ((data.tipAt?.[i] ?? data.paragraphs.length) !== position) return;
      const tip = element('aside');
      if (page !== 36) tip.append(element('strong', '', t('tip')));
      tip.append(element('p', '', value));
      article.append(tip);
    });
  }
  tipsAt(0);
  data.paragraphs.forEach((value, i) => {
    if (data.headings?.[i]) article.append(element(page === start || !showTitle ? 'h2' : 'h3', '', data.headings[i]));
    article.append(element('p', '', value));
    tipsAt(i+1);
  });
  const urls = resources[page] || [];
  if (urls.length) {
    const list = element('ul', 'resources');
    urls.forEach((r, i) => {
      const item = element('li');
      item.append(link(r.url, '', data.links?.[i] || new URL(r.url).hostname));
      list.append(item);
    });
    article.append(list);
  }
  appendIllustrations(article, page, data);
  return article;
}
function appendIllustrations(article, page, data) {
  const sizes = photoSizes[page] || [];
  const gallery = element('div', sizes.length > 1 ? 'photo-gallery' : '');
  sizes.forEach(([width, height], i) => {
    const caption = data.captions[i];
    const fig = element('figure');
    const img = image(photo(page, i+1), caption || data.title);
    img.width = width;
    img.height = height;
    if (page === 34) {
      const map = element('div', 'favorites-map');
      map.append(img, element('span', 'map-label map-beaches', t('beaches')), element('span', 'map-label map-harbor', t('harbor')));
      fig.append(map);
    } else fig.append(img);
    if (caption) fig.append(element('figcaption', '', caption));
    gallery.append(fig);
  });
  if (sizes.length) article.append(gallery);
  for (const note of data.captions.slice(sizes.length)) article.append(element('p', 'editorial-note', note));
}
function reader(page) {
  const index = chapterIndex(page);
  const region = element('div', 'reader');
  const content = element('div', 'chapter-content');
  for (const number of chapterPages[index]) {
    const data = pageData(number);
    const part = element('div', 'reader-part');
    part.id = 'pagina-' + number;
    part.tabIndex = -1;
    part.append(formattedPage(number, data, index));
    content.append(part);
  }
  region.append(chapterNav(index), content, chapterNav(index));
  return region;
}
function currentPage() {
  const match = /^#pagina-(\d{1,2})$/.exec(location.hash);
  const number = match && Number(match[1]);
  return number in legacyPages || chapterIndex(number) >= 0 ? number : null;
}
function render(navigate = false) {
  if (!dictionary) return;
  const page = currentPage();
  if (legacyPages[page]) {
    location.replace(legacyPages[page]);
    return;
  }
  AwenCalendar.unmount();
  const calendar = location.hash === '#calendario';
  const title = calendar ? t('calendar.title') : page ? chapterTitle(chapterPages[chapterIndex(page)][0]) : t('title');
  document.title = title + ' · AWEN';
  document.documentElement.lang = language;
  document.querySelector('meta[name="description"]').content = t(calendar ? 'calendar.subtitle' : 'subtitle');
  document.querySelector('#tab').textContent = t('title');
  document.querySelector('#calendar-tab').textContent = t('calendar.title');
  const activeTab = document.querySelector(calendar ? '#calendar-tab' : '#tab');
  document.querySelector(calendar ? '#tab' : '#calendar-tab').removeAttribute('aria-current');
  activeTab.setAttribute('aria-current', 'page');
  document.querySelector('#skip').textContent = t('skip');
  selector.setAttribute('aria-label', t('language'));
  languagePicker.sync();
  if (location.protocol === 'file:') syncLocalFolder();
  const calendarOptions = {language, t: (id, params) => t('calendar.' + id, params)};
  main.replaceChildren(calendar ? AwenCalendar.render(calendarOptions) : page ? reader(page) : home(calendarOptions));
  if (location.hash === '#indice') {
    const index = document.querySelector('#indice');
    index.focus({preventScroll: true});
    index.scrollIntoView();
  } else if (page && page !== chapterPages[chapterIndex(page)][0]) {
    const target = document.getElementById('pagina-' + page);
    if (navigate) target.focus({preventScroll: true});
    target.scrollIntoView();
  } else if (navigate) {
    if (page || calendar) main.focus({preventScroll: true});
    window.scrollTo(0, 0);
  }
}
function syncLocalFolder() {
  document.querySelector('#local-folder').hidden = false;
  document.querySelector('#choose-local-folder').textContent = t('chooseLocalFolder');
  document.querySelector('#local-folder-hint').textContent = t('localFolderHint');
  document.querySelector('#local-folder-status').textContent = localFolderStatus ? t(localFolderStatus) : '';
}
if (location.protocol === 'file:') {
  const choose = document.querySelector('#choose-local-folder');
  const input = document.querySelector('#local-folder-input');
  choose.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    if (!input.files.length) return;
    choose.disabled = true;
    try {
      const data = await AwenData.readFolder(input.files);
      AwenCalendar.replaceEvents(data['events/events.json']);
      AwenData.useFolder(data);
      ++request; // A pending language change may still be reading the previous files.
      dictionary = data['locales/' + language + '.json'];
      resources = data['assets/book.json'].resources;
      selector.value = language;
      localFolderStatus = 'localFolderLoaded';
      render();
    } catch {
      localFolderStatus = 'localFolderError';
      syncLocalFolder();
    } finally {
      input.value = '';
      choose.disabled = false;
    }
  });
}
async function selectLanguage(code, remember = false) {
  const serial = ++request;
  try {
    const [next, book] = await Promise.all([
      AwenData.read('locales/' + code + '.json?v=8'), resources ? Promise.resolve({resources}) : AwenData.read('assets/book.json')
    ]);
    if (serial !== request) return;
    dictionary = next;
    resources = book.resources;
    language = code;
    selector.value = code;
    formatNumber = new Intl.NumberFormat(code);
    if (remember) {
      try { localStorage.setItem(key, code); } catch { /* Storage is optional. */ }
    }
    render();
  } catch {
    if (serial !== request) return;
    if (!dictionary && code !== 'es') return selectLanguage('es');
    const error = element('section', 'error');
    error.setAttribute('role', 'alert');
    const retry = element('button', '', dictionary ? t('retry') : 'Volver a intentar');
    retry.onclick = () => selectLanguage(code, remember);
    error.append(element('p', '', dictionary ? t('error') : 'No se pudo cargar la guía.'), retry);
    main.replaceChildren(error);
    selector.value = language;
    languagePicker.sync();
  }
}
selector.addEventListener('change', () => selectLanguage(selector.value, true));
document.querySelector('#skip').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView();
});
window.addEventListener('hashchange', () => render(true));
document.addEventListener('keydown', event => {
  const page = currentPage();
  if (!page || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('select,input,textarea,button')) return;
  const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
  if (!direction) return;
  const target = chapterPages[chapterIndex(page) + direction];
  if (!target) return;
  event.preventDefault();
  location.hash = pageHref(target[0]);
});
let initial;
try { initial = localStorage.getItem(key); } catch { /* First visit. */ }
selectLanguage(languages.includes(initial) ? initial : 'es');
