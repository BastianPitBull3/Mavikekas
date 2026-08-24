/**
 * BirthdayModal.jsx
 * Modal automático de felicitación de cumpleaños.
 *
 * Se activa cuando la fecha actual (real o simulada) coincide con el
 * día/mes de cumpleaños del usuario en sesión. Ambos escenarios pedidos
 * quedan cubiertos con el mismo punto de entrada: este componente vive en
 * el layout autenticado de App.jsx y su efecto corre en cuanto hay
 * currentUser —
 *   Escenario A: justo tras un login exitoso (currentUser pasa de null a un id).
 *   Escenario B: sesión ya activa + recarga de página (currentUser se
 *   restaura desde localStorage y este componente monta igual).
 *
 * "Una vez por día" se controla con localStorage (mavikekas_birthday_modal_shown_{userId}),
 * guardando la fecha en que ya se mostró para no repetirlo en la misma sesión
 * ni en recargas posteriores del mismo día.
 */
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isBirthdayToday, getTodayString } from '../../utils/dateUtils';
import { wasBirthdayModalShownToday, markBirthdayModalShown } from '../../utils/storage';
import { BIRTHDAY_ART_SRC } from '../../utils/birthdayArt';

export default function BirthdayModal() {
  const { state, birthdayModalTrigger } = useApp();
  const { currentUser, appState } = state;

  const [visible,   setVisible]   = useState(false);
  const [artFailed, setArtFailed] = useState(!BIRTHDAY_ART_SRC);

  useEffect(() => {
    if (!currentUser) return;

    const today = appState.simulatedDate || getTodayString();
    if (!isBirthdayToday(currentUser.cumpleanos, appState.simulatedDate)) return;
    if (wasBirthdayModalShownToday(currentUser.id, today)) return;

    markBirthdayModalShown(currentUser.id, today);
    setVisible(true);
    // Reacciona también si el cumpleaños se acaba de guardar, si se cambia
    // la fecha simulada durante la misma sesión (no solo al loguear/recargar),
    // o si se limpia el flag de "ya mostrado" desde el simulador de pruebas.
  }, [currentUser?.id, currentUser?.cumpleanos, appState.simulatedDate, birthdayModalTrigger]);

  if (!visible || !currentUser) return null;

  const firstName = currentUser.nombre.trim().split(/\s+/)[0];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={() => setVisible(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-6 text-white text-center relative">
          <button
            onClick={() => setVisible(false)}
            className="absolute top-3 right-3 text-white/80 hover:text-white text-lg"
            title="Cerrar"
          >
            ✕
          </button>
          <p className="text-3xl mb-1">🎉</p>
          <h2 className="text-xl font-bold">¡Feliz cumpleaños, {firstName}!</h2>
        </div>

        {/* Arte */}
        <div className="p-6 flex flex-col items-center gap-4">
          {artFailed ? (
            <div className="w-full aspect-square max-w-[220px] rounded-xl bg-pink-50 border-2 border-dashed
                            border-pink-200 flex flex-col items-center justify-center text-center p-4 gap-2">
              <span className="text-4xl">💀🌮🎩</span>
              <p className="text-xs text-gray-400">Arte de cumpleaños próximamente</p>
            </div>
          ) : (
            <img
              src={BIRTHDAY_ART_SRC}
              alt={`¡Feliz cumpleaños, ${firstName}!`}
              className="w-full max-w-[280px] rounded-xl border border-gray-200"
              onError={() => setArtFailed(true)}
            />
          )}
          <p className="text-sm text-gray-500 text-center">
            Todo el equipo de Mavikekas te desea un excelente día 🌮
          </p>
        </div>
      </div>
    </div>
  );
}
