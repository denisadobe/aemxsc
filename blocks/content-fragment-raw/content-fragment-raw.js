import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment, moveInstrumentation } from '../../scripts/scripts.js';
import { getHostname } from '../../scripts/utils.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const isLikelyImagePath = (value) => typeof value === 'string'
  && /^\/content\/dam\//i.test(value)
  && /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(value.split('?')[0]);

const sanitizeHtml = (htmlString) => {
  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(htmlString, 'text/html');
  const blockedTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style'];

  blockedTags.forEach((tag) => {
    documentFragment.querySelectorAll(tag).forEach((node) => node.remove());
  });

  documentFragment.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const { name, value } = attribute;
      const isEventHandler = /^on/i.test(name);
      const isJsUrl = /^(href|src)$/i.test(name) && /^\s*javascript:/i.test(value);
      if (isEventHandler || isJsUrl) {
        element.removeAttribute(name);
      }
    });
  });

  return documentFragment.body.innerHTML;
};

const renderValue = (value) => {
  if (value === null || value === undefined) return '<span class="cf-raw-null">null</span>';

  if (isLikelyImagePath(value)) {
    return `<img src="${escapeHtml(value)}" alt="" loading="lazy">`;
  }

  if (typeof value === 'object') {
    const rawJson = JSON.stringify(value, null, 2);
    return `<pre>${escapeHtml(rawJson)}</pre>`;
  }

  return `<span>${escapeHtml(value)}</span>`;
};

const TECHNICAL_FIELD_PATTERNS = [
  /^jcr:/i,
  /^cq:/i,
  /^sling:/i,
  /^dc:/i,
  /^dam:/i,
  /^_./,
  /lastmodified/i,
  /lastmodifiedby/i,
  /created/i,
  /createdby/i,
  /version/i,
  /primarytype/i,
  /mixin/i,
  /uuid/i,
  /@contenttype$/i,
];

const isContentField = (key) => !TECHNICAL_FIELD_PATTERNS.some((pattern) => pattern.test(key));
const inferAueType = (value, contentType) => {
  if (contentType === 'text/html') return 'richtext';
  if (isLikelyImagePath(value)) return 'media';
  return 'text';
};

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const contentPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();
  const variation = block.querySelector(':scope div:nth-child(2) > div')?.textContent?.trim() || 'master';

  block.innerHTML = '';

  if (!contentPath) {
    block.innerHTML = '<p class="cf-raw-error">Content Fragment path is required.</p>';
    return;
  }

  const isAuthor = isAuthorEnvironment();
  const authorUrl = getMetadata('authorurl') || '';
  const hostnameFromPlaceholders = await getHostname();
  const hostname = hostnameFromPlaceholders || getMetadata('hostname') || '';
  const publishUrl = hostname.replace('author', 'publish').replace(/\/$/, '');
  const baseUrl = isAuthor ? authorUrl : publishUrl;

  const endpoint = `${baseUrl}${contentPath}/jcr:content/data/${variation}.json`;
  const itemId = `urn:aemconnection:${contentPath}/jcr:content/data/${variation}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      block.innerHTML = `<p class="cf-raw-error">Failed to load Content Fragment (${response.status}).</p>`;
      return;
    }

    const data = await response.json();
    const entries = Object.entries(data).filter(([key]) => isContentField(key));
    const contentTypes = Object.entries(data)
      .filter(([key]) => /@contenttype$/i.test(key))
      .reduce((acc, [key, value]) => {
        acc[key.replace(/@contenttype$/i, '')] = value;
        return acc;
      }, {});

    if (!entries.length) {
      block.innerHTML = '<p class="cf-raw-empty">No content fields found for this variation.</p>';
      return;
    }

    const contents = entries
      .map(([key, value]) => {
        const contentType = contentTypes[key];
        const aueType = inferAueType(value, contentType);
        const renderedValue = contentType === 'text/html' && typeof value === 'string'
          ? sanitizeHtml(value)
          : renderValue(value);

        return `
          <div
            class="cf-raw-item"
            data-aue-prop="${escapeHtml(key)}"
            data-aue-label="${escapeHtml(key)}"
            data-aue-type="${aueType}"
          >
            ${renderedValue}
          </div>
        `;
      })
      .join('');

    block.setAttribute('data-aue-type', 'container');
    block.innerHTML = `
      <div
        class="cf-raw-list"
        data-aue-resource="${escapeHtml(itemId)}"
        data-aue-label="${escapeHtml(variation || 'Elements')}"
        data-aue-type="reference"
        data-aue-filter="contentfragment"
      >
        ${contents}
      </div>
    `;

    if (!isAuthor) {
      moveInstrumentation(block, null);
      block.querySelectorAll('*').forEach((elem) => moveInstrumentation(elem, null));
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading raw content fragment data', error);
    block.innerHTML = '<p class="cf-raw-error">Error loading Content Fragment data.</p>';
  }
}
