import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const [imageRow, nameRow, roleRow, bioRow, ctaRow] = rows;

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

  // Bio (optional)
  if (bioRow && bioRow.textContent.trim()) {
    const bioWrapper = document.createElement('div');
    bioWrapper.className = 'profile-card-bio';
    moveInstrumentation(bioRow, bioWrapper);
    bioWrapper.innerHTML = bioRow.querySelector('div')?.innerHTML || bioRow.innerHTML;
    card.append(bioWrapper);
  }

  // CTA Button (optional)
  if (ctaRow && ctaRow.textContent.trim()) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'profile-card-cta';
    moveInstrumentation(ctaRow, ctaWrapper);
    ctaWrapper.innerHTML = ctaRow.querySelector('div')?.innerHTML || ctaRow.innerHTML;
    card.append(ctaWrapper);
  }

  block.textContent = '';
  block.append(card);
}
