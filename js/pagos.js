/* ═══════════════════════════════════════════════════
   pagos.js — Modal de pago Yape / Depósito BCP
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

const YAPE_NUMERO   = '51925030742';
const BCP_CUENTA    = '19401153157004';
const BCP_CCI       = '00219410115315700498';
const BCP_TITULAR   = 'Niquel Mendoza M.';
const WA_NUMERO     = '51925030742';

const PRECIOS = {
  certificado: { label: 'Certificado PDF firmado', monto: 50.00 },
  xlsx:        { label: 'Descarga XLSX editable',  monto: 3.00  },
};

const TERMINOS = `TÉRMINOS Y CONDICIONES\n\nLa precisión del resultado depende de la selección adecuada de los datos e información proporcionada por el usuario. Este cuadro de cargas es aplicable a instalaciones proyectadas donde se tienen definidas las cargas a implementar, o a instalaciones existentes donde se tiene conocimiento de las cargas instaladas.\n\nSe recomienda siempre contactar con un profesional electricista colegiado en caso de requerir asesoramiento técnico y mayor precisión en el cuadro de cargas.\n\nEl documento generado es referencial y no reemplaza el criterio técnico del proyectista o instalador responsable.`;

// ── Estado del modal de pago ───────────────────────
let pagoActual = { tipo: '', nombre: '', direccion: '', rubro: '', potencia: 0 };

// ── Inyectar HTML del modal ────────────────────────
function inyectarModalPago() {
  const html = `
  <div class="modal-overlay" id="modalPagoOverlay">
    <div class="modal modal-pago">

      <div class="modal-header">
        <span id="modalPagoTitulo">💳 Completar pedido</span>
        <button class="modal-cerrar" id="modalPagoCerrar">✕</button>
      </div>

      <div class="modal-body">

        <!-- Servicio y precio -->
        <div class="pago-servicio">
          <div class="pago-servicio-label" id="pagoServicioLabel">—</div>
          <div class="pago-servicio-monto" id="pagoServicioMonto">S/. 0.00</div>
        </div>

        <!-- Datos del cliente -->
        <div class="modal-campo">
          <label for="pagoNombre">Nombre completo</label>
          <input type="text" id="pagoNombre" placeholder="Ej: Juan Pérez García">
        </div>
        <div class="modal-campo">
          <label for="pagoDireccion">Dirección de la instalación</label>
          <input type="text" id="pagoDireccion" placeholder="Ej: Av. Los Olivos 123, Lima">
        </div>

        <!-- Datos de entrega -->
        <div class="modal-campo">
          <label>¿Dónde enviamos tu documento?</label>
          <div class="entrega-row">
            <div class="entrega-campo">
              <span class="entrega-icono">📱</span>
              <input type="tel" id="pagoWhatsapp" placeholder="WhatsApp ej: 987654321">
            </div>
            <div class="entrega-sep">— o —</div>
            <div class="entrega-campo">
              <span class="entrega-icono">📧</span>
              <input type="email" id="pagoCorreo" placeholder="Correo electrónico">
            </div>
          </div>
          <div class="entrega-hint">Solo necesitamos uno de los dos</div>
        </div>

        <!-- Medio de pago -->
        <div class="modal-campo">
          <label>Elige tu medio de pago</label>
          <div class="radio-group radio-group--horizontal">
            <label class="radio-opcion" id="optYape">
              <input type="radio" name="medioPago" value="yape" checked>
              <span>📱 Yape</span>
            </label>
            <label class="radio-opcion" id="optBCP">
              <input type="radio" name="medioPago" value="bcp">
              <span>🏦 Depósito BCP</span>
            </label>
          </div>
        </div>

        <!-- Instrucciones Yape -->
        <div id="instrYape" class="instrucciones-pago">
          <div class="instr-header">Datos para Yapear</div>
          <div class="instr-body">
            <img src="img/qr_yape.webp" alt="QR Yape" class="qr-yape">
            <div class="instr-datos">
              <div class="instr-fila"><span>Número:</span><strong>${YAPE_NUMERO}</strong></div>
              <div class="instr-fila"><span>Titular:</span><strong>${BCP_TITULAR}</strong></div>
              <div class="instr-monto" id="instrYapeMonto">S/. 0.00</div>
              <p class="instr-nota">Yapea el monto exacto y envíanos el comprobante por WhatsApp.</p>
            </div>
          </div>
        </div>

        <!-- Instrucciones BCP -->
        <div id="instrBCP" class="instrucciones-pago" style="display:none">
          <div class="instr-header">Datos para Depósito BCP</div>
          <div class="instr-body instr-body--bcp">
            <div class="instr-datos">
              <div class="instr-fila"><span>Titular:</span><strong>${BCP_TITULAR}</strong></div>
              <div class="instr-fila"><span>Cta. Soles:</span><strong>${BCP_CUENTA}</strong></div>
              <div class="instr-fila"><span>CCI:</span><strong>${BCP_CCI}</strong></div>
              <div class="instr-monto" id="instrBCPMonto">S/. 0.00</div>
              <p class="instr-nota">Realiza el depósito y envíanos el comprobante por WhatsApp.</p>
            </div>
          </div>
        </div>

        <!-- Términos -->
        <details class="terminos-detalle">
          <summary>📋 Términos y condiciones</summary>
          <div class="terminos-texto">${TERMINOS.replace(/\n/g, '<br>')}</div>
        </details>

        <div id="modalPagoError" class="modal-error" style="display:none"></div>
      </div>

      <div class="modal-footer">
        <button class="btn-modal-cancelar" id="btnPagoCancelar">Cancelar</button>
        <button class="btn-modal-agregar" id="btnPagoWhatsapp">💬 Enviar comprobante por WhatsApp</button>
      </div>

    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  // Eventos
  document.getElementById('modalPagoCerrar').addEventListener('click', cerrarModalPago);
  document.getElementById('btnPagoCancelar').addEventListener('click', cerrarModalPago);
  document.getElementById('modalPagoOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalPagoOverlay')) cerrarModalPago();
  });
  document.querySelectorAll('input[name="medioPago"]').forEach(r =>
    r.addEventListener('change', actualizarMedioPago)
  );
  document.getElementById('btnPagoWhatsapp').addEventListener('click', procesarPago);
}

// ── Abrir modal de pago ────────────────────────────
function abrirModalPago(tipo) {
  const stats = Calculos.calcularTodo(
    datosActuales.map((d, idx) => ({ ...d, cantidad: cantidades[idx] || 0 })),
    parseFloat(document.getElementById('inputTarifa').value) || 0.70
  );

  if (!datosActuales.some((_, idx) => (cantidades[idx] || 0) > 0)) {
    alert('Selecciona al menos un artefacto antes de continuar.');
    return;
  }

  const precio = PRECIOS[tipo];
  const rubroLabel = (rubroSelect.options[rubroSelect.selectedIndex]?.text || rubroSelect.value)
    .replace(/[^\w\s\-áéíóúÁÉÍÓÚñÑ]/gu, '').trim();

  pagoActual = {
    tipo,
    rubro:      rubroLabel,
    potencia:   stats.potenciaFinal,
    precio:     precio.monto,
    label:      precio.label,
    nombre:     '',
    direccion:  '',
  };

  document.getElementById('pagoServicioLabel').textContent = precio.label;
  document.getElementById('pagoServicioMonto').textContent = `S/. ${precio.monto.toFixed(2)}`;
  document.getElementById('instrYapeMonto').textContent    = `S/. ${precio.monto.toFixed(2)}`;
  document.getElementById('instrBCPMonto').textContent     = `S/. ${precio.monto.toFixed(2)}`;
  document.getElementById('pagoWhatsapp').value  = '';
  document.getElementById('pagoCorreo').value    = '';
  document.getElementById('pagoNombre').value    = '';
  document.getElementById('pagoDireccion').value = '';
  document.getElementById('modalPagoError').style.display = 'none';
  document.querySelector('input[name="medioPago"][value="yape"]').checked = true;
  actualizarMedioPago();

  document.getElementById('modalPagoOverlay').classList.add('visible');
}

function cerrarModalPago() {
  document.getElementById('modalPagoOverlay').classList.remove('visible');
}

function actualizarMedioPago() {
  const medio = document.querySelector('input[name="medioPago"]:checked').value;
  document.getElementById('instrYape').style.display = medio === 'yape' ? 'block' : 'none';
  document.getElementById('instrBCP').style.display  = medio === 'bcp'  ? 'block' : 'none';
}

// ── Procesar pago → Drive + WhatsApp + Google Sheets ─
async function procesarPago() {
  const whatsapp    = document.getElementById('pagoWhatsapp').value.trim();
  const correo      = document.getElementById('pagoCorreo').value.trim();
  const medio       = document.querySelector('input[name="medioPago"]:checked').value;
  const errEl       = document.getElementById('modalPagoError');
  const nombreInput = document.getElementById('pagoNombre').value.trim();
  const dirInput    = document.getElementById('pagoDireccion').value.trim();

  // Guardar en pagoActual
  pagoActual.nombre    = nombreInput || 'Cliente';
  pagoActual.direccion = dirInput    || '—';
  pagoActual.contacto  = whatsapp ? `WA: ${whatsapp}` : `Email: ${correo}`;
  pagoActual.medio     = medio === 'yape' ? 'Yape' : 'Deposito BCP';

  if (!whatsapp && !correo) {
    errEl.textContent   = 'Ingresa tu WhatsApp o correo para recibir tu documento.';
    errEl.style.display = 'block';
    return;
  }

  const contacto    = whatsapp ? `WA: ${whatsapp}` : `Email: ${correo}`;
  const ahora       = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  const nombreModal = pagoActual.nombre   || 'Cliente';
  const dirModal    = pagoActual.direccion || '—';
  const prefijo     = pagoActual.tipo === 'certificado' ? 'CC' : 'XLS';
  const numSolicitud = `${prefijo}-${Date.now().toString().slice(-4)}`;

  // Deshabilitar botón mientras procesa
  const btnWA = document.getElementById('btnPagoWhatsapp');
  btnWA.disabled    = true;
  btnWA.textContent = '⏳ Procesando...';

  // Si es PDF certificado → subir a Google Drive
  let linkDrive = '—';
  if (pagoActual.tipo === 'certificado') {
    const stats = Calculos.calcularTodo(
      datosActuales.map((d, idx) => ({ ...d, cantidad: cantidades[idx] || 0 })),
      parseFloat(document.getElementById('inputTarifa').value) || 0.70
    );

    const resultado = await subirCuadroADrive({
      nombre:    nombreModal,
      direccion: dirModal,
      rubro:     pagoActual.rubro,
      contacto,
    }, stats);

    if (resultado.ok) {
      linkDrive = `https://drive.google.com/file/d/${resultado.fileId}/view`;
      console.log('PDF subido a Drive:', linkDrive);
    }
  }

  // Si es XLSX → generar clave PRIMERO (para que llegue a Sheets)
  if (pagoActual.tipo === 'xlsx') {
    const clave = generarClaveXLSX(numSolicitud);
    pagoActual.claveXLSX = clave;
    subirXLSADrive(clave, numSolicitud); // async, no bloqueante
  }

  // Enviar a Google Sheets (ya tiene la clave XLSX generada)
  enviarSolicitudSheets({ ahora, contacto, medio, linkDrive, numSolicitud });

  // Mensaje WhatsApp al cliente
  const msgCliente = encodeURIComponent(
    `Hola Ing. Niquel, adjunto mi comprobante de pago.\n\n` +
    `Servicio: ${pagoActual.label}\n` +
    `Rubro: ${pagoActual.rubro}\n` +
    `Potencia a contratar: ${pagoActual.potencia.toFixed(3)} kW\n` +
    `Cliente: ${nombreModal}\n` +
    (dirModal !== '—' ? `Direccion: ${dirModal}\n` : '') +
    `Contacto: ${whatsapp || correo}\n` +
    `Monto: S/. ${pagoActual.precio.toFixed(2)}\n` +
    `Medio de pago: ${medio === 'yape' ? 'Yape' : 'Deposito BCP'}\n` +
    `Fecha: ${ahora}`
  );

  btnWA.disabled    = false;
  btnWA.textContent = '💬 Enviar comprobante por WhatsApp';

  window.open(`https://wa.me/${WA_NUMERO}?text=${msgCliente}`, '_blank');
  cerrarModalPago();

  // Mostrar confirmación al cliente
  mostrarConfirmacion(nombreModal, contacto, pagoActual.tipo, numSolicitud);
}

function enviarSolicitudSheets({ ahora, contacto, medio, linkDrive, numSolicitud }) {
  const nombreModal = pagoActual.nombre    || '—';
  const dirModal    = pagoActual.direccion || '—';
  const claveInfo   = pagoActual.claveXLSX ? ` | Clave XLSX: ${pagoActual.claveXLSX}` : '';
  const driveInfo   = linkDrive !== '—'    ? ` | Drive: ${linkDrive}` : '';

  const params = new URLSearchParams({
    [PAGOS_FIELDS.fecha_hora]:      ahora,
    [PAGOS_FIELDS.nombre_cliente]:  nombreModal,
    [PAGOS_FIELDS.direccion]:       dirModal,
    [PAGOS_FIELDS.rubro]:           pagoActual.rubro,
    [PAGOS_FIELDS.potencia_kw]:     `${pagoActual.potencia.toFixed(3)} kW`,
    [PAGOS_FIELDS.tipo_servicio]:   `${pagoActual.label} | N°: ${numSolicitud}`,
    [PAGOS_FIELDS.medio_pago]:      medio === 'yape' ? 'Yape' : 'Deposito BCP',
    [PAGOS_FIELDS.whatsapp_correo]: contacto + claveInfo + driveInfo,
    [PAGOS_FIELDS.estado]:          'Por atender',
  });

  fetch(PAGOS_FORM_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  }).catch(() => {});
}

// ── Pantalla de confirmación post-pago ─────────────
function mostrarConfirmacion(nombre, contacto, tipo, numSolicitud) {
  const esCertificado = tipo === 'certificado';
  const msgWA         = encodeURIComponent(
    `Hola, soy ${nombre}.\n` +
    `No recibí mi ${esCertificado ? 'documento certificado' : 'clave del archivo XLSX'}.\n` +
    `N° solicitud: ${numSolicitud}\n` +
    `Contacto: ${contacto}`
  );

  const div = document.createElement('div');
  div.style.cssText = `
    position:fixed; inset:0; z-index:999;
    background:rgba(0,0,0,0.65);
    display:flex; align-items:center; justify-content:center;
    padding:16px;
  `;

  div.innerHTML = `
    <div style="background:white;border-radius:12px;max-width:400px;width:100%;
                overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.3);font-family:Arial,sans-serif">

      <!-- Header -->
      <div style="background:#0D47A1;padding:18px 20px;text-align:center">
        <div style="font-size:2rem">✅</div>
        <div style="color:#F5C400;font-weight:800;font-size:1rem;
                    text-transform:uppercase;letter-spacing:1px;margin-top:4px">
          ${esCertificado ? 'Solicitud recibida' : 'Verificando tu pago'}
        </div>
      </div>

      <!-- Cuerpo -->
      <div style="padding:20px">

        <!-- Mensaje principal -->
        <p style="font-size:0.9rem;color:#1C1E22;margin:0 0 14px">
          ${esCertificado
            ? `Hola <strong>${nombre}</strong>, estamos procesando tu cuadro de cargas certificado.`
            : `Hola <strong>${nombre}</strong>, estamos verificando tu pago. En breve te enviaremos el enlace de descarga y tu clave de acceso.`
          }
        </p>

        <!-- Info solicitud -->
        <div style="background:#F4F5F7;border-radius:8px;padding:12px;
                    margin-bottom:14px;font-size:0.82rem;color:#5A6070">
          <div style="margin-bottom:4px"><strong style="color:#1C1E22">N° solicitud:</strong> ${numSolicitud}</div>
          <div style="margin-bottom:4px"><strong style="color:#1C1E22">Servicio:</strong> ${pagoActual.label}</div>
          <div><strong style="color:#1C1E22">Contacto registrado:</strong> ${contacto}</div>
        </div>

        <!-- Tiempo de entrega -->
        <div style="background:#E3F2FD;border-left:4px solid #0D47A1;
                    border-radius:0 8px 8px 0;padding:12px;margin-bottom:14px;
                    font-size:0.82rem;color:#0D47A1">
          ${esCertificado
            ? `<strong>⏱️ Tiempo estimado:</strong> máximo <strong>1 hora</strong><br>
               Recibirás tu PDF firmado por WhatsApp o correo.`
            : `<strong>⏱️ Tiempo estimado: máximo <strong>5 minutos</strong></strong><br>
               Recibirás el enlace y tu clave de acceso por WhatsApp o correo.`
          }
        </div>

        <!-- Garantía -->
        <div style="background:#FFF8E1;border:1px solid #F5C400;border-radius:8px;
                    padding:10px;margin-bottom:16px;font-size:0.75rem;color:#7A6000">
          ⚡ Entrega garantizada en el tiempo indicado o <strong>devolución del 100%</strong>
        </div>

        <!-- Botón contacto si no recibe -->
        <div style="font-size:0.78rem;color:#5A6070;text-align:center;margin-bottom:12px">
          ¿No recibiste tu ${esCertificado ? 'documento' : 'enlace y clave'} en el tiempo indicado?
        </div>
        <a href="https://wa.me/${WA_NUMERO}?text=${msgWA}" target="_blank"
           style="display:block;text-align:center;padding:10px;
                  background:#25D366;border-radius:8px;color:white;
                  text-decoration:none;font-weight:700;font-size:0.85rem;
                  margin-bottom:12px">
          💬 Escribir al WhatsApp: 925 030 742
        </a>

        <!-- Cerrar -->
        <button onclick="this.closest('div[style*=fixed]').remove()"
          style="width:100%;padding:10px;background:#F5C400;border:none;
                 border-radius:8px;font-weight:700;font-size:0.9rem;
                 cursor:pointer;text-transform:uppercase;letter-spacing:0.5px">
          Entendido
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(div);
}

// ── Generar clave única XLSX ────────────────────────
function generarClaveXLSX(numSolicitud) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let sufijo  = '';
  for (let i = 0; i < 4; i++) {
    sufijo += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${numSolicitud}-${sufijo}`;
}

// ── Generar HTML del XLS ──────────────────────────
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

  const ENC   = 'background-color:#0D47A1;color:#FFFFFF;font-weight:bold;font-family:Arial;font-size:10pt;border:1px solid #CCCCCC;padding:4px 6px';
  const GRIS  = 'background-color:#F4F5F7;font-family:Arial;font-size:10pt;border:1px solid #CCCCCC;padding:4px 6px';
  const TOT   = 'background-color:#E3F2FD;color:#0D47A1;font-weight:bold;font-family:Arial;font-size:10pt;border:1px solid #CCCCCC;padding:4px 6px;text-align:right';
  const CAJA  = 'background-color:#0D47A1;color:#F5C400;font-weight:bold;font-family:Arial;font-size:12pt;text-align:center;vertical-align:middle;border:2px solid #0D47A1;padding:10px';
  const PIE   = 'background-color:#F4F5F7;color:#5A6070;font-style:italic;font-family:Arial;font-size:8pt;border:1px solid #CCCCCC;padding:4px 6px;text-align:center';
  const LBL   = 'background-color:#F4F5F7;color:#5A6070;font-weight:bold;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:4px 6px';
  const VAL   = 'background-color:#FFFFFF;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:4px 6px;text-align:right';
  const VAL2  = 'background-color:#E3F2FD;font-family:Arial;font-size:9pt;border:1px solid #CCCCCC;padding:4px 6px;text-align:right';

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
async function subirXLSADrive(clave, numSolicitud) {
  try {
    const nombre    = pagoActual.nombre    || '—';
    const direccion = pagoActual.direccion || '—';
    const rubro     = pagoActual.rubro     || '—';
    const ahora     = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    const tarifa    = parseFloat(document.getElementById('inputTarifa').value) || 0.70;
    const stats     = Calculos.calcularTodo(
      datosActuales.map((d, idx) => ({ ...d, cantidad: cantidades[idx] || 0 })), tarifa
    );
    const ft   = obtenerFaseTension();
    const cond = obtenerConductor(stats.potenciaFinal);

    // Generar HTML del XLS
    const html     = generarHTMLXLS(nombre, direccion, rubro, ahora, numSolicitud, stats, ft, cond);
    const base64   = btoa(unescape(encodeURIComponent(html)));
    const nombreArchivo = `XLS_${numSolicitud}_${rubro}.xls`;

    // Subir via Apps Script
    const resultado = await subirArchivoADrive(base64, nombreArchivo);
    const linkDrive = resultado.ok
      ? `https://drive.google.com/file/d/${resultado.fileId}/view`
      : '—';

    // Registrar en Sheets con link y clave
    const contacto = pagoActual.contacto || '—';
    const params   = new URLSearchParams({
      [PAGOS_FIELDS.fecha_hora]:      new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      [PAGOS_FIELDS.nombre_cliente]:  nombre,
      [PAGOS_FIELDS.direccion]:       direccion,
      [PAGOS_FIELDS.rubro]:           rubro,
      [PAGOS_FIELDS.potencia_kw]:     `${stats.potenciaFinal.toFixed(3)} kW`,
      [PAGOS_FIELDS.tipo_servicio]:   `XLSX | N: ${numSolicitud}`,
      [PAGOS_FIELDS.medio_pago]:      pagoActual.medio || '—',
      [PAGOS_FIELDS.whatsapp_correo]: `${contacto} | Clave: ${clave} | Drive: ${linkDrive}`,
      [PAGOS_FIELDS.estado]:          'Por atender',
    });

    fetch(PAGOS_FORM_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }).catch(() => {});

    console.log(`XLS subido: ${linkDrive} | Clave: ${clave}`);

  } catch(err) {
    console.error('Error subiendo XLS:', err);
  }
}


// ── Inicializar ────────────────────────────────────
inyectarModalPago();

// Conectar botones existentes
document.getElementById('btnPDF').addEventListener('click',  () => abrirModalPago('certificado'));
document.getElementById('btnXLSX').addEventListener('click', () => abrirModalPago('xlsx'));
