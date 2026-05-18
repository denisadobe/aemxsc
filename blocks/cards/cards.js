/*
import { patternDecorate } from '../../scripts/blockTemplate.js';

export default async function decorate(block) {
  patternDecorate(block);
}
*/

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const CTA_STYLE_MAP = {
  button: 'cta-button',
  'button-secondary': 'cta-button-secondary',
  'button-dark': 'cta-button-dark',
  'cta-button': 'cta-button',
  'cta-button-secondary': 'cta-button-secondary',
  'cta-button-dark': 'cta-button-dark',
  'cta-link': 'cta-link',
  default: 'default',
};
const LABELS = {
  esg: 'ESG',
  seguranca: 'Segurança',
  investidores: 'Investidores',
  urgente: 'Urgente',
};

const normalize = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    let cardStyle = '';
    let ctaStyle = 'default';
    let label = '';

    // Process the li children to identify and style them correctly
    [...li.children].forEach((div, index) => {
      // First div (index 0) - Image
      if (index === 0) {
        div.className = 'cards-card-image';
      } else if (index === 1) {
        // Second div (index 1) - Content with button
        div.className = 'cards-card-body';
      } else if (index > 1) {
        // Configuration divs (style, CTA, label)
        div.className = 'cards-config';
        const p = div.querySelector('p');
        const value = p?.textContent?.trim() || '';
        const normalizedValue = normalize(value);

        if (value && CTA_STYLE_MAP[value]) {
          ctaStyle = CTA_STYLE_MAP[value];
        } else if (normalizedValue in LABELS || normalizedValue === 'nenhum' || normalizedValue === 'none') {
          label = normalizedValue;
        } else if (value && value !== 'default' && !cardStyle) {
          cardStyle = value;
        }

        if (p) p.style.display = 'none';
      }
    });

    if (cardStyle) {
      li.classList.add(cardStyle);
    }

    if (label && label !== 'nenhum' && label !== 'none') {
      const imageWrapper = li.querySelector('.cards-card-image');
      if (imageWrapper) {
        const badge = document.createElement('span');
        badge.className = `cards-card-label cards-card-label-${label}`;
        badge.textContent = LABELS[label];
        imageWrapper.append(badge);
      }
    }

    // Apply CTA styles to button containers
    const buttonContainers = li.querySelectorAll('p.button-container');
    buttonContainers.forEach((buttonContainer) => {
      // Remove any existing CTA classes
      buttonContainer.classList.remove('default', 'cta-button', 'cta-button-secondary', 'cta-button-dark', 'cta-default');
      // Add the correct CTA class
      buttonContainer.classList.add(ctaStyle);
    });

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
