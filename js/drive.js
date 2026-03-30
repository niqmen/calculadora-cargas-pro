/* ═══════════════════════════════════════════════════
   drive.js — Subida automática a Google Drive
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

// ── Configuración Google Drive ─────────────────────
const DRIVE_CONFIG = {
  clientEmail: 'calculadora-drive@atomic-producer-491421-n5.iam.gserviceaccount.com',
  folderId:    '1O1HisKATqUlfpheXt1pMbVF_ZIbtTVv9',
  privateKey:  `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+ovXhog0o/6bd
szGK67EKpvK7hjh6TNp4wECPHjFwDvrnWM1ym3QRFoEroHp6UC1W5uXMZGCiUnKp
Ygv1Rbx643jp/2va6r8RIxBKjUc+5g5Jk7z0qPO1Q+WXbIo1fySYRn0SRMKOmp++
4jmlvwZGVBBHOMSc7PBgAG5GHCBuka4aX/Woil4PtWoFMtK/vmQD0hYlY4CHo7KF
WzWihNElZXuT4ECbd2Lmk52xdNDlJNdpV8hsiYFhzmHZck2+xlnmMiPIVx23ugYm
wOmSgnFAGgAqaFOFw5TgGEXEF2N5suK6RpMBoQJYSysQ7bMeVlffgXn0VkYadH5u
4WskALnFAgMBAAECggEACE1N/Alddw12tzbV/6WgfeUdcuuwzkJGQGLbXONoEttG
jQ7AHoKlFRc5dFlgHa81exBoOqGDcNMHQcrU8cjbh3y10XdWLqaXwArahOvVCejx
/3CWFo+8bBNjIZgW08B8xKUYAZS2su5w0JrTy/Z/JjU3SUOJ+NO7t+tee6I/ClMt
lDUOnLOx8dqYeDPKraT2YLqbYjHbvyZ+EBWl9Wg0Kg5tVXLT2xKtDGtGsYmfv4Bm
fL7UrHLtLGPVChJZ8keGz+hMDvHNK9Jo5P04TAuNrNII9GPIvknlhHpHE+o+JMV2
tJmGy4D0eCBq3DBbxO+8OoEXekGqUvUUNVLKFY92MQKBgQDzKiLOBxqsO9x+t9YO
FovC0X3efemko5h4uHA2RgUsjcy96t62ViiFhUkldGFIXCypqIk1iKRCKlmDDbau
yoDuBBQ6wfzRU9NC5aoLhdkGXRJ5WcFPYv+CVRkyLe1nVijfBo2H120Ts09irQcR
CmwSt0kumLbngRxUlB8OmlKwsQKBgQDIswRzd/yT4wCl/AYnaOLC6h19+Nq7im7V
Tk88EDgVzW3biTY8nYyZ8jrwADuyTf+MX//ti15yuUUoZFcCsvcThQT2zZP8VV9I
Yf5QZNs+EUouyeB1rmqN3qu3TWiqGuaPv9jVLrOAeJ7blt6fV60nV71W1tum9u8f
T3gD7ji/VQKBgDi1dvB9j6bjPwT+cplOgMGqgaRF0RtoW8KroN/HbKV7XGheQhpb
9Y9OCkUF4zow5OmcOIOXnlcf8UgzBou1BmR75wvc+c0Hs5lCXmnZiUeGpSxP1llh
SR1oIzwkod0bpuR8br1jbDjP9I+asq8yswmaXSLU0rMi1SyUbrnFG8vBAoGAQwRk
LBqY4NkgUkzB0U8YyXVbu8DpaU5kjB3GH4xa7gzW7kP3NG53kMBuJc4uIPAisUEt
OKkdNLng+gfndiNEleQJMFCdZdksJAN05GuJOkSTvOP0a9d+BTmhpWfX11V8P+wT
/7vEfNXKVhEe7Z5dV5HYy7KbTjmOx6nFrapSkLECgYEAw7BismcgZeS3R2TihQMD
9h2ZjYM3FgVHUxVcyWjeunjKQENe+/biska4WOqbScmJ5/1V3mHFtWoHmvWNLzlt
tCnd9JbrK2GCo4wwv/bC9Gv+iAIHY83VHeW+a/PSD45y69WNAVeO4/XEUUDp4F+f
g6qL/0ZhTp9OGQiUI1MAuvo=
-----END PRIVATE KEY-----`,
};

// ── Generar JWT para autenticación ─────────────────
async function generarJWT() {
  const header  = { alg: 'RS256', typ: 'JWT' };
  const ahora   = Math.floor(Date.now() / 1000);
  const payload = {
    iss:   DRIVE_CONFIG.clientEmail,
    scope: 'https://www.googleapis.com/auth/drive',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   ahora,
    exp:   ahora + 3600,
  };

  const encode = obj => btoa(JSON.stringify(obj))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const headerB64  = encode(header);
  const payloadB64 = encode(payload);
  const mensaje    = `${headerB64}.${payloadB64}`;

  // Importar clave privada
  const pemLimpio = DRIVE_CONFIG.privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const keyData = Uint8Array.from(atob(pemLimpio), c => c.charCodeAt(0));

  const clave = await crypto.subtle.importKey(
    'pkcs8', keyData.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const firma = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', clave,
    new TextEncoder().encode(mensaje)
  );

  const firmaB64 = btoa(String.fromCharCode(...new Uint8Array(firma)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${mensaje}.${firmaB64}`;
}

// ── Obtener access token ────────────────────────────
async function obtenerToken() {
  const jwt = await generarJWT();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

// ── Subir PDF a Google Drive ────────────────────────
async function subirPDFaDrive(pdfBytes, nombreArchivo, metadatos) {
  try {
    const token = await obtenerToken();

    // Metadata del archivo
    const meta = {
      name:    nombreArchivo,
      parents: [DRIVE_CONFIG.folderId],
      description: JSON.stringify(metadatos),
    };

    // Multipart upload
    const boundary = '-------314159265358979323846';
    const delim    = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metaStr = JSON.stringify(meta);
    const body = [
      delim,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      metaStr,
      delim,
      'Content-Type: application/pdf\r\n\r\n',
    ].join('');

    // Combinar texto + bytes del PDF
    const encoder  = new TextEncoder();
    const bodyPart = encoder.encode(body);
    const closePart = encoder.encode(closeDelim);
    const pdfArray  = new Uint8Array(pdfBytes);

    const fullBody = new Uint8Array(bodyPart.length + pdfArray.length + closePart.length);
    fullBody.set(bodyPart,   0);
    fullBody.set(pdfArray,   bodyPart.length);
    fullBody.set(closePart,  bodyPart.length + pdfArray.length);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: fullBody,
      }
    );

    const result = await res.json();
    return {
      ok:      true,
      fileId:  result.id,
      nombre:  nombreArchivo,
    };

  } catch (err) {
    console.error('Error subiendo a Drive:', err);
    return { ok: false, error: err.message };
  }
}

// ── Función principal — llamada desde pagos.js ──────
async function subirCuadroADrive(datosCliente, stats) {
  try {
    const { jsPDF } = window.jspdf;
    const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const tarifa = parseFloat(document.getElementById('inputTarifa').value) || 0.70;
    const ft     = obtenerFaseTension();

    // Generar PDF LIMPIO sin marca de agua
    dibujarHoja1(doc, datosCliente.nombre, datosCliente.direccion, stats, ft, tarifa, false);
    doc.addPage();
    dibujarHoja2(doc);
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) { doc.setPage(p); dibujarPie(doc, p, total); }

    // Obtener bytes del PDF
    const pdfBytes = doc.output('arraybuffer');

    // Nombre del archivo
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0,10).replace(/-/g,'');
    const nombreArchivo = `CC_${fecha}_${datosCliente.nombre.replace(/\s+/g,'_')}_${datosCliente.rubro}.pdf`;

    // Metadatos para descripción en Drive
    const metadatos = {
      cliente:   datosCliente.nombre,
      direccion: datosCliente.direccion,
      rubro:     datosCliente.rubro,
      potencia:  stats.potenciaFinal + ' kW',
      fecha:     ahora.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      contacto:  datosCliente.contacto,
    };

    const resultado = await subirPDFaDrive(pdfBytes, nombreArchivo, metadatos);
    return resultado;

  } catch (err) {
    console.error('Error generando PDF para Drive:', err);
    return { ok: false, error: err.message };
  }
}
