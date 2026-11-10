'use strict';

const starts = [5, 8, 11, 14, 16, 19, 22, 25, 28, 31, 34];
const extras = [[2, 'welcome'], [4, 'how'], [37, 'credits'], [38, 'farewell']];
const imageCounts = {2:1, 5:2, 7:1, 8:2, 11:3, 13:1, 14:4, 16:3,
  18:1, 19:2, 21:1, 22:3, 24:1, 25:4, 27:1, 28:3, 30:1, 31:1, 34:1};
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
function pageLabel(page) {
  return t('page', {number: formatNumber.format(page), total: formatNumber.format(totalPages)});
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
function pager(page) {
  const group = element('div', 'pager');
  function turn(delta, action) {
    const target = page + delta;
    if (target < 1 || target > totalPages) {
      const disabled = element('span', 'page-turn');
      disabled.setAttribute('aria-hidden', 'true');
      disabled.append(icon(action));
      return disabled;
    }
    const anchor = link(pageHref(target), 'page-turn');
    anchor.setAttribute('aria-label', t(action));
    anchor.title = t(action);
    anchor.append(icon(action));
    return anchor;
  }
  const count = element('output', '', formatNumber.format(page) + ' / ' + formatNumber.format(totalPages));
  count.setAttribute('aria-label', pageLabel(page));
  group.append(turn(-1, 'previous'), count, turn(1, 'next'));
  return group;
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
function facsimile(page, data) {
  const paper = element('div', 'paper');
  const img = image('assets/pages/' + pad(page) + '.webp', '', false);
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
function transcription(page, data) {
  const facsimileVisible = language === 'es';
  const article = element('article', facsimileVisible ? 'sr-only' : 'transcription');
  if (page >= starts[0] && page < 37) {
    const chapter = starts.filter(start => start <= page).length - 1;
    const title = pageData(starts[chapter]).title;
    const header = element('header', 'chapter-heading');
    header.append(element('span', '', t('chapter', {number: formatNumber.format(chapter + 1)})));
    if (data.title !== title) header.append(element('span', '', title));
    article.append(header);
  }
  article.append(element('h1', '', data.title));
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
    if (data.headings?.[i]) article.append(element('h2', '', data.headings[i]));
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
  const count = page === 1 ? 1 : (imageCounts[page] || 0);
  for (let i = 0; i < Math.max(count, data.captions?.length || 0); i++) {
    const caption = data.captions?.[i];
    const fig = element('figure');
    if (!facsimileVisible && i < count) {
      const img = image(page === 1 ? 'assets/images/puerto.webp' : photo(page, i+1), page === 1 ? t('harbor') : (caption || data.title));
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
  const data = pageData(page);
  const region = element('div', 'reader');
  const bar = element('div', 'toolbar');
  const controls = element('div', 'toolbar-inner');
  controls.append(tocLink(), pager(page));
  bar.append(controls);
  region.append(bar);
  if (language === 'es') region.append(facsimile(page, data));
  region.append(transcription(page, data));
  const bottom = element('div', 'reader-bottom');
  bottom.append(tocLink(), pager(page));
  region.append(bottom);
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
  const title = page ? pageData(page).title : t('title');
  document.title = title + ' · AWEN';
  document.documentElement.lang = language;
  document.querySelector('meta[name="description"]').content = t('subtitle');
  document.querySelector('#tab').textContent = t('title');
  document.querySelector('#skip').textContent = t('skip');
  selector.setAttribute('aria-label', t('language'));
  main.replaceChildren(page ? reader(page) : home());
  if (location.hash === '#indice') {
    const index = document.querySelector('#indice');
    index.focus({preventScroll: true});
    index.scrollIntoView();
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
      json('locales/' + code + '.json?v=2'), resources ? Promise.resolve({resources}) : json('assets/book.json')
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
  const next = page + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0);
  if (next !== page && next >= 1 && next <= totalPages) {
    event.preventDefault();
    location.hash = pageHref(next);
  }
});
let initial;
try { initial = localStorage.getItem(key); } catch { /* First visit. */ }
selectLanguage(languages.includes(initial) ? initial : 'es');
