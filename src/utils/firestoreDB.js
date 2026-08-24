/**
 * firestoreDB.js
 * Capa de abstracción de Firestore.
 * Centraliza listeners en tiempo real y operaciones de escritura.
 *
 * Estructura de colecciones:
 *   /users/{userId}          — cuentas de usuario
 *   /catalogs/main           — catálogos de tacos y quesadillas
 *   /orders/{orderId}        — órdenes del día
 *   /appState/main           — estado global del servicio (switch admin,
 *                              incluye el código de invitación activo)
 */
import {
  collection, doc, getDoc, getDocs,
  setDoc, deleteDoc, onSnapshot,
  query, orderBy, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

// Nombres de colecciones
const C = {
  users:    'users',
  catalogs: 'catalogs',
  orders:   'orders',
  appState: 'appState',
};

// ============================================================
// DATOS SEMILLA (se escriben solo si las colecciones están vacías)
//
// ⚠️  Estas contraseñas son placeholders de ejemplo, pensadas para un
// Firestore recién creado. Cámbialas (Mi Perfil o Panel Admin) apenas
// inicies sesión por primera vez — no las dejes tal cual en producción.
// ============================================================
const SEED = {
  users: [
    {
      id:              'u_admin_seed',
      nombre:          'Admin',
      apellido:        'Inicial',
      username:        'admin',
      password:        'CambiarAhora#1',
      role:            'admin',
      passwordChanged: false,
      cumpleanos:      null,
      pastelFavorito:  null,
      defaultOrders:   { martes: { items: [] }, viernes: { items: [] } },
    },
    {
      id:              'u_user1_seed',
      nombre:          'Usuario',
      apellido:        'De Prueba',
      username:        'usuario1',
      password:        'CambiarAhora#2',
      role:            'user',
      passwordChanged: false,
      cumpleanos:      null,
      pastelFavorito:  null,
      defaultOrders:   { martes: { items: [] }, viernes: { items: [] } },
    },
  ],
  catalogs: {
    tacos: [
      { id: 'taco_1', nombre: 'Bistec',      activo: true },
      { id: 'taco_2', nombre: 'Champiñones', activo: true },
      { id: 'taco_3', nombre: 'Pastor',      activo: true },
      { id: 'taco_4', nombre: 'Longaniza',   activo: true },
      { id: 'taco_5', nombre: 'Pollo',       activo: true },
    ],
    quesadillas: [
      { id: 'que_1', nombre: 'Chicharrón prensado', activo: true },
      { id: 'que_2', nombre: 'Rajas con crema',     activo: true },
      { id: 'que_3', nombre: 'Tinga',               activo: true },
      { id: 'que_4', nombre: 'Flor de calabaza',    activo: true },
      { id: 'que_5', nombre: 'Huitlacoche',         activo: true },
    ],
  },
  appState: {
    serviceEnabled: false,
    simulatedDay:   null,
    simulatedTime:  null,
    simulatedDate:  null,
    inviteCode:     null,
  },
};

// ============================================================
// INICIALIZACIÓN — escribe datos semilla si las colecciones están vacías
// ============================================================
export const initializeData = async () => {
  const batch = writeBatch(db);
  let hasWrites = false;

  // Usuarios
  const usersSnap = await getDocs(collection(db, C.users));
  if (usersSnap.empty) {
    SEED.users.forEach((u) => batch.set(doc(db, C.users, u.id), u));
    hasWrites = true;
  }

  // Catálogos
  const catSnap = await getDoc(doc(db, C.catalogs, 'main'));
  if (!catSnap.exists()) {
    batch.set(doc(db, C.catalogs, 'main'), SEED.catalogs);
    hasWrites = true;
  }

  // Estado de la app
  const stateSnap = await getDoc(doc(db, C.appState, 'main'));
  if (!stateSnap.exists()) {
    batch.set(doc(db, C.appState, 'main'), SEED.appState);
    hasWrites = true;
  }

  if (hasWrites) await batch.commit();
};

// ============================================================
// LISTENERS EN TIEMPO REAL — retornan la función de cancelación (unsubscribe)
// ============================================================

/** Escucha cambios en la colección de usuarios */
export const subscribeUsers = (callback) =>
  onSnapshot(collection(db, C.users), (snap) =>
    callback(snap.docs.map((d) => d.data()))
  );

/** Escucha cambios en el documento de catálogos */
export const subscribeCatalogs = (callback) =>
  onSnapshot(doc(db, C.catalogs, 'main'), (snap) => {
    if (snap.exists()) callback(snap.data());
  });

/** Escucha cambios en la colección de órdenes, ordenadas por timestamp */
export const subscribeOrders = (callback) =>
  onSnapshot(
    query(collection(db, C.orders), orderBy('timestamp', 'asc')),
    (snap) => callback(snap.docs.map((d) => d.data()))
  );

/** Escucha cambios en el documento de estado global */
export const subscribeAppState = (callback) =>
  onSnapshot(doc(db, C.appState, 'main'), (snap) => {
    if (snap.exists()) callback(snap.data());
  });

// ============================================================
// OPERACIONES DE ESCRITURA
// ============================================================

/** Crea o actualiza un usuario */
export const saveUser = (user) =>
  setDoc(doc(db, C.users, user.id), user);

/** Elimina un usuario por ID */
export const removeUser = (userId) =>
  deleteDoc(doc(db, C.users, userId));

/** Reemplaza el documento de catálogos completo */
export const saveCatalogs = (catalogs) =>
  setDoc(doc(db, C.catalogs, 'main'), catalogs);

/** Crea o actualiza una orden */
export const saveOrder = (order) =>
  setDoc(doc(db, C.orders, order.id), order);

/** Elimina una orden por ID */
export const removeOrder = (orderId) =>
  deleteDoc(doc(db, C.orders, orderId));

/** Reemplaza el documento de estado global */
export const saveAppState = (appState) =>
  setDoc(doc(db, C.appState, 'main'), appState);
