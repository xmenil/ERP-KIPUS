import { describe, expect, it, vi } from 'vitest';
import { CameraScanner, CameraDecoder, DecoderControls, mensajeErrorCamara } from './cameraScanner';
import { NotFoundException, ChecksumException, FormatException } from '@zxing/library';

function setup() {
  const stopTrack = vi.fn();
  const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
  const controls = { stop: vi.fn() };
  let emit: (result: { getText: () => string } | undefined, error?: unknown) => void = () => {};
  const decoder: CameraDecoder = { decodeFromStream: vi.fn(async (_stream, _video, callback) => { emit = callback; return controls; }) };
  return { stream, stopTrack, controls, decoder, emit: (code: string) => emit({ getText: () => code }), fail: (error: unknown) => emit(undefined, error) };
}
const video = {} as HTMLVideoElement;

describe('ciclo de vida de lectura con cámara', () => {
  it('continúa con imágenes sin código y muestra errores que detienen el motor', async () => {
    const fixture = setup();
    const scanner = new CameraScanner();
    const failed = vi.fn();
    const read = vi.fn();
    await scanner.start(video, fixture.decoder, async () => fixture.stream, read, failed);
    for (const error of [new NotFoundException(), new ChecksumException(), new FormatException()]) fixture.fail(error);
    expect(fixture.stopTrack).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();
    const fatal = new Error('Canvas detenido');
    fixture.fail(fatal);
    fixture.emit('000123');
    expect(failed).toHaveBeenCalledExactlyOnceWith(fatal);
    expect(fixture.stopTrack).toHaveBeenCalledOnce();
    expect(read).not.toHaveBeenCalled();
  });
  it('entrega una lectura y detiene todos los recursos sin repetir el producto', async () => {
    const fixture = setup();
    const scanner = new CameraScanner();
    const read = vi.fn();
    await scanner.start(video, fixture.decoder, async () => fixture.stream, read);
    fixture.emit('001234');
    fixture.emit('001234');
    scanner.stop();
    expect(read).toHaveBeenCalledExactlyOnceWith('001234');
    expect(fixture.stopTrack).toHaveBeenCalledTimes(1);
    expect(fixture.controls.stop).toHaveBeenCalledTimes(1);
  });
  it('libera una cámara cuyo permiso llega después de cancelar', async () => {
    const fixture = setup();
    const scanner = new CameraScanner();
    let grant!: (stream: MediaStream) => void;
    const pending = scanner.start(video, fixture.decoder, () => new Promise(resolve => { grant = resolve; }), vi.fn());
    scanner.stop();
    grant(fixture.stream);
    await pending;
    expect(fixture.stopTrack).toHaveBeenCalledOnce();
    expect(fixture.decoder.decodeFromStream).not.toHaveBeenCalled();
  });
  it('detiene el decodificador si termina de iniciar después del cierre', async () => {
    const fixture = setup();
    const scanner = new CameraScanner();
    let finish!: (controls: DecoderControls) => void;
    fixture.decoder.decodeFromStream = vi.fn(() => new Promise<DecoderControls>(resolve => { finish = resolve; }));
    const pending = scanner.start(video, fixture.decoder, async () => fixture.stream, vi.fn());
    await Promise.resolve();
    scanner.stop();
    finish(fixture.controls);
    await pending;
    expect(fixture.stopTrack).toHaveBeenCalledOnce();
    expect(fixture.controls.stop).toHaveBeenCalledOnce();
  });
  it('libera el dispositivo cuando falla el decodificador', async () => {
    const fixture = setup();
    fixture.decoder.decodeFromStream = vi.fn(async () => { throw new Error('fallo'); });
    await expect(new CameraScanner().start(video, fixture.decoder, async () => fixture.stream, vi.fn())).rejects.toThrow('fallo');
    expect(fixture.stopTrack).toHaveBeenCalledOnce();
  });
  it('puede cancelar antes de empezar sin solicitar cámara', async () => {
    const fixture = setup();
    const acquire = vi.fn(async () => fixture.stream);
    const scanner = new CameraScanner();
    scanner.stop();
    await scanner.start(video, fixture.decoder, acquire, vi.fn());
    expect(acquire).not.toHaveBeenCalled();
  });
  it('explica permisos, falta de cámara y cámara ocupada', () => {
    expect(mensajeErrorCamara(new DOMException('', 'NotAllowedError'))).toContain('permiso');
    expect(mensajeErrorCamara(new DOMException('', 'NotFoundError'))).toContain('webcam');
    expect(mensajeErrorCamara(new DOMException('', 'NotReadableError'))).toContain('otras aplicaciones');
  });
});
