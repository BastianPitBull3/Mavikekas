/**
 * BirthdaysWidget.jsx
 * Card con la lista de cumpleaños de todos los usuarios, ordenada por
 * proximidad, junto con su pastel favorito. Se embebe en las pantallas
 * de inicio (Panel Admin y Mi Pedido).
 *
 * La felicitación de "hoy" vive en su propia card (TodayBirthdayCard),
 * que se muestra por separado. Aquí solo se marca con una corona al
 * cumpleañero del día dentro de la lista.
 *
 * El cumpleaños ya no se edita desde Mi Perfil — este es el único lugar
 * (junto con el modal post-pedido) donde el propio usuario puede
 * agregarlo o corregirlo, siempre como día/mes (sin año).
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBirthday, sortByUpcomingBirthday, isBirthdayToday } from '../../utils/dateUtils';
import BirthdayPicker, { buildBirthdayDate, parseBirthdayDate } from '../shared/BirthdayPicker';

export default function BirthdaysWidget() {
  const { state, updateBirthday, updateFavoriteCake } = useApp();
  const { users, currentUser, appState } = state;
  const simulatedDate = appState.simulatedDate || null;

  const [editingBirthday, setEditingBirthday] = useState(false);
  const [bdayDay,    setBdayDay]    = useState('');
  const [bdayMonth,  setBdayMonth]  = useState('');
  const [savingDate, setSavingDate] = useState(false);

  const [newCake,    setNewCake]    = useState('');
  const [savingCake, setSavingCake] = useState(false);

  if (!currentUser) return null;

  const sorted = sortByUpcomingBirthday(users, simulatedDate);

  const startEditBirthday = () => {
    const { day, month } = parseBirthdayDate(currentUser.cumpleanos);
    setBdayDay(day);
    setBdayMonth(month);
    setEditingBirthday(true);
  };

  const handleSaveBirthday = async () => {
    const date = buildBirthdayDate(bdayDay, bdayMonth);
    if (!date) return;
    setSavingDate(true);
    await updateBirthday(currentUser.id, date);
    setSavingDate(false);
    setEditingBirthday(false);
  };

  const handleAddCake = async () => {
    if (!newCake.trim()) return;
    setSavingCake(true);
    await updateFavoriteCake(currentUser.id, newCake.trim());
    setSavingCake(false);
    setNewCake('');
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>🎂</span> Cumpleaños
        {simulatedDate && (
          <span className="text-xs font-normal text-blue-500">
            (fecha simulada: {simulatedDate})
          </span>
        )}
      </h3>

      <div className="divide-y divide-gray-100">
        {sorted.map((user) => {
          const isSelf     = user.id === currentUser.id;
          const wearsCrown = isBirthdayToday(user.cumpleanos, simulatedDate);

          return (
            <div key={user.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center
                                  text-pink-600 font-bold text-xs">
                    {user.nombre.charAt(0).toUpperCase()}{user.apellido.charAt(0).toUpperCase()}
                  </div>
                  {wearsCrown && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm leading-none"
                      title="¡De cumpleaños!"
                    >
                      👑
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.nombre} {user.apellido}{' '}
                    {isSelf && <span className="text-xs text-orange-500 font-normal">(tú)</span>}
                  </p>
                  {user.cumpleanos ? (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      🎉 {formatBirthday(user.cumpleanos)}
                      {isSelf && !editingBirthday && (
                        <button
                          onClick={startEditBirthday}
                          className="text-gray-400 hover:text-orange-500"
                          title="Editar cumpleaños"
                        >
                          ✏️
                        </button>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sin fecha configurada</p>
                  )}
                  {user.pastelFavorito ? (
                    <p className="text-xs text-gray-500">🍰 {user.pastelFavorito}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Sin pastel favorito</p>
                  )}
                </div>
              </div>

              {/* Formularios para agregar/editar — en su propia fila, alineados bajo el nombre */}
              {isSelf && (editingBirthday || !user.cumpleanos || !user.pastelFavorito) && (
                <div className="mt-2.5 ml-11 flex flex-col gap-2.5">
                  {editingBirthday ? (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-medium text-orange-700">🎂 Tu cumpleaños</p>
                      <BirthdayPicker
                        day={bdayDay}
                        month={bdayMonth}
                        onChange={({ day, month }) => { setBdayDay(day); setBdayMonth(month); }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveBirthday}
                          disabled={!bdayDay || !bdayMonth || savingDate}
                          className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50 flex-1"
                        >
                          {savingDate ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => setEditingBirthday(false)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    !user.cumpleanos && (
                      <button
                        onClick={startEditBirthday}
                        className="btn-primary text-xs px-3 py-1.5 self-start"
                      >
                        🎂 Agregar cumpleaños
                      </button>
                    )
                  )}
                  {!user.pastelFavorito && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Pastel favorito"
                        className="input-field text-sm py-1.5 flex-1 min-w-0"
                        value={newCake}
                        onChange={(e) => setNewCake(e.target.value)}
                      />
                      <button
                        onClick={handleAddCake}
                        disabled={!newCake.trim() || savingCake}
                        className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50 flex-shrink-0"
                      >
                        {savingCake ? 'Guardando…' : 'Agregar'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
