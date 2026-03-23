type Rgb = { r: number; g: number; b: number };

function clampByte(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 255) return 255;
  return Math.round(n);
}

export function hexToRgb(hex: string): Rgb | null {
  if (typeof hex !== 'string') return null;
  const s = hex.trim();
  const m3 = s.match(/^#([0-9a-fA-F]{3})$/);
  if (m3) {
    const [r, g, b] = m3[1].split('');
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
    };
  }
  const m6 = s.match(/^#([0-9a-fA-F]{6})$/);
  if (m6) {
    const h = m6[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

export function relativeLuminance(rgb: Rgb) {
  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function blendOverSolid(args: { overlayHex: string; overlayOpacity: number; baseHex: string }) {
  const overlay = hexToRgb(args.overlayHex);
  const base = hexToRgb(args.baseHex);
  if (!overlay || !base) return args.baseHex;
  const a = Math.max(0, Math.min(1, Number(args.overlayOpacity)));
  const r = clampByte(overlay.r * a + base.r * (1 - a));
  const g = clampByte(overlay.g * a + base.g * (1 - a));
  const b = clampByte(overlay.b * a + base.b * (1 - a));
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export function getTextOnHex(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'text-white';
  const l = relativeLuminance(rgb);
  return l > 0.55 ? 'text-black' : 'text-white';
}

