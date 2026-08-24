/**
 * OrderForm.jsx
 * Vista principal de levantamiento de órdenes para el usuario.
 *
 * Flujo:
 * 1. Si el servicio NO está activo → muestra mensaje informativo.
 * 2. Si el servicio está activo y hay una orden del día → muestra resumen
 *    con opción de modificar.
 * 3. Si no hay orden y hay una orden por defecto → ofrece "Enviar por defecto"
 *    o "Configurar manualmente".
 * 4. Si no hay orden y no hay defecto → va directo al formulario.
 * 5. Al enviar → muestra OrderSummary (modal).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  isServiceActive,
  getCurrentDay,
  getMenuTypeForDay,
  formatTimestamp,
} from '../../utils/dateUtils';
import { getOrderSummaryLines } from '../../utils/reportGenerator';
import OrderSummary from './OrderSummary';
import CompleteProfileModal from './CompleteProfileModal';
import BirthdaysWidget from '../birthdays/BirthdaysWidget';
import TodayBirthdayCard from '../birthdays/TodayBirthdayCard';

// ============================================================
// SUB-COMPONENTE: Mensaje de servicio inactivo
// ============================================================
function ServiceInactiveMessage({ appState }) {
  const day = getCurrentDay(appState.simulatedDay);
  return (
    <div className="max-w-lg mx-auto text-center py-16 fade-in">
      <div className="text-6xl mb-4">🚫</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Servicio no disponible
      </h2>
      <p className="text-gray-500 mb-6 text-sm leading-relaxed">
        El servicio de pedidos únicamente está disponible los días
        <strong className="text-gray-700"> Martes y Viernes</strong> en el horario
        de <strong className="text-gray-700">12:00 PM a 1:45 PM</strong>.
      </p>
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 inline-block text-left space-y-2">
        <div className="flex items-center gap-3 text-sm">
          <span>📅</span>
          <span>
            <span className="font-medium text-orange-700">Martes:</span>{' '}
            Tacos — 12:00 PM a 1:45 PM
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>📅</span>
          <span>
            <span className="font-medium text-orange-700">Viernes:</span>{' '}
            Quesadillas — 12:00 PM a 1:45 PM
          </span>
        </div>
      </div>
      {day === 'otro' && (
        <p className="text-xs text-gray-400 mt-4">
          Hoy es {new Date().toLocaleDateString('es-MX', { weekday: 'long' })}, no hay servicio.
        </p>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTE: Resumen de orden existente
// ============================================================
function ExistingOrderDisplay({ order, day, onModify, onDelete, serviceActive }) {
  const lines = getOrderSummaryLines(order, day);
  const isMartes = day === 'martes';
  const total = order.items.reduce((acc, it) => acc + it.cantidad, 0);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting,         setDeleting]         = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  return (
    <div className="max-w-lg mx-auto fade-in">
      <div className="card">
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">
            ✅
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tu pedido del día</h3>
            <p className="text-xs text-gray-500">
              Registrado a las {formatTimestamp(order.timestamp)}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-800">
              <span>{isMartes ? '🌮' : '🧀'}</span>
              {line}
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 mt-2 text-sm font-semibold text-gray-700 flex justify-between">
            <span>Total</span>
            <span>{total} {isMartes ? 'tacos' : 'quesadillas'}</span>
          </div>
        </div>

        {/* Acciones de modificar / eliminar */}
        {serviceActive ? (
          confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 flex-1">¿Eliminar tu pedido?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger text-sm px-3 py-1.5 disabled:opacity-60"
              >
                {deleting ? '…' : 'Sí, eliminar'}
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onModify} className="btn-primary flex-1">
                ✏️ Modificar mi orden
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="btn-danger px-3"
                title="Eliminar mi orden"
              >
                🗑
              </button>
            </div>
          )
        ) : (
          <p className="text-xs text-center text-gray-400">
            El servicio ha cerrado. Tu orden quedó registrada.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTE: Opciones de inicio (cuando hay orden por defecto)
// ============================================================
function OrderOptions({ defaultOrder, day, onSendDefault, onManual }) {
  const isMartes = day === 'martes';
  const lines = getOrderSummaryLines({ items: defaultOrder.items }, day);
  const total = defaultOrder.items.reduce((acc, it) => acc + it.cantidad, 0);

  return (
    <div className="max-w-lg mx-auto fade-in space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold text-gray-900">
          ¿Cómo quieres ordenar hoy?
        </h2>
        <p className="text-sm text-gray-500">
          {isMartes ? '🌮 Día de Tacos' : '🧀 Día de Quesadillas'}
        </p>
      </div>

      {/* Opción 1: Orden por defecto */}
      <div className="card border-2 border-orange-200">
        <h3 className="font-semibold text-gray-800 mb-1">Tu orden por defecto</h3>
        <div className="bg-orange-50 rounded-lg p-3 space-y-1 mb-3">
          {lines.length > 0 ? (
            lines.map((line, i) => (
              <p key={i} className="text-sm text-orange-800 flex items-center gap-2">
                <span>{isMartes ? '🌮' : '🧀'}</span> {line}
              </p>
            ))
          ) : (
            <p className="text-sm text-gray-400">Sin items configurados</p>
          )}
          <p className="text-xs text-orange-600 font-medium mt-1">
            Total: {total} {isMartes ? 'tacos' : 'quesadillas'}
          </p>
        </div>
        <button onClick={onSendDefault} className="btn-primary w-full">
          ⚡ Enviar orden por defecto
        </button>
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">o</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Opción 2: Configurar manualmente */}
      <button onClick={onManual} className="btn-secondary w-full py-3">
        ✏️ Configurar orden manual
      </button>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTE: Formulario de orden
// ============================================================
function ManualOrderForm({ catalog, day, initialItems, onSubmit, onBack }) {
  const isMartes = day === 'martes';

  // Inicializar items del formulario desde el catálogo activo
  const buildItems = useCallback(() =>
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
      }),
    [catalog, initialItems]
  );

  const [items,         setItems]         = useState(buildItems);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [error,         setError]         = useState('');

  // Re-sincronizar si cambia el catálogo
  useEffect(() => { setItems(buildItems()); }, [buildItems]);

  /** Actualiza la cantidad de un sabor específico */
  const setCantidad = (sabor, value) => {
    const cantidad = Math.max(0, parseInt(value) || 0);
    setItems((prev) =>
      prev.map((it) =>
        it.sabor === sabor
          ? { ...it, cantidad, conQueso: Math.min(it.conQueso, cantidad) }
          : it
      )
    );
  };

  /** Actualiza cuántos van con queso de un sabor (solo martes) */
  const setConQueso = (sabor, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.sabor !== sabor) return it;
        const max     = it.cantidad;
        const conQ    = Math.max(0, Math.min(parseInt(value) || 0, max));
        return { ...it, conQueso: conQ };
      })
    );
  };

  /** Botón global: poner todos los que admiten queso al máximo */
  const selectAllWithCheese = () => {
    setItems((prev) =>
      prev.map((it) => it.admiteQueso ? { ...it, conQueso: it.cantidad } : it)
    );
  };

  const totalItems = items.reduce((acc, it) => acc + it.cantidad, 0);

  const handleSubmit = () => {
    if (totalItems === 0) {
      setError('Agrega al menos un item a tu orden');
      return;
    }
    setError('');
    onSubmit(items, saveAsDefault);
  };

  const activeItems = items.filter((it) => catalog.find((c) => c.nombre === it.sabor && c.activo));

  return (
    <div className="max-w-lg mx-auto fade-in">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-4">
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Volver
          </button>
        )}
        <div>
          <h2 className="font-semibold text-gray-900">
            {isMartes ? '🌮 Configura tus tacos' : '🧀 Configura tus quesadillas'}
          </h2>
          <p className="text-xs text-gray-500">Selecciona cantidades para cada sabor</p>
        </div>
      </div>

      {/* Botón global "Seleccionar todos con queso" (solo martes) */}
      {isMartes && totalItems > 0 && (
        <div className="mb-3">
          <button
            onClick={selectAllWithCheese}
            className="w-full py-2 px-4 bg-amber-50 border border-amber-200 text-amber-700
                       text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
          >
            🧀 Seleccionar todos con queso
          </button>
        </div>
      )}

      {/* Lista de items del catálogo */}
      <div className="card space-y-3">
        {activeItems.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">
            No hay sabores disponibles en el catálogo
          </p>
        ) : (
          activeItems.map((item) => (
            <div key={item.sabor} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between gap-3">
                {/* Nombre del sabor */}
                <span className="text-sm font-medium text-gray-800 flex-1">
                  {isMartes ? '🌮' : '🧀'} {item.sabor}
                </span>

                {/* Input de cantidad */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCantidad(item.sabor, item.cantidad - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600
                               flex items-center justify-center text-sm font-bold transition-colors"
                    disabled={item.cantidad === 0}
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
                               flex items-center justify-center text-sm font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Sub-fila de "con queso" (solo martes, con cantidad y si el sabor admite queso) */}
              {isMartes && item.cantidad > 0 && item.admiteQueso && (
                <div className="mt-2 ml-1 flex items-center gap-2 text-xs text-amber-700">
                  <span>🧀 Con queso:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConQueso(item.sabor, item.conQueso - 1)}
                      className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 flex items-center
                                 justify-center text-xs font-bold transition-colors"
                      disabled={item.conQueso === 0}
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
                                 rounded-md py-0.5 bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-300"
                    />
                    <button
                      type="button"
                      onClick={() => setConQueso(item.sabor, item.conQueso + 1)}
                      className="w-5 h-5 rounded bg-amber-100 hover:bg-amber-200 flex items-center
                                 justify-center text-xs font-bold transition-colors"
                      disabled={item.conQueso >= item.cantidad}
                    >
                      +
                    </button>
                    <span className="text-amber-500 ml-1">/ {item.cantidad}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resumen rápido */}
      {totalItems > 0 && (
        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm text-orange-700 font-medium flex justify-between">
          <span>Total:</span>
          <span>{totalItems} {isMartes ? 'tacos' : 'quesadillas'}</span>
        </div>
      )}

      {/* Checkbox: guardar como predeterminada */}
      <label className="mt-4 flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={saveAsDefault}
          onChange={(e) => setSaveAsDefault(e.target.checked)}
          className="w-4 h-4 accent-orange-500 rounded"
        />
        <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
          Guardar como mi orden por defecto
        </span>
      </label>

      {/* Error */}
      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          ⚠️ {error}
        </p>
      )}

      {/* Botón de envío */}
      <button
        onClick={handleSubmit}
        className="btn-primary w-full mt-4 py-3 text-base"
        disabled={totalItems === 0}
      >
        📤 Enviar mi orden
      </button>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function OrderForm() {
  const { state, getTodayOrder, submitOrder, deleteOrder } = useApp();
  const { currentUser, catalogs, appState, orderSummary } = state;

  // Vista interna: 'decide' | 'form'
  const [innerView, setInnerView] = useState('decide');

  // Se activa tras enviar un pedido si al usuario le falta cumpleaños o
  // pastel favorito; se muestra hasta que se cierre el resumen del pedido
  // para no encimar dos modales a la vez.
  const [pendingCompleteProfile, setPendingCompleteProfile] = useState(false);

  const serviceActive = isServiceActive(appState);
  const day           = getCurrentDay(appState.simulatedDay);
  const menuType      = getMenuTypeForDay(day);
  const catalog       = menuType ? catalogs[menuType] : [];

  const existingOrder  = currentUser ? getTodayOrder(currentUser.id) : null;
  const defaultOrder   = currentUser?.defaultOrders?.[day];
  const hasDefault     = defaultOrder && defaultOrder.items && defaultOrder.items.length > 0;

  // Cuando el servicio se desactiva, resetear a la vista de decisión
  useEffect(() => {
    if (!serviceActive) setInnerView('decide');
  }, [serviceActive]);

  // Al enviar la orden (manual o por defecto)
  const handleSubmit = async (items, saveAsDefault = false) => {
    const result = await submitOrder(items, day, saveAsDefault);
    if (result.success) {
      setInnerView('decide');
      if (!currentUser?.cumpleanos || !currentUser?.pastelFavorito) {
        setPendingCompleteProfile(true);
      }
    }
  };

  // Enviar la orden por defecto directamente
  const handleSendDefault = () => {
    if (!hasDefault) return;
    handleSubmit(defaultOrder.items, false);
  };

  // Eliminar el pedido del día
  const handleDeleteOrder = async () => {
    if (!existingOrder) return;
    await deleteOrder(existingOrder.id);
  };

  // ---- Contenido según el estado del servicio y la vista ----
  let content;

  if (!serviceActive) {
    // El servicio está inactivo
    content = <ServiceInactiveMessage appState={appState} />;
  } else if (existingOrder && innerView === 'decide') {
    // El usuario ya tiene una orden hoy y no está en modo formulario
    content = (
      <>
        <ExistingOrderDisplay
          order={existingOrder}
          day={day}
          serviceActive={serviceActive}
          onModify={() => setInnerView('form')}
          onDelete={handleDeleteOrder}
        />
        {orderSummary && <OrderSummary onModify={() => setInnerView('form')} />}
      </>
    );
  } else if (innerView === 'form') {
    // Modo formulario (nuevo o modificación)
    content = (
      <>
        <ManualOrderForm
          catalog={catalog}
          day={day}
          initialItems={existingOrder?.items || null}
          onSubmit={handleSubmit}
          onBack={() => setInnerView('decide')}
        />
        {orderSummary && <OrderSummary onModify={() => setInnerView('form')} />}
      </>
    );
  } else if (hasDefault) {
    // Sin orden existente: mostrar opciones
    content = (
      <>
        <OrderOptions
          defaultOrder={defaultOrder}
          day={day}
          onSendDefault={handleSendDefault}
          onManual={() => setInnerView('form')}
        />
        {orderSummary && <OrderSummary onModify={() => setInnerView('form')} />}
      </>
    );
  } else {
    // Sin orden y sin defecto → directo al formulario
    content = (
      <>
        <ManualOrderForm
          catalog={catalog}
          day={day}
          initialItems={null}
          onSubmit={handleSubmit}
          onBack={null}
        />
        {orderSummary && <OrderSummary onModify={() => setInnerView('form')} />}
      </>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-lg mx-auto">
        <TodayBirthdayCard />
      </div>
      {content}
      <div className="max-w-lg mx-auto mt-6">
        <BirthdaysWidget />
      </div>
      {!orderSummary && pendingCompleteProfile && (
        <CompleteProfileModal onClose={() => setPendingCompleteProfile(false)} />
      )}
    </div>
  );
}
