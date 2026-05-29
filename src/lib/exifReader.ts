// Lightweight EXIF reader used to give the AI extra context about the photo
// (camera/lens, exposure, focal length, GPS, time-of-day). Falls back silently
// when the image has no EXIF data (PNG/WebP/AI-generated).
import exifr from 'exifr';

export interface ExifContext {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  flash?: string;
  dateTaken?: string;     // ISO string
  timeOfDay?: string;     // golden hour, blue hour, midday, etc.
  gps?: { lat: number; lon: number };
  orientation?: string;
}

function describeTimeOfDay(d: Date): string {
  const h = d.getHours();
  if (h >= 5 && h < 7) return 'dawn / early morning';
  if (h >= 7 && h < 10) return 'morning golden hour';
  if (h >= 10 && h < 15) return 'midday';
  if (h >= 15 && h < 18) return 'afternoon';
  if (h >= 18 && h < 20) return 'sunset / golden hour';
  if (h >= 20 && h < 22) return 'twilight / blue hour';
  return 'night';
}

function formatShutter(value: number | undefined): string | undefined {
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) return undefined;
  if (value >= 1) return `${value}s`;
  return `1/${Math.round(1 / value)}s`;
}

export async function extractExifContext(file: File): Promise<ExifContext | null> {
  try {
    // Only photo formats carry EXIF
    if (!/jpeg|jpg|tiff|heic|heif/i.test(file.type || file.name)) return null;

    const data = await exifr.parse(file, {
      pick: [
        'Make', 'Model', 'LensModel', 'LensMake',
        'FocalLength', 'FocalLengthIn35mmFormat',
        'FNumber', 'ApertureValue',
        'ExposureTime', 'ShutterSpeedValue',
        'ISO', 'ISOSpeedRatings',
        'Flash',
        'DateTimeOriginal', 'CreateDate',
        'Orientation',
        'GPSLatitude', 'GPSLongitude',
      ],
      gps: true,
    }).catch(() => null);

    if (!data) return null;

    const camera = [data.Make, data.Model].filter(Boolean).join(' ').trim() || undefined;
    const lens = data.LensModel || data.LensMake || undefined;

    const focalRaw = data.FocalLengthIn35mmFormat || data.FocalLength;
    const focalLength = typeof focalRaw === 'number' ? `${Math.round(focalRaw)}mm` : undefined;

    const fNum = data.FNumber || data.ApertureValue;
    const aperture = typeof fNum === 'number' ? `f/${fNum.toFixed(1)}` : undefined;

    const shutter = formatShutter(data.ExposureTime);
    const iso = (data.ISO || data.ISOSpeedRatings) ? String(data.ISO || data.ISOSpeedRatings) : undefined;
    const flash = typeof data.Flash === 'number' ? ((data.Flash & 1) ? 'fired' : 'no flash') : undefined;

    const dateRaw = data.DateTimeOriginal || data.CreateDate;
    const dateObj = dateRaw instanceof Date ? dateRaw : (dateRaw ? new Date(dateRaw) : null);
    const dateTaken = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toISOString() : undefined;
    const timeOfDay = dateObj && !isNaN(dateObj.getTime()) ? describeTimeOfDay(dateObj) : undefined;

    const gps = (typeof data.latitude === 'number' && typeof data.longitude === 'number')
      ? { lat: data.latitude, lon: data.longitude }
      : undefined;

    const ctx: ExifContext = {
      camera, lens, focalLength, aperture, shutter, iso, flash, dateTaken, timeOfDay, gps,
    };

    // If nothing meaningful was extracted, return null
    const hasAny = Object.values(ctx).some(v => v !== undefined && v !== null && v !== '');
    return hasAny ? ctx : null;
  } catch {
    return null;
  }
}

/** Compact, AI-friendly summary suitable for prompt injection. */
export function summarizeExif(ctx: ExifContext | null | undefined): string | null {
  if (!ctx) return null;
  const parts: string[] = [];
  if (ctx.camera) parts.push(`Camera: ${ctx.camera}`);
  if (ctx.lens) parts.push(`Lens: ${ctx.lens}`);
  const expo = [ctx.focalLength, ctx.aperture, ctx.shutter, ctx.iso ? `ISO ${ctx.iso}` : null]
    .filter(Boolean).join(', ');
  if (expo) parts.push(`Exposure: ${expo}`);
  if (ctx.flash) parts.push(`Flash: ${ctx.flash}`);
  if (ctx.timeOfDay) parts.push(`Time of day: ${ctx.timeOfDay}`);
  if (ctx.dateTaken) parts.push(`Date taken: ${ctx.dateTaken.slice(0, 10)}`);
  if (ctx.gps) parts.push(`GPS: ${ctx.gps.lat.toFixed(4)}, ${ctx.gps.lon.toFixed(4)}`);
  return parts.length ? parts.join(' | ') : null;
}
