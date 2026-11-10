'use strict';

const starts = [5, 8, 11, 14, 16, 19, 22, 25, 28, 31, 34];
const sectionStarts = [1, ...starts, 37];
const extras = [[2, 'welcome'], [4, 'how'], [37, 'credits'], [38, 'farewell']];
// Reserve space for photos so a link into a chapter stays aligned as images load.
const photoSizes = {
  1: [[893, 959]], 2: [[405, 304]], 5: [[460, 631], [365, 653]], 7: [[709, 307]],
  8: [[695, 384], [655, 331]], 11: [[849, 328], [414, 292], [408, 292]], 13: [[712, 309]],
  14: [[416, 700], [400, 182], [400, 182], [400, 233]], 16: [[887, 377], [397, 353], [465, 353]],
  18: [[715, 307]], 19: [[807, 417], [807, 350]], 21: [[712, 307]],
  22: [[831, 368], [404, 287], [406, 287]], 24: [[712, 307]],
  25: [[829, 303], [382, 252], [201, 382], [203, 382]], 27: [[712, 309]],
  28: [[829, 349], [406, 284], [404, 284]], 30: [[712, 307]], 31: [[893, 713]], 34: [[817, 626]]
};
const totalPages = 38;
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
    use.setAttribute('href', 'assets/flags.svg#' + code);
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
    book: 'M12 5.5C9 3.5 5 3.5 2.5 4.5v14c3-1.2 6.5-1 9.5 1 3-2 6.5-2.2 9.5-1v-14C19 3.5 15 3.5 12 5.5Zm0 0v14',
    down: 'M12 4v16m-6-6 6 6 6-6', right: 'M4 12h16m-6-6 6 6-6 6',
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
  return dictionary.ui[id].replace(/\{(\w+)\}/g, (_, name) => parameters[name]);
}
function pageData(page) {
  return dictionary.pages['p' + pad(page)];
}
function chapters(withPhotos) {
  const list = element('ol', withPhotos ? 'chapter-list' : '');
  starts.forEach((start, i) => {
    const item = element('li');
    const title = pageData(start).title;
    const anchor = link(pageHref(start), withPhotos ? 'chapter-link' : '');
    if (withPhotos) {
      const details = element('span', 'chapter-detail');
      details.append(element('small', '', t('chapter', {number: formatNumber.format(i + 1)})), element('strong', '', title));
      anchor.append(image(photo(start), ''), details, icon('right'));
    } else anchor.textContent = title;
    item.append(anchor);
    list.append(item);
  });
  return list;
}
function otherPages() {
  const links = element('div', 'slim-links');
  for (const [page, id] of extras) links.append(link(pageHref(page), '', t(id)));
  return links;
}
function home() {
  const wrapper = element('div', 'wrap');
  const cover = element('section', 'cover');
  const content = element('div');
  const actions = element('div', 'cover-actions');
  const open = link(pageHref(1), 'btn');
  open.append(icon('book'), t('open'));
  const index = link('#indice', 'text-link');
  index.append(t('viewIndex'), icon('down'));
  actions.append(open, index);
  content.append(element('p', 'location', 'Maldonado, Uruguay'), element('h1', '', t('title')),
    element('p', 'intro', t('subtitle')), actions);
  const figure = element('figure', 'hero-photo');
  figure.append(image('assets/images/puerto.webp', t('harbor'), false));
  cover.append(content, figure);
  const section = element('section', 'contents');
  section.id = 'indice';
  section.tabIndex = -1;
  section.append(element('h2', '', t('contents')), chapters(true), otherPages());
  wrapper.append(cover, section);
  return wrapper;
}
function sectionIndex(page) {
  return sectionStarts.filter(start => start <= page).length - 1;
}
function sectionTitle(start) {
  if (start === 1) return t('introduction');
  if (start === 37) return t('closing');
  return pageData(start).title;
}
function chapterTurn(start, previous) {
  const anchor = link(pageHref(start), 'chapter-turn');
  anchor.rel = previous ? 'prev' : 'next';
  const labels = element('span', 'chapter-destination');
  const isChapter = starts.includes(start);
  const label = previous
    ? (isChapter ? 'previousChapter' : 'previousSection')
    : (isChapter ? 'nextChapter' : 'nextSection');
  labels.append(element('span', 'direction', t(label)), element('strong', '', sectionTitle(start)));
  if (previous) anchor.append(icon('previous'), labels);
  else anchor.append(labels, icon('next'));
  return anchor;
}
function chapterNav(index) {
  const nav = element('nav', 'chapter-nav');
  nav.setAttribute('aria-label', t('title'));
  if (index > 0) nav.append(chapterTurn(sectionStarts[index - 1], true));
  nav.append(tocLink());
  if (index + 1 < sectionStarts.length) nav.append(chapterTurn(sectionStarts[index + 1], false));
  return nav;
}
function tocLink() {
  const anchor = link('#indice', 'toc-link');
  anchor.append(icon('index'), t('index'));
  return anchor;
}
function hotspot(href, label, x, y, width, height) {
  const anchor = link(href, 'hotspot');
  anchor.setAttribute('aria-label', label);
  anchor.title = label;
  Object.assign(anchor.style, {left: x/893*100+'%', top: y/1263*100+'%',
    width: width/893*100+'%', height: height/1263*100+'%'});
  return anchor;
}
function facsimile(page, data, lazy) {
  const paper = element('div', 'paper');
  const img = image('assets/pages/' + pad(page) + '.webp', '', lazy);
  img.width = 893;
  img.height = 1263;
  img.lang = 'es';
  paper.append(img);
  if (page === 3) {
    starts.forEach((start, i) => paper.append(hotspot(pageHref(start), pageData(start).title, 78, 246 + i*67.5, 744, 65)));
    paper.append(hotspot(pageHref(2), t('welcome'), 77, 1090, 100, 49),
      hotspot(pageHref(4), t('how'), 190, 1090, 165, 49),
      hotspot(pageHref(38), t('farewell'), 365, 1090, 180, 49));
  }
  for (const [i, r] of (resources[page] || []).entries()) {
    paper.append(hotspot(r.url, data.links?.[i] || new URL(r.url).hostname, r.x, r.y, r.width, r.height));
  }
  return paper;
}
function transcription(page, data, start) {
  const facsimileVisible = language === 'es';
  const article = element('article', facsimileVisible ? 'sr-only' : 'transcription');
  if (page === start && starts.includes(start)) {
    article.append(element('header', 'chapter-heading', t('chapter', {number: formatNumber.format(starts.indexOf(start) + 1)})));
  }
  if (page === start || data.title !== pageData(start).title) {
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
    if (data.headings?.[i]) article.append(element(page === start ? 'h2' : 'h3', '', data.headings[i]));
    article.append(element('p', '', value));
    tipsAt(i+1);
  });
  if (page === 3 && !facsimileVisible) article.append(chapters(false), otherPages());
  const urls = resources[page] || [];
  if (urls.length && !facsimileVisible) {
    const list = element('ul', 'resources');
    urls.forEach((r, i) => {
      const item = element('li');
      item.append(link(r.url, '', data.links?.[i] || new URL(r.url).hostname));
      list.append(item);
    });
    article.append(list);
  }
  const sizes = photoSizes[page] || [];
  const count = sizes.length;
  for (let i = 0; i < Math.max(count, data.captions?.length || 0); i++) {
    const caption = data.captions?.[i];
    const fig = element('figure');
    if (!facsimileVisible && i < count) {
      const img = image(page === 1 ? 'assets/images/puerto.webp' : photo(page, i+1), page === 1 ? t('harbor') : (caption || data.title));
      [img.width, img.height] = sizes[i];
      if (page === 34) {
        const map = element('div', 'favorites-map');
        map.append(img, element('span', 'map-label map-beaches', t('beaches')), element('span', 'map-label map-harbor', t('harbor')));
        fig.append(map);
      } else fig.append(img);
    }
    if (caption) fig.append(element('figcaption', '', caption));
    if (fig.childElementCount) article.append(fig);
  }
  return article;
}
function reader(page) {
  const index = sectionIndex(page);
  const start = sectionStarts[index];
  const end = sectionStarts[index + 1] || totalPages + 1;
  const region = element('div', 'reader');
  const content = element('div', 'chapter-content');
  for (let number = start; number < end; number++) {
    const data = pageData(number);
    const part = element('div', 'reader-part');
    part.id = 'pagina-' + number;
    part.tabIndex = -1;
    if (language === 'es') part.append(facsimile(number, data, number !== start && number !== page));
    part.append(transcription(number, data, start));
    content.append(part);
  }
  region.append(chapterNav(index), content, chapterNav(index));
  return region;
}
function currentPage() {
  const match = /^#pagina-(\d{1,2})$/.exec(location.hash);
  const number = match && Number(match[1]);
  return number >= 1 && number <= totalPages ? number : null;
}
function render(navigate = false) {
  if (!dictionary) return;
  const page = currentPage();
  const title = page ? sectionTitle(sectionStarts[sectionIndex(page)]) : t('title');
  document.title = title + ' · AWEN';
  document.documentElement.lang = language;
  document.querySelector('meta[name="description"]').content = t('subtitle');
  document.querySelector('#tab').textContent = t('title');
  document.querySelector('#skip').textContent = t('skip');
  selector.setAttribute('aria-label', t('language'));
  languagePicker.sync();
  main.replaceChildren(page ? reader(page) : home());
  if (location.hash === '#indice') {
    const index = document.querySelector('#indice');
    index.focus({preventScroll: true});
    index.scrollIntoView();
  } else if (page && !sectionStarts.includes(page)) {
    const target = document.getElementById('pagina-' + page);
    if (navigate) target.focus({preventScroll: true});
    target.scrollIntoView();
  } else if (navigate) {
    if (page) main.focus({preventScroll: true});
    window.scrollTo(0, 0);
  }
}
async function json(path) {
  const response = await fetch(path, {cache: 'no-cache'});
  if (!response.ok) throw new Error(path);
  return response.json();
}
async function selectLanguage(code, remember = false) {
  const serial = ++request;
  try {
    const [next, book] = await Promise.all([
      json('locales/' + code + '.json?v=6'), resources ? Promise.resolve({resources}) : json('assets/book.json')
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
  const target = sectionStarts[sectionIndex(page) + direction];
  if (!target) return;
  event.preventDefault();
  location.hash = pageHref(target);
});
let initial;
try { initial = localStorage.getItem(key); } catch { /* First visit. */ }
selectLanguage(languages.includes(initial) ? initial : 'es');
