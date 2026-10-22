// Revisión local con Chrome y perfil aislado; ejecutar desde la raíz del proyecto.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const stage = process.env.KIPUS_REVISION_ETAPA || 'E0';
if (!['E0', 'E1', 'E2', 'E3', 'E4'].includes(stage)) throw new Error('Etapa no válida');
const output = path.resolve(`docs/ampliacion/evidencias/${stage}`);
await mkdir(output, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${path.resolve(`scripts/chrome-ampliacion-E0-${Date.now()}.local`)}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome no inició')), 20000);
    chrome.stderr.on('data', data => {
      const match = String(data).match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    chrome.on('error', reject);
  });
  const address = new URL(endpoint);
  const targets = await (await fetch(`http://${address.host}/json/list`)).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (message.id) {
      const task = pending.get(message.id);
      if (task) { pending.delete(message.id); message.error ? task.reject(message.error) : task.resolve(message.result); }
    }
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })); });
  }
  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  }
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    throw new Error(`Tiempo agotado: ${expression}`);
  }
  async function screenshot(name) {
    await evaluate('document.fonts.ready.then(() => true)');
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(output, `${name}.png`), Buffer.from(result.data, 'base64'));
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:8080/login' });
  await waitFor('document.readyState === "complete" && location.pathname === "/login"');
  // Sesión demo solo en el perfil de prueba aislado; no usa el perfil del usuario.
  await evaluate(`localStorage.setItem('kipus_erp_auth_user', JSON.stringify({ id:'user-admin', username:'admin', email:'admin@kipus.pe', nombreCompleto:'Administrador de prueba', rol:'ADMINISTRADOR', sucursal:'Sede Central', avatarInitials:'AP' })); localStorage.setItem('kipus_erp_auth_token','demo-local'); localStorage.setItem('kipus_erp_auth_last_activity',String(Date.now())); true`);
  const results = [];
  for (const width of [1440, 390, 720]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: width === 390 ? 844 : 1000, deviceScaleFactor: 1, mobile: false });
    for (const route of stage === 'E0' ? ['configuracion', 'proveedores', 'compras', 'gastos', 'clientes', 'usuarios', 'reportes', 'kipus-ia'] : stage === 'E2' ? ['configuracion'] : stage === 'E3' ? ['proveedores', 'compras'] : stage === 'E4' ? ['compras', 'inventario'] : ['compras', 'gastos', 'ventas', 'caja', 'inventario']) {
      await send('Page.navigate', { url: `http://localhost:8080/${route}` });
      await waitFor(`location.pathname === '/${route}' && document.querySelector('main h1')`);
      await new Promise(resolve => setTimeout(resolve, 700));
      const metrics = await evaluate(`({route:location.pathname,width:innerWidth,pageWidth:document.documentElement.scrollWidth,title:document.querySelector('main h1')?.textContent.trim(),error:document.body.innerText.includes('Ocurrió un error al cargar')})`);
      results.push(metrics);
      if (width !== 720 || stage === 'E2' || stage === 'E3' || stage === 'E4') await screenshot(`${route}-${width}`);
    }
  }
  const operations = stage !== 'E0' ? await (await import(`./revision-ampliacion-${stage}.mjs`)).run({ send, evaluate, waitFor, screenshot }) : undefined;
  await writeFile(path.join(output, 'revision.json'), JSON.stringify({ results, operations, exceptions }, null, 2));
  console.log(JSON.stringify({ results, operations, exceptions }, null, 2));
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' }));
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 1500);
      socket.addEventListener('close', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
  }
  socket?.close();
  chrome.kill();
}

