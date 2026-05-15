import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const getText = (el) => el?.querySelector('p')?.textContent?.trim() || el?.textContent?.trim() || '';

export default function decorate(block) {
  // Read fields by data-aue-prop (UE) or by row index (published site)
  const find = (prop, index) =>
    block.querySelector(`[data-aue-prop="${prop}"]`) || block.children[index];

  const imageRow = find('image', 0);
  const nameRow = find('name', 1);
  const roleRow = find('role', 2);
  const ctaRow = find('cta', 3);

  const card = document.createElement('div');
  card.className = 'profile-card-inner';

  // Avatar
  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'profile-card-avatar';
  const img = imageRow?.querySelector('img');
  if (img) {
    moveInstrumentation(imageRow, avatarWrapper);
    const optimizedPic = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    avatarWrapper.append(optimizedPic);
  }
  card.append(avatarWrapper);

  // Name
  const nameWrapper = document.createElement('div');
  nameWrapper.className = 'profile-card-name';
  moveInstrumentation(nameRow, nameWrapper);
  const nameHeading = document.createElement('h3');
  nameHeading.textContent = getText(nameRow);
  nameWrapper.append(nameHeading);
  card.append(nameWrapper);

  // Role
  const roleWrapper = document.createElement('div');
  roleWrapper.className = 'profile-card-role';
  moveInstrumentation(roleRow, roleWrapper);
  const roleP = document.createElement('p');
  roleP.textContent = getText(roleRow);
  roleWrapper.append(roleP);
  card.append(roleWrapper);

  // CTA (optional)
  const ctaText = getText(ctaRow);
  if (ctaText) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'profile-card-cta';
    moveInstrumentation(ctaRow, ctaWrapper);
    const link = document.createElement('a');
    link.className = 'button';
    link.href = '#';
    link.textContent = ctaText;
    link.addEventListener('click', (e) => e.preventDefault());
    ctaWrapper.append(link);
    card.append(ctaWrapper);
  }

  block.innerHTML = '';
  block.append(card);
}
