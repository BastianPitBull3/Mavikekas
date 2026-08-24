/**
 * CompleteProfileModal.jsx
 * Modal que invita a completar cumpleaños y/o pastel favorito justo
 * después de enviar un pedido, si al usuario le falta alguno de los dos.
 * Es la única otra vía (junto con que el admin lo capture al crear la
 * cuenta) para fijar el cumpleaños, ya que se quitó de Mi Perfil.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import BirthdayPicker, { buildBirthdayDate } from '../shared/BirthdayPicker';

export default function CompleteProfileModal({ onClose }) {
  const { state, updateBirthday, updateFavoriteCake } = useApp();
  const { currentUser } = state;

  const needsBirthday = !currentUser?.cumpleanos;
  const needsCake      = !currentUser?.pastelFavorito;

  const [bdayDay,   setBdayDay]   = useState('');
  const [bdayMonth, setBdayMonth] = useState('');
  const [cake,      setCake]      = useState('');
  const [saving,    setSaving]    = useState(false);

  if (!currentUser || (!needsBirthday && !needsCake)) return null;

  const canSave = (needsBirthday && bdayDay && bdayMonth) || (needsCake && cake.trim());

  const handleSave = async () => {
    setSaving(true);
    if (needsBirthday && bdayDay && bdayMonth) {
      await updateBirthday(currentUser.id, buildBirthdayDate(bdayDay, bdayMonth));
    }
    if (needsCake && cake.trim()) {
      await updateFavoriteCake(currentUser.id, cake.trim());
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden slide-up">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-6 text-white text-center">
          <p className="text-3xl mb-1">🎉</p>
          <h2 className="text-lg font-bold">¡Ayúdanos a conocerte mejor!</h2>
          <p className="text-sm text-white/90 mt-1">
            Así podemos celebrar tu cumpleaños como se debe.
          </p>
        </div>

        {/* Formulario */}
        <div className="p-6 space-y-4">
          {needsBirthday && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                🎂 Tu cumpleaños (día y mes)
              </label>
              <BirthdayPicker
                day={bdayDay}
                month={bdayMonth}
                onChange={({ day, month }) => { setBdayDay(day); setBdayMonth(month); }}
              />
            </div>
          )}

          {needsCake && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                🍰 Tu pastel favorito
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Ej. Chocolate"
                value={cake}
                onChange={(e) => setCake(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">
              Ahora no
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : '💾 Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
