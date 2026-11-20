// The cover renderer for Neon Coast Cover Studio. drawCover paints a cover
// onto any canvas: the layout's panels filled with the state's photos, the
// grade's filter and colour washes, a vignette, and the bold Anton lettering
// (title band across the foot, corner badge). renderCover draws the same art
// at an export size onto a fresh offscreen canvas.
//
// State shape:
//   layout, grade, title, subtitle,
//   photos: [image, ...],
//   panelPhotos: [photo index per panel],
//   panelViews: [{ zoom, panX, panY } per panel],
//   samePhoto: bool, activePhoto: index
import { panelRects } from './panels.js';
import { gradeDef } from './grades.js';

const BACKGROUND = '#0b0612';

/** Which photo fills panel i under the state's same-photo setting. */
export function panelPhotoIndex(state, i) {
  if (state.samePhoto) return state.activePhoto;
  return state.panelPhotos[i] ?? state.activePhoto;
}

/**
 * Cover-fit geometry for an image in a panel: the drawn rectangle and the
 * slack (half the overhang) on each axis, which pan moves within. zoom
 * magnifies the cover-fit image; panX/panY in [-1, 1] slide it inside the
 * slack, so dragging a photo moves it one-to-one with the pointer.
 */
export function coverGeometry(img, rectW, rectH, view) {
  const zoom = view?.zoom ?? 1;
  const scale = Math.max(rectW / img.naturalWidth, rectH / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const slackX = Math.max(0, (dw - rectW) / 2);
  const slackY = Math.max(0, (dh - rectH) / 2);
  return {
    dx: (rectW - dw) / 2 + (view?.panX ?? 0) * slackX,
    dy: (rectH - dh) / 2 + (view?.panY ?? 0) * slackY,
    dw,
    dh,
    slackX,
    slackY,
  };
}

function drawPlaceholderPanel(ctx, rect, accent) {
  const glow = ctx.createRadialGradient(
    rect.x + rect.w * 0.5, rect.y + rect.h * 0.35, 0,
    rect.x + rect.w * 0.5, rect.y + rect.h * 0.35, Math.max(rect.w, rect.h) * 0.75,
  );
  glow.addColorStop(0, 'rgba(255, 46, 136, 0.30)');
  glow.addColorStop(0.55, 'rgba(90, 30, 110, 0.25)');
  glow.addColorStop(1, 'rgba(11, 6, 18, 0)');
  ctx.fillStyle = '#1c1026';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = Math.max(1, rect.w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 1;
}

function drawPanel(ctx, img, rect, view, filter) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!img) {
    drawPlaceholderPanel(ctx, rect, '#ff2e88');
  } else {
    const g = coverGeometry(img, rect.w, rect.h, view);
    ctx.filter = filter;
    ctx.drawImage(img, rect.x + g.dx, rect.y + g.dy, g.dw, g.dh);
    ctx.filter = 'none';
  }
  ctx.restore();
}

function drawWashes(ctx, w, h, grade) {
  for (const wash of grade.washes) {
    const grad = ctx.createLinearGradient(
      wash.x0 * w, wash.y0 * h, wash.x1 * w, wash.y1 * h,
    );
    for (const [pos, color] of wash.stops) grad.addColorStop(pos, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.30)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawBadge(ctx, w, h, accent) {
  const size = Math.max(14, h * 0.021);
  const padX = size * 0.9;
  const padY = size * 0.55;
  const text = 'NEON COAST';
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.letterSpacing = `${size * 0.22}px`;
  const tw = ctx.measureText(text).width;
  const dotR = size * 0.28;
  const pillW = padX * 2 + tw + dotR * 2 + size * 0.45;
  const pillH = size + padY * 2;
  const x = w * 0.028;
  const y = h * 0.028;
  ctx.letterSpacing = '0px';
  ctx.fillStyle = 'rgba(8, 4, 16, 0.55)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + padX + dotR, y + pillH / 2, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${size * 0.22}px`;
  ctx.fillText(text, x + padX + dotR * 2 + size * 0.45, y + pillH / 2 + size * 0.05);
  ctx.restore();
}

function drawLettering(ctx, w, h, state, grade) {
  const title = state.title.trim().toUpperCase();
  const subtitle = state.subtitle.trim();
  if (!title && !subtitle) return;

  // Dark scrim rising from the foot so the lettering reads on any photo.
  const scrim = ctx.createLinearGradient(0, h * 0.58, 0, h);
  scrim.addColorStop(0, 'rgba(5, 2, 10, 0)');
  scrim.addColorStop(0.55, 'rgba(5, 2, 10, 0.45)');
  scrim.addColorStop(1, 'rgba(5, 2, 10, 0.78)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const bottom = h * 0.965;

  let titleSize = 0;
  let titleBase = bottom;
  if (subtitle) {
    const subSize = Math.max(16, h * 0.028);
    ctx.font = `${subSize}px Anton, sans-serif`;
    ctx.letterSpacing = `${subSize * 0.3}px`;
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = subSize * 0.4;
    ctx.fillText(subtitle.toUpperCase(), w / 2, bottom);
    ctx.shadowBlur = 0;
    titleBase = bottom - subSize - h * 0.018;
  }
  if (title) {
    titleSize = h * 0.105;
    ctx.font = `${titleSize}px Anton, sans-serif`;
    ctx.letterSpacing = `${titleSize * 0.015}px`;
    while (ctx.measureText(title).width > w * 0.92 && titleSize > 20) {
      titleSize -= 2;
      ctx.font = `${titleSize}px Anton, sans-serif`;
    }
    // Accent rule above the title.
    const ruleW = Math.min(w * 0.22, ctx.measureText(title).width * 0.35);
    const ruleY = titleBase - titleSize * 1.18;
    ctx.fillStyle = grade.accent;
    ctx.fillRect((w - ruleW) / 2, ruleY, ruleW, Math.max(2, h * 0.004));
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(8, 2, 16, 0.9)';
    ctx.lineWidth = Math.max(2, titleSize * 0.12);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = titleSize * 0.16;
    ctx.shadowOffsetY = titleSize * 0.045;
    ctx.strokeText(title, w / 2, titleBase);
    ctx.fillText(title, w / 2, titleBase);
  }
  ctx.restore();
}

/** Draws the state's cover onto the canvas, at the canvas's own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = gradeDef(state.grade);
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((frac, i) => {
    const rect = { x: frac.x * w, y: frac.y * h, w: frac.w * w, h: frac.h * h };
    const photo = state.photos[panelPhotoIndex(state, i)]?.img ?? null;
    drawPanel(ctx, photo, rect, state.panelViews[i], grade.filter);
  });
  drawWashes(ctx, w, h, grade);
  // Crisp light edge around each panel, the box-art frame.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = Math.max(1, w * 0.0012);
  for (const frac of rects) {
    ctx.strokeRect(frac.x * w, frac.y * h, frac.w * w, frac.h * h);
  }
  drawVignette(ctx, w, h);
  drawBadge(ctx, w, h, grade.accent);
  drawLettering(ctx, w, h, state, grade);
}

/** Renders the state's cover at an export size onto a fresh canvas. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
