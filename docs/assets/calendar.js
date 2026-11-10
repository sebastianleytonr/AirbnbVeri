'use strict';

// Civil dates use UTC for arithmetic; event instants always use the venue's zone.
const AwenCalendar = (() => {
  const timeZone = 'America/Montevideo';
  const locales = ['es', 'en', 'pt-BR', 'fr', 'it', 'de', 'pl', 'ru'];
  const dayKeyFormat = new Intl.DateTimeFormat('en', {timeZone, year: 'numeric', month: '2-digit', day: '2-digit'});
  const dayKey = instant => {
    const parts = Object.fromEntries(dayKeyFormat.formatToParts(instant).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const civil = key => new Date(key + 'T12:00:00Z');
  const keyOf = date => date.toISOString().slice(0, 10);
  const addDays = (key, count) => {
    const date = civil(key);
    date.setUTCDate(date.getUTCDate() + count);
    return keyOf(date);
  };
  const weekStart = key => addDays(key, -((civil(key).getUTCDay() + 6) % 7));
  function addMonths(key, count) {
    const date = civil(key);
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + count);
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, last));
    return keyOf(date);
  }
  const node = (tag, className, text) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text != null) result.textContent = text;
    return result;
  };
  const button = (className, text, action) => {
    const result = node('button', className, text);
    result.type = 'button';
    result.addEventListener('click', action);
    return result;
  };
  let anchor = dayKey(new Date());
  let view = 'month';
  let cached;
  let pending;
  let mounted;
  let dialog;
  let nextEventTimer;

  function validate(data) {
    if (data?.schemaVersion !== 1 || data.timeZone !== timeZone || !Array.isArray(data.events)) throw new Error('Invalid events document');
    const ids = new Set();
    return data.events.map(event => {
      if (!event || typeof event.id !== 'string' || !event.id.trim() || ids.has(event.id)) throw new Error('Invalid event id');
      ids.add(event.id);
      if (typeof event.startsAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(event.startsAt)) throw new Error('Event needs an explicit offset');
      const instant = new Date(event.startsAt);
      // Date.parse normalizes dates such as February 30; reject those too.
      const datePart = event.startsAt.slice(0, 10);
      if (!Number.isFinite(instant.getTime()) || keyOf(civil(datePart)) !== datePart || Number(event.startsAt.slice(11, 13)) > 23) throw new Error('Invalid event date');
      if (event.mock !== undefined && typeof event.mock !== 'boolean') throw new Error('Invalid mock flag');
      for (const field of ['name', 'location', 'extraInfo']) {
        const translations = event[field] ?? {};
        if (typeof translations !== 'object' || Array.isArray(translations) ||
            !locales.every(code => translations[code] == null || typeof translations[code] === 'string')) {
          throw new Error('Invalid event translations');
        }
        const required = field !== 'extraInfo' || locales.some(code => translations[code]?.trim());
        if (required && !translations.es?.trim()) throw new Error('Missing Spanish event text: ' + field);
      }
      return {...event, instant, date: dayKey(instant)};
    }).sort((a, b) => a.instant - b.instant || a.id.localeCompare(b.id));
  }
  async function loadEvents() {
    if (cached) return cached;
    if (!pending) pending = (async () => {
      const data = await AwenData.read('events/events.json');
      if (!cached) cached = validate(data);
      return cached;
    })().finally(() => { pending = null; });
    return pending;
  }
  function unmount() {
    clearTimeout(nextEventTimer);
    mounted = null;
    if (dialog) {
      dialog.close();
      dialog.remove();
      dialog = null;
    }
  }
  function eventText(tag, translations, language) {
    const result = node(tag);
    for (const code of [language, 'en', 'es']) {
      const text = translations?.[code]?.trim();
      if (text) {
        result.textContent = text;
        result.lang = code;
        break;
      }
    }
    return result;
  }
  function nextEventRow({language, t}) {
    const row = node('aside', 'next-event');
    row.setAttribute('aria-label', t('nextEvent'));
    const inner = node('div', 'next-event-inner wrap');
    const info = node('p', 'next-event-info', t('loading'));
    info.setAttribute('aria-live', 'polite');
    info.setAttribute('aria-busy', 'true');
    const link = node('a', 'next-event-link', t('fullCalendar'));
    link.href = '#calendario';
    inner.append(info, link);
    row.append(inner);

    let next;
    link.addEventListener('click', event => {
      if (next && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        anchor = next.date;
        view = 'month';
      }
    });
    function show(events) {
      if (!row.isConnected) return;
      const now = Date.now();
      next = events.find(event => event.instant.getTime() > now);
      if (next) {
        const name = eventText('strong', next.name, language);
        name.title = name.textContent;
        info.replaceChildren(name);
        if (next.mock) info.append(node('span', 'sr-only', t('mock')));
        // A tab can stay open past the event's start. Cap long delays at the browser timer limit.
        nextEventTimer = setTimeout(() => show(events), Math.min(next.instant.getTime() - now, 2147483647));
      } else {
        info.textContent = t('noUpcoming');
      }
      info.setAttribute('aria-busy', 'false');
    }
    loadEvents().then(show).catch(() => {
      if (!row.isConnected) return;
      info.textContent = t('eventSummaryUnavailable');
      info.setAttribute('aria-busy', 'false');
    });
    return row;
  }
  function render({language, t}) {
    const root = node('section', 'calendar wrap');
    const session = {root};
    mounted = session;
    let events;
    const number = new Intl.NumberFormat(language);
    const plurals = new Intl.PluralRules(language);
    const format = (key, options) => new Intl.DateTimeFormat(language, {...options, timeZone: 'UTC'}).format(civil(key));
    const fullDate = key => format(key, {dateStyle: 'full'});
    const time = event => new Intl.DateTimeFormat(language, {timeZone, hour: '2-digit', minute: '2-digit'}).format(event.instant);
    const countText = (count, prefix = 'eventCount') => {
      const category = plurals.select(count);
      return t(prefix + category[0].toUpperCase() + category.slice(1), {count: number.format(count)});
    };
    const onDay = key => events.filter(event => event.date === key);
    const heading = node('header', 'calendar-heading');
    heading.append(node('p', 'location', 'AWEN · Maldonado'), node('h1', '', t('title')), node('p', 'calendar-intro', t('subtitle')));
    const toolbar = node('div', 'calendar-toolbar');
    const navigation = node('div', 'calendar-navigation');
    const previous = button('calendar-arrow', '‹', () => move(-1));
    const next = button('calendar-arrow', '›', () => move(1));
    const today = button('calendar-today', t('today'), () => { anchor = dayKey(new Date()); draw(); });
    const period = node('h2', 'calendar-period');
    period.id = 'calendar-period';
    period.setAttribute('aria-live', 'polite');
    navigation.append(previous, next, today);
    const views = node('div', 'calendar-views');
    views.setAttribute('role', 'group');
    views.setAttribute('aria-label', t('views'));
    const viewButtons = ['day', 'week', 'month'].map(mode => {
      const control = button('', t(mode), () => { view = mode; draw(); });
      control.dataset.view = mode;
      views.append(control);
      return control;
    });
    toolbar.append(navigation, period, views);
    const meta = node('div', 'calendar-meta');
    const legend = node('span', 'calendar-legend', t('hasEvents'));
    const pickerLabel = node('label', 'calendar-date-picker', t('chooseDate'));
    const picker = node('input');
    picker.type = 'date';
    picker.min = '1900-01-01';
    picker.max = '2100-12-31';
    picker.addEventListener('change', () => {
      if (picker.value && picker.validity.valid) { anchor = picker.value; draw(); }
    });
    pickerLabel.append(picker);
    meta.append(legend, pickerLabel);
    const body = node('div', 'calendar-body');
    body.setAttribute('aria-labelledby', period.id);
    const status = node('p', 'calendar-status');
    status.setAttribute('role', 'status');
    const notice = node('p', 'calendar-mock-notice', t('mockNotice'));
    notice.hidden = true;
    root.append(heading, toolbar, meta, body, status, node('p', 'calendar-timezone', t('timezone')), notice);

    function move(direction) {
      anchor = view === 'month' ? addMonths(anchor, direction) : addDays(anchor, direction * (view === 'week' ? 7 : 1));
      draw();
    }
    function syncControls() {
      picker.value = anchor;
      const suffix = view[0].toUpperCase() + view.slice(1);
      previous.setAttribute('aria-label', t('previous' + suffix));
      next.setAttribute('aria-label', t('next' + suffix));
      previous.disabled = (view === 'month' ? addMonths(anchor, -1) : addDays(anchor, view === 'week' ? -7 : -1)) < picker.min;
      next.disabled = (view === 'month' ? addMonths(anchor, 1) : addDays(anchor, view === 'week' ? 7 : 1)) > picker.max;
      viewButtons.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.view === view)));
      period.textContent = view === 'month' ? format(anchor, {month: 'long', year: 'numeric'}) : view === 'day' ? fullDate(anchor) : t('weekRange', {
        start: format(weekStart(anchor), {day: 'numeric', month: 'short', year: 'numeric'}),
        end: format(addDays(weekStart(anchor), 6), {day: 'numeric', month: 'short', year: 'numeric'})
      });
    }
    function openDay(key, trigger) {
      anchor = key;
      picker.value = anchor;
      const items = onDay(key);
      const popup = node('dialog', 'event-dialog');
      dialog = popup;
      popup.setAttribute('aria-labelledby', 'event-dialog-title');
      const header = node('header', 'event-dialog-header');
      const titles = node('div');
      const title = node('h2', '', fullDate(key));
      title.id = 'event-dialog-title';
      titles.append(node('p', 'event-eyebrow', t('details')), title);
      const close = button('event-close', '×', () => popup.close());
      close.setAttribute('aria-label', t('close'));
      close.autofocus = true;
      header.append(titles, close);
      popup.append(header);
      for (const event of items) {
        const article = node('article', 'event-detail');
        if (event.mock) article.append(node('span', 'event-mock', t('mock')));
        article.append(eventText('h3', event.name, language));
        const fields = node('dl');
        for (const [label, value] of [
          ['date', node('dd', '', fullDate(event.date))],
          ['time', node('dd', '', time(event))],
          ['place', eventText('dd', event.location, language)],
          ['extraInfo', eventText('dd', event.extraInfo, language)]
        ]) {
          if (!value.textContent) continue;
          const row = node('div');
          row.append(node('dt', '', t(label)), value);
          fields.append(row);
        }
        article.append(fields);
        popup.append(article);
      }
      if (!items.length) popup.append(node('p', 'calendar-empty', t('emptyDay')));
      popup.append(node('p', 'calendar-timezone', t('timezone')));
      popup.addEventListener('click', event => {
        const rect = popup.getBoundingClientRect();
        if (event.target === popup && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) popup.close();
      });
      popup.addEventListener('close', () => {
        popup.remove();
        if (dialog === popup) dialog = null;
        if (mounted === session) {
          draw();
          const eventCard = trigger.dataset.eventId && Array.from(body.querySelectorAll('[data-event-id]')).find(card => card.dataset.eventId === trigger.dataset.eventId);
          const restore = eventCard || body.querySelector('[data-date="' + key + '"]') || viewButtons.find(control => control.dataset.view === view);
          restore.focus({preventScroll: true});
        } else if (trigger.isConnected) trigger.focus({preventScroll: true});
      }, {once: true});
      root.append(popup);
      popup.showModal();
    }
    function dayButton(key, className, items) {
      const control = button(className, null, () => openDay(key, control));
      control.dataset.date = key;
      control.disabled = key < picker.min || key > picker.max;
      control.setAttribute('aria-label', t(items.length ? 'dayWithEvents' : 'dayWithoutEvents', {date: fullDate(key), count: countText(items.length)}));
      if (key === dayKey(new Date())) control.setAttribute('aria-current', 'date');
      return control;
    }
    function month() {
      const table = node('table', 'calendar-month');
      table.setAttribute('aria-labelledby', period.id);
      const head = node('thead');
      const weekdays = node('tr');
      for (let i = 0; i < 7; i++) {
        const th = node('th');
        th.scope = 'col';
        const day = addDays('2026-11-09', i); // A Monday, independent of displayed month.
        const label = node('abbr', '', format(day, {weekday: 'short'}));
        label.title = format(day, {weekday: 'long'});
        th.append(label);
        weekdays.append(th);
      }
      head.append(weekdays);
      const grid = node('tbody');
      const first = anchor.slice(0, 7) + '-01';
      const start = weekStart(first);
      const afterMonth = addMonths(first, 1);
      const days = Math.ceil((civil(afterMonth) - civil(start)) / 86400000 / 7) * 7;
      for (let i = 0; i < days; i += 7) {
        const row = node('tr');
        for (let j = 0; j < 7; j++) {
          const key = addDays(start, i + j);
          const items = onDay(key);
          const cell = node('td', (items.length ? 'has-events ' : '') + (key.slice(0, 7) !== anchor.slice(0, 7) ? 'outside-month' : ''));
          const control = dayButton(key, 'calendar-date', items);
          const date = node('span', 'calendar-day-number', number.format(civil(key).getUTCDate()));
          control.append(date);
          for (const event of items.slice(0, 2)) {
            const summary = node('span', 'calendar-event-preview');
            summary.append(node('span', 'calendar-event-time', time(event)), eventText('span', event.name, language));
            control.append(summary);
          }
          if (items.length > 2) control.append(node('span', 'calendar-more', countText(items.length - 2, 'more')));
          if (items.length) {
            const count = node('span', 'calendar-count', number.format(items.length));
            count.setAttribute('aria-hidden', 'true'); // The button already announces the full localized count.
            count.title = countText(items.length);
            control.append(count);
          }
          cell.append(control);
          row.append(cell);
        }
        grid.append(row);
      }
      table.append(head, grid);
      return table;
    }
    function agenda() {
      const list = node('div', 'calendar-agenda calendar-agenda-view-' + view);
      const start = view === 'week' ? weekStart(anchor) : anchor;
      for (let i = 0; i < (view === 'week' ? 7 : 1); i++) {
        const key = addDays(start, i);
        const items = onDay(key);
        const section = node('section', 'calendar-agenda-day' + (items.length ? ' has-events' : ''));
        const title = node('h3');
        const control = dayButton(key, 'calendar-agenda-date', items);
        control.append(node('span', '', format(key, {weekday: 'long'})), node('strong', '', format(key, {day: 'numeric', month: 'short'})));
        title.append(control);
        section.append(title);
        if (!items.length) section.append(node('p', 'calendar-empty', t('emptyDay')));
        for (const event of items) {
          const card = button('calendar-event-card', null, () => openDay(key, card));
          card.dataset.eventId = event.id;
          card.append(node('span', 'calendar-event-time', time(event)), eventText('strong', event.name, language), eventText('span', event.location, language));
          if (event.mock) card.append(node('span', 'event-mock', t('mock')));
          section.append(card);
        }
        list.append(section);
      }
      return list;
    }
    function draw() {
      syncControls();
      if (!events) return;
      body.replaceChildren(view === 'month' ? month() : agenda());
      body.setAttribute('aria-busy', 'false');
      const start = view === 'month' ? anchor.slice(0, 7) + '-01' : view === 'week' ? weekStart(anchor) : anchor;
      const end = view === 'month' ? addMonths(start, 1) : addDays(start, view === 'week' ? 7 : 1);
      const visible = events.filter(event => event.date >= start && event.date < end);
      status.textContent = visible.length ? countText(visible.length) : t(view === 'day' ? 'emptyDay' : 'emptyPeriod');
      notice.hidden = !events.some(event => event.mock);
    }
    async function load() {
      body.setAttribute('aria-busy', 'true');
      body.replaceChildren();
      status.textContent = t('loading');
      try {
        events = await loadEvents();
        if (mounted === session) draw();
      } catch {
        if (mounted !== session) return;
        body.setAttribute('aria-busy', 'false');
        status.textContent = '';
        const error = node('div', 'calendar-error');
        error.setAttribute('role', 'alert');
        error.append(node('p', '', t('loadError')), button('btn', t('retry'), load));
        body.replaceChildren(error);
      }
    }
    syncControls();
    load();
    return root;
  }
  function replaceEvents(data) {
    cached = validate(data);
  }
  return {render, nextEventRow, unmount, replaceEvents};
})();
