const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crc]);
}

function unfilterPng(buf) {
  let pos = 8;
  const chunks = [];
  let width = 0, height = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString('ascii');
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
    } else if (type === 'IDAT') chunks.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(chunks));
  const bpp = 4;
  const rowBytes = width * bpp;
  const rawRgba = Buffer.alloc(width * height * bpp);
  let srcPos = 0, dstPos = 0, prevRowDst = null;

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
  }

  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcPos++];
    const currentRowDst = dstPos;
    for (let x = 0; x < rowBytes; x++) {
      const val = decompressed[srcPos++];
      const left = x >= bpp ? rawRgba[dstPos - bpp] : 0;
      const up = prevRowDst !== null ? rawRgba[prevRowDst + x] : 0;
      const upLeft = (prevRowDst !== null && x >= bpp) ? rawRgba[prevRowDst + x - bpp] : 0;
      let outVal = 0;
      if (filter === 0) outVal = val;
      else if (filter === 1) outVal = (val + left) & 0xff;
      else if (filter === 2) outVal = (val + up) & 0xff;
      else if (filter === 3) outVal = (val + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) outVal = (val + paeth(left, up, upLeft)) & 0xff;
      rawRgba[dstPos++] = outVal;
    }
    prevRowDst = currentRowDst;
  }
  return { width, height, rawRgba };
}

function encodePng(rawRgba, width, height) {
  const rowSize = 1 + width * 4;
  const filtered = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    filtered[y * rowSize] = 0;
    rawRgba.copy(filtered, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(filtered, { level: 9 });
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    header,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const inputPath = path.join(__dirname, '..', 'client', 'assets', 'kipus-logo.png');
const orig = fs.readFileSync(inputPath);
const decoded = unfilterPng(orig);

const outDir = path.join(__dirname, '..', 'client', 'assets', 'letters');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Common vertical bounds
const minY = 690;
const maxY = 2050;
const targetH = maxY - minY;

const letters = [
  { name: 'k', minX: 545, maxX: 1335 },
  { name: 'i', minX: 1350, maxX: 1590 },
  { name: 'p', minX: 1650, maxX: 2340 },
  { name: 'u', minX: 2400, maxX: 2995 },
  { name: 's', minX: 3070, maxX: 3635 }
];

for (const l of letters) {
  const targetW = l.maxX - l.minX;
  const letterRgba = Buffer.alloc(targetW * targetH * 4);
  
  for (let y = 0; y < targetH; y++) {
    const srcY = minY + y;
    const srcRowOffset = srcY * decoded.width * 4;
    const dstRowOffset = y * targetW * 4;
    for (let x = 0; x < targetW; x++) {
      const srcX = l.minX + x;
      const srcIdx = srcRowOffset + srcX * 4;
      const dstIdx = dstRowOffset + x * 4;
      letterRgba[dstIdx] = decoded.rawRgba[srcIdx];
      letterRgba[dstIdx + 1] = decoded.rawRgba[srcIdx + 1];
      letterRgba[dstIdx + 2] = decoded.rawRgba[srcIdx + 2];
      letterRgba[dstIdx + 3] = decoded.rawRgba[srcIdx + 3];
    }
  }
  
  const pngBuf = encodePng(letterRgba, targetW, targetH);
  const outPath = path.join(outDir, `${l.name}.png`);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Saved letter ${l.name}.png: ${targetW}x${targetH}, size: ${pngBuf.length}`);
}
console.log('ALL LETTERS EXTRACTED SUCCESSFULLY!');
