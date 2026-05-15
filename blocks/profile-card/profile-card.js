import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const [imageRow, nameRow, roleRow, cargoRow, ctaRow] = rows;

  const card = document.createElement('div');
  card.className = 'profile-card-inner';

  // Avatar
  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'profile-card-avatar';
  if (imageRow) {
    moveInstrumentation(imageRow, avatarWrapper);
    const img = imageRow.querySelector('img');
    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '200' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
      avatarWrapper.append(imageRow.querySelector('picture') || imageRow.firstElementChild);
    }
  }
  card.append(avatarWrapper);

  // Name
  const nameWrapper = document.createElement('div');
  nameWrapper.className = 'profile-card-name';
  if (nameRow) {
    moveInstrumentation(nameRow, nameWrapper);
    const nameEl = document.createElement('h3');
    nameEl.textContent = nameRow.querySelector('p')?.textContent?.trim() || nameRow.textContent?.trim();
    nameWrapper.append(nameEl);
  }
  card.append(nameWrapper);

  // Role
  const roleWrapper = document.createElement('div');
  roleWrapper.className = 'profile-card-role';
  if (roleRow) {
    moveInstrumentation(roleRow, roleWrapper);
    const roleEl = document.createElement('p');
    roleEl.textContent = roleRow.querySelector('p')?.textContent?.trim() || roleRow.textContent?.trim();
    roleWrapper.append(roleEl);
  }
  card.append(roleWrapper);

  // Cargo (optional)
  if (cargoRow && cargoRow.textContent.trim()) {
    const cargoWrapper = document.createElement('div');
    cargoWrapper.className = 'profile-card-cargo';
    moveInstrumentation(cargoRow, cargoWrapper);
    const cargoEl = document.createElement('p');
    cargoEl.textContent = cargoRow.querySelector('p')?.textContent?.trim() || cargoRow.textContent?.trim();
    cargoWrapper.append(cargoEl);
    card.append(cargoWrapper);
  }

  // CTA — richtext with a link; extract <a>, add button class
  if (ctaRow && ctaRow.textContent.trim()) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'profile-card-cta';
    moveInstrumentation(ctaRow, ctaWrapper);
    const link = ctaRow.querySelector('a');
    if (link) {
      link.classList.add('button');
      ctaWrapper.append(link);
    }
    card.append(ctaWrapper);
  }

  block.textContent = '';
  block.append(card);
}
