'use strict';

const AwenData = (() => {
  const bookPath = 'assets/book.json';
  const eventsPath = 'events/events.json';
  let bundlePromise;
  let selectedData;

  function bundledData() {
    if (!bundlePromise) {
      bundlePromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/file-data.js';
        script.onload = () => {
          script.remove();
          if (globalThis.AwenFileData) resolve(globalThis.AwenFileData);
          else reject(new Error('Missing local site data'));
        };
        script.onerror = () => {
          script.remove();
          reject(new Error('Could not load local site data'));
        };
        document.head.append(script);
      }).catch(error => {
        bundlePromise = undefined;
        throw error;
      });
    }
    return bundlePromise;
  }

  async function read(path) {
    if (location.protocol === 'file:') {
      const data = selectedData || await bundledData();
      const key = path.split('?')[0];
      if (!Object.hasOwn(data, key)) throw new Error('Missing data: ' + key);
      return data[key];
    }
    const response = await fetch(path, {cache: 'no-cache'});
    if (!response.ok) throw new Error(path);
    return response.json();
  }

  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const strings = values => Array.isArray(values) && values.every(value => typeof value === 'string');
  const parameters = message => (message.match(/\{\w+\}/g) || []).sort().join(',');

  function validateMessages(messages, reference) {
    if (!record(messages)) throw new Error('Missing messages');
    for (const [key, source] of Object.entries(reference)) {
      const message = messages[key];
      if (typeof message !== 'string' || !message.trim() || parameters(message) !== parameters(source)) {
        throw new Error('Invalid message: ' + key);
      }
    }
  }

  function validateLocale(locale, reference, spanish) {
    for (const group of ['ui', 'calendar']) {
      validateMessages(locale[group], reference[group]);
      // Additional messages are allowed when every language supplies them.
      validateMessages(locale[group], spanish[group]);
      if (Object.keys(locale[group]).length !== Object.keys(spanish[group]).length) throw new Error('Inconsistent messages');
    }
    if (!strings(locale.chapters) || !record(locale.pages)) throw new Error('Invalid guide');
    for (const key of Object.keys(reference.pages)) {
      const page = locale.pages[key];
      if (!page || typeof page.title !== 'string' || !page.title.trim()) throw new Error('Missing page');
      for (const field of ['paragraphs', 'headings', 'tips', 'captions', 'links']) {
        if (!strings(page[field])) throw new Error('Invalid page content');
      }
      if (page.tipAt !== undefined && !(Array.isArray(page.tipAt) && page.tipAt.every(Number.isInteger))) {
        throw new Error('Invalid tip positions');
      }
    }
  }

  function validateResources(book) {
    if (!record(book?.resources)) throw new Error('Missing guide resources');
    for (const links of Object.values(book.resources)) {
      if (!Array.isArray(links)) throw new Error('Invalid resource list');
      for (const link of links) {
        if (!record(link) || typeof link.url !== 'string' || !['http:', 'https:'].includes(new URL(link.url).protocol)) {
          throw new Error('Invalid resource link');
        }
        if (!['x', 'y', 'width', 'height'].every(field => Number.isFinite(link[field]))) throw new Error('Invalid link area');
      }
    }
  }

  async function readFolder(fileList) {
    const files = Array.from(fileList);
    const reference = await bundledData();
    const documents = {};
    const inputs = new Map();
    for (const file of files) {
      const path = file.webkitRelativePath.split('/').slice(1).join('/');
      if (Object.hasOwn(reference, path)) inputs.set(path, file);
    }
    await Promise.all(Object.keys(reference).map(async path => {
      const file = inputs.get(path);
      if (!file) throw new Error('Missing file: ' + path);
      documents[path] = JSON.parse(await file.text());
    }));
    const spanish = documents['locales/es.json'];
    for (const path of Object.keys(reference)) {
      if (path.startsWith('locales/')) validateLocale(documents[path], reference[path], spanish);
    }
    validateResources(documents[bookPath]);
    if (!Array.isArray(documents[eventsPath]?.events)) throw new Error('Missing events');
    return documents;
  }

  function useFolder(documents) {
    selectedData = documents;
  }

  return {read, readFolder, useFolder};
})();
