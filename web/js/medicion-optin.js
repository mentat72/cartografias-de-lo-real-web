// Módulo local que solo se incorpora al HTML cuando la medición está configurada.
// No hay persistencia del permiso: cada página empieza sin autorización.
export function iniciarMedicion(config, entorno = window) {
  const doc = entorno.document;
  const panel = doc.querySelector('[data-medicion]');
  if (!panel || config.habilitada !== true) return null;
  const estado = panel.querySelector('[role="status"]');
  const aceptar = panel.querySelector('[data-medicion-aceptar]');
  const retirar = panel.querySelector('[data-medicion-retirar]');
  let autorizada = false;
  let lista = false;
  let script = null;
  let intento = 0;
  const urlScript = new URL(config.script, entorno.location.href);
  // Mantener el servicio en el propio origen, sin CDN ni parámetros de seguimiento.
  if (urlScript.origin !== entorno.location.origin || urlScript.protocol !== 'https:' || urlScript.search || urlScript.hash) return null;

  function revocar() {
    autorizada = false;
    lista = false;
    intento += 1;
    if (script) { script.remove(); script = null; }
    aceptar.disabled = false;
    retirar.disabled = true;
    estado.textContent = 'Medición desactivada en esta página. No se enviarán nuevos eventos.';
  }
  aceptar.addEventListener('click', function () {
    if (autorizada) return;
    autorizada = true;
    lista = false;
    aceptar.disabled = true;
    retirar.disabled = false;
    estado.textContent = 'Activando la medición opcional de esta página…';
    const actual = ++intento;
    script = doc.createElement('script');
    script.src = urlScript.href;
    script.async = true;
    script.dataset.websiteId = config.website_id;
    script.dataset.autoTrack = 'false';
    script.referrerPolicy = 'no-referrer';
    script.onload = function () {
      if (!autorizada || actual !== intento) return;
      lista = !!(entorno.umami && typeof entorno.umami.track === 'function');
      if (!lista) { revocar(); estado.textContent = 'El servicio no está disponible. La medición sigue desactivada.'; return; }
      estado.textContent = 'Solo se medirán clics afiliados desde ahora y en esta página. Puedes retirar el permiso.';
    };
    script.onerror = function () {
      if (actual !== intento) return;
      revocar();
      estado.textContent = 'No se ha podido cargar el servicio. La medición sigue desactivada.';
    };
    doc.head.appendChild(script);
  });
  retirar.addEventListener('click', revocar);

  function registrarClic(evento) {
    if (!autorizada || !lista || !evento.isTrusted) return;
    if (evento.type === 'click' && evento.button !== 0) return;
    if (evento.type === 'auxclick' && evento.button !== 1) return;
    const enlace = evento.target && evento.target.closest ? evento.target.closest('a[data-afiliado]') : null;
    if (!enlace || !enlace.rel.split(/\s+/).includes('sponsored')) return;
    if (!/^[a-z0-9-]{1,64}$/.test(enlace.dataset.afiliado || '')) return;
    const destino = new URL(enlace.href, entorno.location.href);
    if (destino.protocol !== 'https:' || destino.origin === entorno.location.origin) return;
    // No enviar URL comercial, query, fragmento, referrer, texto libre ni valores de formularios.
    try {
      entorno.umami.track({
        website: config.website_id,
        hostname: entorno.location.hostname,
        url: entorno.location.pathname,
        name: 'clic_afiliado',
        data: { recurso: enlace.dataset.afiliado }
      });
    } catch (error) { /* La medición nunca bloquea la navegación. */ }
  }
  doc.addEventListener('click', registrarClic);
  doc.addEventListener('auxclick', registrarClic);
  panel.hidden = false;
  return { revocar };
}

if (typeof document !== 'undefined') {
  const nodo = document.querySelector('#cdlr-medicion-config');
  if (nodo) {
    try { iniciarMedicion(JSON.parse(nodo.textContent)); }
    catch (error) { /* Sin configuración válida, no se carga ningún proveedor. */ }
  }
}
