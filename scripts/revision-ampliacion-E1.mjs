// Escenarios de navegador ejecutados por revision-ampliacion-E0.mjs con
// KIPUS_REVISION_ETAPA=E1. Siempre usa el perfil aislado del runner.
export async function run({ send, evaluate, waitFor, screenshot }) {
  console.log('E1: operaciones con almacenamiento normal y fallido');
  await send('Page.navigate', { url: 'http://localhost:8080/gastos' });
  await waitFor(`document.querySelector('main h1')`);
  const logic = await evaluate(`(async () => {
    const { erpStore: s } = await import('/client/services/erp/erpStore.ts');
    const key = 'KIPUS_ERP_STORAGE_V2';
    const original = Storage.prototype.setItem;
    const venta = { tipoComprobante: 'BOLETA', clienteNombre: 'E1 navegador', clienteDocumento: '00000000', metodoPago: 'EFECTIVO', items: [{productoId:'prod-1', nombre:'Arroz E1', cantidad:1, precioUnitario:4.8}] };
    const compra = { proveedorNombre:'Proveedor E1', proveedorRuc:'20100055237', serieFactura:'E1-NAVEGADOR', metodoPago:'EFECTIVO', total:2, itemsCount:1, items:[{productoId:'prod-1',sku:'ARR-COS-01',nombre:'Arroz',cantidad:1,precioUnitario:2,subtotal:2}] };
    const checks = [];
    for (const [name, operation] of [
      ['venta', () => s.emitirVenta(venta)],
      ['compra', () => s.registrarCompra(compra)],
      ['gasto', () => s.registrarGasto({categoria:'OTROS',descripcion:'E1 lógica navegador',beneficiario:'E1',comprobante:'',monto:2,metodoPago:'EFECTIVO'})],
      ['ajuste', () => s.registrarAjusteInventario({productoId:'prod-1',nuevoStock:40,motivo:'E1'})],
      ['caja', () => s.registrarOperacionCaja({tipo:'INGRESO',concepto:'E1 navegador',metodo:'EFECTIVO',monto:2})]
    ]) {
      const before = localStorage.getItem(key);
      const memory = JSON.stringify([s.getProductos(),s.getVentas(),s.getCompras(),s.getGastos(),s.getKardex(),s.getEstadoCaja(),s.getMovimientosCaja()]);
      let rejected = false;
      Storage.prototype.setItem = function(k,v) { if(k === key) throw new DOMException('E1 aislado','QuotaExceededError'); return original.call(this,k,v); };
      try { operation(); } catch { rejected = true; } finally { Storage.prototype.setItem = original; }
      const rolledBack = memory === JSON.stringify([s.getProductos(),s.getVentas(),s.getCompras(),s.getGastos(),s.getKardex(),s.getEstadoCaja(),s.getMovimientosCaja()]);
      if (!rejected || !rolledBack || localStorage.getItem(key) !== before) throw new Error(name + ': reversión incorrecta');
      operation();
      checks.push({name,rejected,rolledBack,saved:localStorage.getItem(key)!==before});
    }
    window.e1NativeSetItem = original;
    return checks;
  })()`);
  await send('Page.reload');
  await waitFor(`document.querySelector('main h1') && document.body.innerText.includes('E1 lógica navegador')`);
  const reloaded = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).gastos.some(g=>g.descripcion==='E1 lógica navegador')`);
  console.log('E1: formulario de gasto');
  await evaluate(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()==='Registrar gasto').click()`);
  await waitFor(`document.querySelector('#gasto-concepto')`);
  await evaluate(`(() => {
    const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    for (const [id,value] of Object.entries({'gasto-concepto':'E1 formulario con reintento','gasto-beneficiario':'Prueba aislada','gasto-monto':'3'})) { const el=document.getElementById(id); set.call(el,value); el.dispatchEvent(new Event('input',{bubbles:true})); }
    window.e1NativeSetItem=Storage.prototype.setItem;
    window.e1Before = localStorage.getItem('KIPUS_ERP_STORAGE_V2');
    Storage.prototype.setItem=function(k,v){if(k==='KIPUS_ERP_STORAGE_V2')throw new DOMException('E1','QuotaExceededError');return window.e1NativeSetItem.call(this,k,v);};
  })()`);
  await evaluate(`document.querySelector('[role=dialog] button[type=submit]').click()`);
  await waitFor(`document.querySelector('[role=alert]')?.textContent.includes('No se pudo guardar')`);
  const failure = await evaluate(`({ draft:document.getElementById('gasto-concepto').value, unchanged:window.e1Before===localStorage.getItem('KIPUS_ERP_STORAGE_V2'), focus:document.activeElement.getAttribute('role'), dialog:!!document.querySelector('[role=dialog]') })`);
  if (!failure.unchanged || !failure.dialog || failure.draft !== 'E1 formulario con reintento') throw new Error('El formulario perdió el borrador');
  await screenshot('gasto-error-borrador-720');
  await evaluate(`Storage.prototype.setItem=window.e1NativeSetItem; const b=document.querySelector('[role=dialog] button[type=submit]');b.click();b.click();`);
  await waitFor(`!document.querySelector('[role=dialog]')`);
  await send('Page.reload');
  await waitFor(`document.querySelector('main h1') && document.body.innerText.includes('E1 formulario con reintento')`);
  const count = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).gastos.filter(g=>g.descripcion==='E1 formulario con reintento').length`);
  if (count !== 1) throw new Error('Doble envío generó duplicados');
  await screenshot('gasto-reintento-720');
  console.log('E1: formulario de compra');
  await send('Page.navigate', { url: 'http://localhost:8080/compras' });
  await waitFor(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.includes('Nueva orden'))`);
  await evaluate(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.includes('Nueva orden')).click()`);
  await waitFor(`document.querySelector('input[placeholder="F001-008921"]')?.value`);
  await evaluate(`(() => { const el=document.querySelector('input[placeholder="F001-008921"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'E1-FORM-COMPRA');el.dispatchEvent(new Event('input',{bubbles:true}));window.e1Before=localStorage.getItem('KIPUS_ERP_STORAGE_V2');window.e1NativeSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='KIPUS_ERP_STORAGE_V2')throw new Error('E1 aislado');return window.e1NativeSetItem.call(this,k,v);}; })()`);
  const purchaseSubmit = `Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>b.textContent.includes('Recepcionar y Abastecer'))`;
  await evaluate(`${purchaseSubmit}.click()`);
  await waitFor(`document.querySelector('[role=alert]')?.textContent.includes('No se pudo guardar')`);
  const purchaseFailure = await evaluate(`({ draft:document.querySelector('input[placeholder="F001-008921"]').value, unchanged:window.e1Before===localStorage.getItem('KIPUS_ERP_STORAGE_V2'), dialog:!!document.querySelector('[role=dialog]') })`);
  if (!purchaseFailure.unchanged || purchaseFailure.draft!=='E1-FORM-COMPRA') throw new Error('La compra perdió el borrador');
  await screenshot('compra-error-borrador-720');
  await evaluate(`Storage.prototype.setItem=window.e1NativeSetItem;const b=${purchaseSubmit};b.click();b.click();`);
  await waitFor(`!document.querySelector('[role=dialog]')`);
  await send('Page.reload');
  await waitFor(`document.querySelector('main h1') && document.body.innerText.includes('E1-FORM-COMPRA')`);
  const purchaseCount = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).compras.filter(c=>c.serieFactura==='E1-FORM-COMPRA').length`);
  if (purchaseCount!==1) throw new Error('Compra duplicada');
  await screenshot('compra-reintento-720');
  console.log('E1: cobro');
  await evaluate(`(async()=>{const {erpStore:s}=await import('/client/services/erp/erpStore.ts');s.actualizarProducto('prod-1',{codigoBarras:'E1-CODIGO'});})()`);
  await send('Page.navigate', { url: 'http://localhost:8080/ventas' });
  await waitFor(`document.getElementById('pos-codigo')`);
  await waitFor(`document.querySelector('main')?.innerText.includes('Arroz Costeño Extra 1 kg')`);
  await evaluate(`(()=>{const el=document.getElementById('pos-codigo');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'E1-CODIGO');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Agregar por código')).click()`);
  await waitFor(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.includes('COBRAR')&&!b.disabled)`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('COBRAR')).click()`);
  await waitFor(`document.querySelector('[role=dialog] button[type=submit]')`);
  await evaluate(`window.e1Before=localStorage.getItem('KIPUS_ERP_STORAGE_V2');window.e1NativeSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='KIPUS_ERP_STORAGE_V2')throw new Error('E1 aislado');return window.e1NativeSetItem.call(this,k,v);};document.querySelector('[role=dialog] button[type=submit]').click();`);
  await waitFor(`document.querySelector('[role=alert]')?.textContent.includes('No se pudo guardar')`);
  const saleFailure = await evaluate(`({unchanged:window.e1Before===localStorage.getItem('KIPUS_ERP_STORAGE_V2'),dialog:!!document.querySelector('[role=dialog]'),focus:document.activeElement.getAttribute('role')})`);
  if (!saleFailure.unchanged || !saleFailure.dialog) throw new Error('Cobro fallido aplicó efectos');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await screenshot('cobro-error-borrador-390');
  await evaluate(`document.documentElement.classList.add('dark');true`);
  await evaluate(`new Promise(resolve=>setTimeout(resolve,250))`);
  await screenshot('cobro-error-oscuro-390');
  await evaluate(`document.documentElement.classList.remove('dark');Storage.prototype.setItem=window.e1NativeSetItem;window.e1VentaCount=JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).ventas.length;const b=document.querySelector('[role=dialog] button[type=submit]');b.click();b.click();`);
  await waitFor(`document.querySelector('[role=dialog]')?.innerText.includes('Venta completada') || JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).ventas.length>window.e1VentaCount`);
  const saleCount = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).ventas.length-window.e1VentaCount`);
  if (saleCount!==1) throw new Error('Cobro duplicado');
  await send('Page.reload');
  await waitFor(`document.getElementById('pos-codigo')`);
  console.log('E1: ingreso de caja');
  const fault = async () => evaluate(`window.e1Before=localStorage.getItem('KIPUS_ERP_STORAGE_V2');window.e1NativeSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='KIPUS_ERP_STORAGE_V2')throw new Error('E1 aislado');return window.e1NativeSetItem.call(this,k,v);};true`);
  await send('Page.navigate', { url: 'http://localhost:8080/caja' });
  await waitFor(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.trim()==='Ingreso')`);
  await evaluate(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()==='Ingreso').click()`);
  await waitFor(`document.querySelector('[role=dialog] input[placeholder]')`);
  await evaluate(`(()=>{const el=document.querySelector('[role=dialog] input[placeholder]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'E1 ingreso formulario');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await fault();
  await evaluate(`document.querySelector('[role=dialog] button[type=submit]').click()`);
  await waitFor(`document.querySelector('[role=alert]')?.textContent.includes('No se pudo guardar')`);
  const cashFailure = await evaluate(`({unchanged:window.e1Before===localStorage.getItem('KIPUS_ERP_STORAGE_V2'),draft:document.querySelector('[role=dialog] input[placeholder]').value})`);
  if (!cashFailure.unchanged || cashFailure.draft!=='E1 ingreso formulario') throw new Error('Ingreso perdió borrador');
  await screenshot('caja-error-borrador-390');
  await evaluate(`Storage.prototype.setItem=window.e1NativeSetItem;const b=document.querySelector('[role=dialog] button[type=submit]');b.click();b.click();`);
  await waitFor(`!document.querySelector('[role=dialog]')`);
  const cashCount = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).movimientosCaja.filter(m=>m.concepto==='E1 ingreso formulario').length`);
  if(cashCount!==1) throw new Error('Ingreso duplicado');
  console.log('E1: ajuste de inventario');
  await send('Page.navigate', { url: 'http://localhost:8080/inventario?tab=ajustes' });
  await waitFor(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.includes('Nuevo ajuste'))`);
  await evaluate(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.includes('Nuevo ajuste')).click()`);
  await waitFor(`document.querySelector('[role=dialog] [role=combobox]')`);
  await evaluate(`document.querySelector('[role=dialog] [role=combobox]').click()`);
  await waitFor(`document.querySelector('[role=option]')`);
  await evaluate(`document.querySelector('[role=option]').click()`);
  await evaluate(`(()=>{const el=document.getElementById('input-nuevo-stock');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'37');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate(`Array.from(document.querySelectorAll('[role=dialog] button')).find(b=>b.textContent.trim()==='Continuar').click()`);
  await waitFor(`document.querySelector('[role=alertdialog]')`);
  await fault();
  const confirm = `Array.from(document.querySelectorAll('[role=alertdialog] button')).find(b=>b.textContent.includes('Confirmar y aplicar'))`;
  await evaluate(`${confirm}.click()`);
  await waitFor(`document.body.innerText.includes('No se pudo guardar')`);
  const adjustmentFailure = await evaluate(`({unchanged:window.e1Before===localStorage.getItem('KIPUS_ERP_STORAGE_V2'),confirmation:!!document.querySelector('[role=alertdialog]')})`);
  if(!adjustmentFailure.unchanged||!adjustmentFailure.confirmation) throw new Error('Ajuste fallido perdió confirmación');
  await screenshot('ajuste-error-borrador-390');
  await evaluate(`Storage.prototype.setItem=window.e1NativeSetItem;window.e1AjusteCount=JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).ajustesInventario.length;const b=${confirm};b.click();b.click();`);
  await waitFor(`!document.querySelector('[role=alertdialog]')&&!document.querySelector('[role=dialog]')`);
  const adjustmentCount = await evaluate(`JSON.parse(localStorage.getItem('KIPUS_ERP_STORAGE_V2')).ajustesInventario.length-window.e1AjusteCount`);
  if(adjustmentCount!==1) throw new Error('Ajuste duplicado');
  return {logic,reloaded,failure,retryCount:count,purchaseFailure,purchaseCount,saleFailure,saleCount,cashFailure,cashCount,adjustmentFailure,adjustmentCount};
}
