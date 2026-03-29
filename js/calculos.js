/* ═══════════════════════════════════════════════════
   calculos.js — Motor de cálculo eléctrico
   Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M.
═══════════════════════════════════════════════════ */

const Calculos = (() => {

  const COS_PHI = 0.9;
  const round2  = v => Math.round((v || 0) * 100) / 100;

  // Factor de carga según cantidad de equipos (CNE Perú)
  function factorCarga(n) {
    if (n === 0) return 0;
    if (n === 1) return 1.0;
    if (n === 2) return 0.9;
    if (n === 3) return 0.8;
    if (n === 4) return 0.7;
    return 0.6;
  }

  // Amperaje monofásico: I = P / (V × cosφ)
  function amperajeMono(potencia_kw, tension_v) {
    if (!tension_v || !potencia_v) return 0;
    return (potencia_kw * 1000) / (tension_v * COS_PHI);
  }

  // Amperaje trifásico: I = P / (√3 × V × cosφ)
  function amperajeTri(potencia_kw, tension_v) {
    if (!tension_v) return 0;
    return (potencia_kw * 1000) / (Math.sqrt(3) * tension_v * COS_PHI);
  }

  // Calcula todos los resultados dado un array de {potencia_kw, fase, tension_v, cantidad}
  function calcularTodo(items, tarifa) {
    const equipos = [];   // potencias de equipos NO iluminación
    let ilum   = 0;
    let carga  = 0;
    let amperTotal = 0;
    let consumoKwh = 0;   // para costo mensual

    items.forEach(item => {
      const cant    = item.cantidad || 0;
      if (cant === 0) return;

      const pot     = parseFloat(item.potencia_kw) || 0;
      const tension = parseFloat(item.tension_v)   || 220;
      const fase    = parseFloat(item.fase)         || 1;
      const horas   = parseFloat(item.horas_dia)    || 0;
      const esIlum  = (item.categoria || '').toLowerCase().includes('ilumin') ||
                      (item.zona     || '').toLowerCase().includes('ilumin');

      if (esIlum) {
        ilum += cant * pot;
      } else {
        for (let i = 0; i < cant; i++) {
          equipos.push({ pot, tension, fase });
          carga += pot;
        }
      }

      // Consumo mensual (kWh)
      consumoKwh += pot * cant * horas * 30;
    });

    // Ordenar equipos de mayor a menor potencia
    equipos.sort((a, b) => b.pot - a.pot);

    const numEquipos = equipos.length;
    const factor     = factorCarga(numEquipos);
    const potArtefactosFactor = round2(carga * factor);
    const potEnciaEstimada    = round2(ilum + potArtefactosFactor);

    const mayor   = equipos.length >= 1 ? round2(equipos[0].pot) : 0;
    const dosM    = equipos.length >= 2 ? round2((equipos[0].pot + equipos[1].pot) * 0.9) : 0;
    const tresM   = equipos.length >= 3 ? round2((equipos[0].pot + equipos[1].pot + equipos[2].pot) * 0.8) : 0;

    const potenciaFinal = round2(Math.max(potEnciaEstimada, mayor, dosM, tresM));

    // Amperaje del mayor equipo (orientativo)
    let amperaje = 0;
    if (equipos.length > 0) {
      const eq = equipos[0];
      amperaje = eq.fase === 3
        ? amperajeTri(potenciaFinal, eq.tension)
        : (potenciaFinal * 1000) / (eq.tension * COS_PHI);
      amperaje = round2(amperaje);
    } else if (ilum > 0) {
      amperaje = round2((ilum * 1000) / (220 * COS_PHI));
    }

    const costoMensual = round2(consumoKwh * (parseFloat(tarifa) || 0.70));

    return {
      ilum:               round2(ilum),
      carga:              round2(carga),
      numEquipos,
      factor,
      potArtefactosFactor,
      potEnciaEstimada,
      mayor,
      dosM,
      tresM,
      potenciaFinal,
      amperaje,
      consumoKwh: round2(consumoKwh),
      costoMensual
    };
  }

  return { calcularTodo, factorCarga, round2 };

})();
