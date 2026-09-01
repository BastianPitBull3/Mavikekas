/**
 * LoginForm.jsx
 * Pantalla de inicio de sesión. Valida credenciales contra Firestore.
 * También permite auto-registro con un código de invitación generado
 * por un admin (ver RegisterForm), y recuperación de contraseña vía
 * notificación de WhatsApp a los admins (ver ForgotPasswordForm).
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import BirthdayPicker, { buildBirthdayDate } from '../shared/BirthdayPicker';

// ============================================================
// SUB-COMPONENTE: Formulario de auto-registro con código de invitación
// ============================================================
function RegisterForm({ onBack }) {
  const { registerUser } = useApp();

  const [form, setForm] = useState({
    nombre: '', apellido: '', username: '', password: '', confirmPassword: '',
    inviteCode: '', bdayDay: '', bdayMonth: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim() || !form.apellido.trim() || !form.username.trim() ||
        !form.password || !form.inviteCode.trim()) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      const result = await registerUser({
        nombre:     form.nombre,
        apellido:   form.apellido,
        username:   form.username,
        password:   form.password,
        inviteCode: form.inviteCode,
        cumpleanos: buildBirthdayDate(form.bdayDay, form.bdayMonth),
      });
      if (!result.success) {
        setError(result.error);
        setLoading(false);
      }
      // Si tuvo éxito, registerUser ya inició la sesión — App.jsx redirige solo.
    }, 300);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-4"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Volver
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Crear cuenta</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
          <input
            type="text" className="input-field text-sm" placeholder="Ej. Juan"
            value={form.nombre} onChange={set('nombre')} disabled={loading}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Apellido *</label>
          <input
            type="text" className="input-field text-sm" placeholder="Ej. García"
            value={form.apellido} onChange={set('apellido')} disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Usuario *</label>
        <input
          type="text" autoComplete="username" className="input-field text-sm"
          placeholder="Ej. jgarcia" value={form.username} onChange={set('username')}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña *</label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'} autoComplete="new-password"
            className="input-field text-sm pr-10" placeholder="Mínimo 6 caracteres"
            value={form.password} onChange={set('password')} disabled={loading}
          />
          <button
            type="button" onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPwd ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña *</label>
        <input
          type={showPwd ? 'text' : 'password'} className="input-field text-sm"
          placeholder="••••••••" value={form.confirmPassword}
          onChange={set('confirmPassword')} disabled={loading}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          🎂 Cumpleaños (opcional)
        </label>
        <BirthdayPicker
          day={form.bdayDay} month={form.bdayMonth}
          onChange={({ day, month }) => setForm({ ...form, bdayDay: day, bdayMonth: month })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Código de invitación *
        </label>
        <input
          type="text" className="input-field text-sm font-mono tracking-wider uppercase"
          placeholder="Pídeselo a un admin" value={form.inviteCode}
          onChange={set('inviteCode')} disabled={loading}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full py-2.5 text-base" disabled={loading}>
        {loading ? (
          <>
            <span className="animate-spin">⏳</span> Creando cuenta…
          </>
        ) : (
          'Crear cuenta'
        )}
      </button>
    </form>
  );
}

// ============================================================
// SUB-COMPONENTE: Recuperación de contraseña (código vía WhatsApp)
// ============================================================
function ForgotPasswordForm({ onBack }) {
  const { requestPasswordReset, resetPasswordWithCode } = useApp();

  // 'request' → pide el código; 'reset' → ya tiene el código, cambia la contraseña
  const [step, setStep] = useState('request');

  const [username,        setUsername]        = useState('');
  const [code,             setCode]            = useState('');
  const [newPassword,      setNewPassword]     = useState('');
  const [confirmPassword,  setConfirmPassword] = useState('');
  const [showPwd,          setShowPwd]         = useState(false);

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('Escribe tu nombre de usuario');
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(username);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(
      'Se generó un código de recuperación. Pídeselo a un administrador ' +
      '(le llegó por WhatsApp) y captúralo abajo.'
    );
    setStep('reset');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !code.trim() || !newPassword) {
      setError('Completa todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const result = await resetPasswordWithCode(username, code, newPassword);

    if (!result.success) {
      setLoading(false);
      setError(result.error);
      return;
    }
    // Éxito: resetPasswordWithCode ya inició sesión — App.jsx redirige solo
    // al dashboard, no hace falta tocar más estado local aquí.
  };

  return (
    <form
      onSubmit={step === 'request' ? handleRequest : handleReset}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-4"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Volver
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Recuperar contraseña</h2>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nombre de usuario
        </label>
        <input
          type="text" autoComplete="username" className="input-field text-sm"
          placeholder="Tu usuario" value={username}
          onChange={(e) => setUsername(e.target.value)} disabled={loading}
        />
      </div>

      {step === 'reset' && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Código de recuperación
            </label>
            <input
              type="text" inputMode="numeric" className="input-field text-sm font-mono tracking-wider"
              placeholder="6 dígitos, te lo da un admin" value={code}
              onChange={(e) => setCode(e.target.value)} disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'} autoComplete="new-password"
                className="input-field text-sm pr-10" placeholder="Mínimo 6 caracteres"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading}
              />
              <button
                type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña</label>
            <input
              type={showPwd ? 'text' : 'password'} className="input-field text-sm"
              placeholder="••••••••" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading}
            />
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <span>✅</span>
          {success}
        </div>
      )}

      <button type="submit" className="btn-primary w-full py-2.5 text-base" disabled={loading}>
        {loading ? (
          <>
            <span className="animate-spin">⏳</span> {step === 'request' ? 'Enviando…' : 'Guardando…'}
          </>
        ) : step === 'request' ? (
          'Solicitar código'
        ) : (
          'Restablecer contraseña'
        )}
      </button>

      {step === 'reset' && (
        <button
          type="button"
          onClick={() => { setStep('request'); setError(''); setSuccess(''); }}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
        >
          ¿Necesitas pedir el código de nuevo?
        </button>
      )}
    </form>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function LoginForm() {
  const { login } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'

  // Estado del formulario de login
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
      <div className="w-full max-w-sm fade-in">
        {/* Logo / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">🌮</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mavikekas</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de órdenes</p>
        </div>

        {mode === 'register' ? (
          <RegisterForm onBack={() => setMode('login')} />
        ) : mode === 'forgot' ? (
          <ForgotPasswordForm onBack={() => setMode('login')} />
        ) : (
          <>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
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
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-orange-600 font-medium hover:text-orange-700"
              >
                Crear cuenta
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
