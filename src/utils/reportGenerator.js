/**
 * reportGenerator.js
 * Generación del reporte de pedidos en formato texto para compartir por WhatsApp.
 *
 * REGLAS DEL REPORTE DE TACOS (MARTES):
 * ─────────────────────────────────────
 * 1. Si ABSOLUTAMENTE TODOS los tacos de TODOS los usuarios del día fueron pedidos
 *    "Con Queso" (conQueso === cantidad), se omite el texto "con queso" en cada
 *    línea individual y se agrega al final una única leyenda: *Todos con queso*
 *
 * 2. Si al menos un taco de cualquier usuario se pidió sin queso, se desglosa
 *    individualmente. Caso mixto por sabor (N con queso, M sin queso en el
 *    mismo sabor) genera DOS líneas separadas:
 *       N Bistec con queso
 *       M Bistec
 *
 * REGLAS DEL REPORTE DE QUESADILLAS (VIERNES):
 * ─────────────────────────────────────────────
 * Sin manejo de queso. Formato simple: "N Sabor"
 */

// ============================================================
// INTERNOS
// ============================================================

/**
 * Filtra y limpia las órdenes eliminando items con cantidad 0.
 * Retorna únicamente órdenes que tienen al menos un item.
 */
const cleanOrders = (orders) =>
  orders
    .map((o) => ({ ...o, items: o.items.filter((it) => it.cantidad > 0) }))
    .filter((o) => o.items.length > 0);

/**
 * Verifica si todos los tacos que ADMITEN queso fueron pedidos con queso.
 * Items con admiteQueso === false se ignoran en esta verificación.
 * Retorna false si no hay ningún item que admita queso.
 */
const checkAllWithCheese = (orders) => {
  let hasCheeseableItems = false;
  for (const order of orders) {
    for (const item of order.items) {
      if (item.admiteQueso === false) continue;
      hasCheeseableItems = true;
      const conQueso = item.conQueso ?? 0;
      if (conQueso < item.cantidad) return false;
    }
  }
  return hasCheeseableItems;
};

// ============================================================
// GENERADOR DE TACOS (MARTES)
// ============================================================

/**
 * Genera el reporte de texto para el día de Tacos (Martes).
 *
 * @param {Array} orders  - Órdenes del día (ya filtradas por fecha)
 * @returns {string}      - Texto listo para copiar y pegar en WhatsApp
 */
export const generateTacosReport = (orders) => {
  if (!orders || orders.length === 0) {
    return '(Sin órdenes registradas para hoy)';
  }

  // Limpiar items vacíos
  const clean = cleanOrders(orders);
  if (clean.length === 0) return '(Sin órdenes registradas para hoy)';

  // Evaluar si TODOS los tacos de TODOS los usuarios son con queso
  const allWithCheese = checkAllWithCheese(clean);

  let report = '';

  for (const order of clean) {
    // Nombre del usuario como encabezado de sección
    report += `${order.userNombre}:\n`;

    for (const item of order.items) {
      const conQueso = item.conQueso ?? 0;

      if (allWithCheese || item.admiteQueso === false) {
        // Cuando todos son con queso (o el item no admite queso): sin mención de queso por línea
        report += `${item.cantidad} ${item.sabor}\n`;
      } else {
        const sinQueso = item.cantidad - conQueso;

        if (conQueso > 0 && sinQueso > 0) {
          // Caso mixto: dividir en dos líneas para el mismo sabor
          report += `${conQueso} ${item.sabor} con queso\n`;
          report += `${sinQueso} ${item.sabor}\n`;
        } else if (conQueso === item.cantidad) {
          // Todos los de este sabor van con queso
          report += `${item.cantidad} ${item.sabor} con queso\n`;
        } else {
          // Ninguno con queso
          report += `${item.cantidad} ${item.sabor}\n`;
        }
      }
    }

    // Línea en blanco entre usuarios
    report += '\n';
  }

  // Leyenda global al final si aplica la regla
  if (allWithCheese) {
    report += '*Todos con queso*';
  }

  return report.trim();
};

// ============================================================
// GENERADOR DE QUESADILLAS (VIERNES)
// ============================================================

/**
 * Genera el reporte de texto para el día de Quesadillas (Viernes).
 *
 * @param {Array} orders
 * @returns {string}
 */
export const generateQuesadillasReport = (orders) => {
  if (!orders || orders.length === 0) {
    return '(Sin órdenes registradas para hoy)';
  }

  const clean = cleanOrders(orders);
  if (clean.length === 0) return '(Sin órdenes registradas para hoy)';

  let report = '';

  for (const order of clean) {
    report += `${order.userNombre}:\n`;
    for (const item of order.items) {
      report += `${item.cantidad} ${item.sabor}\n`;
    }
    report += '\n';
  }

  return report.trim();
};

// ============================================================
// FUNCIÓN PRINCIPAL — DESPACHA AL GENERADOR CORRECTO
// ============================================================

/**
 * Genera el reporte del día basándose en el tipo de menú activo.
 *
 * @param {Array}  orders  - Todas las órdenes del día
 * @param {'martes'|'viernes'} day  - Día activo
 * @returns {string}
 */
export const generateDayReport = (orders, day) => {
  if (day === 'martes')  return generateTacosReport(orders);
  if (day === 'viernes') return generateQuesadillasReport(orders);
  return '(Día no válido para reporte)';
};

/**
 * Genera un resumen legible de una orden individual para mostrar en modales.
 *
 * @param {Object} order
 * @param {'martes'|'viernes'} day
 * @returns {Array<string>}  - Líneas del resumen
 */
export const getOrderSummaryLines = (order, day) => {
  if (!order || !order.items) return [];

  return order.items
    .filter((it) => it.cantidad > 0)
    .map((item) => {
      if (day === 'viernes') return `${item.cantidad} × ${item.sabor}`;
      if (item.admiteQueso === false) return `${item.cantidad} × ${item.sabor}`;
      const conQueso = item.conQueso ?? 0;
      const sinQueso = item.cantidad - conQueso;

      if (conQueso > 0 && sinQueso > 0) {
        return [
          `${conQueso} × ${item.sabor} con queso`,
          `${sinQueso} × ${item.sabor} sin queso`,
        ];
      }
      if (conQueso === item.cantidad) return `${item.cantidad} × ${item.sabor} con queso`;
      return `${item.cantidad} × ${item.sabor}`;
    })
    .flat();
};
