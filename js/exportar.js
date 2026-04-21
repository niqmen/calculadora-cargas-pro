/* ═══════════════════════════════════════════════════
   exportar.js — PDF borrador + Vista Previa
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

// ── Constantes colores ─────────────────────────────
const AZUL        = [13, 71, 161];
const AZUL_CLARO  = [227, 242, 253];
const AMARILLO    = [245, 196, 0];
const GRIS        = [244, 245, 247];
const BLANCO      = [255, 255, 255];
const TEXTO       = [28, 30, 34];
const TEXTO_SUAVE = [90, 96, 112];
const ROJO_MARCA  = [180, 0, 0];
const COS_PHI     = 0.9;
const SQRT3       = Math.sqrt(3);

// Márgenes 2cm = 20mm
const ML = 20, MR = 20;
const PW = 210, PH = 297;
const CW = PW - ML - MR; // 170mm

// ── Tabla conductor Luz del Sur ────────────────────
function obtenerConductor(kw) {
  if (kw <= 3)   return { awg: 'Min N14 / Max N6',  seccion: 'Min 2.5 mm2 TW/THW / Max 16 mm2 TW/THW' };
  if (kw <= 6)   return { awg: 'Min N10 / Max N6',  seccion: 'Min 6 mm2 TW/THW / Max 16 mm2 TW/THW' };
  if (kw <= 10)  return { awg: 'Min N6',             seccion: 'Min 6 mm2 TW/THW / Max 16 mm2 TW/THW' };
  if (kw <= 20)  return { awg: 'Min N6 / Max N4',   seccion: 'Min 6 mm2 TW/THW / Max 25 mm2 TW/THW' };
  if (kw <= 50)  return { awg: '---',                seccion: '3-1 x 70 NYY (*)' };
  if (kw <= 75)  return { awg: '---',                seccion: '3-1 x 120 NYY (*)' };
  if (kw <= 150) return { awg: '---',                seccion: '6-1 x 120 NYY (*)' };
  if (kw <= 225) return { awg: '---',                seccion: '6-1 x 185 NYY (*)' };
  return           { awg: '---',                     seccion: '6-1 x 300 NYY (*)' };
}

// ── Interruptor termomagnético ─────────────────────
function obtenerInterruptor(kw, factorFase, tension) {
  const I = (kw * 1000 * 1.25) / (factorFase * COS_PHI * tension);
  const est = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200];
  return { I: Math.round(I * 100) / 100, comercial: est.find(v => v >= I) || est[est.length - 1] };
}

// ── Fase/tensión dominante ─────────────────────────
function obtenerFaseTension() {
  const tri = datosActuales.filter((d, i) => (cantidades[i] || 0) > 0 && parseFloat(d.fase) === 3);
  if (tri.length > 0) {
    const mayor = tri.reduce((a, b) => parseFloat(a.potencia_kw) > parseFloat(b.potencia_kw) ? a : b);
    return { esTrifasico: true, tension: parseFloat(mayor.tension_v) || 220, factorFase: SQRT3, label: `Trifasica ${mayor.tension_v || 220}V` };
  }
  return { esTrifasico: false, tension: 220, factorFase: 1, label: 'Monofasica 220V' };
}

// ── Helper: título de sección ──────────────────────
function titSeccion(doc, texto, y) {
  doc.setFillColor(...AZUL);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BLANCO);
  doc.text(texto, ML + CW / 2, y + 4.8, { align: 'center' });
  return y + 7;
}

// ── Helper: marca de agua agresiva ────────────────
function marcaDeAgua(doc) {
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.28 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...ROJO_MARCA);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 4; c++) {
      doc.text('BORRADOR', (PW / 4) * c + PW / 8, (PH / 9) * r + PH / 18, { align: 'center', angle: 38 });
    }
  }
  doc.restoreGraphicsState();
}

// ════════════════════════════════════════════════════
// HOJA 1 — CUADRO DE CARGAS
// ════════════════════════════════════════════════════
function dibujarHoja1(doc, nombre, direccion, stats, ft, tarifa, esBorrador) {

  if (esBorrador) marcaDeAgua(doc);

  doc.setFillColor(...AZUL);
  doc.rect(ML, 15, CW, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLANCO);
  doc.text('CUADRO DE CARGAS ELECTRICAS', ML + CW / 2, 23, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(180, 210, 255);
  const subtitulo = esBorrador
    ? 'Vista previa BORRADOR — No valido como documento oficial'
    : 'Documento oficial — Ing. Niquel Mendoza M.';
  doc.text(subtitulo, ML + CW / 2, 29, { align: 'center' });

  let y = 40;

  const ahora = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  doc.setFillColor(...GRIS);
  doc.roundedRect(ML, y, CW, 22, 2, 2, 'F');
  doc.setDrawColor(...AZUL);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 22, 2, 2, 'S');

  const col2 = ML + CW * 0.55;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...TEXTO_SUAVE);
  doc.text('CLIENTE:',   ML + 4, y + 5.5);
  doc.text('DIRECCION:', ML + 4, y + 11.5);
  doc.text('FECHA:',     ML + 4, y + 17.5);

  doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXTO);
  doc.text(nombre,    ML + 24, y + 5.5);
  doc.text(direccion, ML + 28, y + 11.5);
  doc.text(ahora,     ML + 20, y + 17.5);

  const rubroLabel = (rubroSelect.options[rubroSelect.selectedIndex]?.text || rubroSelect.value)
    .replace(/[^\w\s\-áéíóúÁÉÍÓÚñÑ]/gu, '').trim();
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...TEXTO_SUAVE);
  doc.text('RUBRO:', col2, y + 5.5);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXTO);
  doc.text(rubroLabel, col2 + 16, y + 5.5);

  y += 27;

  const filas = [];
  let seq = 1, sumTotal = 0, sumDem = 0;

  datosActuales.forEach((d, idx) => {
    const cant = cantidades[idx] || 0;
    if (!cant) return;
    const pot    = parseFloat(d.potencia_kw) || 0;
    const esIlum = (d.categoria || '').toLowerCase().includes('ilumin') ||
                   (d.zona      || '').toLowerCase().includes('ilumin');
    const E = Calculos.round2(pot * cant);
    const F = esIlum ? 1.0 : stats.factor;
    const G = Calculos.round2(E * F);
    sumTotal += E;
    sumDem   += G;
    const desc = capitalizar(d.artefacto || '') + (esBorrador ? ' [BORRADOR]' : '');
    filas.push([seq++, capitalizar(d.zona || '—'), desc, pot.toFixed(3), cant, E.toFixed(3), (F * 100).toFixed(0) + '%', G.toFixed(3)]);
  });

  filas.push([
    { content: 'TOTALES', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: AZUL_CLARO, textColor: AZUL } },
    { content: Calculos.round2(sumTotal).toFixed(3), styles: { halign: 'right', fontStyle: 'bold', fillColor: AZUL_CLARO, textColor: AZUL } },
    { content: '', styles: { fillColor: AZUL_CLARO } },
    { content: Calculos.round2(sumDem).toFixed(3),   styles: { halign: 'right', fontStyle: 'bold', fillColor: AZUL_CLARO, textColor: AZUL } },
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Zona', 'Descripcion', 'Pot.\n(kW)', 'Cant.', 'Total\n(kW)', 'Factor', 'Dem.Max.\n(kW)']],
    body: filas,
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: BLANCO, fontStyle: 'bold', fontSize: 7.5, halign: 'center', cellPadding: 2 },
    bodyStyles: { fontSize: 7, textColor: TEXTO, cellPadding: 1.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 56 },
      3: { halign: 'right', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 13 },
      5: { halign: 'right', cellWidth: 17 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'right', cellWidth: 24 },
    },
    alternateRowStyles: { fillColor: AZUL_CLARO },
    margin: { left: ML, right: MR },
    tableWidth: CW,
  });

  y = doc.lastAutoTable.finalY + 6;
  if (y > PH - 90) { doc.addPage(); if (esBorrador) marcaDeAgua(doc); y = 20; }

  y = titSeccion(doc, 'RESUMEN DE CALCULO', y);
  y += 2;

  const resumenData = [
    ['Iluminacion (100%)',        `${stats.ilum.toFixed(3)} kW`],
    ['Carga artefactos',         `${stats.carga.toFixed(3)} kW`],
    ['N de equipos',             `${stats.numEquipos}`],
    ['Factor de carga aplicado', `${(stats.factor * 100).toFixed(0)}%`],
    ['Artefactos con factor',    `${stats.potArtefactosFactor.toFixed(3)} kW`],
    ['Potencia estimada total',  `${stats.potEnciaEstimada.toFixed(3)} kW`],
    ['Mayor equipo',             `${stats.mayor.toFixed(3)} kW`],
    ['90% de los 2 mayores',     `${stats.dosM.toFixed(3)} kW`],
    ['80% de los 3 mayores',     `${stats.tresM.toFixed(3)} kW`],
  ];

  const tablaResumenW = 98;
  const cajaX = ML + tablaResumenW + 6;
  const cajaW = CW - tablaResumenW - 6;
  const cajaY = y;

  doc.autoTable({
    startY: y,
    body: resumenData,
    theme: 'grid',
    bodyStyles: { fontSize: 7.5, textColor: TEXTO, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 66, textColor: TEXTO_SUAVE },
      1: { halign: 'right',   cellWidth: 32 },
    },
    alternateRowStyles: { fillColor: AZUL_CLARO },
    margin: { left: ML, right: MR },
    tableWidth: tablaResumenW,
  });

  const tablaResumenH = doc.lastAutoTable.finalY - cajaY;
  const cajaH = Math.max(tablaResumenH, 50);
  doc.setFillColor(...AZUL);
  doc.roundedRect(cajaX, cajaY, cajaW, cajaH, 2, 2, 'F');

  const contenidoH = 34;
  const offsetV    = (cajaH - contenidoH) / 2;
  const cx         = cajaX + cajaW / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...BLANCO);
  doc.text('POTENCIA MINIMA', cx, cajaY + offsetV + 5, { align: 'center' });
  doc.text('A CONTRATAR', cx, cajaY + offsetV + 10, { align: 'center' });

  doc.setFontSize(20);
  doc.setTextColor(...AMARILLO);
  doc.text(`${stats.potenciaFinal.toFixed(3)}`, cx, cajaY + offsetV + 22, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(...BLANCO);
  doc.text('kW', cx, cajaY + offsetV + 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 210, 255);
  doc.text(`Corriente (cos(phi)=0.9): ${stats.amperaje.toFixed(2)} A`, cx, cajaY + offsetV + 33, { align: 'center' });
  doc.setTextColor(100, 220, 130);
  doc.text(`Costo mensual: S/. ${stats.costoMensual.toFixed(2)}`, cx, cajaY + offsetV + 38, { align: 'center' });

  y = Math.max(doc.lastAutoTable.finalY, cajaY + cajaH) + 6;
  if (y > PH - 60) { doc.addPage(); if (esBorrador) marcaDeAgua(doc); y = 20; }

  y = titSeccion(doc, 'RECOMENDACIONES TECNICAS', y);
  y += 2;

  const { esTrifasico, tension, factorFase, label } = ft;
  const cond = obtenerConductor(stats.potenciaFinal);
  const recFilas = [];

  if (!esTrifasico) {
    const iM = obtenerInterruptor(stats.potenciaFinal, 1,     220);
    const iT = obtenerInterruptor(stats.potenciaFinal, SQRT3, 220);
    recFilas.push(['Interruptor Termomag. (Monofasico 220V)',    `I dis = ${iM.I.toFixed(2)} A`, `${iM.comercial} A`]);
    recFilas.push(['Interruptor Termomag. (Trifasico 220V ref.)', `I dis = ${iT.I.toFixed(2)} A`, `${iT.comercial} A`]);
  } else {
    const iR = obtenerInterruptor(stats.potenciaFinal, factorFase, tension);
    recFilas.push([`Interruptor Termomag. (${label})`, `I dis = ${iR.I.toFixed(2)} A`, `${iR.comercial} A`]);
  }
  recFilas.push(['Conductor alimentador (medidor a tablero)', `AWG: ${cond.awg}`, cond.seccion]);

  doc.autoTable({
    startY: y,
    head: [['Concepto', 'Calculo', 'Valor recomendado']],
    body: recFilas,
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: BLANCO, fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: TEXTO, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 78,         fontStyle: 'bold', textColor: TEXTO_SUAVE },
      1: { cellWidth: 42,         halign: 'center' },
      2: { cellWidth: CW - 120,   fontStyle: 'bold', textColor: AZUL },
    },
    margin: { left: ML, right: MR },
    tableWidth: CW,
  });

  y = doc.lastAutoTable.finalY + 3;

  if (esBorrador) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXTO_SUAVE);
    doc.text('(*) Segun tabla de calibres de conductor - Luz del Sur / CNE Peru. Verificar con proyectista.', ML, y);
    doc.text('Formula: I dis = (P_kW x 1000 x 1.25) / (factor_fase x cos(phi) x V)', ML, y + 4);
  }
}

// ════════════════════════════════════════════════════
// HOJA 2 — METODOLOGÍA
// ════════════════════════════════════════════════════
function dibujarHoja2(doc) {
  doc.setFillColor(...AZUL);
  doc.rect(ML, 15, CW, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BLANCO);
  doc.text('METODOLOGIA Y BASE NORMATIVA', ML + CW / 2, 23, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(180, 210, 255);
  doc.text('Resolucion N 1908-2001 OS/CD — Opciones Tarifarias y Condiciones de Aplicacion', ML + CW / 2, 29, { align: 'center' });

  let y = 42;
  y = titSeccion(doc, 'CAPITULO QUINTO — CALCULO DE LA POTENCIA CONTRATADA', y);
  y += 5;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...AZUL);
  doc.text('Articulo 19.- Determinacion de la Potencia Contratada', ML, y);
  y += 5;
  const t19 = 'La potencia conectada del usuario es la potencia requerida por el mismo al momento de solicitar el suministro. Las potencias contratadas por el usuario a los efectos de la facturacion de la potencia activa, no podran ser mayores que la potencia conectada.';
  y = escribirParrafo(doc, t19, y);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...AZUL);
  doc.text('Articulo 20.- Potencia Conectada en usuarios de Baja Tension (BT)', ML, y);
  y += 5;

  const parrafos20 = [
    'Para el caso de los usuarios en BT, la potencia conectada podra ser determinada por medio de la medicion de la demanda maxima a traves de los instrumentos adecuados o estimada en funcion del siguiente procedimiento:',
    'A la potencia instalada en el alumbrado, se sumara la potencia del resto de los motores, artefactos y demas equipos electricos conectados, segun la tabla siguiente:',
  ];
  parrafos20.forEach(p => { y = escribirParrafo(doc, p, y); });

  doc.autoTable({
    startY: y,
    head: [['N de equipos conectados', 'Potencia Maxima estimada (% de carga)']],
    body: [['1','100%'],['2','90%'],['3','80%'],['4','70%'],['5 o mas','60%']],
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: BLANCO, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: TEXTO, halign: 'center', cellPadding: 2.5 },
    alternateRowStyles: { fillColor: AZUL_CLARO },
    margin: { left: ML + 25, right: MR + 25 },
    tableWidth: CW - 50,
  });
  y = doc.lastAutoTable.finalY + 5;

  const parrafos2 = [
    'Cada aparato de calefaccion sera considerado como un motor para efectos de aplicacion en la tabla anterior.',
    'Se entendera como carga conectada de cada equipo (artefacto, motor, etc.), a la potencia nominal de estos (expresada en kW).',
    'Los valores de la potencia conectada que resulten de aplicar la tabla anterior, deberan ser modificados si es necesario, a los efectos que la potencia estimada no sea en ningun caso menor que:',
  ];
  parrafos2.forEach(p => { y = escribirParrafo(doc, p, y); });

  ['La potencia del motor o artefacto mas grande.',
   'El 90% de la potencia sumada de los dos motores o artefactos mas grandes.',
   'El 80% de la potencia sumada de los tres artefactos o motores mas grandes.',
  ].forEach(c => {
    const ls = doc.splitTextToSize(`  -  ${c}`, CW - 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...TEXTO);
    doc.text(ls, ML + 4, y);
    y += ls.length * 4 + 2;
  });

  y += 2;
  y = escribirParrafo(doc, 'Alternativamente el usuario podra solicitar una potencia contratada menor a la potencia conectada determinada anteriormente, para lo cual la distribuidora podra exigir al usuario la instalacion de equipos limitadores de potencia, los cuales seran a cargo del usuario.', y);
  y += 4;

  doc.setFillColor(...GRIS);
  doc.roundedRect(ML, y, CW, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...AZUL);
  doc.text('NOTA:', ML + 4, y + 5);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXTO_SUAVE);
  const nota = 'Este calculo ha sido realizado utilizando la metodologia establecida en la Resolucion N 1908-2001 OS/CD del OSINERGMIN. Los valores obtenidos son referenciales y deben ser validados por un ingeniero electricista colegiado antes de su implementacion.';
  const notaLs = doc.splitTextToSize(nota, CW - 22);
  doc.text(notaLs, ML + 4, y + 10);
}

// ── Pie de página ──────────────────────────────────
function dibujarPie(doc, pagina, total) {
  doc.setFillColor(...AZUL);
  doc.rect(0, PH - 11, PW, 11, 'F');
  doc.setFontSize(6.5); doc.setTextColor(160, 190, 240);
  doc.text('Documento de vista previa — NO VALIDO sin firma del profesional responsable', PW / 2, PH - 5.5, { align: 'center' });
  doc.text(`Pagina ${pagina} de ${total}`, PW - 12, PH - 5.5, { align: 'right' });
  doc.text('elasesorelectricista.blogspot.com', 12, PH - 5.5);
}

// ── Helpers ────────────────────────────────────────
function escribirParrafo(doc, texto, y) {
  const ls = doc.splitTextToSize(texto, CW);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...TEXTO);
  doc.text(ls, ML, y);
  return y + ls.length * 4 + 4;
}

function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Vista Previa en web ────────────────────────────
document.getElementById('btnPreview').addEventListener('click', mostrarVistaPrevia);

// Cerrar modal VP — muestra banner invitación al cerrar
document.getElementById('modalVPCerrar').addEventListener('click', () => {
  document.getElementById('modalVistaPrevia').classList.remove('visible');
  mostrarBannerInvitacion();
});

// Click fuera del modal — igual muestra banner
document.getElementById('modalVistaPrevia').addEventListener('click', e => {
  if (e.target === document.getElementById('modalVistaPrevia')) {
    document.getElementById('modalVistaPrevia').classList.remove('visible');
    mostrarBannerInvitacion();
  }
});

// ── Banner invitación post-vista-previa ────────────
function mostrarBannerInvitacion() {
  // Evitar duplicados
  if (document.getElementById('bannerInvitacion')) return;

  const banner = document.createElement('div');
  banner.id = 'bannerInvitacion';
  banner.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;z-index:8888;
    background:#0D47A1;color:#fff;
    padding:14px 20px;
    display:flex;align-items:center;justify-content:space-between;
    gap:12px;flex-wrap:wrap;
    box-shadow:0 -4px 20px rgba(0,0,0,0.25);
    font-family:'Barlow',Arial,sans-serif;
    animation: slideUp 0.3s ease;
  `;

  banner.innerHTML = `
    <style>
      @keyframes slideUp {
        from { transform: translateY(100%); opacity:0; }
        to   { transform: translateY(0);    opacity:1; }
      }
    </style>
    <span style="font-size:0.9rem;flex:1;min-width:200px">
      ¿Necesitas el documento <strong>firmado y válido</strong> ante Pluz o Luz del Sur?
    </span>
    <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap">
      <button id="bannerBtnSolicitar"
        style="background:#F5C400;color:#111;border:none;padding:9px 16px;
               border-radius:6px;font-weight:700;cursor:pointer;font-size:0.85rem;
               white-space:nowrap">
        📋 Solicitar Cuadro Certificado
      </button>
      <button id="bannerBtnCoorinar"
        style="background:#25D366;color:#fff;border:none;padding:9px 16px;
               border-radius:6px;font-weight:700;cursor:pointer;font-size:0.85rem;
               white-space:nowrap">
        💬 Coordinar con el Ingeniero
      </button>
      <button id="bannerBtnCerrar"
        style="background:transparent;color:#aac4f0;border:1px solid #aac4f0;
               padding:9px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;
               white-space:nowrap">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('bannerBtnSolicitar').addEventListener('click', () => {
    banner.remove();
    document.getElementById('btnPDF').click();
  });

  document.getElementById('bannerBtnCoorinar').addEventListener('click', () => {
    banner.remove();
    document.getElementById('btnXLSX').click();
  });

  document.getElementById('bannerBtnCerrar').addEventListener('click', () => banner.remove());

  // Auto-cierre después de 12 segundos
  setTimeout(() => { if (document.getElementById('bannerInvitacion')) banner.remove(); }, 12000);
}

function mostrarVistaPrevia() {
  if (!datosActuales.some((_, idx) => (cantidades[idx] || 0) > 0)) {
    alert('Selecciona al menos un artefacto para ver la vista previa.');
    return;
  }
  const tarifa = parseFloat(document.getElementById('inputTarifa').value) || 0.70;
  const stats  = Calculos.calcularTodo(
    datosActuales.map((d, idx) => ({ ...d, cantidad: cantidades[idx] || 0 })), tarifa
  );
  const ft      = obtenerFaseTension();
  const ahora   = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  const rubro   = (rubroSelect.options[rubroSelect.selectedIndex]?.text || rubroSelect.value)
                    .replace(/[^\w\s\-áéíóúÁÉÍÓÚñÑ]/gu, '').trim();

  let filasHTML = '', seq = 1, sumTot = 0, sumDem = 0;
  datosActuales.forEach((d, idx) => {
    const cant = cantidades[idx] || 0;
    if (!cant) return;
    const pot    = parseFloat(d.potencia_kw) || 0;
    const esIlum = (d.categoria||'').toLowerCase().includes('ilumin') || (d.zona||'').toLowerCase().includes('ilumin');
    const E = Calculos.round2(pot * cant);
    const F = esIlum ? 1.0 : stats.factor;
    const G = Calculos.round2(E * F);
    sumTot += E; sumDem += G;
    filasHTML += `<tr>
      <td class="td-center">${seq++}</td>
      <td>${capitalizar(d.zona||'—')}</td>
      <td>${capitalizar(d.artefacto||'')} <em style="color:#B00;font-size:0.7em">[BORRADOR]</em></td>
      <td class="td-right">${pot.toFixed(3)}</td>
      <td class="td-center">${cant}</td>
      <td class="td-right">${E.toFixed(3)}</td>
      <td class="td-center">${(F*100).toFixed(0)}%</td>
      <td class="td-right">${G.toFixed(3)}</td>
    </tr>`;
  });
  filasHTML += `<tr class="tr-total">
    <td colspan="5" style="text-align:right">TOTALES</td>
    <td class="td-right">${Calculos.round2(sumTot).toFixed(3)}</td>
    <td></td>
    <td class="td-right">${Calculos.round2(sumDem).toFixed(3)}</td>
  </tr>`;

  const { esTrifasico, tension, factorFase, label } = ft;
  const cond = obtenerConductor(stats.potenciaFinal);
  let recHTML = '';
  if (!esTrifasico) {
    const iM = obtenerInterruptor(stats.potenciaFinal, 1, 220);
    const iT = obtenerInterruptor(stats.potenciaFinal, SQRT3, 220);
    recHTML += `<tr><td>Interruptor Termomag. (Monofasico 220V)</td><td class="td-center">I dis = ${iM.I.toFixed(2)} A</td><td>${iM.comercial} A</td></tr>`;
    recHTML += `<tr><td>Interruptor Termomag. (Trifasico 220V ref.)</td><td class="td-center">I dis = ${iT.I.toFixed(2)} A</td><td>${iT.comercial} A</td></tr>`;
  } else {
    const iR = obtenerInterruptor(stats.potenciaFinal, factorFase, tension);
    recHTML += `<tr><td>Interruptor Termomag. (${label})</td><td class="td-center">I dis = ${iR.I.toFixed(2)} A</td><td>${iR.comercial} A</td></tr>`;
  }
  recHTML += `<tr><td>Conductor alimentador (medidor a tablero)</td><td class="td-center">AWG: ${cond.awg}</td><td>${cond.seccion}</td></tr>`;

  document.getElementById('modalVPBody').innerHTML = `
    <div class="vp-documento">
      <div class="vp-encabezado">
        <h2>Cuadro de Cargas Electricas</h2>
        <p>Vista previa BORRADOR — No valido como documento oficial sin firma del profesional responsable</p>
      </div>
      <div class="vp-cliente">
        <div><span>RUBRO: </span><strong>${rubro}</strong></div>
        <div><span>FECHA: </span><strong>${ahora}</strong></div>
        <div><span>CLIENTE: </span><strong>—</strong></div>
        <div><span>ELABORADO POR: </span><strong>Ing. Niquel Mendoza M.</strong></div>
      </div>
      <table class="vp-tabla">
        <thead><tr>
          <th>#</th><th>Zona</th><th>Descripcion</th>
          <th>Pot.(kW)</th><th>Cant.</th><th>Total(kW)</th><th>Factor</th><th>Dem.Max.(kW)</th>
        </tr></thead>
        <tbody>${filasHTML}</tbody>
      </table>
      <div class="vp-titulo-seccion">Resumen de Calculo</div>
      <div class="vp-resumen">
        <table class="vp-resumen-tabla">
          <tr><td>Iluminacion (100%)</td><td>${stats.ilum.toFixed(3)} kW</td></tr>
          <tr><td>Carga artefactos</td><td>${stats.carga.toFixed(3)} kW</td></tr>
          <tr><td>N de equipos</td><td>${stats.numEquipos}</td></tr>
          <tr><td>Factor de carga</td><td>${(stats.factor*100).toFixed(0)}%</td></tr>
          <tr><td>Artefactos con factor</td><td>${stats.potArtefactosFactor.toFixed(3)} kW</td></tr>
          <tr><td>Potencia estimada</td><td>${stats.potEnciaEstimada.toFixed(3)} kW</td></tr>
          <tr><td>Mayor equipo</td><td>${stats.mayor.toFixed(3)} kW</td></tr>
          <tr><td>90% de los 2 mayores</td><td>${stats.dosM.toFixed(3)} kW</td></tr>
          <tr><td>80% de los 3 mayores</td><td>${stats.tresM.toFixed(3)} kW</td></tr>
        </table>
        <div class="vp-caja-potencia">
          <div class="vp-pot-label">Potencia Minima<br>a Contratar</div>
          <div class="vp-pot-valor">${stats.potenciaFinal.toFixed(3)}</div>
          <div class="vp-pot-unit">kW</div>
          <div class="vp-pot-sub">
            Corriente: ${stats.amperaje.toFixed(2)} A<br>
            Costo: S/. ${stats.costoMensual.toFixed(2)}/mes
          </div>
        </div>
      </div>
      <div class="vp-titulo-seccion">Recomendaciones Tecnicas</div>
      <table class="vp-rec-tabla">
        <thead><tr><th>Concepto</th><th>Calculo</th><th>Valor recomendado</th></tr></thead>
        <tbody>${recHTML}</tbody>
      </table>
      <p style="font-size:0.65rem;color:#999;margin-top:8px">
        (*) Segun tabla de calibres - Luz del Sur / CNE Peru. Verificar con proyectista.<br>
        Formula: I dis = (P_kW x 1000 x 1.25) / (factor_fase x cos(phi) x V)
      </p>
    </div>`;

  document.getElementById('modalVistaPrevia').classList.add('visible');
}
