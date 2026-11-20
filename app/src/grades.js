// Colour grades for Neon Coast Cover Studio. Each grade has a canvas filter
// applied while each panel photo is drawn, one or two colour washes laid over
// the whole cover afterwards, and an accent colour for the title rule and the
// corner badge. A wash is a gradient across the cover, given as start and end
// points in fractions of the cover plus colour stops.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.3) contrast(1.08) brightness(1.03)',
    accent: '#ff5e62',
    washes: [
      {
        x0: 0, y0: 0, x1: 0, y1: 1,
        stops: [
          [0, 'rgba(255, 140, 60, 0.10)'],
          [0.5, 'rgba(255, 80, 120, 0.04)'],
          [1, 'rgba(180, 30, 110, 0.26)'],
        ],
      },
    ],
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.5) contrast(1.15)',
    accent: '#22d3ee',
    washes: [
      {
        x0: 0, y0: 0, x1: 1, y1: 1,
        stops: [
          [0, 'rgba(255, 0, 128, 0.20)'],
          [0.5, 'rgba(120, 0, 255, 0.05)'],
          [1, 'rgba(0, 229, 255, 0.20)'],
        ],
      },
    ],
  },
  gold: {
    label: 'Gold',
    filter: 'sepia(0.28) saturate(1.25) contrast(1.06)',
    accent: '#fbbf24',
    washes: [
      {
        x0: 0, y0: 0, x1: 0, y1: 1,
        stops: [
          [0, 'rgba(255, 190, 70, 0.12)'],
          [1, 'rgba(150, 80, 10, 0.22)'],
        ],
      },
    ],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.3) brightness(1.06)',
    accent: '#e5e7eb',
    washes: [
      {
        x0: 0, y0: 0, x1: 0, y1: 1,
        stops: [
          [0, 'rgba(255, 255, 255, 0.05)'],
          [1, 'rgba(0, 0, 0, 0.16)'],
        ],
      },
    ],
  },
};

/** The grade definition for a grade id, defaulting to Sunset. */
export function gradeDef(grade) {
  return GRADES[grade] ?? GRADES.sunset;
}
