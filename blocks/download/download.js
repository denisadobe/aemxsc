import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_LABEL = 'Download';

const filenameFromPath = (path) => {
  if (!path || typeof path !== 'string') return '';
  const cleanPath = path.split('?')[0];
  const filename = cleanPath.split('/').pop() || '';
  return decodeURIComponent(filename);
};

const getFilePath = (block, config) => {
  const configPath = config.file || config.reference || '';
  if (configPath) return configPath;

  const anchor = block.querySelector(':scope > div:first-child a[href]');
  if (anchor?.getAttribute('href')) return anchor.getAttribute('href');

  const textPath = block.querySelector(':scope > div:first-child')?.textContent?.trim();
  return textPath || '';
};

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const config = readBlockConfig(block);
  const filePath = getFilePath(block, config);
  const authoredLabel = (config.label || config.linktext || '').trim();
  const label = authoredLabel || filenameFromPath(filePath) || DEFAULT_LABEL;
  const variant = (config.variant || 'button').trim();
  const openInNewTab = `${config.newtab || ''}`.toLowerCase() === 'true';

  if (!filePath) {
    block.innerHTML = '<p>Arquivo de download não configurado.</p>';
    return;
  }

  const target = openInNewTab ? '_blank' : '_self';
  const rel = openInNewTab ? 'noopener noreferrer' : '';

  block.innerHTML = `
    <div class="download-inner ${variant}">
      <a href="${filePath}" class="download-link" download target="${target}" rel="${rel}">
        ${label}
      </a>
    </div>
  `;
}
