/**
 * OrderSummary.jsx
 * Modal de resumen detallado que se muestra después de enviar una orden.
 * Incluye botón "Modificar Orden" mientras el servicio esté activo.
 */
import React from 'react';
import { useApp } from '../../context/AppContext';
import { isServiceActive, formatTimestamp } from '../../utils/dateUtils';
import { getOrderSummaryLines } from '../../utils/reportGenerator';

export default function OrderSummary({ onModify }) {
  const { state, clearOrderSummary } = useApp();
  const { orderSummary, appState } = state;

  if (!orderSummary) return null;

  const serviceActive  = isServiceActive(appState);
  const summaryLines   = getOrderSummaryLines(orderSummary, orderSummary.dia);
  const isMartes       = orderSummary.dia === 'martes';

  // Total de tacos/quesadillas pedidos
  const totalItems = orderSummary.items.reduce((acc, it) => acc + it.cantidad, 0);

  return (
    /* Fondo oscuro del modal */
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      {/* Contenedor del modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md slide-up">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-t-2xl text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <h2 className="text-lg font-bold">¡Orden registrada!</h2>
              <p className="text-sm text-green-100">
                {isMartes ? '🌮 Tacos — Martes' : '🧀 Quesadillas — Viernes'}
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4">
          {/* Meta info */}
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              👤 {orderSummary.userNombre} {orderSummary.userApellido}
            </span>
            <span>🕐 {formatTimestamp(orderSummary.timestamp)}</span>
          </div>

          {/* Listado de items */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Detalle del pedido
            </p>
            {summaryLines.map((line, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-800">
                <span className="text-orange-400">{isMartes ? '🌮' : '🧀'}</span>
                {line}
              </div>
            ))}
            <div className="border-t border-gray-200 mt-3 pt-3 text-sm font-semibold text-gray-700 flex justify-between">
              <span>Total</span>
              <span>
                {totalItems} {isMartes ? (totalItems === 1 ? 'taco' : 'tacos') : (totalItems === 1 ? 'quesadilla' : 'quesadillas')}
              </span>
            </div>
          </div>

          {/* Indicador de estado del servicio */}
          {serviceActive ? (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              El servicio sigue activo — puedes modificar tu orden
            </p>
          ) : (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
              El servicio ya no está activo
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={clearOrderSummary}
            className="btn-secondary flex-1"
          >
            Cerrar
          </button>
          {serviceActive && (
            <button
              onClick={() => {
                clearOrderSummary();
                if (onModify) onModify();
              }}
              className="btn-primary flex-1"
            >
              ✏️ Modificar orden
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
