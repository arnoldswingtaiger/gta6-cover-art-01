// Layout definitions for Neon Coast Cover Studio. Each layout names the panels
// of a cover as rectangles in fractions of the cover (x, y, w, h in 0..1), so
// one definition serves every export size: square, portrait and landscape.
// A thin gap between panels lets the dark cover background show through,
// like the gutters of a printed box-art poster.

const GAP = 0.006;

// Hero + Strip: one big hero panel and three smaller panels in a strip,
// the classic multi-panel box-art look. Landscape covers put the strip on
// the right; square and portrait covers put it along the bottom.
function heroRects(w, h) {
  if (w > h * 1.05) {
    const heroW = 0.615;
    const stripX = heroW + GAP;
    const stripW = 1 - stripX;
    const cellH = (1 - 2 * GAP) / 3;
    return [
      { x: 0, y: 0, w: heroW, h: 1 },
      { x: stripX, y: 0, w: stripW, h: cellH },
      { x: stripX, y: cellH + GAP, w: stripW, h: cellH },
      { x: stripX, y: 2 * (cellH + GAP), w: stripW, h: cellH },
    ];
  }
  const heroH = 0.615;
  const stripY = heroH + GAP;
  const stripH = 1 - stripY;
  const cellW = (1 - 2 * GAP) / 3;
  return [
    { x: 0, y: 0, w: 1, h: heroH },
    { x: 0, y: stripY, w: cellW, h: stripH },
    { x: cellW + GAP, y: stripY, w: cellW, h: stripH },
    { x: 2 * (cellW + GAP), y: stripY, w: cellW, h: stripH },
  ];
}

// Grid: four equal panels, two by two.
function gridRects() {
  const cell = (1 - GAP) / 2;
  return [
    { x: 0, y: 0, w: cell, h: cell },
    { x: cell + GAP, y: 0, w: cell, h: cell },
    { x: 0, y: cell + GAP, w: cell, h: cell },
    { x: cell + GAP, y: cell + GAP, w: cell, h: cell },
  ];
}

// Triptych: three panels side by side on landscape and square covers,
// stacked on portrait covers.
function triptychRects(w, h) {
  const cell = (1 - 2 * GAP) / 3;
  if (w >= h) {
    return [
      { x: 0, y: 0, w: cell, h: 1 },
      { x: cell + GAP, y: 0, w: cell, h: 1 },
      { x: 2 * (cell + GAP), y: 0, w: cell, h: 1 },
    ];
  }
  return [
    { x: 0, y: 0, w: 1, h: cell },
    { x: 0, y: cell + GAP, w: 1, h: cell },
    { x: 0, y: 2 * (cell + GAP), w: 1, h: cell },
  ];
}

// Poster: a single photo, full bleed.
function posterRects() {
  return [{ x: 0, y: 0, w: 1, h: 1 }];
}

export const LAYOUTS = {
  hero: { label: 'Hero + Strip', panels: 4, rects: heroRects },
  grid: { label: 'Grid 2x2', panels: 4, rects: gridRects },
  triptych: { label: 'Triptych', panels: 3, rects: triptychRects },
  poster: { label: 'Poster', panels: 1, rects: posterRects },
};

/** Panel rectangles (fractions of the cover) for a layout at a given size. */
export function panelRects(layout, w, h) {
  const def = LAYOUTS[layout] ?? LAYOUTS.hero;
  return def.rects(w, h);
}

/** How many panels a layout has. */
export function panelCount(layout) {
  return (LAYOUTS[layout] ?? LAYOUTS.hero).panels;
}
