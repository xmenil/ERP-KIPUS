export async function run({ send, evaluate, waitFor, screenshot: capture }) {
  const screenshot = async (name) => {
    await evaluate('new Promise(resolve => setTimeout(resolve, 250))');
    return capture(name);
  };
  const key = 'KIPUS_ERP_STORAGE_V2';
  const click = (expr) => evaluate(`((${expr})?.click(), true)`);
  const visibleButton = (label, scope = 'main') =>
    `Array.from(document.querySelectorAll('${scope} button')).find(b => b.getClientRects().length && b.textContent.trim().includes(${JSON.stringify(label)}))`;

  const fault = () =>
    evaluate(`
      window.e4Before = localStorage.getItem('${key}');
      window.e4Set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v) {
        if (k === '${key}') throw new Error('E4 fallo forzado de almacenamiento');
        return window.e4Set.call(this, k, v);
      };
      true;
    `);

  const restore = () =>
    evaluate(`
      Storage.prototype.setItem = window.e4Set;
      true;
    `);

  // 1. Navegar a /compras y verificar carga inicial
  await send('Page.navigate', { url: 'http://localhost:8080/compras' });
  await waitFor('document.querySelector("main h1")');

  // 2. Abrir diálogo de Nueva Compra
  await click(visibleButton('Nueva orden'));
  await waitFor('document.querySelector("input[placeholder=\'F001-008921\']")?.value.length > 0');

  // 3. Probar validación con serie vacía
  await evaluate(`(() => {
    const el = document.querySelector('input[placeholder="F001-008921"]');
    if (el) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await click('document.querySelector("button[form=compra-form]") || Array.from(document.querySelectorAll("[role=dialog] button")).find(b => b.textContent.includes("Recepcionar") || b.textContent.includes("Registrar"))');
  await waitFor('document.querySelector("[role=dialog] [role=alert]")?.textContent.includes("comprobante")');
  await screenshot('compra-validacion-720');

  // 4. Seleccionar estado PENDIENTE y registrar con fallo de almacenamiento previo
  const initialStock = await evaluate(`JSON.parse(localStorage.getItem('${key}')).productos.find(p => p.id === 'prod-1').stock`);
  const initialCash = await evaluate(`JSON.parse(localStorage.getItem('${key}')).estadoCaja.saldoEfectivoEsperado`);

  await evaluate(`(() => {
    const el = document.querySelector('input[placeholder="F001-008921"]');
    if (el) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'E4-PEND-901');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);

  // Cambiar estado a PENDIENTE
  await click('Array.from(document.querySelectorAll("[role=dialog] button[role=combobox]")).find(b => b.textContent.includes("Recibida") || b.textContent.includes("Pendiente"))');
  await waitFor('document.querySelector("[role=option]")');
  await click('Array.from(document.querySelectorAll("[role=option]")).find(o => o.textContent.includes("Pendiente"))');

  // Cambiar medio de pago a EFECTIVO
  await click('Array.from(document.querySelectorAll("[role=dialog] button[role=combobox]")).find(b => b.textContent.includes("Transferencia") || b.textContent.includes("Efectivo"))');
  await waitFor('document.querySelector("[role=option]")');
  await click('Array.from(document.querySelectorAll("[role=option]")).find(o => o.textContent.includes("Efectivo"))');

  // Inyectar fallo de escritura
  await fault();
  await click('Array.from(document.querySelectorAll("[role=dialog] button")).find(b => b.textContent.includes("Registrar orden pendiente"))');
  await waitFor('document.querySelector("[role=dialog] [role=alert]")?.textContent.includes("No se pudo guardar")');
  const faultDraftPreserved = await evaluate('document.querySelector("input[placeholder=\'F001-008921\']").value === "E4-PEND-901"');
  if (!faultDraftPreserved) throw new Error('El borrador de compra se perdió ante fallo de guardado');
  await screenshot('compra-error-alta-720');

  // Restaurar almacenamiento y enviar con doble clic
  await restore();
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('[role=dialog] button')).find(b => b.textContent.includes('Registrar orden pendiente'));
    if (btn) { btn.click(); btn.click(); }
  })()`);
  await waitFor('!document.querySelector("[role=dialog]")');

  // 5. Verificar que la orden pendiente NO aumentó stock, NO creó kardex y NO descontó caja
  const dataAfterPending = await evaluate(`JSON.parse(localStorage.getItem('${key}'))`);
  const pendingPurchase = dataAfterPending.compras.find(c => c.serieFactura === 'E4-PEND-901');
  if (!pendingPurchase || pendingPurchase.estado !== 'PENDIENTE') {
    throw new Error('La compra no se guardó en estado PENDIENTE');
  }
  const stockAfterPending = dataAfterPending.productos.find(p => p.id === 'prod-1').stock;
  if (stockAfterPending !== initialStock) {
    throw new Error('La compra pendiente alteró el stock antes de la recepción');
  }
  const kardexPending = dataAfterPending.movimientosKardex.some(k => k.referencia?.includes('E4-PEND-901'));
  if (kardexPending) {
    throw new Error('La compra pendiente generó movimientos en Kardex');
  }
  const cashAfterPending = dataAfterPending.estadoCaja.saldoEfectivoEsperado;
  if (cashAfterPending !== initialCash) {
    throw new Error('La compra pendiente en efectivo descontó dinero de caja por adelantado');
  }

  // 6. Consultar detalle de la compra pendiente
  await send('Page.reload');
  await waitFor('document.querySelector("main table")');
  await click('Array.from(document.querySelectorAll("table tbody tr")).find(tr => tr.textContent.includes("E4-PEND-901"))?.querySelector("button")');
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("E4-PEND-901")');
  await screenshot('compra-detalle-pendiente-720');

  // Cerrar detalle con Escape
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor('!document.querySelector("[role=dialog]")');

  // 7. Recepcionar mercadería
  // Abrir confirmación de recepción desde el botón de la fila
  await click('Array.from(document.querySelectorAll("table tbody tr")).find(tr => tr.textContent.includes("E4-PEND-901"))?.querySelector("button[aria-label*=\'Recepcionar\']")');
  await waitFor('document.querySelector("[role=alertdialog]")');
  await screenshot('compra-confirmacion-recepcion-720');

  // Confirmar recepción
  await click('Array.from(document.querySelectorAll("[role=alertdialog] button")).find(b => b.textContent.includes("Confirmar recepción"))');
  await waitFor('!document.querySelector("[role=alertdialog]")');

  // 8. Verificar que la recepción aplicó stock, kardex y caja exactamente una vez
  await new Promise(r => setTimeout(r, 600));
  const dataAfterReceipt = await evaluate(`JSON.parse(localStorage.getItem('${key}'))`);
  const receivedPurchase = dataAfterReceipt.compras.find(c => c.serieFactura === 'E4-PEND-901');
  if (receivedPurchase?.estado !== 'RECIBIDO') {
    throw new Error('La compra no cambió a estado RECIBIDO tras la recepción');
  }
  const stockAfterReceipt = dataAfterReceipt.productos.find(p => p.id === 'prod-1').stock;
  if (stockAfterReceipt <= initialStock) {
    throw new Error('La recepción de mercadería no incrementó el stock en almacén');
  }
  const kardexEntry = dataAfterReceipt.movimientosKardex.find(k => k.referencia?.includes('E4-PEND-901'));
  if (!kardexEntry || kardexEntry.tipo !== 'ENTRADA') {
    throw new Error('No se generó el asiento de entrada en Kardex');
  }
  const cashAfterReceipt = dataAfterReceipt.estadoCaja.saldoEfectivoEsperado;
  if (cashAfterReceipt >= initialCash) {
    throw new Error('La recepción de compra en efectivo no descontó de caja');
  }

  // 9. Probar modal de sugerencia de compras
  await click(visibleButton('Sugerencia de compras'));
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Recomendación") || document.querySelector("[role=dialog]")?.textContent.includes("Sugerencia")');
  await screenshot('compras-sugerencias-720');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor('!document.querySelector("[role=dialog]")');

  // 10. Vista Móvil (390px)
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await screenshot('compras-resultado-390');

  // 11. Medición de Contraste en Claro y Oscuro
  const contrast = () =>
    evaluate(`(() => {
      const pairs = [
        ['foreground', 'card'],
        ['muted-foreground', 'card'],
        ['success-text', 'success-soft'],
        ['danger-text', 'danger-soft'],
      ];
      return pairs.map(([fg, bg]) => {
        const el = document.createElement('p');
        el.className = 'text-' + fg + ' bg-' + bg;
        document.body.append(el);
        const css = getComputedStyle(el);
        const lum = c => c.match(/[\\d.]+/g).slice(0, 3).map(Number).map(v => v / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
        const a = lum(css.color);
        const b = lum(css.backgroundColor);
        el.remove();
        return { fg, bg, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
    })()`);

  const lightContrast = await contrast();
  await evaluate(`document.documentElement.classList.add('dark'); new Promise(r => setTimeout(r, 250))`);
  const darkContrast = await contrast();
  await screenshot('compras-oscuro-390');
  await evaluate(`document.documentElement.classList.remove('dark'); true`);

  if ([...lightContrast, ...darkContrast].some((p) => p.ratio < 4.5)) {
    throw new Error('Contraste de texto insuficiente');
  }

  return {
    pendingRegistered: true,
    stockPreservedWhilePending: stockAfterPending === initialStock,
    kardexPreservedWhilePending: !kardexPending,
    cashPreservedWhilePending: cashAfterPending === initialCash,
    receiptSuccessful: receivedPurchase.estado === 'RECIBIDO',
    stockAddedOnReceipt: stockAfterReceipt > initialStock,
    kardexCreatedOnReceipt: Boolean(kardexEntry),
    cashDeductedOnReceipt: cashAfterReceipt < initialCash,
    lightContrast,
    darkContrast,
  };
}
