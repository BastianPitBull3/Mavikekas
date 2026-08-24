/**
 * storage.js
 * Gestión de sesión en localStorage.
 * Los datos de la aplicación ahora viven en Firestore; aquí solo
 * persiste el ID del usuario autenticado para restaurar la sesión
 * al recargar la página.
 */

const SESSION_KEY = 'mavikekas_session_uid';

/** Guarda el ID del usuario en sesión */
export const saveSessionUserId = (uid) =>
  localStorage.setItem(SESSION_KEY, uid);

/** Lee el ID guardado (null si no hay sesión) */
export const getSessionUserId = () =>
  localStorage.getItem(SESSION_KEY);

/** Elimina la sesión guardada */
export const clearSession = () =>
  localStorage.removeItem(SESSION_KEY);

// ============================================================
// MODAL DE CUMPLEAÑOS — control de "mostrado una vez por día"
// ============================================================
const BIRTHDAY_MODAL_KEY_PREFIX = 'mavikekas_birthday_modal_shown_';

/** Verifica si al usuario ya se le mostró el modal de cumpleaños en esa fecha */
export const wasBirthdayModalShownToday = (userId, dateStr) =>
  localStorage.getItem(`${BIRTHDAY_MODAL_KEY_PREFIX}${userId}`) === dateStr;

/** Marca el modal de cumpleaños como ya mostrado para el usuario en esa fecha */
export const markBirthdayModalShown = (userId, dateStr) =>
  localStorage.setItem(`${BIRTHDAY_MODAL_KEY_PREFIX}${userId}`, dateStr);

/** Olvida que el modal ya se mostró (útil para volver a probarlo) */
export const clearBirthdayModalShown = (userId) =>
  localStorage.removeItem(`${BIRTHDAY_MODAL_KEY_PREFIX}${userId}`);
