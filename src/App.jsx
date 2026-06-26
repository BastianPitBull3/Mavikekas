/**
 * App.jsx
 * Componente raíz de la aplicación.
 * Despacha la vista correcta basándose en el estado de sesión y la navegación.
 */
import React from 'react';
import { useApp }         from './context/AppContext';
import LoginForm          from './components/auth/LoginForm';
import Header             from './components/shared/Header';
import TimeSimulator      from './components/shared/TimeSimulator';
import AdminDashboard     from './components/admin/AdminDashboard';
import OrderForm          from './components/orders/OrderForm';
import UserProfile        from './components/profile/UserProfile';

export default function App() {
  const { state } = useApp();
  const { currentUser, currentView } = state;

  // ── Sin sesión: mostrar pantalla de login ──
  if (!currentUser) {
    return <LoginForm />;
  }

  // ── Con sesión: estructura principal con header y vista activa ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de navegación superior */}
      <Header />

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto">
        {currentView === 'admin'   && <AdminDashboard />}
        {currentView === 'orders'  && <OrderForm />}
        {currentView === 'profile' && <UserProfile />}
      </main>

      {/* Panel flotante de simulación de tiempo (solo visible para admins) */}
      <TimeSimulator />
    </div>
  );
}
