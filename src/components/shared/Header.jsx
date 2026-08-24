/**
 * Header.jsx
 * Barra de navegación superior. Muestra nombre de la app, navegación
 * contextual según el rol, y botón de cierre de sesión.
 */
import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Header() {
  const { state, logout, setView } = useApp();
  const { currentUser, currentView } = state;

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Opciones de navegación según el rol
  const navItems = isAdmin
    ? [
        { id: 'admin',   label: '📊 Panel Admin' },
        { id: 'orders',  label: '🌮 Mi Pedido'   },
        { id: 'profile', label: '👤 Mi Perfil'   },
      ]
    : [
        { id: 'orders',  label: '🌮 Mi Pedido'  },
        { id: 'profile', label: '👤 Mi Perfil'  },
      ];

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Marca */}
          <button
            onClick={() => setView(isAdmin ? 'admin' : 'orders')}
            className="flex items-center gap-2 font-bold text-gray-900 hover:text-orange-500 transition-colors"
          >
            <span className="text-xl">🌮</span>
            <span className="hidden sm:inline">Mavikekas</span>
            <span className="hidden sm:inline text-xs font-normal text-gray-400 tracking-wide">v2.0</span>
          </button>

          {/* Navegación central */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${currentView === item.id
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Usuario + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {currentUser.nombre} {currentUser.apellido}
              </p>
              <p className="text-xs text-gray-400">
                {isAdmin ? '⭐ Admin' : '👤 Usuario'}
              </p>
            </div>
            <button
              onClick={logout}
              className="btn-secondary text-xs px-3 py-1.5"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
