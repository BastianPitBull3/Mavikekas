/**
 * App.jsx
 * Componente raíz. Gestiona las pantallas de carga, error de configuración
 * y el enrutamiento basado en el estado de sesión.
 */
import React from 'react';
import { useApp }         from './context/AppContext';
import LoginForm          from './components/auth/LoginForm';
import Header             from './components/shared/Header';
import TimeSimulator      from './components/shared/TimeSimulator';
import AdminDashboard     from './components/admin/AdminDashboard';
import OrderForm          from './components/orders/OrderForm';
import UserProfile        from './components/profile/UserProfile';

// ── Pantalla de carga mientras Firestore inicializa ──
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50
                    flex flex-col items-center justify-center gap-4">
      <div className="text-5xl animate-bounce">🌮</div>
      <p className="text-lg font-semibold text-gray-700">Cargando Mavikekas…</p>
      <p className="text-sm text-gray-400">Conectando con la base de datos</p>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-400"
            style={{ animation: `bounce 0.8s ${i * 0.15}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Pantalla de error de configuración (Firebase no configurado) ──
function ConfigErrorScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-amber-200 max-w-lg w-full p-8">
        <div className="text-4xl mb-4 text-center">⚙️</div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
          Firebase no configurado
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Necesitas agregar las credenciales de tu proyecto de Firebase
          para que la aplicación funcione.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-mono text-gray-700 space-y-1 mb-6">
          <p className="font-semibold text-amber-700 mb-2">📄 src/firebase.js</p>
          <p>apiKey: <span className="text-red-500">"TU_API_KEY"</span></p>
          <p>authDomain: <span className="text-red-500">"tu-proyecto.firebaseapp.com"</span></p>
          <p>projectId: <span className="text-red-500">"tu-proyecto-id"</span></p>
          <p className="text-gray-400">…</p>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <p>1. Ve a <strong>console.firebase.google.com</strong></p>
          <p>2. Selecciona tu proyecto → ⚙️ → General → "Tus apps"</p>
          <p>3. Copia el objeto <code className="bg-gray-100 px-1 rounded">firebaseConfig</code></p>
          <p>4. Pégalo en <code className="bg-gray-100 px-1 rounded">src/firebase.js</code></p>
          <p>5. Reinicia el servidor (<code className="bg-gray-100 px-1 rounded">npm run dev</code>)</p>
        </div>
      </div>
    </div>
  );
}

// ── Pantalla de error de conexión a Firestore ──
function DbErrorScreen({ error }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-red-200 max-w-md w-full p-8 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Error de conexión</h1>
        <p className="text-sm text-gray-500 mb-4">
          No se pudo conectar con Firestore. Verifica que:
        </p>
        <ul className="text-sm text-gray-600 text-left space-y-1 mb-4">
          <li>• El <strong>Project ID</strong> en <code>src/firebase.js</code> es correcto</li>
          <li>• Firestore está habilitado en tu proyecto de Firebase</li>
          <li>• Las reglas de seguridad permiten lectura y escritura</li>
        </ul>
        <p className="text-xs text-red-400 bg-red-50 rounded-lg px-3 py-2 font-mono">
          {error}
        </p>
      </div>
    </div>
  );
}

// ── Componente principal ──
export default function App() {
  const { state, loading, dbError, configFilled } = useApp();
  const { currentUser, currentView } = state;

  // Firebase no configurado
  if (!configFilled) return <ConfigErrorScreen />;

  // Error de conexión con Firestore
  if (dbError) return <DbErrorScreen error={dbError} />;

  // Cargando datos iniciales
  if (loading) return <LoadingScreen />;

  // Sin sesión: mostrar login
  if (!currentUser) return <LoginForm />;

  // Con sesión: layout principal
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto">
        {currentView === 'admin'   && <AdminDashboard />}
        {currentView === 'orders'  && <OrderForm />}
        {currentView === 'profile' && <UserProfile />}
      </main>
      <TimeSimulator />
    </div>
  );
}
