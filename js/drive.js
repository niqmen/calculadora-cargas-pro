/* ═══════════════════════════════════════════════════
   drive.js — Subida a Google Drive via Apps Script
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

const DRIVE_CONFIG = {
  folderId:  '1O1HisKATqUlfpheXt1pMbVF_ZIbtTVv9',
  scriptURL: 'https://script.google.com/macros/s/AKfycbyxbrrWQog2DqWadObvuMy0xGarcp_XsdSe6ziXWl2u0A-oAGyU2CeVmamldbJbe_NW/exec',
};

// ── Enviar archivo a Drive via Apps Script ─────────
async function enviarADrive(nombre, contenidoBase64) {
  try {
    await fetch(DRIVE_CONFIG.scriptURL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify({ nombre, contenido: contenidoBase64 }),
    });
    return { ok: true };
  } catch(err) {
    console.error('Error enviando a Drive:', err);
    return { ok: false, error: err.message };
  }
}
