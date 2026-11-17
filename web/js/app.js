'use strict';

// El script del head ya ha fijado el tema en html antes del primer pintado.
const raizTema = document.documentElement;
const botonTema = document.querySelector('#boton-tema');
let preferenciaTema = null;
try {
  const guardada = localStorage.getItem('cartografias-tema');
  if (guardada === 'claro' || guardada === 'oscuro') preferenciaTema = guardada;
} catch (error) { /* El tema funciona también sin almacenamiento. */ }
const temaSistema = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: light)') : null;

function actualizarEstadoTema() {
  const claro = raizTema.classList.contains('tema-claro');
  raizTema.style.colorScheme = claro ? 'light' : 'dark';
  const etiqueta = claro ? 'Activar modo oscuro' : 'Activar modo claro';
  if (botonTema) {
    botonTema.setAttribute('aria-label', etiqueta);
    botonTema.setAttribute('aria-pressed', String(claro));
    botonTema.title = etiqueta;
  }
  const colorNavegador = document.querySelector('meta[name="theme-color"]');
  if (colorNavegador) colorNavegador.content = claro ? '#E8E4D9' : '#0A0A0A';
}
function cambiarTema() {
  const claro = raizTema.classList.toggle('tema-claro');
  preferenciaTema = claro ? 'claro' : 'oscuro';
  actualizarEstadoTema();
  try { localStorage.setItem('cartografias-tema', preferenciaTema); }
  catch (error) { /* Se mantiene la elección durante esta visita. */ }
}
actualizarEstadoTema();
if (botonTema) botonTema.addEventListener('click', cambiarTema);

// Seguir los cambios del sistema únicamente mientras no haya elección propia.
if (temaSistema) {
  const seguirSistema = function (evento) {
    if (preferenciaTema !== null) return;
    raizTema.classList.toggle('tema-claro', evento.matches);
    actualizarEstadoTema();
  };
  if (typeof temaSistema.addEventListener === 'function') temaSistema.addEventListener('change', seguirSistema);
  else if (typeof temaSistema.addListener === 'function') temaSistema.addListener(seguirSistema);
}

// Filtros de artículos: evento click + lectura de atributos + cambios visibles en el DOM.
const botonesFiltro = document.querySelectorAll('.filtro');
const tarjetas = document.querySelectorAll('.tarjeta-articulo');
const resultadoFiltros = document.querySelector('#resultado-filtros');
function filtrarArticulos(categoria) {
  let visibles = 0;
  tarjetas.forEach(function (tarjeta) {
    const coincide = categoria === 'todos' || tarjeta.dataset.categoria === categoria;
    tarjeta.hidden = !coincide;
    if (coincide) visibles += 1;
  });
  botonesFiltro.forEach(function (boton) {
    const activo = boton.dataset.filtro === categoria;
    boton.classList.toggle('activo', activo);
    boton.setAttribute('aria-pressed', String(activo));
  });
  if (resultadoFiltros) resultadoFiltros.textContent = visibles + (visibles === 1 ? ' ensayo disponible' : ' ensayos disponibles');
}
botonesFiltro.forEach(function (boton) {
  boton.addEventListener('click', function () { filtrarArticulos(boton.dataset.filtro); });
});

// Itinerarios locales: tres lecturas, sin nombre ni almacenamiento de intereses.
const lecturasCDLR = {"aceleracionismo": {"titulo": "¿Qué significa acelerar el capitalismo?", "url": "articulos/aceleracionismo.html", "minutos": 6}, "hauntologia": {"titulo": "La nostalgia de los futuros perdidos", "url": "articulos/hauntologia.html", "minutos": 5}, "materialismo": {"titulo": "¿Existe un mundo sin nosotros?", "url": "articulos/materialismo-especulativo.html", "minutos": 7}, "hipersticion": {"titulo": "Hiperstición: ficciones que producen realidad", "url": "articulos/hipersticion.html", "minutos": 6}};
const rutasCDLR = {"aceleracionismo": {"titulo": "Tecnología, deseo y futuros en disputa", "slug": "aceleracionismos", "territorio": "Aceleracionismos", "lecturas": ["aceleracionismo", "hipersticion", "hauntologia"], "motivos": ["Distingue las corrientes enfrentadas del aceleracionismo y sus preguntas políticas.", "Continúa con la relación entre relatos, expectativas y prácticas.", "Cierra el recorrido preguntándote qué ocurre con los futuros que no llegan."]}, "filosofia": {"titulo": "Pensar un mundo más allá de nosotros", "slug": "ontologias-especulativas", "territorio": "Ontologías especulativas", "lecturas": ["materialismo", "hipersticion", "aceleracionismo"], "motivos": ["Entra por el problema del correlacionismo y los límites de nuestra perspectiva.", "Compara esa pregunta con las ficciones que intervienen en lo real.", "Pon en relación estas discusiones con proyectos políticos y tecnológicos."]}, "cultura": {"titulo": "Leer las huellas de los futuros perdidos", "slug": "futuros-espectrales", "territorio": "Futuros espectrales", "lecturas": ["hauntologia", "hipersticion", "aceleracionismo"], "motivos": ["Empieza por las relaciones entre memoria, cultura y promesas truncadas.", "Explora cómo un relato también puede orientar expectativas y acciones.", "Contrasta esas expectativas con las distintas políticas de la aceleración."]}, "ficcion": {"titulo": "Relatos, sistemas y bucles de realidad", "slug": "maquinas-y-ficciones", "territorio": "Máquinas y ficciones", "lecturas": ["hipersticion", "aceleracionismo", "materialismo"], "motivos": ["Abre el recorrido con una lectura crítica de la hiperstición.", "Sitúa la teoría-ficción junto a debates sobre capitalismo y tecnología.", "Termina con una pregunta sobre lo real y su relación con el pensamiento."]}, "biblioteca": {"titulo": "Tres entradas al archivo", "slug": "biblioteca-del-futuro", "territorio": "Biblioteca del futuro", "lecturas": ["hauntologia", "aceleracionismo", "materialismo"], "motivos": ["Entra por una pregunta cultural sobre la nostalgia y las promesas perdidas.", "Pasa a las diferencias entre proyectos políticos y tecnológicos.", "Amplía el recorrido con la pregunta filosófica por un mundo sin nosotros."]}};
const formulario = document.querySelector('#formulario-lectura');
const respuesta = document.querySelector('#respuesta-lectura');
let rutaActual = null;

function actualizarRutaCorreo(clave) {
  const ruta = rutasCDLR[clave];
  const formularioRuta = document.querySelector('#correo-ruta-form');
  if (!formularioRuta || !ruta) return;
  const campo = formularioRuta.querySelector('[data-campo-ruta]');
  const base = formularioRuta.dataset.basePublica || new URL('.', document.baseURI).href;
  campo.value = ruta.titulo + '\n' + ruta.lecturas.map(function (id, i) {
    const lectura = lecturasCDLR[id];
    return (i + 1) + '. ' + lectura.titulo + '\n' + new URL(lectura.url, base).href;
  }).join('\n\n');
}

function recomendarLectura(evento) {
  evento.preventDefault();
  const campo = document.querySelector('#tema-lector');
  const ruta = rutasCDLR[campo.value];
  const opciones = document.querySelector('#opciones-ruta');
  respuesta.hidden = false;
  respuesta.replaceChildren();
  respuesta.classList.toggle('error', !ruta);
  campo.removeAttribute('aria-invalid');
  if (!ruta) {
    rutaActual = null;
    opciones.hidden = true;
    campo.setAttribute('aria-invalid', 'true');
    respuesta.textContent = 'Selecciona un territorio para ver tu ruta de lectura.';
    campo.focus();
    return;
  }
  rutaActual = campo.value;
  const encabezado = document.createElement('h3');
  encabezado.textContent = ruta.titulo;
  respuesta.appendChild(encabezado);
  const resumen = document.createElement('p');
  resumen.textContent = 'Tres lecturas · ' + ruta.lecturas.reduce(function (total, id) {
    return total + lecturasCDLR[id].minutos;
  }, 0) + ' min de lectura aproximada. Sigue este orden o entra por la pregunta que prefieras.';
  respuesta.appendChild(resumen);
  const lista = document.createElement('ol');
  ruta.lecturas.forEach(function (id, i) {
    const item = document.createElement('li');
    const enlace = document.createElement('a');
    enlace.href = lecturasCDLR[id].url;
    enlace.textContent = lecturasCDLR[id].titulo;
    const motivo = document.createElement('p');
    motivo.textContent = ruta.motivos[i];
    item.append(enlace, motivo);
    lista.appendChild(item);
  });
  respuesta.appendChild(lista);
  const guia = document.createElement('a');
  guia.href = 'guias/' + ruta.slug + '.html';
  guia.textContent = 'Abrir la guía de este recorrido ↗';
  respuesta.appendChild(guia);
  actualizarRutaCorreo(rutaActual);
  opciones.hidden = false;
  // Evitar conservar un consentimiento para una ruta distinta.
  const consentimiento = document.querySelector('#correo-ruta-consentimiento');
  if (consentimiento) consentimiento.checked = false;
}
if (formulario) formulario.addEventListener('submit', recomendarLectura);

const guardarRuta = document.querySelector('#guardar-ruta');
if (guardarRuta) guardarRuta.addEventListener('click', function () {
  const ruta = rutasCDLR[rutaActual];
  if (!ruta) return;
  const texto = 'Cartografías de lo Real\n' + ruta.titulo + '\n\n' + ruta.lecturas.map(function (id, i) {
    const lectura = lecturasCDLR[id];
    return (i + 1) + '. ' + lectura.titulo + '\n' + ruta.motivos[i] + '\n' + new URL(lectura.url, document.baseURI).href;
  }).join('\n\n');
  const url = URL.createObjectURL(new Blob([texto], {type: 'text/plain;charset=utf-8'}));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'CDLR-ruta-' + rutaActual + '.txt';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
});

// Mejora progresiva: validación accesible; el envío válido sigue siendo POST nativo.
document.querySelectorAll('.formulario-correo').forEach(function (form) {
  const estado = form.querySelector('[role="status"]');
  form.addEventListener('submit', function (evento) {
    if (form.dataset.estado !== 'activo') {
      evento.preventDefault();
      estado.textContent = 'El envío todavía no está disponible. No se ha enviado ningún dato.';
      return;
    }
    const trampa = form.querySelector('[data-honeypot]');
    if (trampa.value.trim()) {
      evento.preventDefault();
      estado.textContent = 'No se ha enviado el formulario. Recarga la página e inténtalo de nuevo.';
      return;
    }
    if (form.dataset.rutaDinamica === 'true' && !rutaActual) {
      evento.preventDefault();
      estado.textContent = 'Genera primero una ruta de lectura.';
      return;
    }
    if (!form.reportValidity()) { evento.preventDefault(); return; }
    // El proveedor debe confirmar la recepción, la baja y, si procede, el doble opt-in.
    estado.textContent = 'Abriendo el servicio de correo. El proveedor confirmará el resultado.';
  });
});


// La cita sigue siendo visible si no hay observador o se solicita menos movimiento.
const cita = document.querySelector('#manifiesto blockquote');
if (cita && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('revelar-visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.25 });
  cita.classList.add('revelar-pendiente');
  observador.observe(cita);
}
