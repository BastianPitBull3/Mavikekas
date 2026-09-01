/**
 * AppContext.jsx
 * Contexto global reescrito para usar Firestore como fuente de verdad.
 *
 * Flujo de datos:
 *  - LECTURA:  Listeners onSnapshot → despachan al reducer → UI reactiva
 *  - ESCRITURA: Acciones escriben en Firestore → listener detecta cambio → reducer
 *
 * La sesión (userId) se almacena en localStorage para sobrevivir recargas.
 */
import React, {
  createContext, useContext, useReducer,
  useEffect, useRef, useState,
} from 'react';
import { CONFIG_FILLED } from '../firebase';
import {
  initializeData,
  subscribeUsers, subscribeCatalogs, subscribeOrders, subscribeAppState,
  saveUser, removeUser, saveCatalogs, saveOrder, removeOrder, saveAppState,
} from '../utils/firestoreDB';
import { saveSessionUserId, getSessionUserId, clearSession } from '../utils/storage';
import { getTodayString } from '../utils/dateUtils';
import { sendWhatsAppNotification } from '../utils/whatsapp';

// ============================================================
// TIPOS DE ACCIONES
// ============================================================
const A = {
  SET_CURRENT_USER:  'SET_CURRENT_USER',
  LOGOUT:            'LOGOUT',
  SET_USERS:         'SET_USERS',
  SET_CATALOGS:      'SET_CATALOGS',
  SET_ORDERS:        'SET_ORDERS',
  PATCH_APP_STATE:   'PATCH_APP_STATE',
  SET_VIEW:          'SET_VIEW',
  SET_PENDING_PWD:   'SET_PENDING_PWD',
  SET_ORDER_SUMMARY: 'SET_ORDER_SUMMARY',
};

// ============================================================
// GENERADORES
// ============================================================
const genId      = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const genTempPwd = () => {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 9; i++) pwd += pool[Math.floor(Math.random() * pool.length)];
  return `${pwd}!`;
};
const genInviteCode = () => {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += pool[Math.floor(Math.random() * pool.length)];
  return code;
};
/** Código numérico de 6 dígitos — fácil de leer/escribir desde un WhatsApp */
const genRecoveryCode = () => String(Math.floor(100000 + Math.random() * 900000));

// ============================================================
// ESTADO INICIAL (vacío — Firestore lo llenará vía listeners)
// ============================================================
const INITIAL_STATE = {
  currentUser:       null,
  users:             [],
  catalogs:          { tacos: [], quesadillas: [] },
  orders:            [],
  appState:          {
    serviceEnabled: false, simulatedDay: null, simulatedTime: null,
    simulatedDate: null, inviteCode: null,
  },
  currentView:       'login',
  pendingNewUserPwd: null,
  orderSummary:      null,
};

// ============================================================
// REDUCER
// ============================================================
const reducer = (state, { type, payload }) => {
  switch (type) {
    case A.SET_CURRENT_USER:  return { ...state, currentUser: payload };
    case A.LOGOUT:            return {
      ...state,
      currentUser: null, currentView: 'login',
      pendingNewUserPwd: null, orderSummary: null,
    };
    case A.SET_USERS:         return { ...state, users: payload };
    case A.SET_CATALOGS:      return { ...state, catalogs: payload };
    case A.SET_ORDERS:        return { ...state, orders: payload };
    case A.PATCH_APP_STATE:   return { ...state, appState: { ...state.appState, ...payload } };
    case A.SET_VIEW:          return { ...state, currentView: payload };
    case A.SET_PENDING_PWD:   return { ...state, pendingNewUserPwd: payload };
    case A.SET_ORDER_SUMMARY: return { ...state, orderSummary: payload };
    default:                  return state;
  }
};

// ============================================================
// CONTEXTO
// ============================================================
const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [state, dispatch]       = useReducer(reducer, INITIAL_STATE);
  const [loading, setLoading]   = useState(true);
  const [dbError, setDbError]   = useState(null);

  // Contador puramente local (no persiste) para forzar que BirthdayModal
  // vuelva a evaluar si debe mostrarse, usado por el botón de prueba del
  // simulador de tiempo tras limpiar el flag de "ya mostrado hoy".
  const [birthdayModalTrigger, setBirthdayModalTrigger] = useState(0);
  const retriggerBirthdayModal = () => setBirthdayModalTrigger((n) => n + 1);

  // Ref para acceder al ID del usuario actual dentro de closures de listeners
  const currentUserIdRef = useRef(null);
  useEffect(() => {
    currentUserIdRef.current = state.currentUser?.id ?? null;
  }, [state.currentUser]);

  // Ref con las funciones de cancelación de los listeners
  const unsubs = useRef([]);

  // Contador para saber cuántas fuentes de datos ya cargaron
  const sourcesLoaded   = useRef(new Set());
  const sessionChecked  = useRef(false);   // La sesión solo se restaura una vez

  const markLoaded = (source) => {
    sourcesLoaded.current.add(source);
    // Cuando las 4 fuentes han respondido, quitar el loader
    if (sourcesLoaded.current.size >= 4) setLoading(false);
  };

  // ============================================================
  // SETUP: inicializar datos y suscribirse a Firestore
  // ============================================================
  useEffect(() => {
    if (!CONFIG_FILLED) {
      setLoading(false);
      return;
    }

    const setup = async () => {
      try {
        // Escribir datos semilla si Firestore está vacío
        await initializeData();

        // ── Listener: Usuarios ──
        const unsubUsers = subscribeUsers((users) => {
          dispatch({ type: A.SET_USERS, payload: users });

          const uid = currentUserIdRef.current;

          if (!sessionChecked.current) {
            // Primera vez: intentar restaurar sesión desde localStorage
            sessionChecked.current = true;
            const savedUid = getSessionUserId();
            if (savedUid) {
              const user = users.find((u) => u.id === savedUid);
              if (user) {
                dispatch({ type: A.SET_CURRENT_USER, payload: user });
                dispatch({ type: A.SET_VIEW, payload: user.role === 'admin' ? 'admin' : 'orders' });
              } else {
                clearSession(); // El usuario ya no existe
              }
            }
          } else if (uid) {
            // Actualizaciones posteriores: sincronizar datos del usuario actual
            const updated = users.find((u) => u.id === uid);
            if (!updated) {
              // El usuario fue eliminado mientras estaba en sesión
              clearSession();
              dispatch({ type: A.LOGOUT });
            } else {
              dispatch({ type: A.SET_CURRENT_USER, payload: updated });
            }
          }

          markLoaded('users');
        });

        // ── Listener: Catálogos ──
        const unsubCatalogs = subscribeCatalogs((catalogs) => {
          dispatch({ type: A.SET_CATALOGS, payload: catalogs });
          markLoaded('catalogs');
        });

        // ── Listener: Órdenes ──
        const unsubOrders = subscribeOrders((orders) => {
          dispatch({ type: A.SET_ORDERS, payload: orders });
          markLoaded('orders');
        });

        // ── Listener: Estado global ──
        const unsubAppState = subscribeAppState((appState) => {
          dispatch({ type: A.PATCH_APP_STATE, payload: appState });
          markLoaded('appState');
        });

        unsubs.current = [unsubUsers, unsubCatalogs, unsubOrders, unsubAppState];
      } catch (err) {
        console.error('Error al conectar con Firestore:', err);
        setDbError(err.message || 'Error de conexión con la base de datos');
        setLoading(false);
      }
    };

    setup();

    // Cancelar todos los listeners al desmontar
    return () => unsubs.current.forEach((u) => u());
  }, []);

  // ============================================================
  // ACCIONES DE AUTENTICACIÓN
  // ============================================================

  const login = (username, password) => {
    // Se recorta espacios accidentales (típico de autocorrección en celulares)
    // para no fallar por un espacio invisible al inicio/final.
    const user = state.users.find(
      (u) => u.username === username && u.password === password.trim()
    );
    if (!user) return { success: false, error: 'Usuario o contraseña incorrectos' };

    saveSessionUserId(user.id);
    dispatch({ type: A.SET_CURRENT_USER, payload: user });
    dispatch({ type: A.SET_VIEW, payload: user.role === 'admin' ? 'admin' : 'orders' });
    return { success: true };
  };

  const logout = () => {
    clearSession();
    dispatch({ type: A.LOGOUT });
  };

  const setView = (view) => dispatch({ type: A.SET_VIEW, payload: view });

  // ============================================================
  // ACCIONES DE USUARIOS (Solo Admin)
  // ============================================================

  const createUser = async (nombre, apellido, username, role = 'user', cumpleanos = null) => {
    if (!nombre.trim() || !apellido.trim() || !username.trim())
      return { success: false, error: 'Todos los campos son requeridos' };
    if (state.users.find((u) => u.username === username.trim()))
      return { success: false, error: 'El nombre de usuario ya está en uso' };

    const tempPwd = genTempPwd();
    const newUser = {
      id: genId(), nombre: nombre.trim(), apellido: apellido.trim(),
      username: username.trim(), password: tempPwd, role,
      passwordChanged: false,
      cumpleanos,
      pastelFavorito: null,
      defaultOrders: { martes: { items: [] }, viernes: { items: [] } },
    };

    try {
      await saveUser(newUser);
      dispatch({ type: A.SET_PENDING_PWD,
        payload: { userId: newUser.id, username: newUser.username, password: tempPwd } });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al guardar el usuario' };
    }
  };

  const deleteUser = async (userId) => {
    if (userId === state.currentUser?.id)
      return { success: false, error: 'No puedes eliminar tu propia cuenta' };
    try {
      await removeUser(userId);
      if (state.pendingNewUserPwd?.userId === userId)
        dispatch({ type: A.SET_PENDING_PWD, payload: null });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al eliminar el usuario' };
    }
  };

  const updateUserRole = async (userId, newRole) => {
    if (userId === state.currentUser?.id)
      return { success: false, error: 'No puedes cambiar tu propio rol' };
    const user = state.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };
    try {
      await saveUser({ ...user, role: newRole });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al cambiar el rol' };
    }
  };

  const updateProfile = async (userId, { username, password }) => {
    if (username) {
      const conflict = state.users.find(
        (u) => u.username === username.trim() && u.id !== userId
      );
      if (conflict) return { success: false, error: 'El nombre de usuario ya está en uso' };
    }
    const user = state.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const updated = {
      ...user,
      ...(username && { username: username.trim() }),
      ...(password && { password: password.trim() }),
      passwordChanged: true,
    };
    try {
      await saveUser(updated);
      return { success: true };
    } catch {
      return { success: false, error: 'Error al actualizar el perfil' };
    }
  };

  const clearPendingPassword = () =>
    dispatch({ type: A.SET_PENDING_PWD, payload: null });

  /** Establece o corrige la fecha de cumpleaños de un usuario ('YYYY-MM-DD') */
  const updateBirthday = async (userId, cumpleanos) => {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };
    try {
      await saveUser({ ...user, cumpleanos });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al guardar la fecha de cumpleaños' };
    }
  };

  /** Establece o corrige el pastel favorito de un usuario (texto libre) */
  const updateFavoriteCake = async (userId, pastelFavorito) => {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };
    try {
      await saveUser({ ...user, pastelFavorito });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al guardar el pastel favorito' };
    }
  };

  /** Guarda el número y la clave de CallMeBot de un admin para recibir notificaciones */
  const updateAdminWhatsApp = async (userId, whatsappPhone, whatsappApiKey) => {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Usuario no encontrado' };
    try {
      await saveUser({ ...user, whatsappPhone, whatsappApiKey });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al guardar los datos de WhatsApp' };
    }
  };

  // ============================================================
  // CÓDIGO DE INVITACIÓN (Solo Admin genera/revoca; cualquiera lo consume)
  // ============================================================
  // Un único código vive en appState.inviteCode. Generar uno nuevo pisa
  // (invalida) el anterior, y usarlo para registrarse lo limpia a null —
  // así queda inservible en ambos casos, sin necesidad de una lista.

  /** Genera un nuevo código, reemplazando (invalidando) el que hubiera */
  const generateInviteCode = async () => {
    const code = genInviteCode();
    try {
      await saveAppState({ ...state.appState, inviteCode: code });
      return { success: true, code };
    } catch {
      return { success: false, error: 'Error al generar el código' };
    }
  };

  /** Revoca el código activo sin generar uno nuevo */
  const revokeInviteCode = async () => {
    try {
      await saveAppState({ ...state.appState, inviteCode: null });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al revocar el código' };
    }
  };

  // ============================================================
  // AUTO-REGISTRO (desde la pantalla de login, con código de invitación)
  // ============================================================

  const registerUser = async ({ nombre, apellido, username, password, inviteCode, cumpleanos }) => {
    if (!nombre.trim() || !apellido.trim() || !username.trim() || !password)
      return { success: false, error: 'Todos los campos son requeridos' };
    if (password.length < 6)
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };

    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!state.appState.inviteCode || normalizedCode !== state.appState.inviteCode)
      return { success: false, error: 'Código de invitación inválido' };

    if (state.users.find((u) => u.username === username.trim()))
      return { success: false, error: 'El nombre de usuario ya está en uso' };

    const newUser = {
      id: genId(), nombre: nombre.trim(), apellido: apellido.trim(),
      username: username.trim(), password, role: 'user',
      passwordChanged: true,
      cumpleanos: cumpleanos ?? null,
      pastelFavorito: null,
      defaultOrders: { martes: { items: [] }, viernes: { items: [] } },
    };

    try {
      await saveUser(newUser);
      // El código queda inservible en cuanto se usa una vez.
      await saveAppState({ ...state.appState, inviteCode: null });

      saveSessionUserId(newUser.id);
      dispatch({ type: A.SET_CURRENT_USER, payload: newUser });
      dispatch({ type: A.SET_VIEW, payload: 'orders' });
      return { success: true };
    } catch {
      return { success: false, error: 'Error al crear la cuenta' };
    }
  };

  // ============================================================
  // RECUPERACIÓN DE CONTRASEÑA (desde la pantalla de login)
  // ============================================================
  // El código vive en el propio documento del usuario (mismo patrón que el
  // código de invitación): generarlo lo deja disponible, y usarlo lo limpia
  // a null — así queda inservible después de un solo uso.

  /**
   * Genera un código de recuperación para el usuario indicado y notifica
   * por WhatsApp (CallMeBot) a todos los admins que tengan su número
   * configurado. No requiere sesión activa — se usa desde el login.
   */
  const requestPasswordReset = async (username) => {
    const user = state.users.find((u) => u.username === username.trim());
    if (!user) return { success: false, error: 'No existe ese usuario' };

    const code = genRecoveryCode();
    try {
      await saveUser({ ...user, passwordResetCode: code });
    } catch {
      return { success: false, error: 'Error al generar el código' };
    }

    const admins = state.users.filter(
      (u) => u.role === 'admin' && u.whatsappPhone && u.whatsappApiKey
    );
    const message =
      `🌮 Mavikekas: ${user.nombre} ${user.apellido} (@${user.username}) ` +
      `solicitó recuperar su contraseña. Código: ${code}`;
    admins.forEach((admin) =>
      sendWhatsAppNotification(admin.whatsappPhone, admin.whatsappApiKey, message)
    );

    return { success: true, notifiedCount: admins.length };
  };

  /** Cambia la contraseña si el código coincide con el generado; lo invalida al usarlo */
  const resetPasswordWithCode = async (username, code, newPassword) => {
    // Se recorta espacios accidentales antes de validar y guardar (típico de
    // autocorrección en celulares) para que coincida luego con lo que se
    // escriba al iniciar sesión.
    const trimmedPassword = newPassword.trim();
    if (trimmedPassword.length < 6)
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };

    const user = state.users.find((u) => u.username === username.trim());
    if (!user) return { success: false, error: 'No existe ese usuario' };
    if (!user.passwordResetCode || user.passwordResetCode !== code.trim())
      return { success: false, error: 'Código inválido' };

    const updatedUser = {
      ...user, password: trimmedPassword, passwordResetCode: null, passwordChanged: true,
    };
    try {
      await saveUser(updatedUser);
    } catch {
      return { success: false, error: 'Error al restablecer la contraseña' };
    }

    // Contraseña restablecida: iniciar sesión automáticamente (mismo patrón
    // que login/registerUser) y mandar directo al dashboard correspondiente.
    saveSessionUserId(updatedUser.id);
    dispatch({ type: A.SET_CURRENT_USER, payload: updatedUser });
    dispatch({ type: A.SET_VIEW, payload: updatedUser.role === 'admin' ? 'admin' : 'orders' });
    return { success: true };
  };

  // ============================================================
  // ACCIONES DE CATÁLOGOS (Solo Admin)
  // ============================================================

  const addCatalogItem = async (type, nombre, admiteQueso = true) => {
    if (!nombre.trim()) return { success: false, error: 'El nombre no puede estar vacío' };
    const dup = state.catalogs[type].find(
      (it) => it.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );
    if (dup) return { success: false, error: 'Ya existe un sabor con ese nombre' };

    const item     = { id: genId(), nombre: nombre.trim(), activo: true, admiteQueso };
    const updated  = { ...state.catalogs, [type]: [...state.catalogs[type], item] };
    try {
      await saveCatalogs(updated);
      return { success: true };
    } catch {
      return { success: false, error: 'Error al guardar el catálogo' };
    }
  };

  const removeCatalogItem = async (type, itemId) => {
    const updated = {
      ...state.catalogs,
      [type]: state.catalogs[type].filter((it) => it.id !== itemId),
    };
    await saveCatalogs(updated);
  };

  const toggleCatalogItem = async (type, itemId) => {
    const updated = {
      ...state.catalogs,
      [type]: state.catalogs[type].map((it) =>
        it.id === itemId ? { ...it, activo: !it.activo } : it
      ),
    };
    await saveCatalogs(updated);
  };

  // ============================================================
  // CONTROL DEL SERVICIO (Solo Admin)
  // ============================================================

  const setServiceEnabled = async (enabled) => {
    // Actualización optimista local (feedback inmediato al toggle)
    dispatch({ type: A.PATCH_APP_STATE, payload: { serviceEnabled: enabled } });
    await saveAppState({ ...state.appState, serviceEnabled: enabled });
  };

  const setSimulatedDay = async (day) => {
    dispatch({ type: A.PATCH_APP_STATE, payload: { simulatedDay: day } });
    await saveAppState({ ...state.appState, simulatedDay: day });
  };

  const setSimulatedTime = async (time) => {
    dispatch({ type: A.PATCH_APP_STATE, payload: { simulatedTime: time } });
    await saveAppState({ ...state.appState, simulatedTime: time });
  };

  const setSimulatedDate = async (date) => {
    dispatch({ type: A.PATCH_APP_STATE, payload: { simulatedDate: date } });
    await saveAppState({ ...state.appState, simulatedDate: date });
  };

  /**
   * Limpia día, hora y fecha simulados en una sola escritura.
   * Llamar a setSimulatedDay/Time/Date por separado aquí causaría una
   * condición de carrera: cada uno escribe el appState completo a partir
   * de un snapshot desactualizado, y el último en resolver pisa los cambios
   * de los otros dos.
   */
  const resetSimulation = async () => {
    const payload = { simulatedDay: null, simulatedTime: null, simulatedDate: null };
    dispatch({ type: A.PATCH_APP_STATE, payload });
    await saveAppState({ ...state.appState, ...payload });
  };

  // ============================================================
  // ACCIONES DE ÓRDENES
  // ============================================================

  const todayStr = getTodayString();

  const getTodayOrder = (userId) =>
    state.orders.find((o) => o.userId === userId && o.fecha === todayStr) ?? null;

  const getTodayOrders = () =>
    state.orders.filter((o) => o.fecha === todayStr);

  const submitOrder = async (items, day, saveAsDefault = false) => {
    if (!state.currentUser) return { success: false, error: 'Sin sesión activa' };

    const validItems = items.filter((it) => it.cantidad > 0);
    if (validItems.length === 0)
      return { success: false, error: 'Agrega al menos un item' };

    const userId   = state.currentUser.id;
    const existing = getTodayOrder(userId);
    const order    = {
      id:           existing?.id ?? genId(),
      userId,
      userNombre:   state.currentUser.nombre,
      userApellido: state.currentUser.apellido,
      dia:          day,
      fecha:        todayStr,
      items:        validItems,
      timestamp:    new Date().toISOString(),
    };

    try {
      await saveOrder(order);
      dispatch({ type: A.SET_ORDER_SUMMARY, payload: order });

      if (saveAsDefault) {
        const user = state.users.find((u) => u.id === userId);
        if (user) {
          await saveUser({
            ...user,
            defaultOrders: {
              ...user.defaultOrders,
              [day]: { items: validItems.map((it) => ({ ...it })) },
            },
          });
        }
      }
      return { success: true, order };
    } catch {
      return { success: false, error: 'Error al guardar la orden' };
    }
  };

  /** Elimina una orden: el dueño puede borrar la suya, el admin puede borrar cualquiera */
  const deleteOrder = async (orderId) => {
    if (!state.currentUser) return { success: false, error: 'Sin sesión activa' };

    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Orden no encontrada' };
    if (order.userId !== state.currentUser.id && state.currentUser.role !== 'admin')
      return { success: false, error: 'No puedes eliminar la orden de otro usuario' };

    try {
      await removeOrder(orderId);
      return { success: true };
    } catch {
      return { success: false, error: 'Error al eliminar la orden' };
    }
  };

  const saveDefaultOrder = async (day, items) => {
    if (!state.currentUser) return;
    const user = state.users.find((u) => u.id === state.currentUser.id);
    if (!user) return;
    await saveUser({
      ...user,
      defaultOrders: {
        ...user.defaultOrders,
        [day]: { items: items.filter((it) => it.cantidad > 0) },
      },
    });
    return { success: true };
  };

  const clearOrderSummary = () =>
    dispatch({ type: A.SET_ORDER_SUMMARY, payload: null });

  // ============================================================
  // PROVEEDOR
  // ============================================================
  return (
    <AppContext.Provider value={{
      state, loading, dbError, configFilled: CONFIG_FILLED,
      login, logout, setView,
      createUser, deleteUser, updateUserRole, updateProfile, clearPendingPassword,
      updateBirthday, updateFavoriteCake, updateAdminWhatsApp,
      generateInviteCode, revokeInviteCode, registerUser,
      requestPasswordReset, resetPasswordWithCode,
      addCatalogItem, removeCatalogItem, toggleCatalogItem,
      setServiceEnabled, setSimulatedDay, setSimulatedTime, setSimulatedDate, resetSimulation,
      getTodayOrder, getTodayOrders, submitOrder, deleteOrder, saveDefaultOrder, clearOrderSummary,
      birthdayModalTrigger, retriggerBirthdayModal,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
};
