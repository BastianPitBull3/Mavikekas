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
