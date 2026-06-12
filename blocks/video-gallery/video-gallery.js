function cleanTitle(raw, path) {
  if (raw) return raw;
  return (path.split('/').pop() || '').replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

function buildCard(asset) {
  const path = asset['jcr:path'] || '';
  const title = cleanTitle(asset['jcr:content/metadata/dc:title'], path);
  const thumbnail = `${path}/_jcr_content/renditions/cq5dam.thumbnail.319.319.png`;

  const wrap = document.createElement('div');
  wrap.className = 'video-gallery-item';

  const thumb = document.createElement('div');
  thumb.className = 'video-gallery-thumb';

  const img = document.createElement('img');
  img.src = thumbnail;
  img.alt = title;
  img.loading = 'lazy';
  img.onerror = () => { img.style.display = 'none'; };

  const playBtn = document.createElement('button');
  playBtn.className = 'video-gallery-play';
  playBtn.setAttribute('aria-label', `Reproduzir: ${title}`);
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  thumb.append(img, playBtn);

  const info = document.createElement('div');
  info.className = 'video-gallery-info';

  const h3 = document.createElement('h3');
  h3.textContent = title;

  const badge = document.createElement('span');
  badge.className = 'video-gallery-badge';
  badge.textContent = (path.split('.').pop() || 'video').toUpperCase();

  info.append(h3, badge);
  wrap.append(thumb, info);

  playBtn.addEventListener('click', () => {
    const video = document.createElement('video');
    video.src = path;
    video.controls = true;
    video.autoplay = true;
    thumb.replaceWith(video);
    wrap.classList.add('playing');
  });

  return wrap;
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const rawPath = rows[0]?.querySelector('div')?.textContent?.trim();
  const maxVideos = parseInt(rows[1]?.querySelector('div')?.textContent?.trim(), 10) || 6;

  block.innerHTML = '';

  if (!rawPath) {
    block.textContent = 'Configuração incompleta: selecione uma pasta do DAM.';
    return;
  }

  // normalize: ensure single leading slash, strip trailing slash
  const damPath = `/${rawPath.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  const params = new URLSearchParams({
    'path': damPath,
    'type': 'dam:Asset',
    'property': 'jcr:content/metadata/dc:format',
    'property.operation': 'like',
    'property.value': 'video/%',
    'orderby': '@jcr:content/jcr:lastModified',
    'orderby.sort': 'desc',
    'p.limit': maxVideos,
    'p.hits': 'selective',
    'p.properties': 'jcr:path jcr:content/metadata/dc:title jcr:content/metadata/dc:format',
  });
  const apiUrl = `/bin/querybuilder.json?${params}`;

  let data;
  try {
    const resp = await fetch(apiUrl);
    if (!resp.ok) throw new Error(resp.status);
    data = await resp.json();
  } catch {
    block.textContent = 'Não foi possível carregar os vídeos.';
    return;
  }

  const assets = (data.hits || []);

  if (!assets.length) {
    block.textContent = 'Nenhum vídeo encontrado. Selecione uma pasta com vídeos no DAM.';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'video-gallery-grid';
  assets.forEach((asset) => grid.append(buildCard(asset)));
  block.append(grid);
}
