import { describe, expect, it, vi } from 'vitest';
import { BinaryBitmap, HybridBinarizer, MultiFormatReader, RGBLuminanceSource, QRCodeWriter, BarcodeFormat } from '@zxing/library';
import { crearHintsCamara, mejorarEnfoque, CameraCodeMode } from './cameraDetection';

function decode(pixels: Uint8ClampedArray, width: number, height: number, mode: CameraCodeMode) {
  const reader = new MultiFormatReader();
  reader.setHints(crearHintsCamara(mode));
  return reader.decodeWithState(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, width, height)))).getText();
}

// EAN-13 fixture built from its standard digit patterns, with quiet zones.
function eanImage(code: string) {
  const l = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const g = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  const parity = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'][Number(code[0])];
  const left = [...code.slice(1, 7)].map((digit, index) => (parity[index] === 'L' ? l : g)[Number(digit)]).join('');
  const right = [...code.slice(7)].map(digit => [...l[Number(digit)]].map(bit => bit === '0' ? '1' : '0').join('')).join('');
  const bars = `000000000000101${left}01010${right}101000000000000`;
  const width = bars.length * 3;
  const height = 300;
  const pixels = new Uint8ClampedArray(width * height).fill(255);
  // Place the barcode away from the frame's center, as in a phone preview.
  for (let y = 30; y < 90; y++) for (let x = 0; x < width; x++) {
    if (bars[Math.floor(x / 3)] === '1') pixels[y * width + x] = 0;
  }
  return { pixels, width, height };
}

describe('detección de imágenes con la configuración de cámara', () => {
  it.each(['0012345678905', '4006381333931'])('decodifica EAN-13 %s fuera del centro sin perder ceros', code => {
    const image = eanImage(code);
    expect(decode(image.pixels, image.width, image.height, 'barras')).toBe(code);
    expect(decode(image.pixels, image.width, image.height, 'todos')).toBe(code);
  });
  it('decodifica un QR con el mismo motor utilizado por la cámara', () => {
    const matrix = new QRCodeWriter().encode('QR-001234', BarcodeFormat.QR_CODE, 240, 240, new Map());
    const pixels = new Uint8ClampedArray(240 * 240);
    for (let y = 0; y < 240; y++) for (let x = 0; x < 240; x++) pixels[y * 240 + x] = matrix.get(x, y) ? 0 : 255;
    expect(decode(pixels, 240, 240, 'qr')).toBe('QR-001234');
    expect(decode(pixels, 240, 240, 'todos')).toBe('QR-001234');
  });
  it('solicita enfoque continuo solamente si la cámara lo admite', async () => {
    const applyConstraints = vi.fn(async () => {});
    const track = { getCapabilities: () => ({ focusMode: ['continuous'] }), applyConstraints };
    await mejorarEnfoque({ getVideoTracks: () => [track] } as unknown as MediaStream);
    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ focusMode: 'continuous' }] });
    await mejorarEnfoque({ getVideoTracks: () => [{ getCapabilities: () => ({}), applyConstraints }] } as unknown as MediaStream);
    expect(applyConstraints).toHaveBeenCalledTimes(1);
  });
  it('mantiene la lectura si el dispositivo rechaza el enfoque opcional', async () => {
    const track = { getCapabilities: () => ({ focusMode: ['continuous'] }), applyConstraints: vi.fn(async () => { throw new Error('No admitido'); }) };
    await expect(mejorarEnfoque({ getVideoTracks: () => [track] } as unknown as MediaStream)).resolves.toBeUndefined();
  });
});
