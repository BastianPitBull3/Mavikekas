/**
 * UserManagement.jsx
 * Panel de gestión de usuarios para el Admin.
 * Permite: crear usuarios, ver contraseñas temporales, cambiar roles y eliminar.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import BirthdayPicker, { buildBirthdayDate } from '../shared/BirthdayPicker';
import InviteCodesManager from './InviteCodesManager';

export default function UserManagement() {
  const { state, createUser, deleteUser, updateUserRole, clearPendingPassword } = useApp();
  const { users, currentUser, pendingNewUserPwd } = state;

  // Estado del formulario de creación
  const [form,    setForm]    = useState({
    nombre: '', apellido: '', username: '', role: 'user', bdayDay: '', bdayMonth: '',
  });
  const [formErr, setFormErr] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState(null); // userId a confirmar

  const handleCreate = () => {
    setFormErr('');
    const cumpleanos = buildBirthdayDate(form.bdayDay, form.bdayMonth);
    const result = createUser(form.nombre, form.apellido, form.username, form.role, cumpleanos);
    if (!result.success) {
      setFormErr(result.error);
      return;
    }
    setForm({ nombre: '', apellido: '', username: '', role: 'user', bdayDay: '', bdayMonth: '' });
    setShowForm(false);
  };

  const handleDelete = (userId) => {
    const result = deleteUser(userId);
    if (!result.success) alert(result.error);
    setDeleteConfirm(null);
  };

  const handleRoleToggle = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateUserRole(userId, newRole);
  };

  return (
    <div className="space-y-5">
      {/* ── Contraseña temporal de nuevo usuario ── */}
      {pendingNewUserPwd && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">
                🔑 Contraseña temporal generada
              </p>
              <p className="text-sm text-blue-700 mb-2">
                Comparte estas credenciales con el usuario{' '}
                <strong>@{pendingNewUserPwd.username}</strong>:
              </p>
              <div className="bg-white border border-blue-200 rounded-lg px-4 py-2 font-mono text-sm text-blue-900 select-all">
                {pendingNewUserPwd.password}
              </div>
              <p className="text-xs text-blue-500 mt-1">
                El usuario deberá cambiarla al ingresar por primera vez.
              </p>
            </div>
            <button
              onClick={clearPendingPassword}
              className="text-blue-400 hover:text-blue-600 flex-shrink-0 text-lg"
              title="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Encabezado + botón de nuevo usuario ── */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Usuarios registrados ({users.length})
        </h2>
        <button
          onClick={() => { setShowForm(!showForm); setFormErr(''); }}
          className="btn-admin text-sm"
        >
          {showForm ? '✕ Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {/* ── Formulario de creación ── */}
      {showForm && (
        <div className="card border border-indigo-100 fade-in">
          <h3 className="font-medium text-gray-800 mb-4">Registrar nuevo usuario</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="Ej. Juan"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Apellido *</label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="Ej. García"
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Usuario *</label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="Ej. jgarcia"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
              <select
                className="input-field text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                🎂 Cumpleaños (opcional)
              </label>
              <BirthdayPicker
                day={form.bdayDay}
                month={form.bdayMonth}
                onChange={({ day, month }) => setForm({ ...form, bdayDay: day, bdayMonth: month })}
              />
              <p className="text-xs text-gray-400 mt-1">
                Si lo dejas vacío, se le pedirá al usuario más adelante después de su primer pedido.
              </p>
            </div>
          </div>

          {formErr && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3">
              ⚠️ {formErr}
            </p>
          )}

          <button onClick={handleCreate} className="btn-admin">
            Registrar usuario
          </button>
        </div>
      )}

      {/* ── Lista de usuarios ── */}
      <div className="space-y-2">
        {users.map((user) => {
          const isSelf     = user.id === currentUser?.id;
          const isDeleting = deleteConfirm === user.id;

          return (
            <div
              key={user.id}
              className={`card flex items-center gap-4 ${isSelf ? 'border-orange-200 bg-orange-50' : ''}`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center
                              text-indigo-600 font-bold text-sm flex-shrink-0">
                {user.nombre.charAt(0).toUpperCase()}{user.apellido.charAt(0).toUpperCase()}
              </div>

              {/* Datos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm">
                    {user.nombre} {user.apellido}
                  </p>
                  <span className={user.role === 'admin' ? 'badge-admin' : 'badge-user'}>
                    {user.role === 'admin' ? '⭐ Admin' : '👤 Usuario'}
                  </span>
                  {!user.passwordChanged && (
                    <span className="badge-inactive">🔐 Sin cambiar pwd</span>
                  )}
                  {isSelf && (
                    <span className="text-xs text-orange-500 font-medium">(tú)</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>

              {/* Acciones */}
              {!isSelf && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Cambiar rol */}
                  {!isDeleting && (
                    <button
                      onClick={() => handleRoleToggle(user.id, user.role)}
                      className="btn-secondary text-xs px-2.5 py-1"
                      title={user.role === 'admin' ? 'Degradar a Usuario' : 'Promover a Admin'}
                    >
                      {user.role === 'admin' ? '↓ Usuario' : '↑ Admin'}
                    </button>
                  )}

                  {/* Eliminar */}
                  {isDeleting ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-red-600 font-medium">¿Confirmar?</span>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn-danger text-xs px-2.5 py-1"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="btn-secondary text-xs px-2.5 py-1"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="btn-danger text-xs px-2.5 py-1"
                    >
                      🗑
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Códigos de invitación para auto-registro ── */}
      <InviteCodesManager />
    </div>
  );
}
