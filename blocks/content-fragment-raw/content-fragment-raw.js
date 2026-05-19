import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';
import { getHostname } from '../../scripts/utils.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const renderValue = (value) => {
  if (value === null || value === undefined) return '<span class="cf-raw-null">null</span>';

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
];

const isContentField = (key) => !TECHNICAL_FIELD_PATTERNS.some((pattern) => pattern.test(key));

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

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      block.innerHTML = `<p class="cf-raw-error">Failed to load Content Fragment (${response.status}).</p>`;
      return;
    }

    const data = await response.json();
    const entries = Object.entries(data).filter(([key]) => isContentField(key));

    if (!entries.length) {
      block.innerHTML = '<p class="cf-raw-empty">No content fields found for this variation.</p>';
      return;
    }

    const rows = entries
      .map(([key, value]) => `
        <div class="cf-raw-row">
          <dt class="cf-raw-key">${escapeHtml(key)}</dt>
          <dd class="cf-raw-value">${renderValue(value)}</dd>
        </div>
      `)
      .join('');

    block.innerHTML = `<dl class="cf-raw-list">${rows}</dl>`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading raw content fragment data', error);
    block.innerHTML = '<p class="cf-raw-error">Error loading Content Fragment data.</p>';
  }
}
