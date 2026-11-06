import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = __dirname;
const outputDir = path.join(__dirname, 'imagenes');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const pumlFiles = fs
  .readdirSync(inputDir)
  .filter((file) => file.endsWith('.puml'))
  .sort();

console.log(`Encontrados ${pumlFiles.length} archivos .puml para compilar...\n`);

async function renderPuml(file) {
  const filePath = path.join(inputDir, file);
  const baseName = path.basename(file, '.puml');
  const outputPath = path.join(outputDir, `${baseName}.png`);
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`Generando PNG para: ${file} ...`);
  const res = await fetch('https://kroki.io/plantuml/png', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: content,
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al procesar ${file}: ${await res.text()}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Creado: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function run() {
  for (const file of pumlFiles) {
    try {
      await renderPuml(file);
    } catch (err) {
      console.error(`✗ Error en ${file}:`, err.message);
    }
  }
  console.log('\n¡Todos los diagramas fueron generados exitosamente en la carpeta "imagenes"!');
}

run();

