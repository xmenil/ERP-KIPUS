// Revisión local con Chrome y perfil aislado; ejecutar desde la raíz del proyecto.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('docs/evidencias/fase4');
await mkdir(output, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${path.resolve(`scripts/chrome-fase4-${Date.now()}.local`)}`, 'about:blank',
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
    for (const route of ['dashboard', 'productos', 'inventario', 'ventas', 'caja']) {
      await send('Page.navigate', { url: `http://localhost:8080/${route}` });
      await waitFor(`location.pathname === '/${route}' && document.querySelector('main h1')`);
      await new Promise(resolve => setTimeout(resolve, 700));
      const metrics = await evaluate(`({route:location.pathname,width:innerWidth,pageWidth:document.documentElement.scrollWidth,title:document.querySelector('main h1')?.textContent.trim(),error:document.body.innerText.includes('Ocurrió un error al cargar')})`);
      results.push(metrics);
      if (width !== 720) await screenshot(`${route}-${width}`);
    }
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:8080/productos' });
  await waitFor(`Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Nuevo producto'))`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Nuevo producto')).click()`);
  await waitFor(`document.querySelector('#producto-form')`);
  await screenshot('producto-formulario-390');
  const form = await evaluate(`({width:innerWidth,dialogWidth:document.querySelector('[role=dialog]').getBoundingClientRect().width,categoryLabel:document.querySelector('label[for=producto-categoria]')?.textContent,categoryExists:!!document.getElementById('producto-categoria'),unitExists:!!document.getElementById('producto-unidad'),fontSize:getComputedStyle(document.querySelector('#nombre')).fontSize})`);
  await evaluate(`(() => {const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for (const [id,value] of Object.entries({sku:'VISUAL-FASE4',nombre:'Arroz de revisión visual',precioCompra:'2',precioVenta:'4',stock:'5'})){const el=document.getElementById(id);set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
  await evaluate(`document.querySelector('button[form="producto-form"]').click()`);
  await waitFor(`!document.querySelector('#producto-form')`);
  await send('Page.reload');
  await waitFor(`document.querySelector('main')?.innerText.includes('Arroz de revisión visual')`);
  const persisted = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).productos.some(p=>p.sku==='VISUAL-FASE4' && p.precioVenta===4)`);
  await evaluate(`Array.from(document.querySelectorAll('button[aria-label]')).find(b=>b.getClientRects().length && b.getAttribute('aria-label')==='Más acciones de Arroz de revisión visual').focus()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
  await waitFor(`document.querySelector('[role=menuitem]')`);
  await evaluate(`Array.from(document.querySelectorAll('[role=menuitem]')).find(b=>b.textContent.includes('Eliminar producto')).click()`);
  await waitFor(`document.querySelector('[role=alertdialog]')`);
  await screenshot('producto-confirmacion-390');
  await evaluate(`Array.from(document.querySelectorAll('[role=alertdialog] button')).find(b=>b.textContent==='Cancelar').click()`);
  await waitFor(`!document.querySelector('[role=alertdialog]')`);
  const deletionCancelled = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).productos.some(p=>p.sku==='VISUAL-FASE4')`);
  await evaluate(`Array.from(document.querySelectorAll('button[aria-label]')).find(b=>b.getClientRects().length && b.getAttribute('aria-label')==='Editar Arroz de revisión visual').click()`);
  await waitFor(`document.querySelector('#nombre')`);
  await evaluate(`(() => {const el=document.getElementById('nombre');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'Arroz editado en revisión visual');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate(`document.querySelector('button[form="producto-form"]').click()`);
  await waitFor(`!document.querySelector('#producto-form')`);
  const edited = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).productos.some(p=>p.sku==='VISUAL-FASE4' && p.nombre==='Arroz editado en revisión visual')`);
  const contrastExpression = `(() => {
    function ratio(fg,bg){const el=document.createElement('div');el.style.color='hsl(var(--'+fg+'))';el.style.backgroundColor='hsl(var(--'+bg+'))';document.body.append(el);const css=getComputedStyle(el);const lum=color=>color.match(/[\\d.]+/g).slice(0,3).map(Number).map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);const a=lum(css.color),b=lum(css.backgroundColor);el.remove();return +((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2);}
    return [['foreground','card'],['muted-foreground','card'],['primary-foreground','primary'],['danger-text','danger-soft'],['warning-text','warning-soft'],['success-text','success-soft']].map(([fg,bg])=>({fg,bg,ratio:ratio(fg,bg)}));
  })()`;
  const lightContrast = await evaluate(contrastExpression);
  await evaluate(`document.documentElement.classList.add('dark'); true`);
  const darkContrast = await evaluate(contrastExpression);
  await screenshot('productos-oscuro-390');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  const keyboard = await evaluate(`({tag:document.activeElement.tagName,name:document.activeElement.getAttribute('aria-label')||document.activeElement.textContent?.trim()})`);
  const report = { results, form, persisted, deletionCancelled, edited, keyboard, lightContrast, darkContrast, exceptions };
  await writeFile(path.join(output, 'revision.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
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
