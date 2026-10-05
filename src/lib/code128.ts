/**
 * High-performance, zero-dependency Code 128-B barcode generator.
 * Produces exact bar/space module sequences for rendering vector barcodes in pdf-lib and SVG.
 */

// Code 128 patterns: each 6-digit string represents the widths of 3 bars and 3 spaces (sum = 11 modules)
// For stop symbol, 7 digits (sum = 13 modules)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export interface BarcodeModule {
  x: number;
  width: number;
  isBar: boolean;
}

/**
 * Encodes ASCII text into Code 128-B bars and spaces.
 */
export function encodeCode128B(text: string): { modules: BarcodeModule[]; totalWidth: number } {
  const codes: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // ASCII 32 (' ') to 126 ('~') maps to code 0 to 94
    const value = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(value);
    checksum += value * (i + 1);
  }

  const checkSymbol = checksum % 103;
  codes.push(checkSymbol);
  codes.push(STOP_CODE);

  const modules: BarcodeModule[] = [];
  let currentX = 0;

  for (const symbolCode of codes) {
    const pattern = CODE128_PATTERNS[symbolCode];
    if (!pattern) continue;

    for (let pIdx = 0; pIdx < pattern.length; pIdx++) {
      const width = parseInt(pattern[pIdx], 10);
      const isBar = pIdx % 2 === 0; // Even index = bar, odd index = space
      modules.push({
        x: currentX,
        width,
        isBar,
      });
      currentX += width;
    }
  }

  return { modules, totalWidth: currentX };
}

/**
 * Generates an SVG string representation of a Code 128 barcode.
 */
export function generateBarcodeSvg(
  text: string,
  options: { height?: number; moduleWidth?: number; includeText?: boolean } = {}
): string {
  const { height = 30, moduleWidth = 1.2, includeText = false } = options;
  const { modules, totalWidth } = encodeCode128B(text);
  const totalPxWidth = totalWidth * moduleWidth;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalPxWidth} ${height + (includeText ? 12 : 0)}" width="${totalPxWidth}" height="${height + (includeText ? 12 : 0)}">`;
  svg += `<rect width="100%" height="100%" fill="transparent" />`;

  for (const mod of modules) {
    if (mod.isBar) {
      svg += `<rect x="${mod.x * moduleWidth}" y="0" width="${mod.width * moduleWidth}" height="${height}" fill="#000000" />`;
    }
  }

  if (includeText) {
    svg += `<text x="${totalPxWidth / 2}" y="${height + 10}" font-family="Helvetica, Arial, sans-serif" font-size="9" text-anchor="middle" fill="#000000">${text}</text>`;
  }

  svg += `</svg>`;
  return svg;
}
