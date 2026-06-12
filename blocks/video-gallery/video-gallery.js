const YT_API = 'https://www.googleapis.com/youtube/v3';

function extractPlaylistId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('list') || url.trim();
  } catch {
    return url.trim();
  }
}

function buildThumbnail(videoId, title) {
  const wrap = document.createElement('div');
  wrap.className = 'video-gallery-item';
  wrap.dataset.videoid = videoId;

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
  const apiKey = rows[2]?.querySelector('div')?.textContent?.trim();

  block.innerHTML = '';

  if (!playlistUrl || !apiKey) {
    block.textContent = 'Configuração incompleta: informe a URL da playlist e a API Key.';
    return;
  }

  const playlistId = extractPlaylistId(playlistUrl);

  const grid = document.createElement('div');
  grid.className = 'video-gallery-grid';

  const loadMore = document.createElement('button');
  loadMore.className = 'video-gallery-load-more';
  loadMore.textContent = 'Ver mais vídeos';

  block.append(grid, loadMore);

  let nextPageToken = '';
  let loaded = 0;

  async function loadVideos() {
    const pageSize = Math.min(maxVideos - loaded, 50);
    if (pageSize <= 0) {
      loadMore.hidden = true;
      return;
    }

    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: pageSize,
      key: apiKey,
      ...(nextPageToken && { pageToken: nextPageToken }),
    });

    const resp = await fetch(`${YT_API}/playlistItems?${params}`);
    if (!resp.ok) {
      block.textContent = 'Erro ao carregar vídeos. Verifique a playlist e a API Key.';
      return;
    }

    const data = await resp.json();
    nextPageToken = data.nextPageToken || '';

    data.items.forEach((item) => {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      if (videoId && title) {
        grid.append(buildThumbnail(videoId, title));
        loaded += 1;
      }
    });

    loadMore.hidden = !nextPageToken || loaded >= maxVideos;
  }

  loadMore.addEventListener('click', loadVideos);
  loadMore.hidden = true;

  await loadVideos();
}
