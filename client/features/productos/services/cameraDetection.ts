import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export type CameraCodeMode = 'todos' | 'barras' | 'qr';

export function crearHintsCamara(mode: CameraCodeMode) {
  // Read UPC-A through EAN-13, preserving the leading zero rather than silently removing it.
  const barras = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.ITF];
  const formatos = mode === 'qr' ? [BarcodeFormat.QR_CODE]
    : mode === 'barras' ? barras : [...barras, BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX];
  return new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, formatos],
    [DecodeHintType.TRY_HARDER, true],
  ]);
}

export async function mejorarEnfoque(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  if (!track?.getCapabilities || !track.applyConstraints) return;
  try {
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & { focusMode?: string[] };
    if (!capabilities.focusMode?.includes('continuous')) return;
    await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] });
  } catch { /* Unsupported optional camera controls must not prevent scanning. */ }
}
