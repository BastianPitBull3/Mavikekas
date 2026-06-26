/**
 * AppContext.jsx
 * Contexto principal de la aplicación: gestiona todo el estado global
 * (usuarios, catálogos, órdenes, sesión, estado del servicio) y
 * expone acciones para modificarlo.
 *
 * Patrón: React Context + useReducer
 */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { initializeStorage, saveStorage } from '../utils/storage';
import { getTodayString } from '../utils/dateUtils';

// ============================================================
// TIPOS DE ACCIONES DEL REDUCER
// ============================================================
const A = {
  SET_CURRENT_USER:    'SET_CURRENT_USER',
  LOGOUT:              'LOGOUT',
  SET_USERS:           'SET_USERS',
  SET_CATALOGS:        'SET_CATALOGS',
  SET_ORDERS:          'SET_ORDERS',
  PATCH_APP_STATE:     'PATCH_APP_STATE',
  SET_VIEW:            'SET_VIEW',
  SET_PENDING_PWD:     'SET_PENDING_PWD',
  SET_ORDER_SUMMARY:   'SET_ORDER_SUMMARY',
};

// ============================================================
// GENERADORES
// ============================================================

/** Genera un ID único combinando timestamp y valor aleatorio */
const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/** Genera una contraseña temporal segura para nuevos usuarios */
const genTempPassword = () => {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 9; i++) pwd += pool[Math.floor(Math.random() * pool.length)];
  return `${pwd}!`;
};

// ============================================================
// ESTADO INICIAL
// ============================================================
const buildInitialState = () => {
  const storage = initializeStorage();
  return {
    currentUser:          null,
    users:                storage.users,
    catalogs:             storage.catalogs,
    orders:               storage.orders,
    appState:             storage.appState,
    currentView:          'login',
    pendingNewUserPwd:    null,   // { userId, username, password } — mostrar al admin
    orderSummary:         null,   // Orden recién enviada para el modal de resumen
  };
};

// ============================================================
// REDUCER
// ============================================================
const reducer = (state, { type, payload }) => {
  switch (type) {
    case A.SET_CURRENT_USER:  return { ...state, currentUser: payload };
    case A.LOGOUT:            return {
      ...state,
      currentUser:       null,
      currentView:       'login',
      pendingNewUserPwd: null,
      orderSummary:      null,
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
  const [state, dispatch] = useReducer(reducer, null, buildInitialState);

  // Persistir en localStorage cuando cambian datos relevantes
  useEffect(() => {
    saveStorage({
      users:    state.users,
      catalogs: state.catalogs,
      orders:   state.orders,
      appState: state.appState,
    });
  }, [state.users, state.catalogs, state.orders, state.appState]);

  // ============================================================
  // AUTENTICACIÓN
  // ============================================================

  /** Inicia sesión buscando usuario por username+password */
  const login = (username, password) => {
    const user = state.users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) return { success: false, error: 'Usuario o contraseña incorrectos' };

    dispatch({ type: A.SET_CURRENT_USER, payload: user });
    dispatch({ type: A.SET_VIEW, payload: user.role === 'admin' ? 'admin' : 'orders' });
    return { success: true };
  };

  /** Cierra la sesión activa */
  const logout = () => dispatch({ type: A.LOGOUT });

  /** Cambia la vista activa */
  const setView = (view) => dispatch({ type: A.SET_VIEW, payload: view });

  // ============================================================
  // GESTIÓN DE USUARIOS (Solo Admin)
  // ============================================================

  /**
   * Crea un nuevo usuario con contraseña temporal auto-generada.
   * Almacena la contraseña en pendingNewUserPwd para que el admin la vea.
   */
  const createUser = (nombre, apellido, username, role = 'user') => {
    if (!nombre.trim() || !apellido.trim() || !username.trim()) {
      return { success: false, error: 'Todos los campos son requeridos' };
    }
    if (state.users.find((u) => u.username === username.trim())) {
      return { success: false, error: 'El nombre de usuario ya está en uso' };
    }

    const tempPwd  = genTempPassword();
    const newUser  = {
      id:              genId(),
      nombre:          nombre.trim(),
      apellido:        apellido.trim(),
      username:        username.trim(),
      password:        tempPwd,
      role,
      passwordChanged: false,
      defaultOrders:   { martes: { items: [] }, viernes: { items: [] } },
    };

    dispatch({ type: A.SET_USERS,     payload: [...state.users, newUser] });
    dispatch({ type: A.SET_PENDING_PWD, payload: { userId: newUser.id, username: newUser.username, password: tempPwd } });

    return { success: true };
  };

  /** Elimina un usuario (no se puede eliminar a uno mismo) */
  const deleteUser = (userId) => {
    if (userId === state.currentUser?.id) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta' };
    }
    dispatch({ type: A.SET_USERS, payload: state.users.filter((u) => u.id !== userId) });
    if (state.pendingNewUserPwd?.userId === userId) {
      dispatch({ type: A.SET_PENDING_PWD, payload: null });
    }
    return { success: true };
  };

  /** Cambia el rol de un usuario (admin no puede cambiar el suyo propio) */
  const updateUserRole = (userId, newRole) => {
    if (userId === state.currentUser?.id) {
      return { success: false, error: 'No puedes cambiar tu propio rol' };
    }
    const updatedUsers = state.users.map((u) =>
      u.id === userId ? { ...u, role: newRole } : u
    );
    dispatch({ type: A.SET_USERS, payload: updatedUsers });
    return { success: true };
  };

  /**
   * Actualiza el username y/o password del usuario indicado.
   * Cualquier usuario puede actualizar su propio perfil.
   * El Admin puede actualizar cualquier perfil.
   */
  const updateProfile = (userId, { username, password }) => {
    if (username) {
      const conflict = state.users.find(
        (u) => u.username === username.trim() && u.id !== userId
      );
      if (conflict) return { success: false, error: 'El nombre de usuario ya está en uso' };
    }

    const updatedUsers = state.users.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        ...(username && { username: username.trim() }),
        ...(password && { password }),
        passwordChanged: true,
      };
    });

    dispatch({ type: A.SET_USERS, payload: updatedUsers });

    // Actualizar currentUser si es el mismo
    if (state.currentUser?.id === userId) {
      const updated = updatedUsers.find((u) => u.id === userId);
      dispatch({ type: A.SET_CURRENT_USER, payload: updated });
    }

    return { success: true };
  };

  /** Limpia la contraseña temporal pendiente de mostrar al admin */
  const clearPendingPassword = () => dispatch({ type: A.SET_PENDING_PWD, payload: null });

  // ============================================================
  // GESTIÓN DE CATÁLOGOS (Solo Admin)
  // ============================================================

  /**
   * Agrega un nuevo sabor al catálogo indicado.
   * @param {'tacos'|'quesadillas'} type
   */
  const addCatalogItem = (type, nombre) => {
    if (!nombre.trim()) return { success: false, error: 'El nombre no puede estar vacío' };
    const dup = state.catalogs[type].find(
      (it) => it.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );
    if (dup) return { success: false, error: 'Ya existe un sabor con ese nombre' };

    const item = { id: genId(), nombre: nombre.trim(), activo: true };
    dispatch({
      type:    A.SET_CATALOGS,
      payload: { ...state.catalogs, [type]: [...state.catalogs[type], item] },
    });
    return { success: true };
  };

  /** Elimina un sabor del catálogo */
  const removeCatalogItem = (type, itemId) => {
    dispatch({
      type:    A.SET_CATALOGS,
      payload: { ...state.catalogs, [type]: state.catalogs[type].filter((it) => it.id !== itemId) },
    });
    return { success: true };
  };

  /** Activa o desactiva un sabor del catálogo */
  const toggleCatalogItem = (type, itemId) => {
    dispatch({
      type:    A.SET_CATALOGS,
      payload: {
        ...state.catalogs,
        [type]: state.catalogs[type].map((it) =>
          it.id === itemId ? { ...it, activo: !it.activo } : it
        ),
      },
    });
  };

  // ============================================================
  // CONTROL DEL SERVICIO (Solo Admin)
  // ============================================================

  /** Activa/desactiva el servicio manualmente (bypass de horario) */
  const setServiceEnabled = (enabled) =>
    dispatch({ type: A.PATCH_APP_STATE, payload: { serviceEnabled: enabled } });

  /** Cambia el día simulado para pruebas */
  const setSimulatedDay = (day) =>
    dispatch({ type: A.PATCH_APP_STATE, payload: { simulatedDay: day } });

  /** Cambia la hora simulada para pruebas */
  const setSimulatedTime = (time) =>
    dispatch({ type: A.PATCH_APP_STATE, payload: { simulatedTime: time } });

  // ============================================================
  // GESTIÓN DE ÓRDENES
  // ============================================================

  const todayStr = getTodayString();

  /** Retorna la orden del usuario indicado para el día de hoy (o null) */
  const getTodayOrder = (userId) =>
    state.orders.find((o) => o.userId === userId && o.fecha === todayStr) || null;

  /** Retorna todas las órdenes de hoy, ordenadas cronológicamente */
  const getTodayOrders = () =>
    state.orders
      .filter((o) => o.fecha === todayStr)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  /**
   * Envía o actualiza la orden del usuario actual.
   * Si ya existe una orden para hoy, la reemplaza.
   *
   * @param {Array}  items  - Array de { sabor, cantidad, conQueso? }
   * @param {'martes'|'viernes'} day
   * @param {boolean} saveAsDefault  - Si true, también guarda como orden por defecto
   */
  const submitOrder = (items, day, saveAsDefault = false) => {
    if (!state.currentUser) return { success: false, error: 'Sin sesión activa' };

    const userId       = state.currentUser.id;
    const validItems   = items.filter((it) => it.cantidad > 0);
    if (validItems.length === 0) return { success: false, error: 'Debes agregar al menos un item' };

    const existing     = getTodayOrder(userId);
    const orderData    = {
      id:           existing?.id || genId(),
      userId,
      userNombre:   state.currentUser.nombre,
      userApellido: state.currentUser.apellido,
      dia:          day,
      fecha:        todayStr,
      items:        validItems,
      timestamp:    new Date().toISOString(),
    };

    const updatedOrders = existing
      ? state.orders.map((o) => (o.id === existing.id ? orderData : o))
      : [...state.orders, orderData];

    dispatch({ type: A.SET_ORDERS,       payload: updatedOrders });
    dispatch({ type: A.SET_ORDER_SUMMARY, payload: orderData });

    // Si se pidió guardar como predeterminada, actualizar el perfil del usuario
    if (saveAsDefault) {
      const defaultItems = validItems.map((it) => ({ ...it }));
      const updatedUsers = state.users.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          defaultOrders: {
            ...u.defaultOrders,
            [day]: { items: defaultItems },
          },
        };
      });
      dispatch({ type: A.SET_USERS, payload: updatedUsers });
      const updatedUser = updatedUsers.find((u) => u.id === userId);
      dispatch({ type: A.SET_CURRENT_USER, payload: updatedUser });
    }

    return { success: true, order: orderData };
  };

  /**
   * Guarda la orden por defecto del usuario actual para el día indicado.
   * Se llama desde el perfil del usuario.
   */
  const saveDefaultOrder = (day, items) => {
    if (!state.currentUser) return;
    const validItems   = items.filter((it) => it.cantidad > 0);
    const updatedUsers = state.users.map((u) => {
      if (u.id !== state.currentUser.id) return u;
      return {
        ...u,
        defaultOrders: { ...u.defaultOrders, [day]: { items: validItems } },
      };
    });
    dispatch({ type: A.SET_USERS, payload: updatedUsers });
    const updatedUser = updatedUsers.find((u) => u.id === state.currentUser.id);
    dispatch({ type: A.SET_CURRENT_USER, payload: updatedUser });
    return { success: true };
  };

  /** Limpia el resumen de orden del estado (cierra el modal) */
  const clearOrderSummary = () =>
    dispatch({ type: A.SET_ORDER_SUMMARY, payload: null });

  // ============================================================
  // PROVEEDOR
  // ============================================================
  return (
    <AppContext.Provider
      value={{
        state,
        // Autenticación
        login, logout, setView,
        // Usuarios
        createUser, deleteUser, updateUserRole, updateProfile, clearPendingPassword,
        // Catálogos
        addCatalogItem, removeCatalogItem, toggleCatalogItem,
        // Servicio
        setServiceEnabled, setSimulatedDay, setSimulatedTime,
        // Órdenes
        getTodayOrder, getTodayOrders, submitOrder, saveDefaultOrder, clearOrderSummary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/** Hook de consumo — lanza error si se usa fuera del proveedor */
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
};
