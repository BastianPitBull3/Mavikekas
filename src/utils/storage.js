/**
 * storage.js
 * Capa de abstracción para localStorage.
 * Centraliza lectura, escritura e inicialización con datos semilla.
 */

// Clave principal de almacenamiento en localStorage
const STORAGE_KEY = 'mavikekas_data';

// ============================================================
// DATOS SEMILLA (se insertan solo cuando localStorage está vacío)
// ============================================================
const SEED_DATA = {
  users: [
    {
      id: 'u_admin_seed',
      nombre: 'Carlos',
      apellido: 'Administrador',
      username: 'admin',
      password: 'Admin2024!',
      role: 'admin',
      passwordChanged: true,
      defaultOrders: {
        martes:  { items: [] },
        viernes: { items: [] }
      }
    },
    {
      id: 'u_user1_seed',
      nombre: 'María',
      apellido: 'González',
      username: 'mgonzalez',
      password: 'Temp1234!',
      role: 'user',
      passwordChanged: false,
      defaultOrders: {
        martes:  { items: [] },
        viernes: { items: [] }
      }
    }
  ],
  catalogs: {
    tacos: [
      { id: 'taco_1', nombre: 'Bistec',       activo: true },
      { id: 'taco_2', nombre: 'Champiñones',  activo: true },
      { id: 'taco_3', nombre: 'Pastor',        activo: true },
      { id: 'taco_4', nombre: 'Longaniza',     activo: true },
      { id: 'taco_5', nombre: 'Pollo',         activo: true }
    ],
    quesadillas: [
      { id: 'que_1', nombre: 'Chicharrón prensado', activo: true },
      { id: 'que_2', nombre: 'Rajas con crema',     activo: true },
      { id: 'que_3', nombre: 'Tinga',               activo: true },
      { id: 'que_4', nombre: 'Flor de calabaza',    activo: true },
      { id: 'que_5', nombre: 'Huitlacoche',         activo: true }
    ]
  },
  orders: [],
  appState: {
    serviceEnabled: false,   // Switch manual del admin
    simulatedDay:   null,    // 'martes' | 'viernes' | 'otro' | null
    simulatedTime:  null     // 'HH:MM' | null
  }
};

/**
 * Inicializa el localStorage con datos semilla si está vacío.
 * Retorna el estado actual del almacenamiento.
 */
export const initializeStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  // Merge para garantizar que nuevas claves del appState existan en datos anteriores
  const parsed = JSON.parse(stored);
  if (!parsed.appState) parsed.appState = SEED_DATA.appState;
  return parsed;
};

/**
 * Lee el estado completo desde localStorage.
 */
export const getStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : SEED_DATA;
};

/**
 * Persiste el estado completo en localStorage.
 * Solo escribe las secciones que se mandan explícitamente.
 */
export const saveStorage = ({ users, catalogs, orders, appState }) => {
  const current = getStorage();
  const updated = {
    ...current,
    ...(users    !== undefined && { users }),
    ...(catalogs !== undefined && { catalogs }),
    ...(orders   !== undefined && { orders }),
    ...(appState !== undefined && { appState }),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

/**
 * Elimina todos los datos de localStorage (útil para desarrollo).
 */
export const resetStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};
