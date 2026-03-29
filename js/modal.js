/* ═══════════════════════════════════════════════════
   modal.js — Carga manual + envío a Google Forms
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdCmQtxsAeGQtkLM1stlalFHhEZ6OHD78ot8_bv8lhFb15knQ/formResponse';
const FIELDS = {
  rubro:         'entry.1264024000',
  nombre_equipo: 'entry.1961318121',
  potencia_kw:   'entry.1088621021',
  tension_v:     'entry.1251467924',
  fase:          'entry.207745716',
  fecha_hora:    'entry.1009563797',
};

const HP_A_KW = 0.7457;

function conexionSeleccionada() {
  const val = document.querySelector('input[name="conexion"]:checked').value;
  const [tension, fase] = val.split('|').map(Number);
  return { tension, fase };
}

function unidadSeleccionada() {
  return document.querySelector('input[name="unidad"]:checked').value;
}

function calcularKW() {
  const unidad = unidadSeleccionada();
  const valor  = parseFloat(document.getElementById('inputValor').value) || 0;
  const { tension, fase } = conexionSeleccionada();
  const fp = parseFloat(document.getElementById('inputFP').value) || 0.85;
  if (unidad === 'kw') return valor;
  if (unidad === 'hp') return valor * HP_A_KW;
  if (unidad === 'a')  return (tension * valor * (fase === 3 ? Math.sqrt(3) : 1) * fp) / 1000;
  return 0;
}

function actualizarUI() {
  const unidad = unidadSeleccionada();
  const labels = { kw: 'Potencia (kW)', hp: 'Potencia (HP)', a: 'Corriente (A)' };
  document.getElementById('labelValor').textContent = labels[unidad];
  document.getElementById('filaFactorPotencia').style.display = unidad === 'a' ? 'flex' : 'none';
  actualizarPreview();
}

function actualizarPreview() {
  const kw    = calcularKW();
  const unidad = unidadSeleccionada();
  const prev  = document.getElementById('previewKW');
  if (kw > 0 && unidad !== 'kw') {
    prev.textContent  = `≈ ${kw.toFixed(3)} kW`;
    prev.style.display = 'block';
  } else {
    prev.style.display = 'none';
  }
}

// ── Abrir modal — función global accesible desde app.js
function abrirModal() {
  document.getElementById('inputNombre').value = '';
  document.getElementById('inputValor').value  = '';
  document.getElementById('inputFP').value     = '0.85';
  document.querySelector('input[name="unidad"][value="kw"]').checked     = true;
  document.querySelector('input[name="conexion"][value="220|1"]').checked = true;
  actualizarUI();
  document.getElementById('modalError').style.display = 'none';
  document.getElementById('modalOverlay').classList.add('visible');
  setTimeout(() => document.getElementById('inputNombre').focus(), 150);
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('visible');
}

// ── Inicializar listeners cuando el DOM esté listo ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[name="unidad"]').forEach(r =>
    r.addEventListener('change', actualizarUI)
  );
  document.querySelectorAll('input[name="conexion"]').forEach(r =>
    r.addEventListener('change', actualizarPreview)
  );
  document.getElementById('inputValor').addEventListener('input', actualizarPreview);
  document.getElementById('inputFP').addEventListener('input',    actualizarPreview);
  document.getElementById('modalCerrar').addEventListener('click', cerrarModal);
  document.getElementById('btnModalCancelar').addEventListener('click', cerrarModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) cerrarModal();
  });
  document.getElementById('btnModalAgregar').addEventListener('click', agregarCargaManual);
  document.getElementById('inputValor').addEventListener('keydown', e => {
    if (e.key === 'Enter') agregarCargaManual();
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarModal();
});

// ── Agregar carga manual ───────────────────────────
function agregarCargaManual() {
  const nombre = document.getElementById('inputNombre').value.trim();
  const valor  = parseFloat(document.getElementById('inputValor').value);
  const unidad = unidadSeleccionada();
  const { tension, fase } = conexionSeleccionada();

  if (!nombre) {
    mostrarError('Escribe el nombre del equipo.');
    document.getElementById('inputNombre').focus();
    return;
  }
  if (!valor || valor <= 0) {
    const labels = { kw: 'potencia en kW', hp: 'potencia en HP', a: 'corriente en Amperios' };
    mostrarError(`Ingresa una ${labels[unidad]} válida mayor a 0.`);
    document.getElementById('inputValor').focus();
    return;
  }

  const potencia_kw = Math.round(calcularKW() * 10000) / 10000;
  if (potencia_kw <= 0) {
    mostrarError('El valor ingresado resulta en 0 kW. Revisa los datos.');
    return;
  }

  const nuevoArtefacto = {
    zona: 'Manual', artefacto: nombre, potencia_kw,
    tension_v: tension, fase, marca: 'Manual',
    precio_pen: 0, horas_dia: 8,
    nombre_archivo: 'placeholder.webp',
    categoria: 'manual', _manual: true,
    _unidad_orig: unidad, _valor_orig: valor,
  };

  const idx = datosActuales.length;
  datosActuales.push(nuevoArtefacto);
  cantidades[idx] = 1;

  agregarTarjetaManual(nuevoArtefacto, idx);
  recalcular();
  enviarAGoogleForms(nuevoArtefacto, unidad, valor);
  cerrarModal();
}

function agregarTarjetaManual(item, idx) {
  let bloque = document.getElementById('zona-manual');
  if (!bloque) {
    bloque = document.createElement('div');
    bloque.className = 'zona-bloque';
    bloque.id = 'zona-manual';

    const titulo = document.createElement('div');
    titulo.className   = 'zona-titulo';
    titulo.textContent = '✏️ Cargas manuales';
    bloque.appendChild(titulo);

    const grid = document.createElement('div');
    grid.className = 'artefactos-grid';
    grid.id = 'grid-manual';
    bloque.appendChild(grid);

    zonasContainer.insertBefore(bloque, zonasContainer.firstChild);
  }
  document.getElementById('grid-manual').appendChild(crearTarjetaManual(item, idx));
}

function crearTarjetaManual(item, idx) {
  const card = document.createElement('div');
  card.className = 'artefacto-card activa';
  card.dataset.index = idx;

  const imgWrap = document.createElement('div');
  imgWrap.className = 'image-wrap';
  const img = document.createElement('img');
  img.src = 'img/placeholder.webp';
  img.alt = item.artefacto;
  img.onerror = () => {
    imgWrap.style.cssText = 'background:#F4F5F7;display:flex;align-items:center;justify-content:center;font-size:2rem;';
    img.style.display = 'none';
    imgWrap.insertAdjacentText('beforeend', '⚡');
  };
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
  nombre.textContent = item.artefacto;
  card.appendChild(nombre);

  const etiquetas = { kw: 'kW', hp: 'HP', a: 'A' };
  const valOrig = (item._unidad_orig && item._unidad_orig !== 'kw')
    ? `${item._valor_orig} ${etiquetas[item._unidad_orig]} → ` : '';
  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:0.65rem;color:#8A9BB0;text-align:center;padding:0 6px 5px;';
  sub.textContent   = `${valOrig}${item.potencia_kw} kW · ${item.fase === 1 ? 'Mono' : 'Tri'}f. ${item.tension_v}V`;
  card.appendChild(sub);

  const badge = document.createElement('div');
  badge.className   = 'badge visible';
  badge.textContent = cantidades[idx] || 1;
  card.appendChild(badge);

  plus.addEventListener('click',  e => { e.stopPropagation(); cambiarCantidad(idx, 1, card, badge); });
  minus.addEventListener('click', e => { e.stopPropagation(); cambiarCantidad(idx, -1, card, badge); });
  card.addEventListener('click',       () => cambiarCantidad(idx, 1, card, badge));
  card.addEventListener('contextmenu', e => { e.preventDefault(); cambiarCantidad(idx, -1, card, badge); });

  return card;
}

function enviarAGoogleForms(item, unidad, valorOrig) {
  const rubroActual = rubroSelect.value || 'sin_rubro';
  const ahora = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  const etiquetas = { kw: 'kW', hp: 'HP', a: 'A' };
  const potenciaLabel = unidad === 'kw'
    ? `${item.potencia_kw} kW`
    : `${valorOrig} ${etiquetas[unidad]} → ${item.potencia_kw} kW`;

  const params = new URLSearchParams({
    [FIELDS.rubro]:         rubroActual,
    [FIELDS.nombre_equipo]: item.artefacto,
    [FIELDS.potencia_kw]:   potenciaLabel,
    [FIELDS.tension_v]:     item.tension_v,
    [FIELDS.fase]:          item.fase,
    [FIELDS.fecha_hora]:    ahora,
  });

  fetch(FORM_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  }).catch(() => {});
}

function mostrarError(msg) {
  const el = document.getElementById('modalError');
  el.textContent   = msg;
  el.style.display = 'block';
}
function ocultarError() {
  document.getElementById('modalError').style.display = 'none';
}
