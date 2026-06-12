function extractPlaylistId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('list') || url.trim();
  } catch {
    return url.trim();
  }
}

function buildCard(videoId, title) {
  const wrap = document.createElement('div');
  wrap.className = 'video-gallery-item';

  const thumb = document.createElement('div');
  thumb.className = 'video-gallery-thumb';

  const img = document.createElement('img');
  img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  img.alt = title;
  img.loading = 'lazy';

  const playBtn = document.createElement('button');
  playBtn.className = 'video-gallery-play';
  playBtn.setAttribute('aria-label', `Reproduzir: ${title}`);
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  thumb.append(img, playBtn);

  const info = document.createElement('div');
  info.className = 'video-gallery-info';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  info.append(h3);

  wrap.append(thumb, info);

  playBtn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.title = title;
    thumb.replaceWith(iframe);
    wrap.classList.add('playing');
  });

  return wrap;
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const playlistUrl = rows[0]?.querySelector('div')?.textContent?.trim();
  const maxVideos = parseInt(rows[1]?.querySelector('div')?.textContent?.trim(), 10) || 6;

  block.innerHTML = '';

  if (!playlistUrl) {
    block.textContent = 'Configuração incompleta: informe a URL da playlist.';
    return;
  }

  const playlistId = extractPlaylistId(playlistUrl);
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;

  let xml;
  try {
    const resp = await fetch(feedUrl);
    if (!resp.ok) throw new Error(resp.status);
    const text = await resp.text();
    xml = new DOMParser().parseFromString(text, 'application/xml');
  } catch {
    block.textContent = 'Não foi possível carregar os vídeos. Verifique a URL da playlist.';
    return;
  }

  const entries = [...xml.querySelectorAll('entry')].slice(0, maxVideos);

  if (!entries.length) {
    block.textContent = 'Nenhum vídeo encontrado na playlist.';
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'video-gallery-grid';

  entries.forEach((entry) => {
    const videoId = entry.querySelector('videoId')?.textContent;
    const title = entry.querySelector('title')?.textContent;
    if (videoId && title) grid.append(buildCard(videoId, title));
  });

  block.append(grid);
}
