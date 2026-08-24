/**
 * dateUtils.js
 * Utilidades para manejo de fecha, hora y lógica de disponibilidad del servicio.
 * Toda la lógica de tiempo pasa por aquí para facilitar las pruebas con simulación.
 */

// Hora de inicio del servicio (12:00 PM en minutos desde medianoche)
const SERVICE_START_MINUTES = 12 * 60;       // 720
// Hora de fin del servicio (1:45 PM en minutos desde medianoche)
const SERVICE_END_MINUTES   = 13 * 60 + 45;  // 825

/**
 * Convierte un día de la semana JS (0–6) al nombre interno del sistema.
 * 2 = Martes, 5 = Viernes, cualquier otro = 'otro'
 */
const dayIndexToName = (index) => {
  if (index === 2) return 'martes';
  if (index === 5) return 'viernes';
  return 'otro';
};

/**
 * Retorna el día activo considerando la simulación.
 * Si simulatedDay está definido, lo usa; si no, usa el día real del sistema.
 *
 * @param {string|null} simulatedDay  - 'martes' | 'viernes' | 'otro' | null
 * @returns {'martes'|'viernes'|'otro'}
 */
export const getCurrentDay = (simulatedDay) => {
  if (simulatedDay) return simulatedDay;
  return dayIndexToName(new Date().getDay());
};

/**
 * Retorna la hora activa en formato 'HH:MM', considerando la simulación.
 * Si simulatedTime está definido, lo usa; si no, usa la hora real del sistema.
 *
 * @param {string|null} simulatedTime  - 'HH:MM' | null
 * @returns {string}
 */
export const getCurrentTime = (simulatedTime) => {
  if (simulatedTime) return simulatedTime;
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

/**
 * Verifica si el horario actual (real o simulado) está dentro del rango de servicio.
 * El servicio está disponible Martes y Viernes de 12:00 PM a 1:45 PM.
 *
 * @param {string|null} simulatedDay
 * @param {string|null} simulatedTime
 * @returns {boolean}
 */
export const isServiceActiveBySchedule = (simulatedDay, simulatedTime) => {
  const day  = getCurrentDay(simulatedDay);
  if (day !== 'martes' && day !== 'viernes') return false;

  const time               = getCurrentTime(simulatedTime);
  const [hh, mm]           = time.split(':').map(Number);
  const totalMinutes       = hh * 60 + mm;

  return totalMinutes >= SERVICE_START_MINUTES && totalMinutes <= SERVICE_END_MINUTES;
};

/**
 * Determina si el servicio está activo teniendo en cuenta:
 * 1. El switch manual del administrador (tiene prioridad total).
 * 2. La lógica de día y hora (automática).
 *
 * @param {{ serviceEnabled: boolean, simulatedDay: string|null, simulatedTime: string|null }} appState
 * @returns {boolean}
 */
export const isServiceActive = (appState) => {
  if (appState.serviceEnabled) return true;
  return isServiceActiveBySchedule(appState.simulatedDay, appState.simulatedTime);
};

/**
 * Retorna la fecha de hoy como string 'YYYY-MM-DD' (fecha real, no simulada).
 * Las órdenes siempre se almacenan con la fecha real.
 */
export const getTodayString = () => new Date().toISOString().split('T')[0];

/**
 * Retorna la fecha activa 'YYYY-MM-DD', considerando la simulación.
 * Si simulatedDate está definida, la usa; si no, usa la fecha real del sistema.
 * Solo afecta la lógica de cumpleaños (para poder probarla sin esperar la fecha real).
 *
 * @param {string|null} simulatedDate  - 'YYYY-MM-DD' | null
 * @returns {Date}
 */
export const getCurrentDate = (simulatedDate) => {
  if (simulatedDate) {
    const [y, m, d] = simulatedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date();
};

/**
 * Formatea un string ISO de timestamp a hora legible 'HH:MM AM/PM'.
 *
 * @param {string} isoString
 * @returns {string}
 */
export const formatTimestamp = (isoString) =>
  new Date(isoString).toLocaleTimeString('es-MX', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });

/**
 * Retorna el nombre legible del día de servicio para mostrar en UI.
 *
 * @param {'martes'|'viernes'|'otro'} day
 * @returns {string}
 */
export const getDayLabel = (day) => {
  const labels = { martes: 'Martes', viernes: 'Viernes', otro: 'Otro día' };
  return labels[day] || 'Desconocido';
};

/**
 * Retorna el tipo de menú según el día activo.
 *
 * @param {'martes'|'viernes'|'otro'} day
 * @returns {'tacos'|'quesadillas'|null}
 */
export const getMenuTypeForDay = (day) => {
  if (day === 'martes')  return 'tacos';
  if (day === 'viernes') return 'quesadillas';
  return null;
};

// ============================================================
// CUMPLEAÑOS
// ============================================================
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Formatea una fecha de cumpleaños 'YYYY-MM-DD' a texto legible, ej. "15 de marzo".
 *
 * @param {string|null} dateStr
 * @returns {string|null}
 */
export const formatBirthday = (dateStr) => {
  if (!dateStr) return null;
  const [, month, day] = dateStr.split('-').map(Number);
  return `${day} de ${MONTH_NAMES[month - 1]}`;
};

/**
 * Calcula cuántos días faltan para el próximo cumpleaños (0 si es hoy).
 * Ignora el año almacenado; siempre proyecta hacia la próxima ocurrencia.
 *
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string|null} simulatedDate - 'YYYY-MM-DD' | null, para pruebas
 * @returns {number}
 */
const daysUntilNextBirthday = (dateStr, simulatedDate = null) => {
  const [, month, day] = dateStr.split('-').map(Number);
  const now   = getCurrentDate(simulatedDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next    = new Date(now.getFullYear(), month - 1, day);
  if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day);
  return Math.round((next - today) / 86400000);
};

/**
 * Ordena usuarios por proximidad de su próximo cumpleaños.
 * Los usuarios sin fecha configurada quedan al final, en su orden original.
 *
 * @param {Array<object>} users
 * @param {string|null} simulatedDate - 'YYYY-MM-DD' | null, para pruebas
 * @returns {Array<object>}
 */
export const sortByUpcomingBirthday = (users, simulatedDate = null) => {
  const withDate    = users.filter((u) => u.cumpleanos);
  const withoutDate = users.filter((u) => !u.cumpleanos);
  withDate.sort(
    (a, b) =>
      daysUntilNextBirthday(a.cumpleanos, simulatedDate) -
      daysUntilNextBirthday(b.cumpleanos, simulatedDate)
  );
  return [...withDate, ...withoutDate];
};

/**
 * Verifica si hoy es el cumpleaños de un usuario. Considera la fecha simulada
 * (si está definida) para poder probar la funcionalidad sin esperar la fecha real.
 *
 * @param {string|null} dateStr - 'YYYY-MM-DD'
 * @param {string|null} simulatedDate - 'YYYY-MM-DD' | null, para pruebas
 * @returns {boolean}
 */
export const isBirthdayToday = (dateStr, simulatedDate = null) => {
  if (!dateStr) return false;
  const [, month, day] = dateStr.split('-').map(Number);
  const now = getCurrentDate(simulatedDate);
  return now.getMonth() + 1 === month && now.getDate() === day;
};
