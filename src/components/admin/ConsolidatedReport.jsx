/**
 * ConsolidatedReport.jsx
 * Vista del consolidado del día para el Admin.
 * Muestra todas las órdenes en orden cronológico y permite copiar el
 * reporte formateado para WhatsApp al portapapeles.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getCurrentDay, formatTimestamp } from '../../utils/dateUtils';
import { generateDayReport, getOrderSummaryLines } from '../../utils/reportGenerator';

export default function ConsolidatedReport() {
  const { state, getTodayOrders } = useApp();
  const { appState }              = state;

  const [copied, setCopied] = useState(false);

  // Día efectivo (simulado o real)
  const day        = getCurrentDay(appState.simulatedDay);
  const isMartes   = day === 'martes';
  const todayOrders = getTodayOrders();

  /** Copia el reporte al portapapeles */
  const handleCopy = async () => {
    const report = generateDayReport(todayOrders, day);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para navegadores sin Clipboard API
      const el = document.createElement('textarea');
      el.value = report;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Totales globales por sabor
  const globalTotals = {};
  for (const order of todayOrders) {
    for (const item of order.items) {
      if (item.cantidad <= 0) continue;
      if (!globalTotals[item.sabor]) {
        globalTotals[item.sabor] = { cantidad: 0, conQueso: 0 };
      }
      globalTotals[item.sabor].cantidad  += item.cantidad;
      globalTotals[item.sabor].conQueso  += item.conQueso ?? 0;
    }
  }
  const totalItems = Object.values(globalTotals).reduce((acc, g) => acc + g.cantidad, 0);

  const reportText = generateDayReport(todayOrders, day);

  return (
    <div className="space-y-5">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">
            Consolidado del Día
          </h2>
          <p className="text-sm text-gray-500">
            {isMartes ? '🌮 Tacos — Martes' : day === 'viernes' ? '🧀 Quesadillas — Viernes' : '📅 Sin servicio hoy'}
            {' · '}
            {todayOrders.length} {todayOrders.length === 1 ? 'orden' : 'órdenes'}
            {totalItems > 0 && ` · ${totalItems} ${isMartes ? 'tacos' : 'quesadillas'} en total`}
          </p>
        </div>

        {todayOrders.length > 0 && (
          <button
            onClick={handleCopy}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
              transition-all duration-200
              ${copied
                ? 'bg-green-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'}
            `}
          >
            {copied ? '✅ ¡Copiado!' : '📋 Copiar reporte para WhatsApp'}
          </button>
        )}
      </div>

      {/* ── Resumen global por sabor ── */}
      {totalItems > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen global</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(globalTotals).map(([sabor, totals]) => (
              <div key={sabor} className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 truncate">{sabor}</p>
                <p className="text-xl font-bold text-orange-600 mt-0.5">{totals.cantidad}</p>
                {isMartes && totals.conQueso > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    🧀 {totals.conQueso} con queso
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Lista de órdenes por usuario ── */}
      {todayOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">Sin órdenes por el momento</p>
          <p className="text-sm mt-1">Las órdenes aparecerán aquí en tiempo real</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayOrders.map((order, idx) => {
            const lines   = getOrderSummaryLines(order, order.dia);
            const itemTotal = order.items.reduce((acc, it) => acc + it.cantidad, 0);

            return (
              <div key={order.id} className="card">
                {/* Encabezado de la orden */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Número de orden */}
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs
                                    font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {order.userNombre} {order.userApellido}
                      </p>
                      <p className="text-xs text-gray-400">
                        🕐 {formatTimestamp(order.timestamp)}
                      </p>
                    </div>
                  </div>
                  <span className="badge-active text-xs">
                    {itemTotal} {isMartes ? 'tacos' : 'quesadillas'}
                  </span>
                </div>

                {/* Items de la orden */}
                <div className="space-y-1 bg-gray-50 rounded-xl p-3">
                  {lines.map((line, i) => (
                    <p key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-orange-400">
                        {isMartes ? '🌮' : '🧀'}
                      </span>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Preview del reporte ── */}
      {todayOrders.length > 0 && (
        <div className="card border border-green-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📱</span> Preview del reporte (WhatsApp)
          </h3>
          <pre className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-gray-700
                          font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-64">
            {reportText}
          </pre>
          <button
            onClick={handleCopy}
            className={`mt-3 btn-primary w-full text-sm ${copied ? 'bg-green-500 hover:bg-green-600' : ''}`}
          >
            {copied ? '✅ ¡Reporte copiado!' : '📋 Copiar reporte al portapapeles'}
          </button>
        </div>
      )}
    </div>
  );
}
