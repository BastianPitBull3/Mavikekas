/**
 * TimeSimulator.jsx
 * Panel flotante de simulación de tiempo (exclusivo para Admin).
 * Permite cambiar el día y la hora virtuales para probar la lógica
 * de activación del servicio sin esperar el horario real.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getCurrentDay, getCurrentTime, getTodayString } from '../../utils/dateUtils';
import { clearBirthdayModalShown } from '../../utils/storage';

export default function TimeSimulator() {
  const {
    state, setSimulatedDay, setSimulatedTime, setSimulatedDate, resetSimulation,
    retriggerBirthdayModal,
  } = useApp();
  const { currentUser, appState } = state;

  // Solo visible para administradores
  if (!currentUser || currentUser.role !== 'admin') return null;

  const [collapsed, setCollapsed] = useState(true);

  const { simulatedDay, simulatedTime, simulatedDate } = appState;

  // Valores actuales efectivos (simulado o real)
  const effectiveDay  = getCurrentDay(simulatedDay);
  const effectiveTime = getCurrentTime(simulatedTime);

  const isSimulating = simulatedDay !== null || simulatedTime !== null || simulatedDate !== null;

  return (
    <div className="fixed bottom-4 right-4 z-50 slide-up">
      {/* Panel expandido */}
      {!collapsed && (
        <div className="bg-gray-900 text-white rounded-2xl shadow-2xl w-72 mb-2 overflow-hidden border border-gray-700">
          {/* Encabezado del panel */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>🧪</span>
              <span className="text-sm font-semibold">Simulador de Tiempo</span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Información del estado actual */}
            <div className="bg-gray-800 rounded-lg p-3 text-xs space-y-1">
              <p className="text-gray-400">Estado actual efectivo:</p>
              <p>
                <span className="text-gray-400">Día:</span>{' '}
                <span className="text-yellow-300 font-medium capitalize">{effectiveDay}</span>
                {simulatedDay && <span className="text-blue-400 ml-1">(simulado)</span>}
              </p>
              <p>
                <span className="text-gray-400">Hora:</span>{' '}
                <span className="text-yellow-300 font-medium">{effectiveTime}</span>
                {simulatedTime && <span className="text-blue-400 ml-1">(simulada)</span>}
              </p>
              <p>
                <span className="text-gray-400">Fecha:</span>{' '}
                <span className="text-yellow-300 font-medium">{simulatedDate || getTodayString()}</span>
                {simulatedDate && <span className="text-blue-400 ml-1">(simulada)</span>}
              </p>
            </div>

            {/* Selector de fecha (para probar cumpleaños) */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">
                Simular fecha (cumpleaños):
              </label>
              <input
                type="date"
                value={simulatedDate || ''}
                onChange={(e) => setSimulatedDate(e.target.value || null)}
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo afecta la felicitación de cumpleaños; el horario del servicio usa el día/hora simulados arriba.
              </p>
              <button
                onClick={() => {
                  clearBirthdayModalShown(currentUser.id);
                  retriggerBirthdayModal();
                }}
                className="w-full mt-2 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs
                           font-semibold rounded-lg transition-colors"
                title="Olvida que ya viste el modal hoy, para poder volver a probarlo"
              >
                🎂 Reprobar modal de cumpleaños
              </button>
            </div>

            {/* Selector de día */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">
                Simular día:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: null,      label: 'Real'    },
                  { value: 'martes',  label: 'Martes'  },
                  { value: 'viernes', label: 'Viernes' },
                  { value: 'otro',    label: 'Otro'    },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setSimulatedDay(opt.value)}
                    className={`
                      px-2 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${simulatedDay === opt.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de hora */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">
                Simular hora:
              </label>
              <input
                type="time"
                value={simulatedTime || ''}
                onChange={(e) => setSimulatedTime(e.target.value || null)}
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Atajos rápidos de hora */}
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium">
                Atajos de hora:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '11:59', time: '11:59' },
                  { label: '12:00', time: '12:00' },
                  { label: '12:30', time: '12:30' },
                  { label: '13:00', time: '13:00' },
                  { label: '13:45', time: '13:45' },
                  { label: '14:00', time: '14:00' },
                ].map((atajo) => (
                  <button
                    key={atajo.time}
                    onClick={() => setSimulatedTime(atajo.time)}
                    className={`
                      px-2 py-1 rounded text-xs font-mono transition-colors
                      ${simulatedTime === atajo.time
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                    `}
                  >
                    {atajo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón de reset */}
            {isSimulating && (
              <button
                onClick={resetSimulation}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                🔄 Usar tiempo real
              </button>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante para expandir/colapsar */}
      <div className="flex justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-semibold
            transition-all duration-200
            ${isSimulating
              ? 'bg-blue-500 hover:bg-blue-600 text-white ring-2 ring-blue-300'
              : 'bg-gray-800 hover:bg-gray-700 text-white'}
          `}
          title="Simulador de tiempo (solo admin)"
        >
          🧪
          <span className="hidden sm:inline">
            {isSimulating ? 'Simulando' : 'Simular tiempo'}
          </span>
          {isSimulating && (
            <span className="inline-flex h-2 w-2 rounded-full bg-yellow-300 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
}
