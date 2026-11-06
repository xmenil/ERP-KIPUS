import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plantumlJar = 'C:\\Users\\NILVER\\.vscode\\extensions\\jebbs.plantuml-2.18.1\\plantuml.jar';
const inputDir = __dirname;
const outputDir = path.join(__dirname, 'imagenes');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir)
  .filter(f => /^\d{2}_.*\.puml$/.test(f))
  .sort();

console.log(`Compilando ${files.length} diagramas PlantUML estilo Bizagi BPMN...`);

for (const file of files) {
  const filePath = path.join(inputDir, file);
  console.log(`Generando: ${file} -> imagenes/`);
  try {
    execSync(`java -jar "${plantumlJar}" -o "${outputDir}" "${filePath}"`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    const pngName = file.replace('.puml', '.png');
    console.log(`  ✓ Éxito: imagenes/${pngName}`);
  } catch (err) {
    console.error(`  ✗ Error compilando ${file}:`, err.message);
  }
}

console.log('\nTodos los diagramas generados exitosamente en docs/UML-flujos/imagenes/');
