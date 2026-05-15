import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Returns element by data-aue-prop (UE context) or falls back to row by index (published site)
function getField(block, prop, fallbackIndex) {
  return block.querySelector(`[data-aue-prop="${prop}"]`)
    || block.children[fallbackIndex]?.querySelector('div')
    || block.children[fallbackIndex];
}

export default function decorate(block) {
  const imageEl = getField(block, 'image', 0);
  const nameEl = getField(block, 'name', 1);
  const roleEl = getField(block, 'role', 2);
  const cargoEl = getField(block, 'cargo', 3);
  const ctaEl = getField(block, 'cta', 4);

  const card = document.createElement('div');
  card.className = 'profile-card-inner';

  // Avatar
  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'profile-card-avatar';
  if (imageEl) {
    moveInstrumentation(imageEl, avatarWrapper);
    const img = imageEl.querySelector('img');
    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '200' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
      avatarWrapper.append(imageEl.querySelector('picture') || imageEl.firstElementChild);
    }
  }
  card.append(avatarWrapper);

  // Name
  const nameWrapper = document.createElement('div');
  nameWrapper.className = 'profile-card-name';
  if (nameEl) {
    moveInstrumentation(nameEl, nameWrapper);
    const nameHeading = document.createElement('h3');
    nameHeading.textContent = nameEl.querySelector('p')?.textContent?.trim() || nameEl.textContent?.trim();
    nameWrapper.append(nameHeading);
  }
  card.append(nameWrapper);

  // Role
  const roleWrapper = document.createElement('div');
  roleWrapper.className = 'profile-card-role';
  if (roleEl) {
    moveInstrumentation(roleEl, roleWrapper);
    const roleP = document.createElement('p');
    roleP.textContent = roleEl.querySelector('p')?.textContent?.trim() || roleEl.textContent?.trim();
    roleWrapper.append(roleP);
  }
  card.append(roleWrapper);

  // Cargo (optional)
  const cargoText = cargoEl?.querySelector('p')?.textContent?.trim() || cargoEl?.textContent?.trim();
  if (cargoText) {
    const cargoWrapper = document.createElement('div');
    cargoWrapper.className = 'profile-card-cargo';
    moveInstrumentation(cargoEl, cargoWrapper);
    const cargoP = document.createElement('p');
    cargoP.textContent = cargoText;
    cargoWrapper.append(cargoP);
    card.append(cargoWrapper);
  }

  // CTA (optional)
  const ctaText = ctaEl?.querySelector('p')?.textContent?.trim() || ctaEl?.textContent?.trim();
  if (ctaText) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'profile-card-cta';
    moveInstrumentation(ctaEl, ctaWrapper);
    const link = document.createElement('a');
    link.className = 'button';
    link.href = '#';
    link.textContent = ctaText;
    link.addEventListener('click', (e) => e.preventDefault());
    ctaWrapper.append(link);
    card.append(ctaWrapper);
  }

  block.textContent = '';
  block.append(card);
}
