/* ═══════════════════════════════════════════════════
   app.js — Lógica principal
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

const COMUNES = ['iluminacion_comun', 'clima_comun', 'comunicaciones_comun'];

let datosActuales = [];
let cantidades    = {};

const rubroSelect    = document.getElementById('rubroSelect');
const emptyState     = document.getElementById('emptyState');
const zonasContainer = document.getElementById('zonasContainer');
const inputTarifa    = document.getElementById('inputTarifa');

const el = {
  iluminacion:      document.getElementById('resIluminacion'),
  cargaArtefactos:  document.getElementById('resCargaArtefactos'),
  numEquipos:       document.getElementById('resNumEquipos'),
  factorCarga:      document.getElementById('resFactorCarga'),
  artefactosFactor: document.getElementById('resArtefactosFactor'),
  potenciaEstimada: document.getElementById('resPotenciaEstimada'),
  mayorEquipo:      document.getElementById('resMayorEquipo'),
  dosM:             document.getElementById('resDosM'),
  tresM:            document.getElementById('resTresM'),
  potenciaFinal:    document.getElementById('resPotenciaFinal'),
  amperaje:         document.getElementById('resAmperaje'),
  costoMensual:     document.getElementById('resCostoMensual'),
};

async function cargarJSON(nombre) {
  const res = await fetch(`data/${nombre}.json`);
  if (!res.ok) throw new Error(`No se pudo cargar ${nombre}.json`);
  return res.json();
}

rubroSelect.addEventListener('change', async () => {
  const rubro = rubroSelect.value;
  if (!rubro) { mostrarEmpty(); return; }
  await cargarRubro(rubro);
});

async function cargarRubro(rubro) {
  emptyState.style.display     = 'none';
  zonasContainer.innerHTML     = '<div style="padding:20px;color:#888">Cargando...</div>';
  zonasContainer.style.display = 'block';

  try {
    const resultados = await Promise.all([
      cargarJSON(rubro),
      ...COMUNES.map(c => cargarJSON(c))
    ]);
    datosActuales = resultados.flat();
    cantidades    = {};
    renderizarArtefactos();
    recalcular();
  } catch (e) {
    zonasContainer.innerHTML = `<div style="padding:20px;color:red">Error: ${e.message}</div>`;
  }
}

// ── Renderizar zonas ───────────────────────────────
function renderizarArtefactos() {
  zonasContainer.innerHTML = '';

  const grupos = new Map();
  datosActuales.forEach((item, idx) => {
    const titulo = `${formatearRubro(item.categoria||'')} — ${capitalizar(item.zona||'General')}`;
    if (!grupos.has(titulo)) grupos.set(titulo, []);
    grupos.get(titulo).push({ ...item, _idx: idx });
  });

  grupos.forEach((items, titulo) => {
    const bloque   = document.createElement('div');
    bloque.className = 'zona-bloque';

    const tit = document.createElement('div');
    tit.className   = 'zona-titulo';
    tit.textContent = titulo;
    bloque.appendChild(tit);

    const grid = document.createElement('div');
    grid.className = 'artefactos-grid';
    items.forEach(item => grid.appendChild(crearTarjeta(item)));
    bloque.appendChild(grid);
    zonasContainer.appendChild(bloque);
  });

  // Tarjeta ➕ al final de todo — una sola
  const bloqueAgregar = document.createElement('div');
  bloqueAgregar.className = 'zona-bloque';

  const titAgregar = document.createElement('div');
  titAgregar.className   = 'zona-titulo';
  titAgregar.textContent = '✏️ Carga personalizada';
  bloqueAgregar.appendChild(titAgregar);

  const gridAgregar = document.createElement('div');
  gridAgregar.className = 'artefactos-grid';

  const cardAgregar = document.createElement('div');
  cardAgregar.className = 'artefacto-card artefacto-card--agregar';
  cardAgregar.innerHTML = `
    <div class="image-wrap agregar-wrap">
      <span class="agregar-icono">➕</span>
    </div>
    <div class="artefacto-nombre">Agregar carga</div>
  `;
  // Usar setTimeout para asegurar que modal.js ya cargó
  cardAgregar.addEventListener('click', () => {
    if (typeof abrirModal === 'function') {
      abrirModal();
    } else {
      alert('El módulo de carga manual no está disponible.');
    }
  });

  gridAgregar.appendChild(cardAgregar);
  bloqueAgregar.appendChild(gridAgregar);
  zonasContainer.appendChild(bloqueAgregar);
}

// ── Crear tarjeta ──────────────────────────────────
function crearTarjeta(item) {
  const idx  = item._idx;
  const cant = cantidades[idx] || 0;

  const card = document.createElement('div');
  card.className     = 'artefacto-card' + (cant > 0 ? ' activa' : '');
  card.dataset.index = idx;

  const imgWrap = document.createElement('div');
  imgWrap.className = 'image-wrap';

  const img = document.createElement('img');
  img.src     = `img/${item.categoria}/${item.nombre_archivo}`;
  img.alt     = item.artefacto || '';
  img.loading = 'lazy';
  img.onerror = () => { img.src = 'img/placeholder.webp'; };
  imgWrap.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'controls-overlay';
  const plus  = document.createElement('div');
  plus.className  = 'overlay-half overlay-plus';
  plus.innerHTML  = '<span class="overlay-sign">+</span>';
  const minus = document.createElement('div');
  minus.className = 'overlay-half overlay-minus';
  minus.innerHTML = '<span class="overlay-sign">−</span>';
  overlay.appendChild(plus);
  overlay.appendChild(minus);
  imgWrap.appendChild(overlay);
  card.appendChild(imgWrap);

  const nombre = document.createElement('div');
  nombre.className   = 'artefacto-nombre';
  nombre.textContent = capitalizar(item.artefacto || '');
  card.appendChild(nombre);

  const badge = document.createElement('div');
  badge.className   = 'badge' + (cant > 0 ? ' visible' : '');
  badge.textContent = cant;
  card.appendChild(badge);

  plus.addEventListener('click',  e => { e.stopPropagation(); cambiarCantidad(idx, 1, card, badge); });
  minus.addEventListener('click', e => { e.stopPropagation(); cambiarCantidad(idx, -1, card, badge); });
  card.addEventListener('click',       () => cambiarCantidad(idx, 1, card, badge));
  card.addEventListener('contextmenu', e => { e.preventDefault(); cambiarCantidad(idx, -1, card, badge); });

  return card;
}

// ── Cambiar cantidad ───────────────────────────────
function cambiarCantidad(idx, delta, card, badge) {
  cantidades[idx] = Math.max(0, (cantidades[idx] || 0) + delta);
  const cant = cantidades[idx];
  badge.textContent = cant;
  badge.classList.toggle('visible', cant > 0);
  card.classList.toggle('activa',   cant > 0);
  badge.classList.remove('bounce');
  void badge.offsetWidth;
  badge.classList.add('bounce');
  recalcular();
}

// ── Recalcular ─────────────────────────────────────
function recalcular() {
  const items = datosActuales.map((item, idx) => ({ ...item, cantidad: cantidades[idx] || 0 }));
  const tarifa = parseFloat(inputTarifa.value) || 0.70;
  const s = Calculos.calcularTodo(items, tarifa);

  el.iluminacion.textContent      = s.ilum.toFixed(2)                + ' kW';
  el.cargaArtefactos.textContent  = s.carga.toFixed(2)               + ' kW';
  el.numEquipos.textContent       = s.numEquipos;
  el.factorCarga.textContent      = (s.factor * 100).toFixed(0)      + '%';
  el.artefactosFactor.textContent = s.potArtefactosFactor.toFixed(2) + ' kW';
  el.potenciaEstimada.textContent = s.potEnciaEstimada.toFixed(2)    + ' kW';
  el.mayorEquipo.textContent      = s.mayor.toFixed(2)               + ' kW';
  el.dosM.textContent             = s.dosM.toFixed(2)                + ' kW';
  el.tresM.textContent            = s.tresM.toFixed(2)               + ' kW';
  el.amperaje.textContent         = s.amperaje.toFixed(2)            + ' A';
  el.costoMensual.textContent     = 'S/. ' + s.costoMensual.toFixed(2);

  const finalEl = el.potenciaFinal;
  finalEl.textContent = s.potenciaFinal.toFixed(2) + ' kW';
  finalEl.classList.remove('actualizado');
  void finalEl.offsetWidth;
  finalEl.classList.add('actualizado');
}

// ── Reiniciar ──────────────────────────────────────
document.getElementById('btnReset').addEventListener('click', () => {
  cantidades = {};
  document.querySelectorAll('.badge').forEach(b => { b.textContent = '0'; b.classList.remove('visible'); });
  document.querySelectorAll('.artefacto-card').forEach(c => c.classList.remove('activa'));
  recalcular();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

inputTarifa.addEventListener('input', recalcular);

// ── Helpers ────────────────────────────────────────
function mostrarEmpty() {
  zonasContainer.style.display = 'none';
  emptyState.style.display     = 'flex';
  datosActuales = [];
  cantidades    = {};
  recalcular();
}

function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatearRubro(cat) {
  const n = {
    residencial:          'Residencial',
    panaderia:            'Panaderia',
    carpinteria:          'Carpinteria',
    carpinteria_metalica: 'Carp. Metalica',
    consultorio_dental:   'Consultorio Dental',
    imprenta:             'Imprenta',
    polleria:             'Polleria',
    restaurante:          'Restaurante',
    carniceria:           'Carniceria',
    minimarket:           'Minimarket',
    iluminacion_comun:    'Iluminacion',
    clima_comun:          'Clima',
    comunicaciones_comun: 'Comunicaciones',
  };
  return n[cat] || capitalizar(cat);
}
