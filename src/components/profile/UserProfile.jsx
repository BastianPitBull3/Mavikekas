/**
 * UserProfile.jsx
 * Perfil del usuario: cambiar username/contraseña y configurar
 * órdenes por defecto para Martes (tacos) y Viernes (quesadillas).
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

// ============================================================
// SUB-COMPONENTE: Selector de ítems para orden por defecto
// (sin card propia — vive dentro de la card con pestañas del padre)
// ============================================================
function DefaultOrderEditor({ catalog, day, initialItems, onSave }) {
  const isMartes = day === 'martes';

  const buildItems = () =>
    catalog
      .filter((c) => c.activo)
      .map((c) => {
        const existing    = initialItems?.find((it) => it.sabor === c.nombre);
        const admiteQueso = c.admiteQueso !== false;
        return {
          sabor:       c.nombre,
          cantidad:    existing?.cantidad ?? 0,
          conQueso:    admiteQueso ? (existing?.conQueso ?? 0) : 0,
          admiteQueso,
        };
      });

  const [items, setItems] = useState(buildItems);
  const [saved, setSaved] = useState(false);

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

  const total  = items.reduce((acc, it) => acc + it.cantidad, 0);
  const active = items.filter((it) => catalog.find((c) => c.nombre === it.sabor && c.activo));

  return (
    <div>
      {active.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
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

              {/* Con queso (solo martes y si el sabor admite queso) */}
              {isMartes && item.cantidad > 0 && item.admiteQueso && (
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

      <div className="flex flex-col gap-2 pt-1">
        <span className="text-sm text-gray-500">
          Total: <strong>{total}</strong> {isMartes ? 'tacos' : 'quesadillas'}
        </span>
        <button onClick={handleSave} className="btn-primary w-full">
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
  const { state, updateProfile, updateFavoriteCake, updateAdminWhatsApp, saveDefaultOrder } = useApp();
  const { currentUser, catalogs } = state;

  const [defaultTab,      setDefaultTab]      = useState('martes');
  const [username,        setUsername]        = useState(currentUser?.username ?? '');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd,         setShowPwd]         = useState(false);
  const [profileMsg,      setProfileMsg]      = useState(null);
  const [pastelFavorito,  setPastelFavorito]  = useState(currentUser?.pastelFavorito ?? '');
  const [cakeMsg,         setCakeMsg]         = useState(null);
  const [whatsappPhone,   setWhatsappPhone]   = useState(currentUser?.whatsappPhone ?? '');
  const [whatsappApiKey,  setWhatsappApiKey]  = useState(currentUser?.whatsappApiKey ?? '');
  const [whatsappMsg,     setWhatsappMsg]     = useState(null);

  // Sincronizar username si currentUser cambia (p.ej. tras actualizar perfil)
  useEffect(() => {
    if (currentUser) setUsername(currentUser.username);
  }, [currentUser?.username]);

  useEffect(() => {
    if (currentUser) setPastelFavorito(currentUser.pastelFavorito ?? '');
  }, [currentUser?.pastelFavorito]);

  useEffect(() => {
    if (currentUser) {
      setWhatsappPhone(currentUser.whatsappPhone ?? '');
      setWhatsappApiKey(currentUser.whatsappApiKey ?? '');
    }
  }, [currentUser?.whatsappPhone, currentUser?.whatsappApiKey]);

  if (!currentUser) return null;

  const handleProfileSave = async () => {
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

    const result = await updateProfile(currentUser.id, {
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

  const handleSaveCake = async () => {
    setCakeMsg(null);
    const trimmed = pastelFavorito.trim();
    const result = await updateFavoriteCake(currentUser.id, trimmed);
    setCakeMsg(
      result.success
        ? { type: 'success', text: trimmed ? 'Pastel favorito guardado correctamente' : 'Pastel favorito eliminado' }
        : { type: 'error', text: result.error }
    );
  };

  const handleSaveWhatsApp = async () => {
    setWhatsappMsg(null);
    const result = await updateAdminWhatsApp(
      currentUser.id, whatsappPhone.trim(), whatsappApiKey.trim()
    );
    setWhatsappMsg(
      result.success
        ? { type: 'success', text: 'Datos de WhatsApp guardados correctamente' }
        : { type: 'error', text: result.error }
    );
  };

  const TAB_STYLES = (active) =>
    `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-orange-500 text-orange-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="max-w-6xl mx-auto p-4 fade-in">
      <h1 className="text-xl font-bold text-gray-900 mb-5">Mi Perfil</h1>

      {/* ── Layout de dos columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── COLUMNA IZQUIERDA: Datos de la cuenta ── */}
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

          {/* Pastel favorito */}
          <div className="pt-3 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              🍰 Pastel favorito
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                className="input-field flex-1 min-w-[10rem]"
                placeholder="Ej. Chocolate"
                value={pastelFavorito}
                onChange={(e) => setPastelFavorito(e.target.value)}
              />
              <button onClick={handleSaveCake} className="btn-secondary text-sm">
                Guardar
              </button>
            </div>
            {cakeMsg && (
              <p className={`text-xs mt-2 ${
                cakeMsg.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {cakeMsg.type === 'success' ? '✅ ' : '⚠️ '}{cakeMsg.text}
              </p>
            )}
          </div>

          {/* WhatsApp para notificaciones de recuperación de contraseña (solo admin) */}
          {currentUser.role === 'admin' && (
            <div className="pt-3 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                📱 WhatsApp para recuperación de contraseñas
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Cuando un usuario pida recuperar su contraseña, te llega el código por
                WhatsApp (vía <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/"
                target="_blank" rel="noreferrer" className="underline">CallMeBot</a>, un
                servicio gratuito de terceros):
                {' '}1. Agrega <strong>+34 644 51 95 23</strong> a tus contactos de WhatsApp.
                {' '}2. Envíale el mensaje <em>"I allow callmebot to send me messages"</em>.
                {' '}3. Pega aquí el número que respondió y la clave que te dio.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  className="input-field text-sm"
                  placeholder="Tu número con código de país, ej. 521234567890"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                />
                <input
                  type="text"
                  className="input-field text-sm font-mono"
                  placeholder="Clave que te dio CallMeBot"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                />
                <button onClick={handleSaveWhatsApp} className="btn-secondary text-sm w-full">
                  Guardar
                </button>
              </div>
              {whatsappMsg && (
                <p className={`text-xs mt-2 ${
                  whatsappMsg.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {whatsappMsg.type === 'success' ? '✅ ' : '⚠️ '}{whatsappMsg.text}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: Órdenes por defecto con pestañas ── */}
        <div className="card">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-800 mb-0.5">Órdenes por defecto</h2>
            <p className="text-xs text-gray-400">
              Configura lo que pides normalmente para agilizar tu pedido del día.
            </p>
          </div>

          {/* Pestañas */}
          <div className="flex border-b border-gray-200 mb-4 -mx-1">
            <button
              onClick={() => setDefaultTab('martes')}
              className={TAB_STYLES(defaultTab === 'martes')}
            >
              🌮 Martes
            </button>
            <button
              onClick={() => setDefaultTab('viernes')}
              className={TAB_STYLES(defaultTab === 'viernes')}
            >
              🧀 Viernes
            </button>
          </div>

          {/* Editor activo según pestaña */}
          {defaultTab === 'martes' ? (
            <DefaultOrderEditor
              key="martes"
              catalog={catalogs.tacos}
              day="martes"
              initialItems={currentUser.defaultOrders?.martes?.items}
              onSave={handleSaveDefault}
            />
          ) : (
            <DefaultOrderEditor
              key="viernes"
              catalog={catalogs.quesadillas}
              day="viernes"
              initialItems={currentUser.defaultOrders?.viernes?.items}
              onSave={handleSaveDefault}
            />
          )}
        </div>

      </div>
    </div>
  );
}
