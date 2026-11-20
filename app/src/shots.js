// Fixed scenes for screenshots. ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows a finished cover alone, filling the window.
// Query params pick the scene: photo and photo2 name samples (samples/<name>.jpg),
// caption and sub set the lettering, layout, grade and size pick the cover,
// and views sets per-panel crops as semicolon-separated zoom,panX,panY triples.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, { loadImage, applyScene }) {
  if (shot === 'cover') document.body.classList.add('shot-cover');

  const names = [query.get('photo') ?? 'boulevard'];
  if (query.get('photo2')) names.push(query.get('photo2'));
  const photos = [];
  for (const name of names) {
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      photos.push({ img, src: `samples/${name}.jpg`, name });
    } catch {
      // A missing sample leaves the panel empty rather than breaking the shot.
    }
  }

  const panelViews = query.get('views')
    ? query.get('views').split(';').map((triple) => {
        const [zoom = 1, panX = 0, panY = 0] = triple.split(',').map(Number);
        return {
          zoom: Number.isFinite(zoom) ? zoom : 1,
          panX: Number.isFinite(panX) ? panX : 0,
          panY: Number.isFinite(panY) ? panY : 0,
        };
      })
    : undefined;

  await applyScene({
    photos,
    title: query.get('caption') ?? 'Neon Coast',
    subtitle: query.get('sub') ?? 'Vice City nights',
    layout: query.get('layout') ?? 'hero',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '1920x1080',
    samePhoto: photos.length <= 1 || query.get('same') === '1',
    panelViews,
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
