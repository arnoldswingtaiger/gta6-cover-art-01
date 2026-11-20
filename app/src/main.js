// Wires Neon Coast Cover Studio: photo uploads and samples, the layout and
// grade pickers, per-panel crop (zoom slider and drag-to-pan on the preview),
// caption editing, and PNG export at the three post sizes. A `?shot=` query
// sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, renderCover, coverGeometry, panelPhotoIndex } from './cover.js';
import { panelRects, panelCount, LAYOUTS } from './panels.js';
import { GRADES } from './grades.js';
import { runShot } from './shots.js';

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: '1920x1080',
  title: 'Neon Coast',
  subtitle: 'Vice City nights',
  photos: [], // { img, src, name }
  panelPhotos: [],
  panelViews: [], // { zoom, panX, panY } per panel
  samePhoto: true,
  activePhoto: 0,
  selectedPanel: 0,
};

const canvas = document.getElementById('cover');
const stage = document.querySelector('.stage');
const thumbsEl = document.getElementById('thumbs');
const panelLabel = document.getElementById('panel-label');
const statusEl = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('pan-x');
const panYInput = document.getElementById('pan-y');
const samePhotoInput = document.getElementById('same-photo');
const shotMode = new URLSearchParams(location.search).get('shot');

function defaultView() {
  return { zoom: 1, panX: 0, panY: 0 };
}

function resizePanels() {
  const n = panelCount(state.layout);
  while (state.panelPhotos.length < n) state.panelPhotos.push(state.activePhoto);
  while (state.panelViews.length < n) state.panelViews.push(defaultView());
  state.panelPhotos.length = n;
  state.panelViews.length = n;
  state.selectedPanel = Math.min(state.selectedPanel, n - 1);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function selectedPhotoName() {
  const idx = panelPhotoIndex(state, state.selectedPanel);
  return state.photos[idx]?.name ?? 'No photo yet';
}

function updatePanelControls() {
  const n = panelCount(state.layout);
  panelLabel.textContent = `Panel ${state.selectedPanel + 1} of ${n} — ${selectedPhotoName()}`;
  const view = state.panelViews[state.selectedPanel] ?? defaultView();
  zoomInput.value = view.zoom;
  panXInput.value = view.panX;
  panYInput.value = view.panY;
}

function updateStatus(message) {
  const n = state.photos.length;
  const base = `${n} photo${n === 1 ? '' : 's'} · ${LAYOUTS[state.layout].label} · ${GRADES[state.grade].label} · ${state.size.replace('x', ' × ')}`;
  statusEl.textContent = message ? `${message} — ${base}` : base;
}

function markActiveButtons(container, attr, value) {
  for (const btn of container.querySelectorAll('button')) {
    btn.classList.toggle('active', btn.dataset[attr] === value);
  }
}

function syncControls() {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  samePhotoInput.checked = state.samePhoto;
  markActiveButtons(document.getElementById('layout-pick'), 'layout', state.layout);
  markActiveButtons(document.getElementById('grade-pick'), 'grade', state.grade);
  markActiveButtons(document.getElementById('size-pick'), 'size', state.size);
  updatePanelControls();
  updateStatus();
}

function renderThumbs() {
  thumbsEl.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = photo.name;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.name;
    btn.appendChild(img);
    const isActive = state.samePhoto
      ? i === state.activePhoto
      : panelPhotoIndex(state, state.selectedPanel) === i;
    btn.classList.toggle('active', isActive);
    btn.addEventListener('click', () => {
      state.activePhoto = i;
      if (!state.samePhoto) state.panelPhotos[state.selectedPanel] = i;
      redraw();
    });
    thumbsEl.appendChild(btn);
  });
}

function drawSelection(ctx) {
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const frac = rects[state.selectedPanel];
  if (!frac) return;
  ctx.save();
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = Math.max(2, canvas.width * 0.003);
  ctx.setLineDash([canvas.width * 0.012, canvas.width * 0.008]);
  ctx.strokeRect(frac.x * canvas.width, frac.y * canvas.height, frac.w * canvas.width, frac.h * canvas.height);
  ctx.restore();
}

function redraw() {
  const [w, h] = SIZES[state.size];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  if (!shotMode || shotMode === 'editor') drawSelection(canvas.getContext('2d'));
  renderThumbs();
  updatePanelControls();
  updateStatus();
}

function addPhotos(newPhotos) {
  for (const photo of newPhotos) {
    const first = state.photos.length === 0;
    state.photos.push(photo);
    const idx = state.photos.length - 1;
    if (first) {
      state.activePhoto = 0;
      state.panelPhotos = state.panelPhotos.map(() => 0);
    } else if (!state.samePhoto) {
      // Each extra photo fills the next panel, in order.
      state.panelPhotos[idx % panelCount(state.layout)] = idx;
    }
  }
  redraw();
}

async function addSample(name, label) {
  const src = `samples/${name}.jpg`;
  if (state.photos.some((p) => p.src === src)) {
    statusEl.textContent = `${label} is already loaded.`;
    return;
  }
  try {
    const img = await loadImage(src);
    addPhotos([{ img, src, name: label }]);
  } catch {
    statusEl.textContent = `Could not load the ${label} sample.`;
  }
}

async function addFiles(files) {
  const loaded = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const src = URL.createObjectURL(file);
      const img = await loadImage(src);
      loaded.push({ img, src, name: file.name });
    } catch {
      // Skip a file that is not a readable image.
    }
  }
  if (loaded.length) addPhotos(loaded);
  else statusEl.textContent = 'No readable image in that drop.';
}

function setLayout(layout) {
  if (!LAYOUTS[layout]) return;
  state.layout = layout;
  resizePanels();
  syncControls();
  redraw();
}

function setGrade(grade) {
  if (!GRADES[grade]) return;
  state.grade = grade;
  syncControls();
  redraw();
}

function setSize(size) {
  if (!SIZES[size]) return;
  state.size = size;
  syncControls();
  redraw();
}

function exportPng() {
  const [w, h] = SIZES[state.size];
  const out = renderCover(state, w, h);
  out.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
    updateStatus(`Exported neon-coast-${w}x${h}.png`);
  }, 'image/png');
}

// --- Panel picking and drag-to-pan on the preview ---

function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const x = (clientX - box.left) / box.width;
  const y = (clientY - box.top) / box.height;
  return panelRects(state.layout, 1, 1).findIndex(
    (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h,
  );
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i === -1) return;
  state.selectedPanel = i;
  const img = state.photos[panelPhotoIndex(state, i)]?.img;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const rect = rects[i];
  drag = {
    lastX: e.clientX,
    lastY: e.clientY,
    img,
    rectW: rect.w * canvas.width,
    rectH: rect.h * canvas.height,
  };
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('dragging');
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || !drag.img) return;
  const box = canvas.getBoundingClientRect();
  const dx = (e.clientX - drag.lastX) * (canvas.width / box.width);
  const dy = (e.clientY - drag.lastY) * (canvas.height / box.height);
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  const view = state.panelViews[state.selectedPanel];
  const g = coverGeometry(drag.img, drag.rectW, drag.rectH, view);
  if (g.slackX > 0) view.panX = Math.max(-1, Math.min(1, view.panX + dx / g.slackX));
  if (g.slackY > 0) view.panY = Math.max(-1, Math.min(1, view.panY + dy / g.slackY));
  redraw();
});
function endDrag() {
  drag = null;
  canvas.classList.remove('dragging');
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// --- Controls ---

document.getElementById('photo-input').addEventListener('change', (e) => {
  addFiles(e.target.files);
  e.target.value = '';
});
document.getElementById('sample-boulevard').addEventListener('click', () => addSample('boulevard', 'Boulevard'));
document.getElementById('sample-pier').addEventListener('click', () => addSample('pier', 'Pier'));
document.getElementById('layout-pick').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn) setLayout(btn.dataset.layout);
});
document.getElementById('grade-pick').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn) setGrade(btn.dataset.grade);
});
document.getElementById('size-pick').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn) setSize(btn.dataset.size);
});
samePhotoInput.addEventListener('change', () => {
  state.samePhoto = samePhotoInput.checked;
  if (state.samePhoto) {
    state.activePhoto = panelPhotoIndex(state, state.selectedPanel);
    state.panelPhotos = state.panelPhotos.map(() => state.activePhoto);
  }
  redraw();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
zoomInput.addEventListener('input', () => {
  state.panelViews[state.selectedPanel].zoom = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panelViews[state.selectedPanel].panX = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panelViews[state.selectedPanel].panY = Number(panYInput.value);
  redraw();
});
document.getElementById('panel-prev').addEventListener('click', () => {
  const n = panelCount(state.layout);
  state.selectedPanel = (state.selectedPanel + n - 1) % n;
  redraw();
});
document.getElementById('panel-next').addEventListener('click', () => {
  state.selectedPanel = (state.selectedPanel + 1) % panelCount(state.layout);
  redraw();
});
document.getElementById('export').addEventListener('click', exportPng);

stage.addEventListener('dragover', (e) => e.preventDefault());
stage.addEventListener('drop', (e) => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});

// --- Screenshot scenes ---

/**
 * Applies a fixed scene (from ?shot=): photos, caption, layout, grade and
 * size, then paints once the Anton font is ready.
 */
async function applyScene(scene) {
  state.photos = scene.photos;
  state.activePhoto = 0;
  state.title = scene.title;
  state.subtitle = scene.subtitle;
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.size = scene.size;
  state.samePhoto = scene.samePhoto;
  resizePanels();
  state.panelPhotos = scene.panelPhotos ?? state.panelPhotos.map((_, i) => i % Math.max(1, scene.photos.length));
  state.panelViews = scene.panelViews ?? state.panelViews.map(() => defaultView());
  state.selectedPanel = 0;
  syncControls();
  try {
    await document.fonts.load('100px Anton');
  } catch {
    // Fall back to the system font if Anton cannot load.
  }
  redraw();
}

// --- Start ---

resizePanels();
syncControls();
if (shotMode) {
  runShot(shotMode, new URLSearchParams(location.search), { loadImage, applyScene });
} else {
  redraw();
  // A sample on first open, so the studio shows a cover at once; the user's
  // own photos replace it the moment they add one.
  addSample('boulevard', 'Boulevard');
  document.fonts.load('100px Anton').then(redraw).catch(() => {});
  document.fonts.ready.then(redraw).catch(() => {});
}
