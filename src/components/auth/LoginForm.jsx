/**
 * LoginForm.jsx
 * Pantalla de inicio de sesión. Valida credenciales contra localStorage.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function LoginForm() {
  const { login } = useApp();

  // Estado del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    // Simulamos un breve delay para dar sensación de procesamiento
    setTimeout(() => {
      const result = login(username.trim(), password);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
      {/* Tarjeta de login */}
      <div className="w-full max-w-sm fade-in">
        {/* Logo / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">🌮</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mavikekas</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de órdenes</p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-gray-800 text-center">
            Iniciar sesión
          </h2>

          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              autoComplete="username"
              className="input-field"
              placeholder="Tu nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {/* Botón mostrar/ocultar contraseña */}
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

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            className="btn-primary w-full py-2.5 text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>

          {/* Credenciales de prueba */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 text-center font-medium mb-2">
              Cuentas de prueba
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="font-semibold text-indigo-600">Admin</p>
                <p>admin / Admin2024!</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="font-semibold text-orange-600">Usuario</p>
                <p>mgonzalez / Temp1234!</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
