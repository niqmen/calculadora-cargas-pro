/* ═══════════════════════════════════════════════════
   pagos.js — Modal Solicitar Cuadro Certificado
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

// ── Configuración ──────────────────────────────────
const PAGOS_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeNmGMUC5UIMHWN1WbJLqiuXcM1bCsB0NZzQXW7TDLVn2-H4A/formResponse';
const PAGOS_FIELDS = {
  fecha_hora:      'entry.50903638',
  nombre_cliente:  'entry.1121681693',
  direccion:       'entry.1665966982',
  rubro:           'entry.1667641581',
  potencia_kw:     'entry.771553152',
  tipo_servicio:   'entry.1625019016',
  medio_pago:      'entry.1344373799',
  whatsapp_correo: 'entry.1752092371',
  estado:          'entry.688163085',
};

const WA_NUMERO   = '51925030742';
const APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbyxbrrWQog2DqWadObvuMy0xGarcp_XsdSe6ziXWl2u0A-oAGyU2CeVmamldbJbe_NW/exec';

// ── Estado ─────────────────────────────────────────
let solicitudActual = { nombre: '', direccion: '', rubro: '', potencia: 0 };

// ── Inyectar HTML del modal solicitud ──────────────
function inyectarModalPago() {
  const html = `
  <div class="modal-overlay" id="modalPagoOverlay">
    <div class="modal modal-pago">

      <div class="modal-header">
        <span id="modalPagoTitulo">📋 Solicitar Cuadro Certificado</span>
        <button class="modal-cerrar" id="modalPagoCerrar">✕</button>
      </div>

      <div class="modal-body">

        <div class="pago-servicio">
          <div class="pago-servicio-label">Cuadro de Cargas Certificado — Firmado por Ing. CIP</div>
          <div class="pago-servicio-monto" style="font-size:0.85rem;color:#5A6070;font-weight:500">desde S/ 180</div>
        </div>

        <div class="modal-campo">
          <label for="pagoNombre">Nombre completo / Razón social</label>
          <input type="text" id="pagoNombre" placeholder="Ej: Juan Pérez García o Panadería El Sol SAC">
        </div>

        <div class="modal-campo">
          <label for="pagoDireccion">Dirección del local</label>
          <input type="text" id="pagoDireccion" placeholder="Ej: Av. Los Olivos 123, Ate, Lima">
        </div>

        <div class="modal-campo">
          <label for="pagoRubro">Rubro</label>
          <input type="text" id="pagoRubro" readonly
            style="background:#F4F5F7;color:#5A6070;cursor:not-allowed">
        </div>

        <div class="modal-campo">
          <label for="pagoWhatsapp">N° WhatsApp <span style="color:#B00">*</span></label>
          <input type="tel" id="pagoWhatsapp" placeholder="Ej: 987654321"
            maxlength="9">
          <div style="font-size:0.72rem;color:#888;margin-top:3px">
            9 dígitos, empezando en 9 — te contactaremos por aquí
          </div>
        </div>

        <div id="modalPagoError" class="modal-error" style="display:none"></div>

        <div style="background:#E3F2FD;border-left:4px solid #0D47A1;border-radius:0 8px 8px 0;
                    padding:12px;margin-top:8px;font-size:0.78rem;color:#0D47A1;line-height:1.5">
          ✅ Recibirás un PDF borrador para revisión antes de confirmar el pago.<br>
          ⚡ Entrega del documento firmado en 15 min tras confirmación.
        </div>

      </div>

      <div class="modal-footer">
        <button class="btn-modal-cancelar" id="btnPagoCancelar">Cancelar</button>
        <button class="btn-modal-agregar" id="btnEnviarSolicitud">Enviar solicitud</button>
      </div>

    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('modalPagoCerrar').addEventListener('click', cerrarModalPago);
  document.getElementById('btnPagoCancelar').addEventListener('click', cerrarModalPago);
  document.getElementById('modalPagoOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalPagoOverlay')) cerrarModalPago();
  });
  document.getElementById('btnEnviarSolicitud').addEventListener('click', procesarSolicitud);
}

// ── Abrir modal solicitud ──────────────────────────
function abrirModalPago(tipo) {
  if (!datosActuales.some((_, idx) => (cantidades[idx] || 0) > 0)) {
    alert('Selecciona al menos un artefacto antes de continuar.');
    return;
  }

  const rubroLabel = (rubroSelect.options[rubroSelect.selectedIndex]?.text || rubroSelect.value)
    .replace(/[^\w\s\-áéíóúÁÉÍÓÚñÑ]/gu, '').trim();

  const stats = Calculos.calcularTodo(
    datosActuales.map((d, idx) => ({ ...d, cantidad: cantidades[idx] || 0 })),
    parseFloat(document.getElementById('inputTarifa').value) || 0.70
  );

  solicitudActual = {
    rubro:    rubroLabel,
    potencia: stats.potenciaFinal,
    nombre:   '',
    direccion: '',
  };

  document.getElementById('pagoRubro').value    = rubroLabel;
  document.getElementById('pagoNombre').value   = '';
  document.getElementById('pagoDireccion').value = '';
  document.getElementById('pagoWhatsapp').value  = '';
  document.getElementById('modalPagoError').style.display = 'none';
  document.getElementById('modalPagoOverlay').classList.add('visible');
}

function cerrarModalPago() {
  document.getElementById('modalPagoOverlay').classList.remove('visible');
}

// ── Procesar solicitud ─────────────────────────────
async function procesarSolicitud() {
  const nombre    = document.getElementById('pagoNombre').value.trim();
  const direccion = document.getElementById('pagoDireccion').value.trim();
  const whatsapp  = document.getElementById('pagoWhatsapp').value.trim();
  const errEl     = document.getElementById('modalPagoError');

  // Validaciones
  if (!nombre) {
    errEl.textContent   = 'Ingresa tu nombre o razón social.';
    errEl.style.display = 'block';
    document.getElementById('pagoNombre').focus();
    return;
  }
  if (!direccion) {
    errEl.textContent   = 'Ingresa la dirección del local.';
    errEl.style.display = 'block';
    document.getElementById('pagoDireccion').focus();
    return;
  }
  if (!whatsapp) {
    errEl.textContent   = 'Ingresa tu número de WhatsApp.';
    errEl.style.display = 'block';
    document.getElementById('pagoWhatsapp').focus();
    return;
  }
  if (!/^9\d{8}$/.test(whatsapp.replace(/\s|-/g, ''))) {
    errEl.textContent   = 'El número debe tener 9 dígitos y empezar con 9. Ej: 987654321';
    errEl.style.display = 'block';
    document.getElementById('pagoWhatsapp').focus();
    return;
  }

  solicitudActual.nombre    = nombre;
  solicitudActual.direccion = direccion;

  const btn = document.getElementById('btnEnviarSolicitud');
  btn.disabled    = true;
  btn.textContent = '⏳ Enviando...';

  const ahora        = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  const numSolicitud = `CC-${Date.now().toString().slice(-5)}`;

  // 1) Subir XLS a Drive
  subirXLSADrive(numSolicitud);

  // 2) Registrar en Google Sheets
  enviarSolicitudSheets({ ahora, whatsapp, numSolicitud });

  // 3) Alerta WhatsApp automática al ingeniero
  enviarAlertaWhatsApp({ nombre, direccion, whatsapp, numSolicitud });

  btn.disabled    = false;
  btn.textContent = 'Enviar solicitud';

  cerrarModalPago();
  mostrarConfirmacion(nombre, whatsapp, numSolicitud);
}

// ── Enviar alerta al ingeniero via Apps Script ─────
function enviarAlertaWhatsApp({ nombre, direccion, whatsapp, numSolicitud }) {
  const potencia = solicitudActual.potencia.toFixed(3);
  const rubro    = solicitudActual.rubro;
  const mensaje  = `🔔 Nueva solicitud:\nN°: ${numSolicitud}\nNombre: ${nombre}\nDirección: ${direccion}\nRubro: ${rubro}\nWhatsApp: ${whatsapp}\nPotencia calculada: ${potencia} kW`;

  fetch(APPS_SCRIPT, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify({ accion: 'whatsapp', numero: WA_NUMERO, mensaje }),
  }).catch(() => {});
}

// ── Registrar en Google Sheets ─────────────────────
function enviarSolicitudSheets({ ahora, whatsapp, numSolicitud }) {
  const params = new URLSearchParams({
    [PAGOS_FIELDS.fecha_hora]:      ahora,
    [PAGOS_FIELDS.nombre_cliente]:  solicitudActual.nombre,
    [PAGOS_FIELDS.direccion]:       solicitudActual.direccion,
    [PAGOS_FIELDS.rubro]:           solicitudActual.rubro,
    [PAGOS_FIELDS.potencia_kw]:     `${solicitudActual.potencia.toFixed(3)} kW`,
    [PAGOS_FIELDS.tipo_servicio]:   `Solicitud Cuadro Certificado | N°: ${numSolicitud}`,
    [PAGOS_FIELDS.medio_pago]:      'Por coordinar',
    [PAGOS_FIELDS.whatsapp_correo]: `WA: ${whatsapp}`,
    [PAGOS_FIELDS.estado]:          'Por atender',
  });

  fetch(PAGOS_FORM_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  }).catch(() => {});
}

// ── Pantalla de confirmación ───────────────────────
function mostrarConfirmacion(nombre, whatsapp, numSolicitud) {
  const div = document.createElement('div');
  div.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.65);
    display:flex;align-items:center;justify-content:center;
    padding:16px;
  `;

  div.innerHTML = `
    <div style="background:white;border-radius:12px;max-width:400px;width:100%;
                overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.3);font-family:Arial,sans-serif">

      <div style="background:#0D47A1;padding:18px 20px;text-align:center">
        <div style="font-size:2rem">✅</div>
        <div style="color:#F5C400;font-weight:800;font-size:1rem;
                    text-transform:uppercase;letter-spacing:1px;margin-top:4px">
          Solicitud recibida
        </div>
      </div>

      <div style="padding:20px">
        <p style="font-size:0.9rem;color:#1C1E22;margin:0 0 14px">
          Hola <strong>${nombre}</strong>, recibimos tu solicitud.<br>
          En breve nos ponemos en contacto contigo.
        </p>

        <div style="background:#F4F5F7;border-radius:8px;padding:12px;
                    margin-bottom:14px;font-size:0.82rem;color:#5A6070">
          <div style="margin-bottom:4px"><strong style="color:#1C1E22">N° solicitud:</strong> ${numSolicitud}</div>
          <div style="margin-bottom:4px"><strong style="color:#1C1E22">Rubro:</strong> ${solicitudActual.rubro}</div>
          <div><strong style="color:#1C1E22">WhatsApp registrado:</strong> ${whatsapp}</div>
        </div>

        <div style="background:#E3F2FD;border-left:4px solid #0D47A1;
                    border-radius:0 8px 8px 0;padding:12px;margin-bottom:16px;
                    font-size:0.82rem;color:#0D47A1;line-height:1.6">
          <strong>¿Qué sigue?</strong><br>
          1. Te enviamos un PDF borrador para revisión<br>
          2. Confirmas que los datos están correctos<br>
          3. Coordinas el pago (desde S/ 180)<br>
          4. Recibes el PDF firmado en 15 min ⚡
        </div>

        <button onclick="this.closest('div[style*=fixed]').remove()"
          style="width:100%;padding:12px;background:#F5C400;border:none;
                 border-radius:8px;font-weight:700;font-size:0.9rem;
                 cursor:pointer;text-transform:uppercase;letter-spacing:0.5px">
          Entendido
        </button>
      </div>
    </div>`;

  document.body.appendChild(div);
}

// ══════════════════════════════════════════════════
// Generar HTML del XLS (se conserva igual)
// ══════════════════════════════════════════════════
function generarHTMLXLS(nombre, direccion, rubro, ahora, numSolicitud, stats, ft, cond) {
  const { esTrifasico, tension, factorFase, label } = ft;

  let filasHTML = '', seq = 1, sumTot = 0, sumDem = 0;
  datosActuales.forEach((d, idx) => {
    const cant = cantidades[idx] || 0;
    if (!cant) return;
    const pot    = parseFloat(d.potencia_kw) || 0;
    const esIlum = (d.categoria||'').toLowerCase().includes('ilumin') || (d.zona||'').toLowerCase().includes('ilumin');
    const factor = esIlum ? 1.0 : stats.factor;
    const total  = Calculos.round2(pot * cant);
    const dem    = Calculos.round2(total * factor);
    sumTot += total; sumDem += dem;
    const bg = seq % 2 === 0 ? '#E3F2FD' : '#FFFFFF';
    const STD = `background-color:${bg};font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:3px 5px`;
    filasHTML += `<tr>
      <td style="${STD};text-align:center">${seq++}</td>
      <td style="${STD}">${d.zona||'—'}</td>
      <td style="${STD}">${d.artefacto||'—'}</td>
      <td style="${STD};text-align:right">${pot.toFixed(3)}</td>
      <td style="${STD};text-align:center">${cant}</td>
      <td style="${STD};text-align:right">${total.toFixed(3)}</td>
      <td style="${STD};text-align:center">${(factor*100).toFixed(0)}%</td>
      <td style="${STD};text-align:right">${dem.toFixed(3)}</td>
    </tr>`;
  });

  let recHTML = '';
  const R1 = 'background-color:#E3F2FD;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:3px 5px';
  const R2 = 'background-color:#FFFFFF;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:3px 5px';
  const RV = 'font-weight:bold;color:#0D47A1;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:3px 5px';
  if (!esTrifasico) {
    const iM = obtenerInterruptor(stats.potenciaFinal, 1, 220);
    const iT = obtenerInterruptor(stats.potenciaFinal, SQRT3, 220);
    recHTML += `<tr><td colspan="4" style="${R1}">Interruptor Termomag. Monofasico 220V</td><td colspan="2" style="${R1};text-align:center">I dis = ${iM.I.toFixed(2)} A</td><td colspan="2" style="${RV};background-color:#E3F2FD">${iM.comercial} A</td></tr>
    <tr><td colspan="4" style="${R2}">Interruptor Termomag. Trifasico 220V ref.</td><td colspan="2" style="${R2};text-align:center">I dis = ${iT.I.toFixed(2)} A</td><td colspan="2" style="${RV};background-color:#FFFFFF">${iT.comercial} A</td></tr>`;
  } else {
    const iR = obtenerInterruptor(stats.potenciaFinal, factorFase, tension);
    recHTML += `<tr><td colspan="4" style="${R1}">Interruptor Termomag. (${label})</td><td colspan="2" style="${R1};text-align:center">I dis = ${iR.I.toFixed(2)} A</td><td colspan="2" style="${RV};background-color:#E3F2FD">${iR.comercial} A</td></tr>`;
  }
  recHTML += `<tr><td colspan="4" style="${R2}">Conductor alimentador (medidor a tablero)</td><td colspan="2" style="${R2};text-align:center">AWG: ${cond.awg}</td><td colspan="2" style="${RV};background-color:#FFFFFF">${cond.seccion}</td></tr>`;

  const ENC  = 'background-color:#0D47A1;color:#FFFFFF;font-weight:bold;font-family:Arial;font-size:10pt;border:1px solid #CCCCCC;padding:4px 6px';
  const GRIS = 'background-color:#F4F5F7;font-family:Arial;font-size:10pt;border:1px solid #CCCCCC;padding:4px 6px';
  const TOT  = 'background-color:#E3F2FD;color:#0D47A1;font-weight:bold;font-family:Arial;font-size:10pt;border:1px solid #CCCCCC;padding:4px 6px;text-align:right';
  const CAJA = 'background-color:#0D47A1;color:#F5C400;font-weight:bold;font-family:Arial;font-size:12pt;text-align:center;vertical-align:middle;border:2px solid #0D47A1;padding:10px';
  const PIE  = 'background-color:#F4F5F7;color:#5A6070;font-style:italic;font-family:Arial;font-size:8pt;border:1px solid #CCCCCC;padding:4px 6px;text-align:center';
  const LBL  = 'background-color:#F4F5F7;color:#5A6070;font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:4px 6px';
  const VAL  = 'background-color:#FFFFFF;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:4px 6px;text-align:right';
  const VAL2 = 'background-color:#E3F2FD;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:4px 6px;text-align:right';

  return `<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"></head><body>
<table style="border-collapse:collapse;width:100%;font-family:Arial">
<tr><td colspan="8" style="${ENC};font-size:14pt;text-align:center">CUADRO DE CARGAS ELECTRICAS</td></tr>
<tr><td colspan="8" style="${ENC};font-size:8pt;text-align:center;color:#B3C8F5">Calculadora de Demanda Maxima — Ing. Niquel Mendoza M. — Asesor Electricista</td></tr>
<tr><td colspan="8" style="height:4px;border:none"></td></tr>
<tr><td colspan="8" style="${GRIS}">CLIENTE:      ${nombre}</td></tr>
<tr><td colspan="8" style="${GRIS}">DIRECCION:    ${direccion}</td></tr>
<tr><td colspan="8" style="${GRIS}">RUBRO:        ${rubro}     FECHA: ${ahora}</td></tr>
<tr><td colspan="8" style="${GRIS}">N SOLICITUD:  ${numSolicitud}</td></tr>
<tr><td colspan="8" style="height:4px;border:none"></td></tr>
<tr>
  <th style="${ENC};width:4%">#</th>
  <th style="${ENC};width:13%">Zona</th>
  <th style="${ENC};width:30%">Descripcion</th>
  <th style="${ENC};width:9%;text-align:center">Pot.(kW)</th>
  <th style="${ENC};width:6%;text-align:center">Cant.</th>
  <th style="${ENC};width:10%;text-align:center">Total(kW)</th>
  <th style="${ENC};width:8%;text-align:center">Factor</th>
  <th style="${ENC};width:11%;text-align:center">Dem.Max.(kW)</th>
</tr>
${filasHTML}
<tr><td colspan="8" style="height:4px;border:none"></td></tr>
<tr>
  <td colspan="5" style="${TOT}">TOTALES</td>
  <td style="${TOT}">${Calculos.round2(sumTot).toFixed(3)}</td>
  <td style="${TOT}"></td>
  <td style="${TOT}">${Calculos.round2(sumDem).toFixed(3)}</td>
</tr>
<tr><td colspan="8" style="height:4px;border:none"></td></tr>
<tr><td colspan="8" style="${ENC};text-align:center">RESUMEN DE CALCULO</td></tr>
<tr>
  <td colspan="4" style="${LBL}">Iluminacion (100%)</td>
  <td style="${VAL}">${stats.ilum.toFixed(3)} kW</td>
  <td colspan="3" rowspan="9" style="${CAJA}">POTENCIA MINIMA<br>A CONTRATAR<br><br><big><big>${stats.potenciaFinal.toFixed(3)}</big></big><br>kW<br><br><small>Corriente: ${stats.amperaje.toFixed(2)} A<br>Costo: S/. ${stats.costoMensual.toFixed(2)}/mes</small></td>
</tr>
<tr><td colspan="4" style="${LBL}">Carga artefactos</td><td style="${VAL2}">${stats.carga.toFixed(3)} kW</td></tr>
<tr><td colspan="4" style="${LBL}">N de equipos</td><td style="${VAL}">${stats.numEquipos}</td></tr>
<tr><td colspan="4" style="${LBL}">Factor de carga</td><td style="${VAL2}">${(stats.factor*100).toFixed(0)}%</td></tr>
<tr><td colspan="4" style="${LBL}">Artefactos con factor</td><td style="${VAL}">${stats.potArtefactosFactor.toFixed(3)} kW</td></tr>
<tr><td colspan="4" style="${LBL}">Potencia estimada</td><td style="${VAL2}">${stats.potEnciaEstimada.toFixed(3)} kW</td></tr>
<tr><td colspan="4" style="${LBL}">Mayor equipo</td><td style="${VAL}">${stats.mayor.toFixed(3)} kW</td></tr>
<tr><td colspan="4" style="${LBL}">90% de los 2 mayores</td><td style="${VAL2}">${stats.dosM.toFixed(3)} kW</td></tr>
<tr><td colspan="4" style="${LBL}">80% de los 3 mayores</td><td style="${VAL}">${stats.tresM.toFixed(3)} kW</td></tr>
<tr><td colspan="8" style="height:4px;border:none"></td></tr>
<tr><td colspan="8" style="${ENC};text-align:center">RECOMENDACIONES TECNICAS</td></tr>
<tr>
  <th style="${ENC}" colspan="4">Concepto</th>
  <th style="${ENC}" colspan="2">Calculo</th>
  <th style="${ENC}" colspan="2">Valor recomendado</th>
</tr>
${recHTML}
<tr><td colspan="8" style="height:4px;border:none"></td></tr>
<tr><td colspan="8" style="${PIE}">Documento generado con Calculadora de Cuadro de Cargas Pro — elasesorelectricista.blogspot.com</td></tr>
</table></body></html>`;
}

// ── Subir XLS a Google Drive via Apps Script ───────
async function subirXLSADrive(numSolicitud) {
  try {
    const nombre    = solicitudActual.nombre    || '—';
    const direccion = solicitudActual.direccion || '—';
    const rubro     = solicitudActual.rubro     || '—';
    const ahora     = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    const tarifa    = parseFloat(document.getElementById('inputTarifa').value) || 0.70;
    const stats     = Calculos.calcularTodo(
      datosActuales.map((d, idx) => ({ ...d, cantidad: cantidades[idx] || 0 })), tarifa
    );
    const ft   = obtenerFaseTension();
    const cond = obtenerConductor(stats.potenciaFinal);

    const html          = generarHTMLXLS(nombre, direccion, rubro, ahora, numSolicitud, stats, ft, cond);
    const base64        = btoa(unescape(encodeURIComponent(html)));
    const nombreArchivo = `XLS_${numSolicitud}_${rubro}.xls`;

    await enviarADrive(nombreArchivo, base64);
    console.log(`XLS subido a Drive | N: ${numSolicitud}`);
  } catch(err) {
    console.error('Error subiendo XLS:', err);
  }
}

// ── Inicializar ────────────────────────────────────
inyectarModalPago();

// Conectar botón Solicitar Cuadro Certificado
document.getElementById('btnPDF').addEventListener('click', () => abrirModalPago('certificado'));
// btnXLSX ya no existe — el botón Coordinar abre WhatsApp directo (manejado en index.html)
