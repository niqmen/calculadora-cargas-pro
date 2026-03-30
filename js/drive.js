/* ═══════════════════════════════════════════════════
   drive.js — Subida a Google Drive via Apps Script
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

const DRIVE_CONFIG = {
  folderId:  '1O1HisKATqUlfpheXt1pMbVF_ZIbtTVv9',
  scriptURL: 'https://script.google.com/macros/s/AKfycbyxbrrWQog2DqWadObvuMy0xGarcp_XsdSe6ziXWl2u0A-oAGyU2CeVmamldbJbe_NW/exec',
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

// ── Enviar a Apps Script via formulario (sin CORS) ─
function enviarAScript(nombre, contenidoBase64) {
  return new Promise((resolve) => {
    try {
      const form   = document.createElement('form');
      form.method  = 'POST';
      form.action  = DRIVE_CONFIG.scriptURL;
      form.target  = 'drive_iframe';
      form.style.display = 'none';

      const addField = (name, value) => {
        const input = document.createElement('input');
        input.type  = 'hidden';
        input.name  = name;
        input.value = value;
        form.appendChild(input);
      };

      addField('nombre',    nombre);
      addField('contenido', contenidoBase64);

      // Iframe oculto para capturar respuesta sin navegar
      let iframe = document.getElementById('drive_iframe');
      if (!iframe) {
        iframe      = document.createElement('iframe');
        iframe.name = 'drive_iframe';
        iframe.id   = 'drive_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      document.body.appendChild(form);
      form.submit();
      form.remove();

      // Esperar 3 segundos y asumir éxito
      setTimeout(() => resolve({ ok: true, fileId: 'drive' }), 3000);

    } catch(err) {
      console.error('Error enviando a Drive:', err);
      resolve({ ok: false, error: err.message });
    }
  });
}

// ── Subir PDF limpio a Google Drive ────────────────
async function subirCuadroADrive(datosCliente, stats) {
  try {
    const { jsPDF } = window.jspdf;
    const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const tarifa = parseFloat(document.getElementById('inputTarifa').value) || 0.70;
    const ft     = obtenerFaseTension();

    dibujarHoja1(doc, datosCliente.nombre, datosCliente.direccion, stats, ft, tarifa, false);
    doc.addPage();
    dibujarHoja2(doc);
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) { doc.setPage(p); dibujarPie(doc, p, total); }

    const pdfBytes = doc.output('arraybuffer');
    const base64   = arrayBufferToBase64(pdfBytes);
    const ahora    = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const nombre   = `CC_${ahora}_${datosCliente.nombre.replace(/\s+/g,'_')}_${datosCliente.rubro}.pdf`;

    return await enviarAScript(nombre, base64);

  } catch(err) {
    console.error('Error subiendo PDF:', err);
    return { ok: false, error: err.message };
  }
}

// ── Subir XLS a Google Drive ────────────────────────
async function subirArchivoADrive(contenidoBase64, nombre) {
  return await enviarAScript(nombre, contenidoBase64);
}
