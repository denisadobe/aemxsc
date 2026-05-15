import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const getText = (el) => el?.querySelector('p')?.textContent?.trim() || el?.textContent?.trim() || '';

const find = (block, prop, index) =>
  block.querySelector(`[data-aue-prop="${prop}"]`) || block.children[index];

export default function decorate(block) {
  const imageRow = find(block, 'image', 0);
  const nameRow = find(block, 'personName', 1);
  const roleRow = find(block, 'role', 2);
  const ctaRow = find(block, 'cta', 3);

  const card = document.createElement('div');
  card.className = 'profile-card-inner';

  // Avatar — query img anywhere in the block to avoid nesting/prop issues
  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'profile-card-avatar';
  const img = block.querySelector('img');
  if (img) {
    moveInstrumentation(imageRow, avatarWrapper);
    const optimizedPic = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    avatarWrapper.append(optimizedPic);
  }
  card.append(avatarWrapper);

  // Nome
  const nameWrapper = document.createElement('div');
  nameWrapper.className = 'profile-card-name';
  moveInstrumentation(nameRow, nameWrapper);
  const nameHeading = document.createElement('h3');
  nameHeading.textContent = getText(nameRow);
  nameWrapper.append(nameHeading);
  card.append(nameWrapper);

  // Cargo
  const roleWrapper = document.createElement('div');
  roleWrapper.className = 'profile-card-role';
  moveInstrumentation(roleRow, roleWrapper);
  const roleP = document.createElement('p');
  roleP.textContent = getText(roleRow);
  roleWrapper.append(roleP);
  card.append(roleWrapper);

  // CTA (opcional)
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
