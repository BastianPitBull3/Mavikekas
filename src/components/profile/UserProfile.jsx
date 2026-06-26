/**
 * UserProfile.jsx
 * Perfil del usuario: cambiar username/contraseña y configurar
 * órdenes por defecto para Martes (tacos) y Viernes (quesadillas).
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// ============================================================
// SUB-COMPONENTE: Selector de ítems para orden por defecto
// ============================================================
function DefaultOrderEditor({ catalog, day, initialItems, onSave }) {
  const isMartes = day === 'martes';
  const label    = isMartes ? '🌮 Tacos (Martes)' : '🧀 Quesadillas (Viernes)';

  // Inicializar el estado con el catálogo activo
  const buildItems = () =>
    catalog
      .filter((c) => c.activo)
      .map((c) => {
        const existing = initialItems?.find((it) => it.sabor === c.nombre);
        return {
          sabor:    c.nombre,
          cantidad: existing?.cantidad ?? 0,
          conQueso: existing?.conQueso ?? 0,
        };
      });

  const [items,   setItems]   = useState(buildItems);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => { setItems(buildItems()); }, [catalog, initialItems]);

  const setCantidad = (sabor, value) => {
    setSaved(false);
    const cantidad = Math.max(0, parseInt(value) || 0);
    setItems((prev) =>
      prev.map((it) =>
        it.sabor === sabor
          ? { ...it, cantidad, conQueso: Math.min(it.conQueso, cantidad) }
          : it
      )
    );
  };

  const setConQueso = (sabor, value) => {
    setSaved(false);
    setItems((prev) =>
      prev.map((it) => {
        if (it.sabor !== sabor) return it;
        return { ...it, conQueso: Math.max(0, Math.min(parseInt(value) || 0, it.cantidad)) };
      })
    );
  };

  const handleSave = () => {
    onSave(day, items);
    setSaved(true);
  };

  const total = items.reduce((acc, it) => acc + it.cantidad, 0);
  const active = items.filter((it) => catalog.find((c) => c.nombre === it.sabor && c.activo));

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-3">{label}</h3>

      {active.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3">
          No hay sabores activos en el catálogo
        </p>
      ) : (
        <div className="space-y-2 mb-4">
          {active.map((item) => (
            <div key={item.sabor} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-800 flex-1">
                  {item.sabor}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCantidad(item.sabor, item.cantidad - 1)}
                    disabled={item.cantidad === 0}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600
                               flex items-center justify-center text-sm font-bold disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={item.cantidad}
                    onChange={(e) => setCantidad(item.sabor, e.target.value)}
                    className="w-12 text-center text-sm font-semibold border border-gray-200
                               rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <button
                    type="button"
                    onClick={() => setCantidad(item.sabor, item.cantidad + 1)}
                    className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-600
                               flex items-center justify-center text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Con queso (solo martes) */}
              {isMartes && item.cantidad > 0 && (
                <div className="mt-2 ml-1 flex items-center gap-2 text-xs text-amber-700">
                  <span>🧀 Con queso:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConQueso(item.sabor, item.conQueso - 1)}
                      disabled={item.conQueso === 0}
                      className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 flex items-center
                                 justify-center text-xs font-bold disabled:opacity-40"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={item.cantidad}
                      value={item.conQueso}
                      onChange={(e) => setConQueso(item.sabor, e.target.value)}
                      className="w-10 text-center text-xs font-medium border border-amber-200
                                 rounded-md py-0.5 bg-amber-50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setConQueso(item.sabor, item.conQueso + 1)}
                      disabled={item.conQueso >= item.cantidad}
                      className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 flex items-center
                                 justify-center text-xs font-bold disabled:opacity-40"
                    >
                      +
                    </button>
                    <span className="text-amber-500">/ {item.cantidad}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contador y botón guardar */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500">
          Total: <strong>{total}</strong> {isMartes ? 'tacos' : 'quesadillas'}
        </span>
        <button onClick={handleSave} className="btn-primary">
          {saved ? '✅ Guardada' : '💾 Guardar predeterminada'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function UserProfile() {
  const { state, updateProfile, saveDefaultOrder } = useApp();
  const { currentUser, catalogs } = state;

  if (!currentUser) return null;

  // Estado del formulario de perfil
  const [username,        setUsername]        = useState(currentUser.username);
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd,         setShowPwd]         = useState(false);
  const [profileMsg,      setProfileMsg]      = useState(null); // { type: 'success'|'error', text }

  const handleProfileSave = () => {
    setProfileMsg(null);

    if (!username.trim()) {
      setProfileMsg({ type: 'error', text: 'El nombre de usuario no puede estar vacío' });
      return;
    }

    if (password && password !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (password && password.length < 6) {
      setProfileMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const result = updateProfile(currentUser.id, {
      username: username.trim(),
      password: password || undefined,
    });

    if (result.success) {
      setPassword('');
      setConfirmPassword('');
      setProfileMsg({ type: 'success', text: 'Perfil actualizado correctamente' });
    } else {
      setProfileMsg({ type: 'error', text: result.error });
    }
  };

  const handleSaveDefault = (day, items) => {
    saveDefaultOrder(day, items);
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6 fade-in">
      <h1 className="text-xl font-bold text-gray-900">Mi Perfil</h1>

      {/* ── Sección: Datos de la cuenta ── */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800 mb-0.5">Datos de la cuenta</h2>
          <p className="text-xs text-gray-400">
            Puedes cambiar tu usuario y contraseña, pero no tu nombre real.
          </p>
        </div>

        {/* Nombre real (solo lectura) */}
        <div className="bg-gray-50 rounded-xl p-3 text-sm">
          <p className="text-xs text-gray-400 mb-1">Nombre completo</p>
          <p className="font-medium text-gray-800">
            {currentUser.nombre} {currentUser.apellido}
          </p>
        </div>

        {/* Username editable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre de usuario
          </label>
          <input
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Contraseña nueva */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nueva contraseña{' '}
            <span className="font-normal text-gray-400">(dejar vacío para no cambiar)</span>
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              className="input-field pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        {password && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type={showPwd ? 'text' : 'password'}
              className="input-field"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        {/* Mensaje de resultado */}
        {profileMsg && (
          <div
            className={`px-4 py-3 rounded-lg text-sm border ${
              profileMsg.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}
          >
            {profileMsg.type === 'success' ? '✅ ' : '⚠️ '}
            {profileMsg.text}
          </div>
        )}

        <button onClick={handleProfileSave} className="btn-primary">
          💾 Guardar cambios
        </button>
      </div>

      {/* ── Sección: Órdenes por defecto ── */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-1">Órdenes por defecto</h2>
        <p className="text-xs text-gray-400 mb-4">
          Configura lo que pides normalmente para agilizar tu pedido del día.
        </p>

        <div className="space-y-4">
          {/* Defecto para Martes (Tacos) */}
          <DefaultOrderEditor
            catalog={catalogs.tacos}
            day="martes"
            initialItems={currentUser.defaultOrders?.martes?.items}
            onSave={handleSaveDefault}
          />

          {/* Defecto para Viernes (Quesadillas) */}
          <DefaultOrderEditor
            catalog={catalogs.quesadillas}
            day="viernes"
            initialItems={currentUser.defaultOrders?.viernes?.items}
            onSave={handleSaveDefault}
          />
        </div>
      </div>
    </div>
  );
}
