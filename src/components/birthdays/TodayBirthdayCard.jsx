/**
 * TodayBirthdayCard.jsx
 * Card independiente y persistente que celebra los cumpleaños de hoy.
 * A diferencia de BirthdayModal (que aparece una sola vez por día y se
 * cierra), esta card se mantiene visible en el inicio todo el día mientras
 * siga siendo el cumpleaños de alguien — se muestra a todos (admin y
 * usuarios) cada vez que entran o recargan.
 */
import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isBirthdayToday } from '../../utils/dateUtils';
import { BIRTHDAY_ART_SRC } from '../../utils/birthdayArt';

export default function TodayBirthdayCard() {
  const { state } = useApp();
  const { users, appState } = state;
  const simulatedDate = appState.simulatedDate || null;
  const [artFailed, setArtFailed] = useState(!BIRTHDAY_ART_SRC);

  const todaysBirthdays = useMemo(
    () => users.filter((u) => isBirthdayToday(u.cumpleanos, simulatedDate)),
    [users, simulatedDate]
  );

  if (todaysBirthdays.length === 0) return null;

  return (
    <div className="space-y-4 my-6">
      {todaysBirthdays.map((u) => (
        <div
          key={u.id}
          className="max-w-xs mx-auto bg-white rounded-2xl shadow-md overflow-hidden fade-in"
        >
          {/* ── Cabecera: ícono + nombre ── */}
          <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-4 flex items-center gap-3 text-white">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center
                            text-xl flex-shrink-0">
              🎉
            </div>
            <p className="font-bold text-base leading-tight">
              ¡Feliz cumpleaños, {u.nombre}!
            </p>
          </div>

          {/* ── Cuerpo: imagen de la carpeta ── */}
          <div className="bg-white p-4 flex justify-center">
            {artFailed ? (
              <div className="w-full aspect-square max-w-[280px] rounded-xl bg-gray-50
                              flex items-center justify-center text-4xl">
                🎉
              </div>
            ) : (
              <img
                src={BIRTHDAY_ART_SRC}
                alt=""
                className="w-full max-w-[280px] rounded-xl border border-gray-200"
                onError={() => setArtFailed(true)}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
