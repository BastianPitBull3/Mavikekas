/**
 * AdminDashboard.jsx
 * Panel central del administrador con navegación por pestañas.
 * Incluye: Inicio (overview + control del servicio), Usuarios, Catálogos,
 * Consolidado del Día.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isServiceActive, getCurrentDay, isServiceActiveBySchedule } from '../../utils/dateUtils';
import UserManagement    from './UserManagement';
import CatalogManagement from './CatalogManagement';
import ConsolidatedReport from './ConsolidatedReport';

// ============================================================
// SUB-COMPONENTE: Pestaña de inicio (overview + control de servicio)
// ============================================================
function OverviewTab() {
  const { state, setServiceEnabled, getTodayOrders } = useApp();
  const { appState, users, catalogs } = state;

  const day          = getCurrentDay(appState.simulatedDay);
  const scheduleOn   = isServiceActiveBySchedule(appState.simulatedDay, appState.simulatedTime);
  const serviceOn    = isServiceActive(appState);
  const todayOrders  = getTodayOrders();
  const totalTacos   = catalogs.tacos.filter((t) => t.activo).length;
  const totalQue     = catalogs.quesadillas.filter((q) => q.activo).length;
  const totalUsers   = users.length;

  return (
    <div className="space-y-5">
      {/* ── Control del Servicio ── */}
      <div className="card border-2 border-dashed border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>⚡</span> Control del Servicio
        </h3>

        {/* Estado actual */}
        <div className={`rounded-xl p-4 mb-4 flex items-center gap-3 ${
          serviceOn
            ? 'bg-green-50 border border-green-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            serviceOn ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
          }`} />
          <div>
            <p className={`font-semibold text-sm ${serviceOn ? 'text-green-700' : 'text-gray-600'}`}>
              Servicio {serviceOn ? 'ACTIVO' : 'INACTIVO'}
            </p>
            <p className="text-xs text-gray-500">
              {appState.serviceEnabled
                ? 'Activado manualmente (ignorando horario)'
                : scheduleOn
                  ? 'Activo por horario automático'
                  : `Inactivo — ${day === 'martes' || day === 'viernes' ? 'fuera de horario' : 'día sin servicio'}`}
            </p>
          </div>
        </div>

        {/* Switch manual */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">Activación manual (bypass)</p>
            <p className="text-xs text-gray-400">
              Ignora el horario y día para habilitar pedidos en cualquier momento
            </p>
          </div>
          <button
            onClick={() => setServiceEnabled(!appState.serviceEnabled)}
            className={`
              relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              ${appState.serviceEnabled ? 'bg-indigo-500' : 'bg-gray-300'}
            `}
          >
            <span
              className={`
                inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200
                ${appState.serviceEnabled ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Info del horario automático */}
        <div className="mt-3 text-xs text-gray-400 flex items-start gap-2">
          <span>ℹ️</span>
          <span>
            El servicio automático está disponible <strong>Martes y Viernes de 12:00 PM a 1:45 PM</strong>.
            El simulador de tiempo (🧪 flotante) te permite probar esta lógica.
          </span>
        </div>
      </div>

      {/* ── Estadísticas del día ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pedidos hoy',     value: todayOrders.length, color: 'indigo', emoji: '📦' },
          { label: 'Usuarios totales', value: totalUsers,         color: 'blue',   emoji: '👥' },
          { label: 'Sabores tacos',   value: totalTacos,          color: 'orange', emoji: '🌮' },
          { label: 'Sabores quesd.',  value: totalQue,            color: 'amber',  emoji: '🧀' },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <p className="text-2xl mb-1">{stat.emoji}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Últimas órdenes (mini-preview) ── */}
      {todayOrders.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Últimas órdenes del día</h3>
          <div className="space-y-2">
            {todayOrders.slice(-3).reverse().map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {order.userNombre} {order.userApellido}
                </span>
                <span className="badge-active">
                  {order.items.reduce((acc, it) => acc + it.cantidad, 0)}{' '}
                  {order.dia === 'martes' ? 'tacos' : 'quesadillas'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const TABS = [
  { id: 'overview',   label: '🏠 Inicio'       },
  { id: 'users',      label: '👥 Usuarios'      },
  { id: 'catalogs',   label: '📋 Catálogos'    },
  { id: 'report',     label: '📊 Consolidado'   },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* ── Pestañas de navegación ── */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Contenido de la pestaña activa ── */}
      <div className="fade-in">
        {activeTab === 'overview'  && <OverviewTab />}
        {activeTab === 'users'     && <UserManagement />}
        {activeTab === 'catalogs'  && <CatalogManagement />}
        {activeTab === 'report'    && <ConsolidatedReport />}
      </div>
    </div>
  );
}
