'use strict';

const {chapterPages} = AwenGuide;
const legacyPages = {1: '#portada', 3: '#indice', 4: '#indice', 37: '#pagina-38'};
const main = document.querySelector('main');
const tabs = Array.from(document.querySelectorAll('.masthead nav .tab'));
const selector = document.querySelector('#language');
const languages = Array.from(selector.options, option => option.value);
const key = 'awen.language';
const pad = number => String(number).padStart(2, '0');
const pageHref = number => '#pagina-' + number;
let language = 'es';
let dictionary;
let book;
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
    pause: 'M8 5v14m8-14v14', play: 'm8 5 11 7-11 7z',
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
  if (!value.includes('{')) return value;
  const parts = value.split(/\{(\w+)\}/).map((part, index) => index % 2 ? parameters[part] : part);
  // Keep language attributes on translated event fields inserted into a message.
  if (parts.some(part => part instanceof Node)) {
    const fragment = document.createDocumentFragment();
    fragment.append(...parts);
    return fragment;
  }
  return parts.join('');
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
    const thumbnail = book.guide.thumbnails[start];
    if (thumbnail) anchor.append(AwenGuide.illustration(thumbnail, '', file => 'assets/images/' + encodeURIComponent(file)));
    anchor.append(details, icon('right'));
    item.append(anchor);
    list.append(item);
  });
  return list;
}
function home(calendarOptions) {
  const wrapper = element('div', 'wrap');
  const cover = AwenGuide.cover({dictionary, guide:book.guide, language, imageUrl:file => 'assets/images/' + encodeURIComponent(file)});
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
function reader(page) {
  const index = chapterIndex(page);
  const region = element('div', 'reader');
  const content = element('div', 'chapter-content');
  for (const number of chapterPages[index]) {
    const data = pageData(number);
    const part = element('div', 'reader-part');
    part.id = 'pagina-' + number;
    part.tabIndex = -1;
    part.append(AwenGuide.section({page:number, data, dictionary, book, language,
      imageUrl:file => 'assets/images/' + encodeURIComponent(file)}));
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
  AwenAbout.unmount();
  const activeTab = tabs.find(tab => tab.hash === location.hash) || document.querySelector('#tab');
  for (const tab of tabs) {
    tab.textContent = t(tab.dataset.title);
    if (tab === activeTab) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  const title = page ? chapterTitle(chapterPages[chapterIndex(page)][0]) : activeTab.textContent;
  document.title = title + ' · AWEN';
  document.documentElement.lang = language;
  document.querySelector('meta[name="description"]').content = t(activeTab.dataset.description || 'subtitle');
  document.querySelector('#skip').textContent = t('skip');
  selector.setAttribute('aria-label', t('language'));
  languagePicker.sync();
  if (location.protocol === 'file:') syncLocalFolder();
  const calendarOptions = {language, t: (id, params) => t('calendar.' + id, params)};
  let content;
  if (activeTab.hash === '#sobre-awen') {
    content = AwenAbout.render({language, t: (id, params) => t('about.' + id, params), photos: AwenPhotos});
  } else if (activeTab.hash === '#calendario') {
    content = AwenCalendar.render(calendarOptions);
  } else {
    content = page ? reader(page) : home(calendarOptions);
  }
  main.replaceChildren(content);
  if (location.hash === '#indice') {
    const index = document.querySelector('#indice');
    index.focus({preventScroll: true});
    index.scrollIntoView();
  } else if (page && page !== chapterPages[chapterIndex(page)][0]) {
    const target = document.getElementById('pagina-' + page);
    if (navigate) target.focus({preventScroll: true});
    target.scrollIntoView();
  } else if (navigate) {
    if (page || activeTab.hash !== '#portada') main.focus({preventScroll: true});
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
      if (!data['assets/book.json']?.guide) throw new Error('Missing guide images');
      AwenCalendar.replaceEvents(data['events/events.json']);
      AwenData.useFolder(data);
      ++request; // A pending language change may still be reading the previous files.
      dictionary = data['locales/' + language + '.json'];
      book = data['assets/book.json'];
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
    const [next, nextBook] = await Promise.all([
      AwenData.read('locales/' + code + '.json?v=11'), book ?? AwenData.read('assets/book.json?v=2')
    ]);
    if (serial !== request) return;
    dictionary = next;
    book = nextBook;
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
    AwenAbout.unmount();
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
