/* ═══════════════════════════════════════════════════
   drive.js — Subida a Google Drive via Apps Script
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

const DRIVE_CONFIG = {
  folderId:   '1O1HisKATqUlfpheXt1pMbVF_ZIbtTVv9',
  scriptURL:  'https://script.google.com/macros/s/AKfycbyxbrrWQog2DqWadObvuMy0xGarcp_XsdSe6ziXWl2u0A-oAGyU2CeVmamldbJbe_NW/exec',
};

// ── Convertir ArrayBuffer a Base64 ─────────────────
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ── Subir PDF limpio a Google Drive ────────────────
async function subirCuadroADrive(datosCliente, stats) {
  try {
    const { jsPDF } = window.jspdf;
    const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const tarifa = parseFloat(document.getElementById('inputTarifa').value) || 0.70;
    const ft     = obtenerFaseTension();

    // PDF limpio sin marca de agua
    dibujarHoja1(doc, datosCliente.nombre, datosCliente.direccion, stats, ft, tarifa, false);
    doc.addPage();
    dibujarHoja2(doc);
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) { doc.setPage(p); dibujarPie(doc, p, total); }

    const pdfBytes = doc.output('arraybuffer');
    const base64   = arrayBufferToBase64(pdfBytes);

    const ahora  = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const nombre = `CC_${ahora}_${datosCliente.nombre.replace(/\s+/g,'_')}_${datosCliente.rubro}.pdf`;

    const res = await fetch(DRIVE_CONFIG.scriptURL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nombre, contenido: base64 }),
    });

    const result = await res.json();
    if (result.id) {
      return { ok: true, fileId: result.id };
    }
    return { ok: false, error: 'Sin ID en respuesta' };

  } catch(err) {
    console.error('Error subiendo PDF a Drive:', err);
    return { ok: false, error: err.message };
  }
}

// ── Subir XLS a Google Drive ────────────────────────
async function subirArchivoADrive(contenidoBase64, nombre) {
  try {
    const res = await fetch(DRIVE_CONFIG.scriptURL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nombre, contenido: contenidoBase64 }),
    });
    const result = await res.json();
    return result.id ? { ok: true, fileId: result.id } : { ok: false };
  } catch(err) {
    console.error('Error subiendo archivo a Drive:', err);
    return { ok: false, error: err.message };
  }
}
